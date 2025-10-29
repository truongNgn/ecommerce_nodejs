const User = require('../models/User');
const Order = require('../models/Order');
const asyncHandler = require('../middleware/async');
const AppError = require('../middleware/errorResponse');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  res.json({
    success: true,
    data: { user }
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullName, addresses } = req.body;
  
  const user = await User.findById(req.user.id);
  
  if (fullName) user.fullName = fullName;
  if (addresses) user.addresses = addresses;
  
  await user.save();
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
});

// @desc    Get user addresses
// @route   GET /api/users/addresses
// @access  Private
const getUserAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  res.json({
    success: true,
    data: { addresses: user.addresses }
  });
});

// @desc    Add user address
// @route   POST /api/users/addresses
// @access  Private
const addUserAddress = asyncHandler(async (req, res) => {
  const addressData = req.body;
  
  // Validate required fields
  if (!addressData.fullName || !addressData.street || !addressData.city || !addressData.state || !addressData.zipCode) {
    return res.status(400).json({
      success: false,
      message: 'All address fields are required (fullName, street, city, state, zipCode)'
    });
  }
  
  const user = await User.findById(req.user.id);
  await user.addAddress(addressData);
  
  res.json({
    success: true,
    message: 'Address added successfully',
    data: { user }
  });
});

// @desc    Update user address
// @route   PUT /api/users/addresses/:id
// @access  Private
const updateUserAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const addressData = req.body;
  
  const user = await User.findById(req.user.id);
  
  try {
    await user.updateAddress(id, addressData);
    
    res.json({
      success: true,
      message: 'Address updated successfully',
      data: { user }
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete user address
// @route   DELETE /api/users/addresses/:id
// @access  Private
const deleteUserAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  console.log('🗑️ Delete address request:', {
    addressId: id,
    userId: req.user.id,
    userEmail: req.user.email
  });
  
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  try {
    await user.removeAddress(id);
    
    console.log('✅ Address deleted successfully');
    
    res.json({
      success: true,
      message: 'Address deleted successfully',
      data: { user }
    });
  } catch (error) {
    console.error('❌ Delete address error:', error);
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get user orders
// @route   GET /api/users/orders
// @access  Private
const getUserOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  
  const orders = await Order.findByUser(req.user.id, { status });
  
  res.json({
    success: true,
    count: orders.length,
    data: orders
  });
});

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  getUserOrders
};
