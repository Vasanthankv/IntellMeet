import express from 'express';
import Enquiry from '../models/Enquiry.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Simple in-memory rate limiting map for contact form: max 5 submissions per 15 minutes per IP
const submissionRateMap = new Map();

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_SUBMISSIONS_PER_WINDOW = 5;

// Clean up stale rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of submissionRateMap.entries()) {
    if (now - data.firstAttempt > RATE_LIMIT_WINDOW_MS) {
      submissionRateMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * @route   POST /api/contact OR /api/enquiries
 * @desc    Submit a sales enquiry / contact form message
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const isDbConnected = Enquiry.db && Enquiry.db.readyState === 1;
    if (!isDbConnected) {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable. Please try again shortly.',
      });
    }

    // IP rate limiting check
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const rateData = submissionRateMap.get(clientIp);

    if (rateData) {
      if (now - rateData.firstAttempt < RATE_LIMIT_WINDOW_MS) {
        if (rateData.count >= MAX_SUBMISSIONS_PER_WINDOW) {
          return res.status(429).json({
            success: false,
            message: 'Too many submissions received from this network. Please wait a few minutes before trying again.',
          });
        }
        rateData.count += 1;
      } else {
        submissionRateMap.set(clientIp, { firstAttempt: now, count: 1 });
      }
    } else {
      submissionRateMap.set(clientIp, { firstAttempt: now, count: 1 });
    }

    // Input sanitization & validation
    let { name, email, company, teamSize, enquiryType, message } = req.body;

    name = typeof name === 'string' ? name.trim() : '';
    email = typeof email === 'string' ? email.trim().toLowerCase() : '';
    company = typeof company === 'string' ? company.trim() : '';
    message = typeof message === 'string' ? message.trim() : '';
    enquiryType = typeof enquiryType === 'string' ? enquiryType.trim() : 'Enterprise Deployment';
    teamSize = typeof teamSize === 'string' ? teamSize.trim() : '1-10';

    const errors = {};

    if (!name || name.length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      errors.email = 'Please provide a valid business email address.';
    }

    if (!company || company.length < 2) {
      errors.company = 'Company or organization name is required.';
    }

    if (!message || message.length < 10) {
      errors.message = 'Please provide a message with at least 10 characters explaining your meeting needs.';
    }

    const validEnquiryTypes = [
      'Enterprise Deployment',
      'Custom AI & Security Requirements',
      'Volume Pricing & Licensing',
      'Technical Integration / API',
      'Other',
    ];
    if (!validEnquiryTypes.includes(enquiryType)) {
      enquiryType = 'Enterprise Deployment';
    }

    const validTeamSizes = ['1-10', '11-50', '51-200', '201-1000', '1000+'];
    if (!validTeamSizes.includes(teamSize)) {
      teamSize = '1-10';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please correct the highlighted errors.',
        errors,
      });
    }

    // Create and persist enquiry to MongoDB Atlas
    const enquiry = new Enquiry({
      name,
      email,
      company,
      teamSize,
      enquiryType,
      message,
      ipAddress: clientIp !== 'unknown' ? clientIp : null,
      userAgent: req.headers['user-agent'] ? req.headers['user-agent'].slice(0, 255) : null,
    });

    const savedEnquiry = await enquiry.save();

    console.log(`[SalesEnquiry] New enquiry logged: #${savedEnquiry._id} from ${email} (${company})`);

    return res.status(201).json({
      success: true,
      message: 'Your enquiry has been received. Our sales solutions team will reach out within 1 business day.',
      enquiryId: savedEnquiry._id,
      createdAt: savedEnquiry.createdAt,
    });
  } catch (error) {
    console.error('[SalesEnquiry] Error processing submission:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An unexpected error occurred while processing your enquiry.',
    });
  }
});

/**
 * @route   GET /api/contact OR /api/enquiries
 * @desc    View sales enquiries (Strictly protected for Administrators)
 * @access  Private (Admin)
 */
router.get('/', protect, async (req, res) => {
  try {
    // Only allow administrators or account owners to view customer enquiries
    const userRole = (req.user?.role || '').toLowerCase();
    const isAdmin = userRole.includes('admin') || userRole.includes('owner');

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Administrator privileges required.',
      });
    }

    const isDbConnected = Enquiry.db && Enquiry.db.readyState === 1;
    if (!isDbConnected) {
      return res.status(503).json({ success: false, message: 'Database offline' });
    }

    const enquiries = await Enquiry.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json({
      success: true,
      count: enquiries.length,
      enquiries,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
