const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  searchProducts,
  getCategories,
  getBrands,
  getFeaturedProducts,
  getNewProducts,
  getBestSellingProducts,
  getProductReviews,
  getProductStats
} = require('../controllers/product.controller');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/categories', getCategories);
router.get('/brands', getBrands);
router.get('/featured', getFeaturedProducts);
router.get('/new', getNewProducts);
router.get('/bestsellers', getBestSellingProducts);
router.get('/:id', getProduct);
router.get('/:id/reviews', getProductReviews);
router.get('/:id/stats', getProductStats);

module.exports = router;
