import nodemailer from 'nodemailer';

/**
 * In-memory deduplication cache to suppress duplicate email notifications
 * caused by rapid double-clicks, React StrictMode, or duplicated OAuth callbacks.
 * Key: `${type}:${email}:${provider}`
 * Value: timestamp (ms)
 */
const recentNotifications = new Map();
const DEDUPLICATION_WINDOW_MS = 60 * 1000; // 60 seconds cooldown

// Periodic cleanup of stale deduplication entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of recentNotifications.entries()) {
    if (now - timestamp > DEDUPLICATION_WINDOW_MS) {
      recentNotifications.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Circular history buffer to retain recent notification outcomes
 * for live diagnostic inspection via GET /api/auth/email-status.
 */
const notificationHistory = [];
const MAX_HISTORY = 50;

const recordHistory = (entry) => {
  notificationHistory.unshift({
    id: 'notif_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    ...entry,
  });
  if (notificationHistory.length > MAX_HISTORY) {
    notificationHistory.pop();
  }
};

/**
 * Reliable Asynchronous Notification Queue.
 * Dispatches emails in the background without blocking the HTTP response cycle.
 */
class NotificationQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  enqueue(task) {
    this.queue.push(task);
    this.processNext();
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    const task = this.queue.shift();

    try {
      const result = await task.handler();
      recordHistory({
        type: task.type,
        recipient: task.recipient,
        subject: task.subject,
        status: result.delivered ? 'delivered' : (result.deduplicated ? 'deduplicated' : 'unconfigured_or_skipped'),
        details: result,
      });
      if (task.onSuccess) {
        await task.onSuccess(result).catch((e) => {
          console.error('[NotificationQueue] Task onSuccess error:', e.message);
        });
      }
    } catch (error) {
      console.error(`[NotificationQueue] Error processing ${task.type} notification:`, error.message);
      recordHistory({
        type: task.type,
        recipient: task.recipient,
        subject: task.subject,
        status: 'failed',
        error: error.message,
      });
      if (task.onError) {
        await task.onError(error).catch(() => {});
      }
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setImmediate(() => this.processNext());
      }
    }
  }

  getPendingCount() {
    return this.queue.length;
  }

  getHistory() {
    return notificationHistory;
  }
}

export const notificationQueue = new NotificationQueue();

/**
 * Resolve effective SMTP configuration with support for:
 * 1. Transactional API keys: RESEND_API_KEY, SENDGRID_API_KEY
 * 2. Dedicated services: EMAIL_SERVICE='gmail'
 * 3. Environment variable aliases: SMTP_*, EMAIL_*, MAIL_*, GMAIL_*
 * 4. Automatic default to smtp.gmail.com if user is a @gmail.com address
 */
export const getResolvedEmailConfig = () => {
  // 1. Resend API Key auto-configuration
  if (process.env.RESEND_API_KEY) {
    return {
      provider: 'Resend',
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: { user: 'resend', pass: process.env.RESEND_API_KEY },
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || '"IntelliMeet" <onboarding@resend.dev>',
    };
  }

  // 2. SendGrid API Key auto-configuration
  if (process.env.SENDGRID_API_KEY) {
    return {
      provider: 'SendGrid',
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: { user: 'apikey', pass: process.env.SENDGRID_API_KEY },
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || '"IntelliMeet" <notifications@intellmeet.com>',
    };
  }

  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || process.env.MAIL_USER || process.env.GMAIL_USER || '').trim();
  const pass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASS || process.env.MAIL_PASS || process.env.GMAIL_PASS || '').trim();
  let host = (process.env.SMTP_HOST || process.env.EMAIL_HOST || process.env.MAIL_HOST || '').trim();
  const service = (process.env.EMAIL_SERVICE || process.env.MAIL_SERVICE || '').trim().toLowerCase();
  const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || process.env.MAIL_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  // Auto-detect Gmail if host omitted or user is @gmail.com
  const isGmail = (user && user.toLowerCase().endsWith('@gmail.com')) || host.includes('gmail') || service === 'gmail';
  if (isGmail && user && pass && (!process.env.SMTP_PORT || process.env.SMTP_PORT === '465')) {
    return {
      provider: 'Gmail',
      service: 'gmail',
      auth: { user, pass },
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || `"IntelliMeet" <${user}>`,
    };
  }

  if (service && user && pass) {
    return {
      provider: service,
      service,
      auth: { user, pass },
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || `"IntelliMeet" <${user}>`,
    };
  }

  if (host && user && pass) {
    return {
      provider: host.includes('gmail') ? 'Gmail (SMTP)' : host,
      host,
      port,
      secure,
      auth: { user, pass },
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || `"IntelliMeet" <${user}>`,
    };
  }

  return null;
};

