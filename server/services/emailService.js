import nodemailer from 'nodemailer';
import dns from 'dns';
import { promisify } from 'util';

const resolveMxAsync = promisify(dns.resolveMx);

// Disallow reserved, fake, or documentation domains that cause DNS bounce-backs
const INVALID_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'test.org',
  'dummy.com',
  'invalid',
  'localhost',
]);

/**
 * Cleanly resolve the user's authentic profile display name.
 * Strictly avoids dummy/mock names (Alice, Bob, Alex, Meta, Sally, etc.)
 * and falls back to a formatted name derived from their real verified email address.
 */
export const resolveUserProfileName = (user) => {
  if (!user) return 'IntelliMeet User';

  const candidate = (user.name || user.fullName || user.profileName || user.displayName || '').trim();
  const mockNameRegex = /^(alice|bob|alex|meta|sally|john doe|jane doe|test user|member)\b/i;

  if (candidate && !mockNameRegex.test(candidate)) {
    return candidate;
  }

  // Derive from real user email address if name is absent or mock
  if (user.email && typeof user.email === 'string') {
    const local = user.email.split('@')[0];
    const words = local.replace(/[._0-9+-]+/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (words.length > 0) {
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    return local;
  }

  return 'IntelliMeet User';
};

/**
 * Validate recipient address syntax and confirm domain has active MX records before attempting delivery.
 * Suppresses delivery to fake/unroutable domains to prevent DNS bounce-backs ("Address not found").
 */
export const validateRecipientEmail = async (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, reason: 'empty_or_non_string' };
  }
  const clean = email.toLowerCase().trim();
  const atIndex = clean.lastIndexOf('@');
  if (atIndex === -1 || atIndex === 0 || atIndex === clean.length - 1) {
    return { valid: false, reason: 'invalid_recipient' };
  }

  const domain = clean.slice(atIndex + 1);
  if (INVALID_DOMAINS.has(domain) || domain.endsWith('.invalid') || domain.endsWith('.example')) {
    return {
      valid: false,
      reason: `reserved_test_domain: ${domain} has no mail routing; delivery suppressed to prevent DNS bounce-backs`,
    };
  }

  // Basic DNS MX record check to prevent "Address not found" / "DNS error" bounces
  try {
    const mxRecords = await resolveMxAsync(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, reason: `domain_has_no_mx_records: ${domain}` };
    }
  } catch (dnsErr) {
    if (dnsErr.code === 'ENOTFOUND' || dnsErr.code === 'ENODATA' || dnsErr.code === 'NXDOMAIN') {
      return {
        valid: false,
        reason: `dns_resolution_failed: domain ${domain} does not exist (${dnsErr.code})`,
      };
    }
  }

  return { valid: true, email: clean };
};

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
  // 1. Resend HTTPS REST API (Uses port 443 HTTPS - 100% immune to Render free-tier SMTP blocks)
  if (process.env.RESEND_API_KEY) {
    return {
      provider: 'Resend (HTTPS API)',
      isHttpApi: true,
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || 'IntelliMeet <onboarding@resend.dev>',
    };
  }

  // 2. Brevo HTTPS REST API (Uses port 443 HTTPS)
  if (process.env.BREVO_API_KEY) {
    return {
      provider: 'Brevo (HTTPS API)',
      isHttpApi: true,
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || 'IntelliMeet <notifications@intellmeet.com>',
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
 * Format a human-readable date and time.
 */
const formatDateTime = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  try {
    return d.toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'long',
    });
  } catch (e) {
    return d.toUTCString();
  }
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

const sendViaResendHttp = async (mailOptions) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'IntelliMeet <onboarding@resend.dev>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [mailOptions.to],
      subject: mailOptions.subject,
      html: mailOptions.html,
      text: mailOptions.text,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.name || `HTTP ${res.status}`);
  }
  return { success: true, delivered: true, messageId: data.id };
};

const sendViaBrevoHttp = async (mailOptions) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER || process.env.SMTP_USER || 'notifications@intellmeet.com';
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'IntelliMeet', email: senderEmail },
      to: [{ email: mailOptions.to }],
      subject: mailOptions.subject,
      htmlContent: mailOptions.html,
      textContent: mailOptions.text,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return { success: true, delivered: true, messageId: data.messageId };
};

/**
 * Verify transporter or HTTP API connection status (useful for health checks & startup diagnostics).
 */
