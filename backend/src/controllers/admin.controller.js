const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const DiscountCode = require('../models/DiscountCode');
const asyncHandler = require('../middleware/async');
const AppError = require('../middleware/errorResponse');

// @desc    Get admin dashboard (Simple Dashboard)
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboard = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  
  // Calculate date range
  const now = new Date();
  const startDate = new Date(now.getTime() - (period === '7d' ? 7 : period === '30d' ? 30 : 365) * 24 * 60 * 60 * 1000);
  
  // Get basic statistics
  const [
    totalUsers,
    newUsers,
    totalProducts,
    totalOrders,
    revenue,
    recentOrders,
    bestSellingProducts
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: startDate } }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments({ createdAt: { $gte: startDate } }),
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),
    Order.find({ createdAt: { $gte: startDate } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'fullName email'),
    Product.find({ isActive: true })
      .sort({ salesCount: -1 })
      .limit(5)
      .select('name salesCount basePrice images')
  ]);
  
  res.json({
    success: true,
    data: {
      stats: {
        totalUsers,
        newUsers,
        totalProducts,
        totalOrders,
        revenue: revenue[0]?.total || 0
      },
      recentOrders,
      bestSellingProducts
    }
  });
});

// @desc    Get advanced dashboard analytics
// @route   GET /api/admin/dashboard/advanced
// @access  Private/Admin
const getAdvancedDashboard = asyncHandler(async (req, res) => {
  const { 
    timeframe = 'yearly', 
    startDate, 
    endDate,
    year,
    quarter,
    month,
    week
  } = req.query;
  
  let dateFilter = {};
  let groupBy = {};
  
  // Calculate date range based on timeframe
  const now = new Date();
  
  if (startDate && endDate) {
    // Custom date range
    dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
  } else {
    switch (timeframe) {
      case 'yearly':
        if (year) {
          const yearStart = new Date(`${year}-01-01`);
          const yearEnd = new Date(`${year}-12-31`);
          dateFilter = {
            createdAt: { $gte: yearStart, $lte: yearEnd }
          };
        } else {
          const currentYear = now.getFullYear();
          const yearStart = new Date(`${currentYear}-01-01`);
          const yearEnd = new Date(`${currentYear}-12-31`);
          dateFilter = {
            createdAt: { $gte: yearStart, $lte: yearEnd }
          };
        }
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
        
      case 'quarterly':
        if (year && quarter) {
          const quarterStart = new Date(`${year}-${(quarter - 1) * 3 + 1}-01`);
          const quarterEnd = new Date(`${year}-${quarter * 3}-31`);
          dateFilter = {
            createdAt: { $gte: quarterStart, $lte: quarterEnd }
          };
        }
        groupBy = {
          year: { $year: '$createdAt' },
          quarter: { $ceil: { $divide: [{ $month: '$createdAt' }, 3] } }
        };
        break;
        
      case 'monthly':
        if (year && month) {
          const monthStart = new Date(`${year}-${month}-01`);
          const monthEnd = new Date(`${year}-${month}-31`);
          dateFilter = {
            createdAt: { $gte: monthStart, $lte: monthEnd }
          };
        }
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
        
      case 'weekly':
        if (year && week) {
          const weekStart = new Date(`${year}-01-01`);
          weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          dateFilter = {
            createdAt: { $gte: weekStart, $lte: weekEnd }
          };
        }
        groupBy = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
    }
  }
  
  // Get analytics data
  const [
    ordersAnalytics,
    revenueAnalytics,
    productAnalytics,
    categoryAnalytics
  ] = await Promise.all([
    // Orders by time period
    Order.aggregate([
      { $match: dateFilter },
      { $group: { 
        _id: groupBy, 
        count: { $sum: 1 },
        totalRevenue: { $sum: '$total' }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.quarter': 1, '_id.week': 1 }}
    ]),
    
    // Revenue analytics
    Order.aggregate([
      { $match: dateFilter },
      { $group: { 
        _id: groupBy, 
        revenue: { $sum: '$total' },
        profit: { $sum: { $multiply: ['$total', 0.2] } } // Assuming 20% profit margin
      }},
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.quarter': 1, '_id.week': 1 }}
    ]),
    
    // Product sales analytics
    Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      { $group: { 
        _id: '$items.product', 
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] }}
      }},
      { $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }},
      { $unwind: '$product' },
      { $sort: { totalSold: -1 }},
      { $limit: 10 }
    ]),
    
    // Category analytics
    Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      { $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product'
      }},
      { $unwind: '$product' },
      { $group: { 
        _id: '$product.category', 
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] }}
      }},
      { $sort: { totalRevenue: -1 }}
    ])
  ]);
  
  res.json({
    success: true,
    data: {
      timeframe,
      dateFilter,
      analytics: {
        orders: ordersAnalytics,
        revenue: revenueAnalytics,
        products: productAnalytics,
        categories: categoryAnalytics
      }
    }
  });
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  const filter = {};
  if (role) filter.role = role;
  if (search) filter.$or = [
    { fullName: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } }
  ];
  
  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .skip((pageNum - 1) * limitNum);
  
  const total = await User.countDocuments(filter);
  const totalPages = Math.ceil(total / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;
  
  res.json({
    success: true,
    count: users.length,
    total,
    pagination: {
      currentPage: pageNum,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? pageNum + 1 : null,
      prevPage: hasPrevPage ? pageNum - 1 : null
    },
    data: users
  });
});

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, dateFrom, dateTo } = req.query;
  
  const filter = {};
  if (status) filter.status = status;
  if (dateFrom && dateTo) {
    filter.createdAt = {
      $gte: new Date(dateFrom),
      $lte: new Date(dateTo)
    };
  }
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .skip((pageNum - 1) * limitNum)
    .populate('user', 'fullName email');
  
  const total = await Order.countDocuments(filter);
  const totalPages = Math.ceil(total / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;
  
  res.json({
    success: true,
    count: orders.length,
    total,
    pagination: {
      currentPage: pageNum,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? pageNum + 1 : null,
      prevPage: hasPrevPage ? pageNum - 1 : null
    },
    data: orders
  });
});

