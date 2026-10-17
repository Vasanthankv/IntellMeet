import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (token && token !== 'null' && token !== 'undefined') {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'intellmeet_jwt_secret_key_2026_secure');
        
        // If DB is connected
        if (User.db && User.db.readyState === 1) {
          req.user = await User.findById(decoded.id || decoded._id).select('-password').lean();
          if (!req.user && decoded.email) {
            req.user = await User.findOne({ email: decoded.email.toLowerCase() }).select('-password').lean();
          }
        }
        if (!req.user) {
          req.user = decoded;
        }
        if (req.user) {
          if (!req.user.id && req.user._id) req.user.id = String(req.user._id);
          if (!req.user._id && req.user.id) req.user._id = req.user.id;
        }
        return next();
      }
    } catch (error) {
      console.warn('JWT verification fallback for meeting context:', error.message);
    }
  }

  // Graceful fallback for meeting participants (Summary, Q&A, Notes, Translation, Interpretation)
  const isMeetingContext = 
    req.params?.meetingId || 
    req.body?.meetingId || 
    req.query?.meetingId || 
    req.baseUrl?.includes('meeting') ||
    req.baseUrl?.includes('recording') ||
    req.baseUrl?.includes('whiteboard') ||
    req.baseUrl?.includes('poll') ||
    req.baseUrl?.includes('summar') ||
    req.baseUrl?.includes('question') ||
    req.baseUrl?.includes('transcript') ||
    req.baseUrl?.includes('note') ||
    req.baseUrl?.includes('translation') ||
    req.baseUrl?.includes('interpretation');

  if (isMeetingContext) {
    req.user = {
      _id: 'guest_' + (req.headers['x-participant-id'] || 'participant'),
      id: req.headers['x-participant-id'] || 'guest',
      name: req.headers['x-participant-name'] || 'Meeting Participant',
      email: 'participant@intellmeet.io',
      role: 'participant'
    };
    return next();
  }

  return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
};
