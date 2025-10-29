const express = require('express');
const router = express.Router();
const {
  getDiscounts,
  getDiscount,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  validateDiscount
} = require('../controllers/discount.controller');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/validate/:code', validateDiscount);

// Protected routes (Admin only)
router.get('/', protect, authorize('admin'), getDiscounts);
router.get('/:id', protect, authorize('admin'), getDiscount);
router.post('/', protect, authorize('admin'), createDiscount);
router.put('/:id', protect, authorize('admin'), updateDiscount);
router.delete('/:id', protect, authorize('admin'), deleteDiscount);

module.exports = router;