/**
 * Check if the email service has the minimum required SMTP configuration.
 * @returns {boolean}
 */
export const isEmailConfigured = () => {
  return getResolvedEmailConfig() !== null;
};

/**
 * Create and return a configured Nodemailer transporter.
 * Returns null if SMTP credentials are missing.
 */
let cachedTransporter = null;
const getTransporter = () => {
  const config = getResolvedEmailConfig();
  if (!config) {
    return null;
  }

  if (cachedTransporter) {
    return cachedTransporter;
  }

  const transportOpts = {
    ...config,
    connectionTimeout: 8000,  // 8s
    greetingTimeout: 8000,    // 8s
    socketTimeout: 12000,     // 12s
  };

  try {
    cachedTransporter = nodemailer.createTransport(transportOpts);
    return cachedTransporter;
  } catch (error) {
    console.error('[EmailService] Failed to initialize Nodemailer transporter:', error.message);
    return null;
  }
};

/**
 * Reset cached transporter (useful when environment variables are updated).
 */
export const resetTransporter = () => {
  cachedTransporter = null;
};

/**
 * Get formatted sender address.
 */
const getFromAddress = () => {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  if (process.env.SMTP_USER) {
    return `"IntelliMeet" <${process.env.SMTP_USER}>`;
  }
  return '"IntelliMeet" <notifications@intellmeet.com>';
};

/**
 * Format a human-readable date and time with UTC offset.
 */
const formatDateTime = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toUTCString();
};

/**
 * Safe logger that logs email attempts without exposing credentials or tokens.
 */
const logEmailDiagnostic = (action, details) => {
  const safeDetails = { ...details };
  delete safeDetails.password;
  delete safeDetails.token;
  delete safeDetails.secret;
  console.log(`[EmailService] ${action}:`, JSON.stringify(safeDetails));
};

/**
 * Verify transporter connection status (useful for health checks & startup diagnostics).
 */
export const verifyEmailService = async () => {
  const config = getResolvedEmailConfig();
  const configured = Boolean(config);
  if (!configured) {
    return {
      configured: false,
      status: 'unconfigured',
      provider: 'None',
      message: 'SMTP credentials (SMTP_HOST / SMTP_USER / SMTP_PASS or RESEND_API_KEY / SENDGRID_API_KEY) are not configured in environment variables.',
      queuePending: notificationQueue.getPendingCount(),
      recentLogs: notificationQueue.getHistory().slice(0, 10),
    };
  }

  const transporter = getTransporter();
  if (!transporter) {
    return {
      configured: false,
      status: 'error',
      provider: config.provider,
      message: 'Could not construct Nodemailer transporter with current configuration.',
      queuePending: notificationQueue.getPendingCount(),
      recentLogs: notificationQueue.getHistory().slice(0, 10),
    };
  }

  try {
    await transporter.verify();
    return {
      configured: true,
      status: 'ready',
      provider: config.provider,
      message: `SMTP connection verified successfully (${config.provider}).`,
      queuePending: notificationQueue.getPendingCount(),
      recentLogs: notificationQueue.getHistory().slice(0, 10),
    };
  } catch (error) {
    return {
      configured: true,
      status: 'connection_failed',
      message: `SMTP verification failed: ${error.message}`,
      queuePending: notificationQueue.getPendingCount(),
      recentLogs: notificationQueue.getHistory().slice(0, 10),
    };
  }
};

/**
 * Core mail sender with safety wrappers, deduplication, and diagnostics.
 */
