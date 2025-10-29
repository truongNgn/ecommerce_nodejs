const express = require('express');
const router = express.Router();
const {
  getReviews,
  createReview,
  createAnonymousComment,
  createRating,
  updateReview,
  deleteReview
} = require('../controllers/review.controller');
const { protect, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/:productId', getReviews);
router.post('/:productId/comment', createAnonymousComment); // Anonymous comment (no login)

// Protected routes
router.post('/:productId/rating', protect, createRating); // Rating (login required)
router.post('/:productId', protect, createReview); // Full review (DEPRECATED)
router.put('/:productId/:reviewId', protect, updateReview);
router.delete('/:productId/:reviewId', protect, deleteReview);

module.exports = router;
