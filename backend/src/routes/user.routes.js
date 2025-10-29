const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  getUserOrders
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth');

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

// Address management routes
router.get('/addresses', protect, getUserAddresses);
router.post('/addresses', protect, addUserAddress);
router.put('/addresses/:id', protect, updateUserAddress);
router.delete('/addresses/:id', protect, deleteUserAddress);

// Orders
router.get('/orders', protect, getUserOrders);

module.exports = router;