// @desc    Get single order details
// @route   GET /api/admin/orders/:id
// @access  Private/Admin
const getOrderDetails = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'fullName email phone')
    .populate('items.product', 'name brand category basePrice images')
    .populate('items.variant', 'name price sku attributes');
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }
  
  res.json({
    success: true,
    data: { order }
  });
});

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }
  
  await order.updateStatus(status, note, req.user.id);
  
  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: { order }
  });
});

// @desc    Get discount codes
// @route   GET /api/admin/discounts
// @access  Private/Admin
const getDiscountCodes = asyncHandler(async (req, res) => {
  console.log('🎫 Getting discount codes...');
  
  try {
    const discountCodes = await DiscountCode.find()
      .sort({ createdAt: -1 })
      .populate({
        path: 'createdBy',
        select: 'fullName email',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'usageHistory.user',
        select: 'fullName email',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'usageHistory.order',
        select: 'orderNumber total status',
        options: { strictPopulate: false }
      });
    
    console.log('🎫 Found discount codes:', discountCodes.length);
    
    res.json({
      success: true,
      count: discountCodes.length,
      data: discountCodes
    });
  } catch (error) {
    console.error('❌ Error getting discount codes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get discount codes',
      error: error.message
    });
  }
});

// @desc    Create discount code
// @route   POST /api/admin/discounts
// @access  Private/Admin
const createDiscountCode = asyncHandler(async (req, res) => {
  const { code, discountType, discountValue, maxUses } = req.body;

  // Validate required fields
  if (!code || !discountType || !discountValue || !maxUses) {
    return res.status(400).json({
      success: false,
      message: 'Code, discount type, discount value, and max uses are required'
    });
  }

  // Validate code format (5 alphanumeric characters)
  if (!/^[A-Z0-9]{5}$/.test(code)) {
    return res.status(400).json({
      success: false,
      message: 'Discount code must be exactly 5 alphanumeric characters'
    });
  }

  // Check if code already exists
  const existingCode = await DiscountCode.findOne({ code: code.toUpperCase() });
  if (existingCode) {
    return res.status(400).json({
      success: false,
      message: 'Discount code already exists'
    });
  }

  // Validate max uses (1-10)
  if (maxUses < 1 || maxUses > 10) {
    return res.status(400).json({
      success: false,
      message: 'Max uses must be between 1 and 10'
    });
  }

  // Validate percentage discount
  if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
    return res.status(400).json({
      success: false,
      message: 'Percentage discount must be between 0 and 100'
    });
  }

  const discountCode = await DiscountCode.create({
    ...req.body,
    code: code.toUpperCase(),
    createdBy: req.user.id
  });
  
  res.status(201).json({
    success: true,
    message: 'Discount code created successfully',
    data: { discountCode }
  });
});

