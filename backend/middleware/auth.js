import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to protect routes
export const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!req.user.isActive) {
        return res.status(401).json({ message: 'User account is deactivated' });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware to check if user is admin
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Not authorized as admin' });
  }
};

// Middleware to check subscription level
export const requireSubscription = (minLevel = 'monthly') => {
  return (req, res, next) => {
    const subscriptionLevels = {
      'free': 0,
      'monthly': 1
    };

    const userLevel = subscriptionLevels[req.user.subscriptionStatus] || 0;
    const requiredLevel = subscriptionLevels[minLevel] || 0;

    if (userLevel >= requiredLevel) {
      next();
    } else {
      return res.status(403).json({ 
        message: `Subscription level '${minLevel}' or higher required`,
        currentLevel: req.user.subscriptionStatus
      });
    }
  };
}; 