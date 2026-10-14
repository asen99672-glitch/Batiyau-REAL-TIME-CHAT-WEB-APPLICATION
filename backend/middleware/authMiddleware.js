import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// JWT token verify karne ka middleware
const protect = async (req, res, next) => {
  let token;

  // Authorization header se token nikalo
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // "Bearer <token>" se sirf token nikalo
      token = req.headers.authorization.split(' ')[1];

      // Token verify karo
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // User database se nikalo (password exclude karo)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (req.user.isDeleted) {
        return res.status(403).json({
          message: 'Your account has been deleted or deactivated.',
          isDeleted: true,
        });
      }

      // Check temporary block expiration
      if (req.user.isBanned) {
        if (req.user.blockType === 'temporary' && req.user.blockExpiryDate && new Date(req.user.blockExpiryDate) <= new Date()) {
          req.user.isBanned = false;
          req.user.blockExpiryDate = null;
          req.user.blockHistory.push({
            action: 'unblock',
            reason: 'Temporary block duration expired automatically',
            adminName: 'System (Auto-expiry)',
            createdAt: new Date(),
          });
          await req.user.save();
        } else {
          return res.status(403).json({
            message: req.user.banReason
              ? `Account blocked: ${req.user.banReason}`
              : 'Your account has been blocked by an administrator.',
            isBanned: true,
            blockType: req.user.blockType || 'permanent',
            blockExpiryDate: req.user.blockExpiryDate,
          });
        }
      }

      // Check temporary suspension expiration
      if (req.user.isSuspended) {
        if (req.user.suspendedUntil && new Date(req.user.suspendedUntil) <= new Date()) {
          req.user.isSuspended = false;
          req.user.suspendedUntil = null;
          req.user.suspensionHistory.push({
            action: 'activate',
            reason: 'Suspension period concluded automatically',
            adminName: 'System (Auto-expiry)',
            createdAt: new Date(),
          });
          await req.user.save();
        } else {
          return res.status(403).json({
            message: req.user.suspendReason
              ? `Account temporarily suspended: ${req.user.suspendReason}`
              : 'Your account is currently suspended by an administrator.',
            isSuspended: true,
            suspendedUntil: req.user.suspendedUntil,
          });
        }
      }

      next(); // Aage jaao
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Any Admin Portal Access middleware
const requireAnyAdmin = (req, res, next) => {
  if (req.user && ['superadmin', 'admin', 'moderator', 'support_admin', 'security_admin'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Administrative privileges required' });
  }
};

// Admin only middleware - Super Admin / Admin strictly required
const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'superadmin' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Administrator privileges required' });
  }
};

// Superadmin only middleware
const requireSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Super Admin privileges required' });
  }
};

// Moderator or Admin middleware
const requireModerator = (req, res, next) => {
  if (req.user && ['moderator', 'admin', 'superadmin'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Moderator privileges required' });
  }
};

// Security Admin or Superadmin middleware
const requireSecurityAdmin = (req, res, next) => {
  if (req.user && ['security_admin', 'admin', 'superadmin'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Security Admin privileges required' });
  }
};

export { protect, requireAnyAdmin, requireAdmin, requireSuperAdmin, requireModerator, requireSecurityAdmin };

