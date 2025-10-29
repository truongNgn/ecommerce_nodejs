const asyncHandler = require('../middleware/async');
const AppError = require('../middleware/errorResponse');
const DiscountCode = require('../models/DiscountCode');

// @desc    Get all discount codes
// @route   GET /api/discounts
// @access  Private/Admin
const getDiscounts = asyncHandler(async (req, res) => {
  const discounts = await DiscountCode.find().sort('-createdAt');

  res.status(200).json({
    success: true,
    count: discounts.length,
    data: discounts
  });
});

// @desc    Get single discount code
// @route   GET /api/discounts/:id
// @access  Private/Admin
const getDiscount = asyncHandler(async (req, res) => {
  const discount = await DiscountCode.findById(req.params.id);

  if (!discount) {
    return res.status(404).json({
      success: false,
      message: 'Discount code not found'
    });
  }

  res.status(200).json({
    success: true,
    data: discount
  });
});

// @desc    Create new discount code
// @route   POST /api/discounts
// @access  Private/Admin
const createDiscount = asyncHandler(async (req, res) => {
  const { code, discountType, discountValue, maxUses } = req.body;

  // Check if discount code already exists
  const existingDiscount = await DiscountCode.findOne({ code });
  if (existingDiscount) {
    return res.status(400).json({
      success: false,
      message: 'Discount code already exists'
    });
  }

  const discount = await DiscountCode.create({
    code,
    discountType,
    discountValue,
    maxUses: maxUses || 10
  });

  res.status(201).json({
    success: true,
    data: discount
  });
});

// @desc    Update discount code
// @route   PUT /api/discounts/:id
// @access  Private/Admin
const updateDiscount = asyncHandler(async (req, res) => {
  let discount = await DiscountCode.findById(req.params.id);

  if (!discount) {
    return res.status(404).json({
      success: false,
      message: 'Discount code not found'
    });
  }

  discount = await DiscountCode.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: discount
  });
});

// @desc    Delete discount code
// @route   DELETE /api/discounts/:id
// @access  Private/Admin
const deleteDiscount = asyncHandler(async (req, res) => {
  const discount = await DiscountCode.findById(req.params.id);

  if (!discount) {
    return res.status(404).json({
      success: false,
      message: 'Discount code not found'
    });
  }

  await discount.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Validate discount code
// @route   GET /api/discounts/validate/:code
// @access  Public
const validateDiscount = asyncHandler(async (req, res) => {
  const discount = await DiscountCode.findOne({ code: req.params.code });

  if (!discount) {
    return res.status(404).json({
      success: false,
      message: 'Invalid discount code'
    });
  }

  if (discount.usedCount >= discount.maxUses) {
    return res.status(400).json({
      success: false,
      message: 'Discount code has reached maximum usage limit'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      code: discount.code,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      remainingUses: discount.maxUses - discount.usedCount
    }
  });
});

module.exports = {
  getDiscounts,
  getDiscount,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  validateDiscount
};