export const sendMailSafe = async (mailOptions, dedupKey = null) => {
  const recipient = (mailOptions.to || '').toLowerCase().trim();

  if (!recipient || !recipient.includes('@')) {
    logEmailDiagnostic('Skipped invalid recipient', { to: recipient, subject: mailOptions.subject });
    return { success: false, delivered: false, reason: 'invalid_recipient' };
  }

  // Deduplication check
  if (dedupKey) {
    const lastSent = recentNotifications.get(dedupKey);
    const now = Date.now();
    if (lastSent && now - lastSent < DEDUPLICATION_WINDOW_MS) {
      logEmailDiagnostic('Suppressed duplicate email (cooldown active)', {
        dedupKey,
        recipient,
        elapsedSec: Math.round((now - lastSent) / 1000),
      });
      return {
        success: true,
        delivered: false,
        deduplicated: true,
        reason: 'Duplicate notification suppressed within cooldown window',
      };
    }
  }

  const transporter = getTransporter();

  // If SMTP is not yet configured, log safely and return accurate status
  if (!transporter) {
    logEmailDiagnostic('Simulated notification (SMTP not configured in environment)', {
      to: recipient,
      subject: mailOptions.subject,
      note: 'Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS on Render to dispatch real inboxes.',
    });

    if (dedupKey) {
      recentNotifications.set(dedupKey, Date.now());
    }

    return {
      success: true,
      delivered: false,
      reason: 'unconfigured_smtp',
      message: 'SMTP credentials not configured in environment variables. Email was generated but external dispatch skipped.',
    };
  }

  try {
    const payload = {
      from: getFromAddress(),
      to: recipient,
      subject: mailOptions.subject,
      text: mailOptions.text,
      html: mailOptions.html,
    };

    const info = await transporter.sendMail(payload);

    if (dedupKey) {
      recentNotifications.set(dedupKey, Date.now());
    }

    logEmailDiagnostic('Email delivered successfully', {
      to: recipient,
      subject: mailOptions.subject,
      messageId: info.messageId,
      response: info.response,
    });

    return {
      success: true,
      delivered: true,
      messageId: info.messageId,
    };
  } catch (error) {
    logEmailDiagnostic('Delivery failure', {
      to: recipient,
      subject: mailOptions.subject,
      error: error.message,
    });

    return {
      success: false,
      delivered: false,
      error: error.message,
    };
  }
};

/**
 * Generate registration email content.
 */
const generateWelcomeContent = (user, meta = {}) => {
  const userEmail = user.email.toLowerCase().trim();
  const userName = user.name || 'Member';
  const userRole = user.role || 'Member';
  const userType = user.userType || 'Professional';
  const pmi = user.pmi || 'Assigned in dashboard';
  const frontendUrl = process.env.FRONTEND_URL || 'https://intellmeet-frontend-5khf.onrender.com';

  const subject = `Welcome to IntelliMeet, ${userName}! 🎉 Your account is ready`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to IntelliMeet</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 36px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">IntelliMeet</h1>
              <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 15px;">Smart, AI-Powered Video Conferencing & Collaboration</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 600;">Welcome aboard, ${userName}! 🚀</h2>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                Your <strong>IntelliMeet</strong> account has been created successfully. You can now host HD meetings, collaborate in real time, and generate AI-powered meeting summaries.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #cbd5e1;">
                <tr>
                  <td style="padding-bottom: 8px; font-size: 14px; color: #475569;"><strong>Registered Email:</strong></td>
                  <td style="padding-bottom: 8px; font-size: 14px; color: #0f172a; text-align: right;">${userEmail}</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 8px; font-size: 14px; color: #475569;"><strong>Profile Type:</strong></td>
                  <td style="padding-bottom: 8px; font-size: 14px; color: #0f172a; text-align: right;">${userType} (${userRole})</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 8px; font-size: 14px; color: #475569;"><strong>Personal Meeting ID (PMI):</strong></td>
                  <td style="padding-bottom: 8px; font-size: 14px; color: #4f46e5; font-weight: 600; text-align: right;">${pmi}</td>
                </tr>
                <tr>
                  <td style="font-size: 14px; color: #475569;"><strong>Account Status:</strong></td>
                  <td style="font-size: 14px; color: #16a34a; font-weight: 600; text-align: right;">Active & Verified</td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 12px 0 24px 0;">
                    <a href="${frontendUrl}/dashboard" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.25);">
                      Launch Your Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                This registration confirmation was sent to <strong style="color: #64748b;">${userEmail}</strong>. &copy; ${new Date().getFullYear()} IntelliMeet Inc.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Welcome to IntelliMeet, ${userName}!

Your account has been created successfully.
- Registered Email: ${userEmail}
- Profile Type: ${userType} (${userRole})
- Personal Meeting ID: ${pmi}
- Status: Active

Dashboard: ${frontendUrl}/dashboard

