const Product = require('../models/Product');
const Review = require('../models/Review');
const asyncHandler = require('../middleware/async');
const AppError = require('../middleware/errorResponse');

// @desc    Get all products with filtering, sorting, and pagination
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    brand,
    minPrice,
    maxPrice,
    search,
    sort = '-createdAt',
    rating,
    inStock = true
  } = req.query;

  console.log('🔍 Product search request:', {
    page, limit, category, brand, minPrice, maxPrice, search, sort, rating, inStock
  });

  // Build filter object
  const filter = { isActive: true };

  if (category) {
    filter.category = category;
  }

  if (brand) {
    filter.brand = { $regex: brand, $options: 'i' };
  }

  if (minPrice || maxPrice) {
    filter.basePrice = {};
    if (minPrice) filter.basePrice.$gte = parseFloat(minPrice);
    if (maxPrice) filter.basePrice.$lte = parseFloat(maxPrice);
  }

  if (search) {
    filter.$text = { $search: search };
  }

  if (rating) {
    filter.averageRating = { $gte: parseFloat(rating) };
  }

  if (inStock === 'true') {
    filter.totalStock = { $gt: 0 };
  }

  console.log('🔍 Filter object:', filter);

  // Build sort object - Handle format like "-createdAt" or "name"
  const sortObj = {};
  let sortField = String(sort || '-createdAt');
  let sortOrder = 1; // default ascending
  
  if (sortField.startsWith('-')) {
    sortField = sortField.substring(1);
    sortOrder = -1; // descending
  }
  
  // Map special sort fields
  if (sortField === 'price') {
    sortObj.basePrice = sortOrder;
  } else if (sortField === 'rating') {
    sortObj.averageRating = sortOrder;
  } else if (sortField === 'name') {
    sortObj.name = sortOrder;
  } else if (sortField === 'createdAt') {
    sortObj.createdAt = sortOrder;
  } else {
    sortObj[sortField] = sortOrder;
  }

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Execute query
  const products = await Product.find(filter)
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum)
    .populate('createdBy', 'fullName');

  // Get total count for pagination
  const total = await Product.countDocuments(filter);

  console.log('🔍 Query results:', {
    productsFound: products.length,
    total,
    filter,
    sortObj
  });

  // Calculate pagination info
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

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('createdBy', 'fullName')
    .populate('updatedBy', 'fullName');

  if (!product || !product.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Get related products (same category)
  const relatedProducts = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true
  })
    .limit(4)
    .select('name images basePrice averageRating');

  res.json({
    success: true,
    data: {
      product,
      relatedProducts
    }
  });
});

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
const searchProducts = asyncHandler(async (req, res) => {
  const {
    q,
    page = 1,
    limit = 20,
    category,
    brand,
    minPrice,
    maxPrice,
    sort = 'relevance',
    order = 'desc'
  } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  // Build filter object
  const filter = {
    isActive: true,
    $text: { $search: q }
  };

  if (category) {
    filter.category = category;
  }

  if (brand) {
    filter.brand = { $regex: brand, $options: 'i' };
  }

  if (minPrice || maxPrice) {
    filter.basePrice = {};
    if (minPrice) filter.basePrice.$gte = parseFloat(minPrice);
    if (maxPrice) filter.basePrice.$lte = parseFloat(maxPrice);
  }

  // Build sort object
  const sortObj = {};
  if (sort === 'relevance') {
    sortObj.score = { $meta: 'textScore' };
  } else if (sort === 'price') {
    sortObj.basePrice = order === 'asc' ? 1 : -1;
  } else if (sort === 'name') {
    sortObj.name = order === 'asc' ? 1 : -1;
  } else if (sort === 'rating') {
    sortObj.averageRating = order === 'asc' ? 1 : -1;
  } else {
    sortObj[sort] = order === 'asc' ? 1 : -1;
  }

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Execute query
  const products = await Product.find(filter, { score: { $meta: 'textScore' } })
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum);

  // Get total count
  const total = await Product.countDocuments(filter);

  // Calculate pagination info
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

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category', { isActive: true });
  
  const categoryStats = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  res.json({
    success: true,
    data: {
      categories,
      stats: categoryStats
    }
  });
});

// @desc    Get product brands
// @route   GET /api/products/brands
// @access  Public
const getBrands = asyncHandler(async (req, res) => {
  const brands = await Product.distinct('brand', { isActive: true });
  
  const brandStats = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$brand', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  res.json({
    success: true,
    data: {
      brands,
      stats: brandStats
    }
  });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;
  
  const products = await Product.find({
    isFeatured: true,
    isActive: true
  })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Get new products
// @route   GET /api/products/new
// @access  Public
const getNewProducts = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;
  
  const products = await Product.find({
    isNew: true,
    isActive: true
  })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Get best selling products
// @route   GET /api/products/bestsellers
// @access  Public
const getBestSellingProducts = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;
  
  // Get products sorted by sales count
  const products = await Product.find({ isActive: true })
    .sort({ salesCount: -1, createdAt: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Get product reviews
// @route   GET /api/products/:id/reviews
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    rating,
    sort = 'createdAt',
    order = 'desc'
  } = req.query;

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Build filter
  const filter = {
    product: req.params.id,
    isActive: true,
    isApproved: true
  };

  if (rating) {
    filter.rating = parseInt(rating);
  }

  // Build sort
  const sortObj = {};
  sortObj[sort] = order === 'asc' ? 1 : -1;

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const reviews = await Review.find(filter)
    .populate('user', 'fullName')
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum);

  const total = await Review.countDocuments(filter);

  // Get rating distribution
  const ratingDistribution = await Review.getRatingDistribution(req.params.id);

  // Calculate pagination info
  const totalPages = Math.ceil(total / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  res.json({
    success: true,
    count: reviews.length,
    total,
    pagination: {
      currentPage: pageNum,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? pageNum + 1 : null,
      prevPage: hasPrevPage ? pageNum - 1 : null
    },
    data: {
      reviews,
      ratingDistribution,
      productRating: {
        average: product.averageRating,
        count: product.reviewCount
      }
    }
  });
});

// @desc    Get product statistics
// @route   GET /api/products/:id/stats
// @access  Public
const getProductStats = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  const stats = await Review.getStatistics(req.params.id);

  res.json({
    success: true,
    data: {
      product: {
        id: product._id,
        name: product.name,
        averageRating: product.averageRating,
        reviewCount: product.reviewCount,
        totalStock: product.totalStock,
        isInStock: product.isInStock()
      },
      reviewStats: stats[0] || {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: {
          fiveStar: 0,
          fourStar: 0,
          threeStar: 0,
          twoStar: 0,
          oneStar: 0
        },
        helpfulPercentage: 0
      }
    }
  });
});

module.exports = {
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
};
