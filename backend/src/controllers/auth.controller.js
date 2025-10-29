const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const AppError = require('../middleware/errorResponse');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../services/emailService');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { email, password, fullName, phone, address } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  // Prepare user data
  const userData = {
    email,
    password,
    fullName
  };
  
  // Add optional phone
  if (phone) {
    userData.phone = phone;
  }
  
  // Add shipping address if provided
  if (address) {
    userData.addresses = [{
      type: 'default',
      fullName: fullName,
      street: address,
      city: 'Ho Chi Minh City', // Default values, can be updated later
      state: 'Ho Chi Minh',
      zipCode: '700000',
      country: 'Vietnam',
      phone: phone || '',
      isDefault: true
    }];
  }

  // Create user
  const user = await User.create(userData);

  // Generate email verification token
  const emailToken = user.getSignedJwtToken();
  user.emailVerificationToken = emailToken;
  user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  await user.save();

  // Send verification email
  try {
    await sendEmail({
      email: user.email,
      subject: 'Email Verification - TechStore',
      message: `Please verify your email by clicking the link: ${req.protocol}://${req.get('host')}/api/auth/verify-email/${emailToken}`
    });
  } catch (error) {
    console.error('Email sending failed:', error);
    // Don't fail registration if email fails
  }

  // Generate JWT token
  const token = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please check your email for verification.',
    data: {
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      token,
      refreshToken
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // Check for user
  const user = await User.findByEmail(email).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account has been deactivated'
    });
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate JWT token
  const token = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        loyaltyPoints: user.loyaltyPoints
      },
      token,
      refreshToken
    }
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  // In a more sophisticated setup, you might want to blacklist the token
  // For now, we'll just send a success response
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  res.json({
    success: true,
    data: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      loyaltyPoints: user.loyaltyPoints,
      addresses: user.addresses,
      createdAt: user.createdAt
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, addresses } = req.body;
  
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  if (fullName) {
    user.fullName = fullName;
  }
  
  if (phone !== undefined) {
    user.phone = phone;
  }
  
  if (addresses) {
    user.addresses = addresses;
  }
  
  await user.save();
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        loyaltyPoints: user.loyaltyPoints,
        addresses: user.addresses
      }
    }
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  // Validate input
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required'
    });
  }
  
  // Validate new password strength
  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long'
    });
  }
  
  // Check if new password is same as current
  if (currentPassword === newPassword) {
    return res.status(400).json({
      success: false,
      message: 'New password must be different from current password'
    });
  }
  
  const user = await User.findById(req.user.id).select('+password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }
  
  // Update password (will be hashed by pre-save middleware)
  user.password = newPassword;
  await user.save();
  
  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  console.log('🔐 Forgot password request for:', email);
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address'
    });
  }
  
  const user = await User.findByEmail(email);
  
  // Always return success to prevent user enumeration
  // But only send email if user exists
  if (user) {
    console.log('✅ User found, generating reset token for:', user.email);
    
    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set expire (10 minutes)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    
    await user.save();
    console.log('✅ Reset token generated and saved');
    
    // Create reset url for frontend
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
    
    console.log('📧 Reset URL created:', resetUrl);
    
    const message = `You are receiving this email because you (or someone else) has requested a password reset for your account.\n\n
Please click on the following link to reset your password:\n\n
${resetUrl}\n\n
This link will expire in 10 minutes.\n\n
If you did not request this, please ignore this email and your password will remain unchanged.`;
    
    try {
      console.log('📧 Attempting to send password reset email...');
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request - TechStore',
        message
      });
      console.log('✅ Password reset email sent successfully');
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      
      // Clear the reset token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      
      // Log the specific error for debugging
      console.error('Email error details:', {
        message: error.message,
        code: error.code,
        response: error.response,
        command: error.command
      });
      
      // Return error response with more details
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset email. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } else {
    console.log('ℹ️ User not found for email:', email);
  }
  
  // Always return success message (security best practice)
  res.json({
    success: true,
    message: 'If an account exists with this email, a password reset link has been sent'
  });
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  
  // Validate password
  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required'
    });
  }
  
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }
  
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });
  
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }
  
  // Set new password (will be hashed by pre-save middleware)
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  
  // Generate JWT token for auto-login
  const jwtToken = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();
  
  res.json({
    success: true,
    message: 'Password reset successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      token: jwtToken,
      refreshToken
    }
  });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpire: { $gt: Date.now() }
  });
  
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification token'
    });
  }
  
  // Mark email as verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();
  
  res.json({
    success: true,
    message: 'Email verified successfully'
  });
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
const resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email is already verified'
    });
  }
  
  // Generate new verification token
  const emailToken = user.getSignedJwtToken();
  user.emailVerificationToken = emailToken;
  user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  await user.save();
  
  // Send verification email
  try {
    await sendEmail({
      email: user.email,
      subject: 'Email Verification - TechStore',
      message: `Please verify your email by clicking the link: ${req.protocol}://${req.get('host')}/api/auth/verify-email/${emailToken}`
    });
    
    res.json({
      success: true,
      message: 'Verification email sent'
    });
  } catch (error) {
    console.error('Email sending failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Email could not be sent'
    });
  }
});


// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token is required'
    });
  }
  
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
    
    // Generate new access token
    const newToken = user.getSignedJwtToken();
    
    res.json({
      success: true,
      data: {
        token: newToken
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
const googleCallback = asyncHandler(async (req, res) => {
  try {
    console.log('🔐 Google callback - User:', req.user);
    
    // This will be handled by passport middleware
    // The user will be available in req.user after successful authentication
    const user = req.user;
    
    if (!user) {
      console.log('❌ No user in Google callback');
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=google_auth_failed`);
    }
    
    // Generate JWT token
    const token = user.getSignedJwtToken();
    const refreshToken = user.getRefreshToken();
    
    console.log('✅ Google auth successful, redirecting with token');
    
    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}&refresh=${refreshToken}`);
  } catch (error) {
    console.error('❌ Google callback error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=google_auth_failed`);
  }
});

// @desc    Facebook OAuth callback
// @route   GET /api/auth/facebook/callback
// @access  Public
const facebookCallback = asyncHandler(async (req, res) => {
  try {
    console.log('🔐 Facebook callback - User:', req.user);
    console.log('🔐 Facebook callback - Session:', req.session);
    
    // This will be handled by passport middleware
    // The user will be available in req.user after successful authentication
    const user = req.user;
    
    if (!user) {
      console.log('❌ No user in Facebook callback');
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=facebook_auth_failed`);
    }
    
    // Generate JWT token
    const token = user.getSignedJwtToken();
    const refreshToken = user.getRefreshToken();
    
    console.log('✅ Facebook auth successful, redirecting with token');
    
    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}&refresh=${refreshToken}`);
  } catch (error) {
    console.error('❌ Facebook callback error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=facebook_auth_failed`);
  }
});

// @desc    Social login success handler
// @route   GET /api/auth/success
// @access  Public
const socialLoginSuccess = asyncHandler(async (req, res) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Social authentication failed'
    });
  }
  
  const token = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();
  
  res.json({
    success: true,
    message: 'Social login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        socialLogin: user.socialLogin
      },
      token,
      refreshToken
    }
  });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  refreshToken,
  googleCallback,
  facebookCallback,
  socialLoginSuccess
};