export const verifyEmailService = async () => {
  const config = getResolvedEmailConfig();
  const configured = Boolean(config);
  if (!configured) {
    return {
      configured: false,
      status: 'unconfigured',
      provider: 'None',
      message: 'Email credentials (RESEND_API_KEY, BREVO_API_KEY, or SMTP_USER/SMTP_PASS) are not configured in environment variables.',
      queuePending: notificationQueue.getPendingCount(),
      recentLogs: notificationQueue.getHistory().slice(0, 10),
    };
  }

  // Verify Resend HTTP API (Port 443 HTTPS)
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/api-keys', {
        headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
      });
      if (res.ok) {
        return {
          configured: true,
          status: 'ready',
          provider: 'Resend (HTTPS Port 443)',
          message: 'Email service verified successfully via Resend HTTPS REST API (Port 443 - zero firewall blocks).',
          queuePending: notificationQueue.getPendingCount(),
          recentLogs: notificationQueue.getHistory().slice(0, 10),
        };
      }
    } catch (e) {}
  }

  // Verify Brevo HTTP API (Port 443 HTTPS)
  if (process.env.BREVO_API_KEY) {
    try {
      const res = await fetch('https://api.brevo.com/v3/account', {
        headers: { 'api-key': process.env.BREVO_API_KEY },
      });
      if (res.ok) {
        return {
          configured: true,
          status: 'ready',
          provider: 'Brevo (HTTPS Port 443)',
          message: 'Email service verified successfully via Brevo HTTPS REST API (Port 443).',
          queuePending: notificationQueue.getPendingCount(),
          recentLogs: notificationQueue.getHistory().slice(0, 10),
        };
      }
    } catch (e) {}
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
      message: `SMTP verification failed: ${error.message}. Note: Render Free Tier blocks outbound SMTP ports 25, 465, and 587. Use RESEND_API_KEY over HTTPS (port 443) for 100% free, unblocked delivery.`,
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

  // Validate recipient syntax and check DNS MX records to prevent bounce-backs ("Address not found" / "DNS error")
  const val = await validateRecipientEmail(recipient);
  if (!val.valid) {
    logEmailDiagnostic('Skipped invalid or unroutable recipient domain', {
      to: recipient,
      subject: mailOptions.subject,
      reason: val.reason,
    });
    return {
      success: false,
      delivered: false,
      reason: val.reason,
      message: `Delivery suppressed: ${val.reason}`,
    };
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

  // 1. Send via Resend HTTPS REST API (Port 443 - zero firewall blocks on Render)
  if (process.env.RESEND_API_KEY) {
    try {
      const result = await sendViaResendHttp(mailOptions);
      if (dedupKey) recentNotifications.set(dedupKey, Date.now());
      logEmailDiagnostic('Email delivered successfully via Resend HTTPS', {
        to: recipient,
        subject: mailOptions.subject,
        messageId: result.messageId,
      });
      return result;
    } catch (error) {
      logEmailDiagnostic('Resend HTTPS delivery error', { to: recipient, error: error.message });
      return { success: false, delivered: false, error: error.message };
    }
  }

  // 2. Send via Brevo HTTPS REST API (Port 443)
  if (process.env.BREVO_API_KEY) {
    try {
      const result = await sendViaBrevoHttp(mailOptions);
      if (dedupKey) recentNotifications.set(dedupKey, Date.now());
      logEmailDiagnostic('Email delivered successfully via Brevo HTTPS', {
        to: recipient,
        subject: mailOptions.subject,
        messageId: result.messageId,
      });
      return result;
    } catch (error) {
      logEmailDiagnostic('Brevo HTTPS delivery error', { to: recipient, error: error.message });
      return { success: false, delivered: false, error: error.message };
    }
  }

  const transporter = getTransporter();

  // If SMTP is not yet configured, log safely and return accurate status
  if (!transporter) {
    logEmailDiagnostic('Simulated notification (Email provider not configured in environment)', {
      to: recipient,
      subject: mailOptions.subject,
      note: 'Set RESEND_API_KEY or SMTP credentials on Render to dispatch real inboxes.',
    });

    if (dedupKey) {
      recentNotifications.set(dedupKey, Date.now());
    }

    return {
      success: true,
      delivered: false,
      reason: 'unconfigured_smtp',
      message: 'Email credentials not configured in environment variables. Email was generated but external dispatch skipped.',
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

    logEmailDiagnostic('Email delivered successfully via SMTP', {
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
  const userEmail = (user.email || '').toLowerCase().trim();
  const userName = resolveUserProfileName(user);
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
 * Follows the professional template with dynamic values from the authenticated user's real account.
 */
const generateLoginContent = (user, details = {}) => {
  const userEmail = (user.email || '').toLowerCase().trim();
  const userName = resolveUserProfileName(user);
  const loginTime = formatDateTime(details.timestamp || new Date());

  const subject = 'Successful Login to IntelliMeet';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Successful Login to IntelliMeet</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background-color: #4f46e5; padding: 24px 32px; text-align: left;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">IntelliMeet</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #0f172a;">
                Hello <strong>${userName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                You have successfully logged in to IntelliMeet.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding-bottom: 8px; font-size: 14px; color: #64748b; width: 35%;"><strong>Account:</strong></td>
                  <td style="padding-bottom: 8px; font-size: 14px; color: #0f172a; font-weight: 600;">${userEmail}</td>
                </tr>
                <tr>
                  <td style="font-size: 14px; color: #64748b;"><strong>Date and time:</strong></td>
                  <td style="font-size: 14px; color: #0f172a;">${loginTime}</td>
                </tr>
              </table>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                If this login was not initiated by you, please secure your account.
              </p>
              <p style="margin: 0; font-size: 15px; color: #0f172a;">
                Thank you,<br>
                <strong>IntelliMeet Team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                This automated security notification was sent to <strong style="color: #64748b;">${userEmail}</strong>. &copy; ${new Date().getFullYear()} IntelliMeet.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Hello ${userName},

You have successfully logged in to IntelliMeet.

Account: ${userEmail}
Date and time: ${loginTime}

If this login was not initiated by you, please secure your account.

Thank you,
IntelliMeet Team
  `.trim();

  return { to: userEmail, subject, html, text, dedupKey: `login:${userEmail}` };
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
