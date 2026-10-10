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
      if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'intellmeet_jwt_secret_key_2026_secure');
      
      // If DB is connected
      if (User.db && User.db.readyState === 1) {
        req.user = await User.findById(decoded.id || decoded._id).select('-password');
        if (!req.user && decoded.email) {
          req.user = await User.findOne({ email: decoded.email.toLowerCase() }).select('-password');
        }
      }
      if (!req.user) {
        req.user = decoded;
      }
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};
