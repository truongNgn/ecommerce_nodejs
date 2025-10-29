const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyDiscountCode,
  removeDiscountCode,
  useLoyaltyPoints,
  removeLoyaltyPoints,
  mergeCarts
} = require('../controllers/cart.controller');
const { protect, optionalAuth } = require('../middleware/auth');

// All cart routes can work with or without authentication
router.use(optionalAuth);

// Debug middleware for cart routes
router.use((req, res, next) => {
  console.log('🛒 Cart route middleware:', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path
  });
  next();
});

// Test route to verify routing works
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Cart routes are working' });
});

// Test PUT route
router.put('/test-update', (req, res) => {
  res.json({ success: true, message: 'PUT route is working', body: req.body });
});

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.delete('/remove/:productId/:variantId', removeFromCart);
router.delete('/clear', clearCart);
router.post('/discount', applyDiscountCode);
router.delete('/discount', removeDiscountCode);
router.post('/loyalty', useLoyaltyPoints);
router.delete('/loyalty', removeLoyaltyPoints);
router.post('/merge', mergeCarts);

// Test endpoint to create discount code
router.post('/test-discount', async (req, res) => {
  try {
    const DiscountCode = require('../models/DiscountCode');
    
    // Create a test discount code
    const testCode = await DiscountCode.create({
      code: 'TEST1',
      description: 'Test discount code - 10% off',
      discountType: 'percentage',
      discountValue: 10,
      maxUses: 10,
      minOrderAmount: 0,
      isActive: true
    });
    
    res.json({
      success: true,
      message: 'Test discount code created',
      data: { code: testCode.code }
    });
  } catch (error) {
    console.error('❌ Failed to create test discount code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test discount code',
      error: error.message
    });
  }
});

module.exports = router;
