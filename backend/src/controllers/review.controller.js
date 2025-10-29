const asyncHandler = require('../middleware/async');
const AppError = require('../middleware/errorResponse');
const Review = require('../models/Review');
const Product = require('../models/Product');
const webSocketService = require('../services/websocketService');

// @desc    Get reviews for a product
// @route   GET /api/products/:productId/reviews
// @access  Public
const getReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId })
    .populate('user', 'fullName')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Create anonymous comment (no login required)
// @route   POST /api/products/:productId/reviews/comment
// @access  Public
const createAnonymousComment = asyncHandler(async (req, res) => {
  const { comment, title, anonymousName, anonymousEmail } = req.body;

  // Check if product exists
  const product = await Product.findById(req.params.productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Validate anonymous info
  if (!anonymousName || !comment) {
    return res.status(400).json({
      success: false,
      message: 'Name and comment are required'
    });
  }

  const review = await Review.create({
    product: req.params.productId,
    comment,
    title: title || 'Customer Comment',
    anonymousUser: {
      name: anonymousName,
      email: anonymousEmail
    },
    rating: null // No rating for anonymous comments
  });

  // Populate for response
  await review.populate('product', 'name');

  // Broadcast via WebSocket
  webSocketService.broadcastNewReview(req.params.productId, review);

  res.status(201).json({
    success: true,
    message: 'Comment posted successfully',
    data: { review }
  });
});

// @desc    Create rating (login required)
// @route   POST /api/products/:productId/reviews/rating
// @access  Private
const createRating = asyncHandler(async (req, res) => {
  const { rating, comment, title } = req.body;

  // Check if product exists
  const product = await Product.findById(req.params.productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5 stars'
    });
  }

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    product: req.params.productId,
    user: req.user.id
  });

  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'You have already reviewed this product'
    });
  }

  const review = await Review.create({
    product: req.params.productId,
    user: req.user.id,
    rating,
    comment: comment || '',
    title: title || 'Customer Review'
  });

  // Update product average rating
  await Review.updateProductRating(req.params.productId);

  // Get updated product rating
  const updatedProduct = await Product.findById(req.params.productId);

  // Populate for response
  await review.populate('user', 'fullName email');

  // Broadcast via WebSocket
  webSocketService.broadcastNewReview(req.params.productId, review);
  webSocketService.broadcastUpdatedRating(req.params.productId, {
    averageRating: updatedProduct.averageRating,
    reviewCount: updatedProduct.reviewCount
  });

  res.status(201).json({
    success: true,
    message: 'Review posted successfully',
    data: { review }
  });
});

// @desc    Create a review (DEPRECATED - use createRating or createAnonymousComment)
// @route   POST /api/products/:productId/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { rating, comment, title } = req.body;

  // Check if product exists
  const product = await Product.findById(req.params.productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    product: req.params.productId,
    user: req.user.id
  });

  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'You have already reviewed this product'
    });
  }

  const review = await Review.create({
    product: req.params.productId,
    user: req.user.id,
    rating,
    comment,
    title
  });

  // Update product average rating
  await Review.updateProductRating(req.params.productId);

  res.status(201).json({
    success: true,
    data: { review }
  });
});

// @desc    Update a review
// @route   PUT /api/products/:productId/reviews/:reviewId
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
  let review = await Review.findById(req.params.reviewId);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Make sure review belongs to user or user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to update this review'
    });
  }

  review = await Review.findByIdAndUpdate(req.params.reviewId, req.body, {
    new: true,
    runValidators: true
  });

  // Update product average rating
  await Review.getAverageRating(req.params.productId);

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Delete a review
// @route   DELETE /api/products/:productId/reviews/:reviewId
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Make sure review belongs to user or user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to delete this review'
    });
  }

  await review.remove();

  // Update product average rating
  await Review.getAverageRating(req.params.productId);

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  getReviews,
  createReview,
  createAnonymousComment,
  createRating,
  updateReview,
  deleteReview
};
