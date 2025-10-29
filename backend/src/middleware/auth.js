const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is valid but user no longer exists.'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account has been deactivated.'
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication.'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please authenticate first.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role ${req.user.role} is not authorized to access this resource.`
      });
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    console.log('🔐 Optional auth middleware:', {
      method: req.method,
      url: req.url,
      hasAuth: !!req.headers.authorization,
      sessionId: req.sessionID
    });

    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
          console.log('🔐 User authenticated:', user.id);
        }
      } catch (error) {
        // Token is invalid, but we don't fail the request
        console.log('Optional auth: Invalid token, continuing without user');
      }
    }

    console.log('🔐 Optional auth result:', {
      hasUser: !!req.user,
      userId: req.user?.id || 'guest'
    });

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if there's an error
  }
};

// Check if user owns resource or is admin
const checkOwnership = (resourceUserIdField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please authenticate first.'
      });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (resourceUserId && resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }

    next();
  };
};

// Rate limiting for auth endpoints
const authRateLimit = (req, res, next) => {
  // This would typically use a rate limiting library like express-rate-limit
  // For now, we'll implement a simple check
  const attempts = req.session?.authAttempts || 0;
  const lastAttempt = req.session?.lastAuthAttempt || 0;
  const now = Date.now();
  
  // Reset attempts if more than 15 minutes have passed
  if (now - lastAttempt > 15 * 60 * 1000) {
    req.session.authAttempts = 0;
  }
  
  // Block if more than 5 attempts in 15 minutes
  if (attempts >= 5) {
    return res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again later.'
    });
  }
  
  next();
};

// Verify email token
const verifyEmailToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Email verification token is required.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email verification token.'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired email verification token.'
    });
  }
};

// Verify password reset token
const verifyPasswordResetToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is required.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password reset token.'
      });
    }

    if (!user.resetPasswordToken || user.resetPasswordToken !== token) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password reset token.'
      });
    }

    if (user.resetPasswordExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token has expired.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired password reset token.'
    });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please authenticate first.'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  next();
};

// Check if user is customer
const isCustomer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please authenticate first.'
    });
  }

  if (req.user.role !== 'customer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Customer privileges required.'
    });
  }

  next();
};

// Check if user can access order
const canAccessOrder = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please authenticate first.'
      });
    }

    const Order = require('../models/Order');
    const orderId = req.params.id || req.params.orderId;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required.'
      });
    }

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Admin can access any order
    if (req.user.role === 'admin') {
      req.order = order;
      return next();
    }

    // Customer can only access their own orders
    if (order.user && order.user.toString() === req.user._id.toString()) {
      req.order = order;
      return next();
    }

    // Check guest orders by email
    if (order.guestInfo && order.guestInfo.email === req.user.email) {
      req.order = order;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own orders.'
    });
  } catch (error) {
    console.error('Order access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error checking order access.'
    });
  }
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  checkOwnership,
  authRateLimit,
  verifyEmailToken,
  verifyPasswordResetToken,
  isAdmin,
  isCustomer,
  canAccessOrder
};
