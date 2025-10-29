const express = require('express');
const passport = require('passport');
const {
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
} = require('../controllers/auth.controller');
const { protect, verifyEmailToken, verifyPasswordResetToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmailToken, verifyEmail);

// Social Authentication routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { 
  failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=google_auth_failed` 
}), googleCallback);

router.get('/facebook', passport.authenticate('facebook', { 
  scope: ['email', 'public_profile'] 
}));

router.get('/facebook/callback', passport.authenticate('facebook', { 
  failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=facebook_auth_failed`,
  failureMessage: true
}), facebookCallback);

router.get('/success', socialLoginSuccess);

// Test email endpoint (for debugging)
router.post('/test-email', async (req, res) => {
  try {
    const { sendEmail } = require('../services/emailService');
    
    await sendEmail({
      email: 'namhuynhfree@gmail.com',
      subject: 'Test Email - TechStore',
      message: 'This is a test email to verify email service configuration.'
    });
    
    res.json({
      success: true,
      message: 'Test email sent successfully'
    });
  } catch (error) {
    console.error('Test email failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test email failed',
      error: error.message
    });
  }
});

// Protected routes
router.use(protect); // All routes below this middleware are protected

router.post('/logout', logout);
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.post('/resend-verification', resendVerification);
router.post('/refresh-token', refreshToken);

module.exports = router;
