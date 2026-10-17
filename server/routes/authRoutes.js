import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

import fs from 'fs';
import path from 'path';

// Fallback JSON store if MongoDB service is not currently running locally
const fallbackDbPath = path.join(process.cwd(), 'data', 'users.json');

// Ensure data directory and file exist
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}
if (!fs.existsSync(fallbackDbPath)) {
  fs.writeFileSync(fallbackDbPath, JSON.stringify([]));
}

const getFallbackUsers = () => {
  try {
    const data = fs.readFileSync(fallbackDbPath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

const saveFallbackUser = (user) => {
  const users = getFallbackUsers();
  users.push(user);
  fs.writeFileSync(fallbackDbPath, JSON.stringify(users, null, 2));
};

import {
  sendWelcomeEmail,
  sendLoginNotificationEmail,
  queueLoginNotification,
  queueWelcomeNotification,
  verifyEmailService,
  isEmailConfigured,
  sendMailSafe,
} from '../services/emailService.js';

// Helper to extract sanitized client connection details (IP & User-Agent)
const getClientDetails = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : (req.socket?.remoteAddress || req.ip || 'Unknown IP');
  const userAgent = req.headers['user-agent'] || 'Unknown Browser/Device';
  return { ip, userAgent };
};

// Helper to generate JWT token
const generateToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET || 'intellmeet_jwt_secret_key_2026_secure', {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user & save to MongoDB
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, userType, department, company, phone, location } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const isDbConnected = User.db && User.db.readyState === 1;

    let existingUser = null;
    if (isDbConnected) {
      existingUser = await User.findOne({ email: email.toLowerCase() });
    } else {
      const users = getFallbackUsers();
      existingUser = users.find(u => u.email === email.toLowerCase());
    }

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email address' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let newUser;
    if (isDbConnected) {
      newUser = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || 'Member',
        userType: userType || 'professional',
        department: department || 'General',
        company: company || 'Independent',
        phone: phone || '',
        location: location || '',
      });
    } else {
      // Memory store fallback
      const id = 'user_' + Date.now();
      const p1 = Math.floor(100 + Math.random() * 900);
      const p2 = Math.floor(100 + Math.random() * 900);
      const p3 = Math.floor(1000 + Math.random() * 9000);
      const pmi = `${p1}-${p2}-${p3}`;
      
      newUser = {
        _id: id,
        id,
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || 'Member',
        userType: userType || 'professional',
        department: department || 'General',
        company: company || 'Independent',
        phone: phone || '',
        location: location || '',
        timezone: '(GMT-07:00) Pacific Time (US & Canada)',
        pmi,
        vanityUrl: `https://intellmeet.io/m/${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        plan: 'Free Plan',
        avatar: '',
        stats: {
          totalMeetings: 0,
          aiSummariesGenerated: 0,
          hoursSaved: '0 hrs',
          supportTickets: 0,
        },
      };
      saveFallbackUser(newUser);
    }

    const token = generateToken(newUser._id || newUser.id, newUser.email);

    // Extract client connection details safely
    const { ip, userAgent } = getClientDetails(req);

    // Queue personalized registration confirmation email (dispatched reliably in background without blocking response)
    queueWelcomeNotification(newUser, { ip, userAgent }, async (result) => {
      if (result.success && isDbConnected && newUser._id) {
        try {
          await User.findByIdAndUpdate(newUser._id, { welcomeEmailSentAt: new Date() });
        } catch (e) {}
      }
    });

    const userResponse = {
      id: newUser._id || newUser.id,
      _id: newUser._id || newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      userType: newUser.userType,
      department: newUser.department,
      company: newUser.company,
      phone: newUser.phone,
      location: newUser.location,
      timezone: newUser.timezone,
      pmi: newUser.pmi,
      vanityUrl: newUser.vanityUrl,
      plan: newUser.plan,
      avatar: newUser.avatar,
      stats: newUser.stats,
    };

    return res.status(201).json({
      success: true,
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: error.message || 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter email and password' });
    }

    const isDbConnected = User.db && User.db.readyState === 1;

    let user = null;
    if (isDbConnected) {
      user = await User.findOne({ email: email.toLowerCase() });
    } else {
      const users = getFallbackUsers();
      user = users.find(u => u.email === email.toLowerCase());
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials. User does not exist.' });
    }

    // Check password match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id || user.id, user.email);

    // Extract client connection details safely
    const { ip, userAgent } = getClientDetails(req);

    // Queue personalized security login notification email (dispatched reliably in background without delaying login response)
    queueLoginNotification(
      user,
      {
        method: 'Email & Password',
        provider: 'Email & Password',
        ip,
        userAgent,
      },
      async (result) => {
        if (isDbConnected && user._id) {
          try {
            await User.findByIdAndUpdate(user._id, {
              lastLoginAt: new Date(),
              lastLoginProvider: 'local',
              lastLoginIp: ip,
              lastLoginUserAgent: userAgent,
              ...(result.success ? { lastLoginNotificationSentAt: new Date() } : {}),
            });
          } catch (e) {}
        }
      }
    );

    const userResponse = {
      id: user._id || user.id,
      _id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      userType: user.userType,
      department: user.department,
      company: user.company,
      phone: user.phone,
      location: user.location,
      timezone: user.timezone,
      pmi: user.pmi,
      vanityUrl: user.vanityUrl,
      plan: user.plan,
      avatar: user.avatar,
      stats: user.stats,
    };

    return res.json({
      success: true,
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: error.message || 'Server error during login' });
  }
});

// @route   POST /api/auth/social
// @desc    Handle social login (Google, Facebook, Twitter) - Simulated OAuth
router.post('/social', async (req, res) => {
  try {
    const { provider, email, name, avatar } = req.body;

    if (!email || !name) {
      return res.status(400).json({ message: 'Email and name are required from social provider' });
    }

    const isDbConnected = mongoose.connection.readyState === 1;
    let user = null;
    let isNewUser = false;

    if (isDbConnected) {
      user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        isNewUser = true;
        // Auto-register: generate a valid hashed dummy password for social-only users
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('social_oauth_' + Date.now(), salt);
        const p1 = Math.floor(100 + Math.random() * 900);
        const p2 = Math.floor(100 + Math.random() * 900);
        const p3 = Math.floor(1000 + Math.random() * 9000);

        user = await User.create({
          name: name || `${provider} User`,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: 'Member',
          userType: 'professional',
          department: 'General',
          company: 'Independent',
          phone: '',
          location: '',
          avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || provider)}&background=random&color=fff`,
          pmi: `${p1}-${p2}-${p3}`,
          plan: 'Free Plan',
        });
      }
    } else {
      const users = getFallbackUsers();
      user = users.find(u => u.email === email.toLowerCase());

      if (!user) {
        isNewUser = true;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('social_oauth_' + Date.now(), salt);
        const p1 = Math.floor(100 + Math.random() * 900);
        const p2 = Math.floor(100 + Math.random() * 900);
        const p3 = Math.floor(1000 + Math.random() * 9000);
        const id = 'social_' + Date.now();

        user = {
          _id: id, id,
          name: name || `${provider} User`,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: 'Member',
          userType: 'professional',
          department: 'General',
          company: 'Independent',
          phone: '', location: '',
          avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || provider)}&background=random&color=fff`,
          pmi: `${p1}-${p2}-${p3}`,
          plan: 'Free Plan',
          stats: { totalMeetings: 0, aiSummariesGenerated: 0, hoursSaved: '0 hrs', supportTickets: 0 },
        };
        saveFallbackUser(user);
      }
    }

    const token = generateToken(user._id || user.id, user.email);

    // Extract client connection details safely
    const { ip, userAgent } = getClientDetails(req);
    const providerName = provider || 'Google';

    // If new user registered via social login, send welcome confirmation in background
    if (isNewUser) {
      queueWelcomeNotification(user, { ip, userAgent, provider: providerName }, async (result) => {
        if (result.success && isDbConnected && user._id) {
          try {
            await User.findByIdAndUpdate(user._id, { welcomeEmailSentAt: new Date() });
          } catch (e) {}
        }
      });
    }

    // Queue personalized security login notification email for the social sign-in session
    // (Deduplication cache automatically suppresses rapid duplicate callbacks within 60s)
    queueLoginNotification(
      user,
      {
        method: `${providerName} Social Login`,
        provider: providerName,
        ip,
        userAgent,
      },
      async (result) => {
        if (isDbConnected && user._id) {
          try {
            await User.findByIdAndUpdate(user._id, {
              lastLoginAt: new Date(),
              lastLoginProvider: providerName.toLowerCase(),
              lastLoginIp: ip,
              lastLoginUserAgent: userAgent,
              ...(result.success ? { lastLoginNotificationSentAt: new Date() } : {}),
            });
          } catch (e) {}
        }
      }
    );

    return res.json({
      success: true,
      message: `${provider} login successful`,
      user: {
        id: user._id || user.id,
        _id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        userType: user.userType,
        department: user.department,
        company: user.company,
        phone: user.phone,
        location: user.location,
        timezone: user.timezone,
        pmi: user.pmi,
        vanityUrl: user.vanityUrl,
        plan: user.plan,
        avatar: user.avatar,
        stats: user.stats,
      },
      token,
    });
  } catch (error) {
    console.error('Social login error:', error.message);
    res.status(500).json({ message: 'Social login error: ' + (error.message || 'Unknown error') });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const isDbConnected = User.db && User.db.readyState === 1;
    let user = null;
    if (isDbConnected) {
      user = await User.findById(req.user.id).select('-password');
    } else {
      const users = getFallbackUsers();
      user = users.find(u => u.email === req.user.email);
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, role, department, company, location, timezone } = req.body;
    const isDbConnected = User.db && User.db.readyState === 1;

    if (isDbConnected) {
      const user = await User.findById(req.user.id);
      if (user) {
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (role) user.role = role;
        if (department) user.department = department;
        if (company) user.company = company;
        if (location) user.location = location;
        if (timezone) user.timezone = timezone;

        const updatedUser = await user.save();
        const userObj = updatedUser.toObject();
        delete userObj.password;
        return res.json({ success: true, user: userObj });
      }
    } else {
      const users = getFallbackUsers();
      const userIndex = users.findIndex(u => u.email === req.user.email);
      if (userIndex !== -1) {
        const user = users[userIndex];
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (role) user.role = role;
        if (department) user.department = department;
        if (company) user.company = company;
        if (location) user.location = location;
        if (timezone) user.timezone = timezone;

        users[userIndex] = user;
        fs.writeFileSync(fallbackDbPath, JSON.stringify(users, null, 2));

        const { password, ...userObj } = user;
        return res.json({ success: true, user: userObj });
      }
    }

    return res.status(404).json({ message: 'User not found' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/auth/email-status
// @desc    Safe diagnostic status check for Email Notification Service
// @access  Public
router.get('/email-status', async (req, res) => {
  try {
    const status = await verifyEmailService();
    return res.json({
      success: true,
      service: 'IntelliMeet Email Notification Service',
      configured: status.configured,
      status: status.status,
      message: status.message,
      smtpHostConfigured: Boolean(process.env.SMTP_HOST || process.env.EMAIL_SERVICE),
      smtpUserConfigured: Boolean(process.env.SMTP_USER),
      smtpFrom: process.env.SMTP_FROM || process.env.EMAIL_FROM || (process.env.SMTP_USER ? `IntelliMeet <${process.env.SMTP_USER}>` : 'Default Sender'),
      queuePending: status.queuePending || 0,
      recentLogs: status.recentLogs || [],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/test-email
// @desc    Dispatch a live test email directly to verify provider configuration
// @access  Public
router.post('/test-email', async (req, res) => {
  try {
    const { to } = req.body;
    const recipient = (to || 'kvasanth0309@gmail.com').toLowerCase().trim();

    if (!isEmailConfigured()) {
      return res.status(400).json({
        success: false,
        delivered: false,
        reason: 'unconfigured_smtp',
        message: 'Cannot send email: SMTP credentials (SMTP_USER and SMTP_PASS) are not yet configured in the Render backend environment variables.',
        instructions: {
          step1: 'Go to your Render Dashboard -> intellmeet-backend -> Environment',
          step2: 'Add SMTP_USER (your Gmail) and SMTP_PASS (your 16-character Google App Password)',
          step3: 'Click Save Changes',
        },
      });
    }

    const testSubject = `IntelliMeet Live Test Verification Email (${new Date().toLocaleTimeString()})`;
    const testHtml = `
      <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 500px;">
        <h2 style="color: #4f46e5; margin-top: 0;">IntelliMeet Email System: Operational ✅</h2>
        <p style="color: #334155; line-height: 1.6;">This is a live test email verifying that your IntelliMeet application on Render can successfully deliver real-world notifications to your inbox.</p>
        <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #cbd5e1; margin: 16px 0;">
          <p style="margin: 4px 0; font-size: 14px;"><strong>Recipient:</strong> ${recipient}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Timestamp:</strong> ${new Date().toUTCString()}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Status:</strong> Delivered successfully</p>
        </div>
        <p style="color: #16a34a; font-weight: bold; margin-bottom: 0;">If you are reading this email in your inbox, your notification pipeline is 100% active and working!</p>
      </div>
    `;

    const result = await sendMailSafe({
      to: recipient,
      subject: testSubject,
      html: testHtml,
      text: `IntelliMeet Test Email: Successfully connected to SMTP and delivered to ${recipient} at ${new Date().toUTCString()}`,
    });

    if (result.delivered) {
      return res.json({
        success: true,
        delivered: true,
        recipient,
        message: `Test email successfully dispatched to ${recipient}!`,
        messageId: result.messageId,
      });
    } else {
      return res.status(502).json({
        success: false,
        delivered: false,
        recipient,
        reason: result.reason || result.error || 'Delivery rejected by SMTP server',
        error: result.error,
        message: `The SMTP server rejected the email: ${result.error || result.reason}. Please verify that your Google App Password is correct and that 2-Step Verification is active.`,
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      delivered: false,
      error: err.message,
    });
  }
});

export default router;
