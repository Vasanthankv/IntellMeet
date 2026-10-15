import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/billing/plans
// @desc    Retrieve enterprise subscription tiers & features
// @access  Private / Public
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    plans: [
      {
        id: 'basic',
        name: 'Basic Free',
        priceMonthly: 0,
        priceAnnual: 0,
        participantLimit: 100,
        durationMinutes: 40,
        cloudRecording: false,
        aiCompanion: false,
        features: ['Up to 100 participants', '40-minute limit on group meetings', 'Local recording', 'Team Chat & Whiteboard']
      },
      {
        id: 'pro',
        name: 'Pro',
        priceMonthly: 15.99,
        priceAnnual: 159.90,
        participantLimit: 150,
        durationMinutes: 1800,
        cloudRecording: true,
        cloudStorageGb: 5,
        aiCompanion: true,
        features: ['Up to 150 participants', '30 hours per meeting', '5GB Cloud Recording (GridFS)', 'AI Summary & Live Transcripts', 'User Management']
      },
      {
        id: 'business',
        name: 'Business Enterprise',
        priceMonthly: 21.99,
        priceAnnual: 219.90,
        participantLimit: 300,
        durationMinutes: 1800,
        cloudRecording: true,
        cloudStorageGb: 25,
        aiCompanion: true,
        features: ['Up to 300 participants', 'Unlimited Cloud Recording', 'Company Branding & Custom URLs', 'Single Sign-On (SSO)', 'Admin Portal & Audit Logs']
      }
    ]
  });
});

// @route   GET /api/billing/subscription
// @desc    Get active organization subscription details
// @access  Private
router.get('/subscription', protect, (req, res) => {
  res.json({
    success: true,
    subscription: {
      plan: 'business',
      planName: 'IntellMeet Enterprise Business',
      status: 'active',
      licensedSeats: 25,
      seatsUsed: 1,
      billingCycle: 'annual',
      renewalDate: '2026-11-01T00:00:00.000Z',
      currency: 'USD',
      amountDue: 0.00,
      paymentMethod: {
        brand: 'Visa',
        last4: '4242',
        expiry: '12/28'
      }
    }
  });
});

// @route   GET /api/billing/payments
// @desc    Get payment and invoice history
// @access  Private
router.get('/payments', protect, (req, res) => {
  res.json({
    success: true,
    payments: [
      {
        invoiceId: 'INV-2026-10-01',
        amount: 549.75,
        currency: 'USD',
        date: '2026-10-01T10:00:00.000Z',
        status: 'PAID',
        description: 'IntellMeet Enterprise - Annual Subscription (25 Seats)',
        downloadUrl: '/api/billing/invoices/INV-2026-10-01.pdf'
      },
      {
        invoiceId: 'INV-2025-10-01',
        amount: 549.75,
        currency: 'USD',
        date: '2025-10-01T10:00:00.000Z',
        status: 'PAID',
        description: 'IntellMeet Enterprise - Initial Setup & Annual License',
        downloadUrl: '/api/billing/invoices/INV-2025-10-01.pdf'
      }
    ]
  });
});

export default router;