// @desc    Update discount code
// @route   PUT /api/admin/discounts/:id
// @access  Private/Admin
const updateDiscountCode = asyncHandler(async (req, res) => {
  console.log('=== UPDATE DISCOUNT CODE ===');
  console.log('ID:', req.params.id);
  console.log('Body:', req.body);
  console.log('User:', req.user);
  
  const { code, discountType, discountValue, maxUses } = req.body;

  // Validate code format if provided
  if (code && !/^[A-Z0-9]{5}$/.test(code)) {
    return res.status(400).json({
      success: false,
      message: 'Discount code must be exactly 5 alphanumeric characters'
    });
  }

  // Check if code already exists (if changing code)
  if (code) {
    const existingCode = await DiscountCode.findOne({ 
      code: code.toUpperCase(),
      _id: { $ne: req.params.id }
    });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: 'Discount code already exists'
      });
    }
  }

  // Validate max uses if provided
  if (maxUses && (maxUses < 1 || maxUses > 10)) {
    return res.status(400).json({
      success: false,
      message: 'Max uses must be between 1 and 10'
    });
  }

  // Validate percentage discount if provided
  if (discountType === 'percentage' && discountValue && (discountValue < 0 || discountValue > 100)) {
    return res.status(400).json({
      success: false,
      message: 'Percentage discount must be between 0 and 100'
    });
  }

  const updateData = { ...req.body, updatedBy: req.user.id };
  if (code) {
    updateData.code = code.toUpperCase();
  }

  const discountCode = await DiscountCode.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!discountCode) {
    return res.status(404).json({
      success: false,
      message: 'Discount code not found'
    });
  }

  res.json({
    success: true,
    message: 'Discount code updated successfully',
    data: { discountCode }
  });
});

// @desc    Delete discount code
// @route   DELETE /api/admin/discounts/:id
// @access  Private/Admin
const deleteDiscountCode = asyncHandler(async (req, res) => {
  console.log('=== DELETE DISCOUNT CODE ===');
  console.log('ID:', req.params.id);
  console.log('User:', req.user);
  
  const discountCode = await DiscountCode.findByIdAndDelete(req.params.id);

  if (!discountCode) {
    return res.status(404).json({
      success: false,
      message: 'Discount code not found'
    });
  }

  res.json({
    success: true,
    message: 'Discount code deleted successfully'
  });
});

// @desc    Get all products (Admin)
// @route   GET /api/admin/products
// @access  Private/Admin
const getProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, brand, search, isActive } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  const filter = {};
  if (category) filter.category = category;
  if (brand) filter.brand = { $regex: brand, $options: 'i' };
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } }
    ];
  }
  
  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .skip((pageNum - 1) * limitNum)
    .populate('createdBy', 'fullName email')
    .populate('updatedBy', 'fullName email');
  
  const total = await Product.countDocuments(filter);
  const totalPages = Math.ceil(total / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;
  
  res.json({
    success: true,
    count: products.length,
    total,
    pagination: {
      currentPage: pageNum,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? pageNum + 1 : null,
      prevPage: hasPrevPage ? pageNum - 1 : null
    },
    data: products
  });
});

