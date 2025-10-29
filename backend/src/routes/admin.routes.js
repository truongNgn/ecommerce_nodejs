const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getAdvancedDashboard,
  getUsers,
  updateUserRole,
  toggleUserStatus,
  updateUserInfo,
  deleteUser,
  getOrders,
  getOrderDetails,
  updateOrderStatus,
  getDiscountCodes,
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require admin authentication
router.use((req, res, next) => {
  console.log('=== ADMIN ROUTES MIDDLEWARE ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Original URL:', req.originalUrl);
  console.log('Path:', req.path);
  next();
});

router.use(protect, authorize('admin'));

// Dashboard routes
router.get('/dashboard', getDashboard);
router.get('/dashboard/advanced', getAdvancedDashboard);

// User management
router.get('/users', getUsers);
router.put('/users/:id', updateUserInfo);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

// Order management
router.get('/orders', getOrders);
router.get('/orders/:id', getOrderDetails);
router.put('/orders/:id/status', updateOrderStatus);

// Discount management
router.get('/discounts', getDiscountCodes);
router.post('/discounts', createDiscountCode);
router.put('/discounts/:id', updateDiscountCode);
router.delete('/discounts/:id', deleteDiscountCode);

// Product management
router.get('/products', getProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.put('/products/:id/toggle-status', toggleProductStatus);

module.exports = router;