Best regards,
The IntelliMeet Team
  `.trim();

  return { to: userEmail, subject, html, text, dedupKey: `register:${userEmail}` };
};

/**
 * Generate login notification email content.
 */
const generateLoginContent = (user, details = {}) => {
  const userEmail = user.email.toLowerCase().trim();
  const userName = user.name || 'Member';
  const provider = details.provider || details.method || 'Email & Password';
  const ip = details.ip || 'Unknown IP';
  const userAgent = details.userAgent || 'Unknown Browser/Device';
  const loginTime = formatDateTime(new Date());
  const frontendUrl = process.env.FRONTEND_URL || 'https://intellmeet-frontend-5khf.onrender.com';

  const subject = `Security Alert: New sign-in to your IntelliMeet account (${provider})`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Alert: New Sign-in</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px; text-align: center;">
              <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 50%; background-color: rgba(255, 255, 255, 0.1); font-size: 20px; margin-bottom: 12px;">🛡️</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">Security Alert: New Sign-in</h1>
              <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 14px;">IntelliMeet Account Protection</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #0f172a;">
                Hi <strong>${userName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #334155;">
                We detected a successful sign-in to your <strong>IntelliMeet</strong> account. If this was you, you can safely disregard this message.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding-bottom: 10px; font-size: 13px; color: #64748b; width: 40%;"><strong>Sign-in Method:</strong></td>
                  <td style="padding-bottom: 10px; font-size: 13px; color: #0f172a; font-weight: 600;">${provider}</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 10px; font-size: 13px; color: #64748b;"><strong>Date & Time:</strong></td>
                  <td style="padding-bottom: 10px; font-size: 13px; color: #0f172a;">${loginTime}</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 10px; font-size: 13px; color: #64748b;"><strong>IP Address:</strong></td>
                  <td style="padding-bottom: 10px; font-size: 13px; color: #0f172a; font-family: monospace;">${ip}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #64748b;"><strong>Device / Client:</strong></td>
                  <td style="font-size: 13px; color: #0f172a; word-break: break-all;">${userAgent}</td>
                </tr>
              </table>
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 16px; margin-bottom: 28px;">
                <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #991b1b;">
                  Didn't recognize this activity?
                </p>
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #7f1d1d;">
                  If you did not sign in at this time, someone else may have gained access to your credentials. Please reset your password immediately and review your account security.
                </p>
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${frontendUrl}/profile" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px;">
                      Review Account & Security →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                This security notice was sent to <strong style="color: #64748b;">${userEmail}</strong>. &copy; ${new Date().getFullYear()} IntelliMeet Inc.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Security Alert: New sign-in to your IntelliMeet account

Hi ${userName},

We detected a successful sign-in to your account:
- Method: ${provider}
- Date & Time: ${loginTime}
- IP Address: ${ip}
- Device: ${userAgent}

If this was you, no action is needed.

DIDN'T RECOGNIZE THIS ACTIVITY?
If you did not sign in, please secure your account immediately:
${frontendUrl}/profile

Best regards,
IntelliMeet Security Team
  `.trim();

  return { to: userEmail, subject, html, text, dedupKey: `login:${userEmail}:${provider}` };
};

/**
 * Direct synchronous helper for registration welcome email.
 */
export const sendWelcomeEmail = async (user, meta = {}) => {
  if (!user || !user.email) return { success: false, delivered: false, reason: 'missing_user_email' };
  const content = generateWelcomeContent(user, meta);
  return await sendMailSafe(content, content.dedupKey);
};

/**
 * Direct synchronous helper for login notification email.
 */
export const sendLoginNotificationEmail = async (user, details = {}) => {
  if (!user || !user.email) return { success: false, delivered: false, reason: 'missing_user_email' };
  const content = generateLoginContent(user, details);
  return await sendMailSafe(content, content.dedupKey);
};

/**
 * Non-blocking queue-based login notification.
 * Dispatches asynchronously in background and updates DB without delaying HTTP responses.
 */
export const queueLoginNotification = (user, details = {}, onComplete = null) => {
  if (!user || !user.email) return;

  const content = generateLoginContent(user, details);
  notificationQueue.enqueue({
    type: 'login_notification',
    recipient: content.to,
    subject: content.subject,
    handler: () => sendMailSafe(content, content.dedupKey),
    onSuccess: async (result) => {
      if (onComplete) await onComplete(result);
    },
    onError: (err) => {
      console.error('[EmailService] Queued login notification failed:', err.message);
    },
  });
};

/**
 * Non-blocking queue-based welcome notification.
 */
export const queueWelcomeNotification = (user, meta = {}, onComplete = null) => {
  if (!user || !user.email) return;

  const content = generateWelcomeContent(user, meta);
  notificationQueue.enqueue({
    type: 'welcome_notification',
    recipient: content.to,
    subject: content.subject,
    handler: () => sendMailSafe(content, content.dedupKey),
    onSuccess: async (result) => {
      if (onComplete) await onComplete(result);
    },
    onError: (err) => {
      console.error('[EmailService] Queued welcome notification failed:', err.message);
    },
  });
};