// @desc    Create product
// @route   POST /api/admin/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const productData = req.body;
  
  // Validate required fields
  if (!productData.name || !productData.description || !productData.brand || !productData.category) {
    return res.status(400).json({
      success: false,
      message: 'Name, description, brand, and category are required'
    });
  }
  
  // Validate variants (minimum 2 variants)
  if (!productData.variants || productData.variants.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Product must have at least 2 variants'
    });
  }
  
  // Validate images (minimum 3 images)
  if (!productData.images || productData.images.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Product must have at least 3 images'
    });
  }
  
  // Add admin user as creator
  productData.createdBy = req.user.id;
  
  const product = await Product.create(productData);
  
  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product
  });
});

// @desc    Update product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  const updateData = req.body;
  
  // Validate variants if provided (minimum 2 variants)
  if (updateData.variants && updateData.variants.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Product must have at least 2 variants'
    });
  }
  
  // Validate images if provided (minimum 3 images)
  if (updateData.images && updateData.images.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Product must have at least 3 images'
    });
  }
  
  // Add admin user as updater
  updateData.updatedBy = req.user.id;
  updateData.updatedAt = Date.now();
  
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );
  
  res.json({
    success: true,
    message: 'Product updated successfully',
    data: updatedProduct
  });
});

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  // Soft delete - just mark as inactive
  product.isActive = false;
  product.updatedBy = req.user.id;
  await product.save();
  
  res.json({
    success: true,
    message: 'Product deleted successfully (marked as inactive)'
  });
});

// @desc    Toggle product active status
// @route   PUT /api/admin/products/:id/toggle-status
// @access  Private/Admin
const toggleProductStatus = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  product.isActive = !product.isActive;
  product.updatedBy = req.user.id;
  await product.save();
  
  res.json({
    success: true,
    message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
    data: product
  });
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  
  if (!['customer', 'admin'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role. Must be "customer" or "admin"'
    });
  }
  
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Prevent admin from changing their own role
  if (user._id.toString() === req.user.id) {
    return res.status(400).json({
      success: false,
      message: 'You cannot change your own role'
    });
  }
  
  user.role = role;
  await user.save();
  
  res.json({
    success: true,
    message: 'User role updated successfully',
    data: user
  });
});

// @desc    Toggle user active status (Ban/Unban)
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Private/Admin
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Prevent admin from banning themselves
  if (user._id.toString() === req.user.id) {
    return res.status(400).json({
      success: false,
      message: 'You cannot ban yourself'
    });
  }
  
  user.isActive = !user.isActive;
  await user.save();
  
  res.json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'banned'} successfully`,
    data: user
  });
});

// @desc    Update user information (Admin)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUserInfo = asyncHandler(async (req, res) => {
  const { fullName, email, phone } = req.body;
  
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Check if email already exists (if changing email)
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }
    user.email = email;
  }
  
  if (fullName) user.fullName = fullName;
  if (phone !== undefined) user.phone = phone;
  
  await user.save();
  
  res.json({
    success: true,
    message: 'User information updated successfully',
    data: user
  });
});

// @desc    Delete user (Admin)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Prevent admin from deleting themselves
  if (user._id.toString() === req.user.id) {
    return res.status(400).json({
      success: false,
      message: 'You cannot delete yourself'
    });
  }
  
  // Soft delete - mark as inactive
  user.isActive = false;
  await user.save();
  
  res.json({
    success: true,
    message: 'User deleted successfully (marked as inactive)'
  });
});

module.exports = {
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
};
