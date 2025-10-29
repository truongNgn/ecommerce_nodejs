const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  getMyOrders
} = require('../controllers/order.controller');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

// Public routes (guest checkout)
router.post('/', optionalAuth, createOrder);

// Protected routes
router.get('/my', protect, getMyOrders);
router.get('/orders/my', protect, getMyOrders); // Alternative endpoint
router.get('/:id', protect, getOrder);

// Admin routes
router.get('/', protect, authorize('admin'), getOrders);

// Order status update - allow both customers and admins
router.put('/:id/status', protect, updateOrderStatus);

module.exports = router;
