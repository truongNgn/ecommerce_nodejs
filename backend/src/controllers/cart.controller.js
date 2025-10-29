const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../middleware/async');
const AppError = require('../middleware/errorResponse');

// Helper function to populate cart with full variant data
const populateCartWithVariants = async (cart) => {
  if (!cart.items || cart.items.length === 0) {
    return { cart, transformedCart: { ...cart.toObject(), items: [] } };
  }
  
  await cart.populate({
    path: 'items.product',
    select: 'name images brand category basePrice variants totalStock'
  });
  
  // Transform cart items to include full variant data (only for response, keep cart as Mongoose doc)
  const cartObj = cart.toObject();
  const transformedItems = cartObj.items.map(item => {
    if (item.variant && item.product.variants) {
      const variantData = item.product.variants.find(v => v._id.toString() === item.variant.toString());
      if (variantData) {
        item.variant = variantData;
        // Update price from variant if available
        if (variantData.price && variantData.price > 0) {
          item.price = variantData.price;
        }
      } else {
        item.variant = null;
      }
    }
    
    // Ensure price is set from product basePrice if not set
    if (!item.price || item.price === 0) {
      item.price = item.product.basePrice || 0;
    }
    
    return item;
  });
  
  return { cart, transformedCart: { ...cartObj, items: transformedItems } };
};

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private/Public
const getCart = asyncHandler(async (req, res) => {
  let cart;
  
  if (req.user) {
    // Authenticated user
    cart = await Cart.findByUser(req.user.id);
    if (!cart) {
      cart = await Cart.create({ user: req.user.id });
    }
  } else {
    // Guest user - get from session
    const sessionId = req.headers['x-session-id'] || req.sessionID;
    if (sessionId) {
      cart = await Cart.findBySession(sessionId);
      if (!cart) {
        cart = await Cart.create({ sessionId });
      }
    } else {
      // No session, return empty cart
      return res.json({
        success: true,
        data: {
          cart: { items: [], subtotal: 0, total: 0 },
          summary: { subtotal: 0, total: 0 }
        }
      });
    }
  }

  // Populate product and variant details
  const { cart: cartDoc, transformedCart } = await populateCartWithVariants(cart);

  // Safety check for cartDoc
  if (!cartDoc) {
    return res.json({
      success: true,
      data: {
        cart: { items: [], subtotal: 0, total: 0 },
        summary: { subtotal: 0, total: 0 }
      }
    });
  }

  // Safety check for getSummary method
  let summary;
  try {
    summary = cartDoc.getSummary ? cartDoc.getSummary() : { subtotal: 0, total: 0 };
  } catch (error) {
    console.error('❌ Error calling getSummary:', error);
    summary = { subtotal: 0, total: 0 };
  }

  res.json({
    success: true,
    data: {
      cart: transformedCart,
      summary
    }
  });
});

// @desc    Get guest cart
// @route   GET /api/cart/guest/:sessionId
// @access  Public
const getGuestCart = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  let cart = await Cart.findBySession(sessionId);
  
  if (!cart) {
    // Create new guest cart if doesn't exist
    cart = await Cart.create({ sessionId });
  }

  // Populate product and variant details
  const { cart: cartDoc, transformedCart } = await populateCartWithVariants(cart);

  res.json({
    success: true,
    data: {
      cart: transformedCart,
      summary: cartDoc.getSummary()
    }
  });
});

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private/Public
const addToCart = asyncHandler(async (req, res) => {
  const { product: productId, variant: variantId, quantity = 1 } = req.body;

  // Validate input
  if (!productId) {
    return res.status(400).json({
      success: false,
      message: 'Product ID is required'
    });
  }

  // Get product and variant
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  let variant = null;
  if (variantId) {
    variant = product.variants.id(variantId);
    if (!variant || !variant.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found'
      });
    }

    // Check stock availability
    if (variant.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${variant.stock} units available in stock`
      });
    }
  } else {
    // No variant specified, check total stock
    if (product.totalStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.totalStock} units available in stock`
      });
    }
  }

  // Get or create cart
  let cart;
  if (req.user) {
    // Authenticated user
    cart = await Cart.findByUser(req.user.id);
    if (!cart) {
      cart = await Cart.create({ user: req.user.id });
    }
  } else {
    // Guest user
    const sessionId = req.headers['x-session-id'] || req.sessionID;
    if (sessionId) {
      cart = await Cart.findBySession(sessionId);
      if (!cart) {
        cart = await Cart.create({ sessionId });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required for guest users'
      });
    }
  }

  // Add item to cart
  const price = variant ? variant.price : product.basePrice;
  
  console.log('🛒 Adding item to cart:', {
    productId,
    variantId,
    quantity,
    productBasePrice: product.basePrice,
    variantPrice: variant?.price,
    finalPrice: price
  });
  
  await cart.addItem(productId, variantId, quantity, price);

  // Populate product and variant details
  const { cart: cartDoc, transformedCart } = await populateCartWithVariants(cart);

  res.json({
    success: true,
    message: 'Item added to cart successfully',
    data: {
      cart: transformedCart,
      summary: cartDoc.getSummary()
    }
  });
});

// @desc    Add item to guest cart
// @route   POST /api/cart/guest/add
// @access  Public
const addToGuestCart = asyncHandler(async (req, res) => {
  const { sessionId, productId, variantId, quantity = 1 } = req.body;

  // Validate input
  if (!sessionId || !productId || !variantId) {
    return res.status(400).json({
      success: false,
      message: 'Session ID, Product ID and variant ID are required'
    });
  }

  // Get product and variant
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  const variant = product.variants.id(variantId);
  if (!variant || !variant.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Product variant not found'
    });
  }

  // Check stock availability
  if (variant.stock < quantity) {
    return res.status(400).json({
      success: false,
      message: `Only ${variant.stock} units available in stock`
    });
  }

  // Get or create guest cart
  let cart = await Cart.findBySession(sessionId);
  if (!cart) {
    cart = await Cart.create({ sessionId });
  }

  // Add item to cart
  const price = variant ? variant.price : product.basePrice;
  
  console.log('🛒 Adding item to cart:', {
    productId,
    variantId,
    quantity,
    productBasePrice: product.basePrice,
    variantPrice: variant?.price,
    finalPrice: price
  });
  
  await cart.addItem(productId, variantId, quantity, price);

  // Populate product and variant details
  const { cart: cartDoc, transformedCart } = await populateCartWithVariants(cart);

  res.json({
    success: true,
    message: 'Item added to cart successfully',
    data: {
      cart: transformedCart,
      summary: cartDoc.getSummary()
    }
  });
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/update/:itemId
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
  console.log('🛒 Update cart item request:', {
    method: req.method,
    url: req.url,
    body: req.body,
    user: req.user ? req.user.id : 'guest',
    sessionId: req.headers['x-session-id'] || req.sessionID
  });

  const { product: productId, variant: variantId, quantity } = req.body;

  if (!productId || !quantity || quantity < 0) {
    return res.status(400).json({
      success: false,
      message: 'Product ID and valid quantity are required'
    });
  }

  let cart;
  if (req.user) {
    cart = await Cart.findByUser(req.user.id);
    if (!cart) {
      cart = await Cart.create({ user: req.user.id });
    }
  } else {
    const sessionId = req.headers['x-session-id'] || req.sessionID;
    if (sessionId) {
      cart = await Cart.findBySession(sessionId);
      if (!cart) {
        cart = await Cart.create({ sessionId });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required for guest users'
      });
    }
  }

  // Find the item in cart by product and variant
  console.log('🛒 Searching for item:', {
    productId,
    variantId: variantId || 'none',
    cartItemsCount: cart.items.length,
    cartItems: cart.items.map(i => ({
      product: i.product.toString(),
      variant: i.variant ? i.variant.toString() : 'none'
    }))
  });

  const item = cart.items.find(item => {
    const productMatch = item.product.toString() === productId.toString();
    const variantMatch = variantId ? 
      (item.variant && item.variant.toString() === variantId.toString()) :
      (!item.variant);
    return productMatch && variantMatch;
  });

  console.log('🛒 Item found:', !!item);

  if (!item) {
    console.error('❌ Item not found in cart:', {
      productId,
      variantId,
      cartItems: cart.items.map(i => ({
        product: i.product.toString(),
        variant: i.variant ? i.variant.toString() : 'none'
      }))
    });
    return res.status(404).json({
      success: false,
      message: 'Item not found in cart'
    });
  }

  // Check stock availability if increasing quantity
  if (quantity > item.quantity) {
    const product = await Product.findById(item.product);
    
    if (item.variant) {
      const variant = product.variants.id(item.variant);
      if (!variant) {
        return res.status(404).json({
          success: false,
          message: 'Product variant not found'
        });
      }
      
      if (variant.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${variant.stock} units available in stock`
        });
      }
    } else {
      // No variant, check total stock
      if (product.totalStock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.totalStock} units available in stock`
        });
      }
    }
  }

  // Update quantity
  await cart.updateItemQuantity(item.product, item.variant, quantity);

  // Populate product and variant details
  const { cart: cartDoc, transformedCart } = await populateCartWithVariants(cart);

  console.log('🛒 Update cart item success:', {
    cartId: cart._id,
    itemCount: transformedCart.items.length,
    total: cartDoc.getSummary().total
  });

  res.json({
    success: true,
    message: 'Cart updated successfully',
    data: {
      cart: transformedCart,
      summary: cartDoc.getSummary()
    }
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:itemId
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
  const { productId, variantId } = req.params;

  let cart;
  if (req.user) {
    cart = await Cart.findByUser(req.user.id);
  } else {
    const sessionId = req.headers['x-session-id'] || req.sessionID;
    cart = await Cart.findBySession(sessionId);
  }

  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  // Remove item by product and variant IDs
  await cart.removeItem(productId, variantId === 'null' ? null : variantId);

  // Populate product and variant details
  const { cart: cartDoc, transformedCart } = await populateCartWithVariants(cart);

  res.json({
    success: true,
    message: 'Item removed from cart successfully',
    data: {
      cart: transformedCart,
      summary: cartDoc.getSummary()
    }
  });
});

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findByUser(req.user.id);
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  await cart.clearCart();

  res.json({
    success: true,
    message: 'Cart cleared successfully',
    data: {
      cart: { items: [], subtotal: 0, total: 0 },
      summary: { subtotal: 0, total: 0 }
    }
  });
});

// @desc    Apply discount code
// @route   POST /api/cart/discount
// @access  Private
const applyDiscountCode = asyncHandler(async (req, res) => {
  const { discountCode } = req.body;

  if (!discountCode) {
    return res.status(400).json({
      success: false,
      message: 'Discount code is required'
    });
  }

  const cart = await Cart.findByUser(req.user.id);
  if (!cart || cart.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Cart is empty'
    });
  }

  // Get discount code
  const DiscountCode = require('../models/DiscountCode');
  console.log('🎫 Looking for discount code:', discountCode);
  
  const discount = await DiscountCode.findByCode(discountCode);
  console.log('🎫 Found discount:', {
    found: !!discount,
    code: discount?.code,
    type: discount?.discountType,
    value: discount?.value,
    maxUses: discount?.maxUses,
    usedCount: discount?.usedCount
  });
  
  if (!discount) {
    return res.status(404).json({
      success: false,
      message: 'Invalid discount code'
    });
  }

  // Check if code can be used
  const canUse = discount.canBeUsedBy(req.user.id, cart.subtotal);
  if (!canUse.valid) {
    return res.status(400).json({
      success: false,
      message: canUse.reason
    });
  }

  // Calculate discount amount
  const discountAmount = discount.calculateDiscount(cart.subtotal);

  // Apply discount
  await cart.applyDiscountCode(
    discountCode,
    discount.discountType,
    discount.discountValue
  );

  // Populate product and variant details
  const { cart: cartDoc, transformedCart } = await populateCartWithVariants(cart);

  res.json({
    success: true,
    message: 'Discount code applied successfully',
    data: {
      cart: transformedCart,
      summary: cartDoc.getSummary ? cartDoc.getSummary() : null,
      discount: {
        code: discountCode,
        amount: discountAmount,
        type: discount.discountType,
        value: discount.discountValue
      }
    }
  });
});

// @desc    Remove discount code
// @route   DELETE /api/cart/discount
// @access  Private
const removeDiscountCode = asyncHandler(async (req, res) => {
  const cart = await Cart.findByUser(req.user.id);
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  await cart.removeDiscountCode();

  // Populate product and variant details
  const { cart: cartDoc, transformedCart } = await populateCartWithVariants(cart);

  res.json({
    success: true,
    message: 'Discount code removed successfully',
    data: {
      cart: transformedCart,
      summary: cartDoc.getSummary()
    }
  });
});

// @desc    Use loyalty points
// @route   POST /api/cart/loyalty-points
// @access  Private
const useLoyaltyPoints = asyncHandler(async (req, res) => {
  const { points } = req.body;

  if (!points || points < 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid loyalty points amount is required'
    });
  }

  const cart = await Cart.findByUser(req.user.id);
  if (!cart || cart.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Cart is empty'
    });
  }

  // Check if user has enough points
  if (req.user.loyaltyPoints < points) {
    return res.status(400).json({
      success: false,
      message: 'Insufficient loyalty points'
    });
  }

  // Use loyalty points
  await cart.useLoyaltyPoints(points);

  // Populate product and variant details
  const { cart: cartDoc, transformedCart } = await populateCartWithVariants(cart);

  res.json({
    success: true,
    message: 'Loyalty points applied successfully',
    data: {
      cart: transformedCart,
      summary: cartDoc.getSummary()
    }
  });
});

// // @desc    Remove loyalty points
// // @route   DELETE /api/cart/loyalty-points
// // @access  Private
// const removeLoyaltyPoints = asyncHandler(async (req, res) => {
//   const cart = await Cart.findByUser(req.user.id);
//   if (!cart) {
//     return res.status(404).json({
//       success: false,
//       message: 'Cart not found'
//     });
//   }

//   await cart.removeLoyaltyPoints();

//   // Populate product and variant details
//   const { cart: cartDoc, transformedCart } = await populateCartWithVariants(cart);

//   res.json({
//     success: true,
//     message: 'Loyalty points removed successfully',
//     data: {
//       cart: transformedCart,
//       summary: cartDoc.getSummary()
//     }
//   });
// });

// @desc    Merge guest cart with user cart
// @route   POST /api/cart/merge
// @access  Private
const mergeCarts = asyncHandler(async (req, res) => {
  console.log('🛒 Merge carts request:', {
    sessionId: req.body.sessionId,
    userId: req.user?.id,
    hasUser: !!req.user
  });

  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Session ID is required'
    });
  }

  try {
    const guestCart = await Cart.findBySession(sessionId);
    console.log('🛒 Guest cart found:', !!guestCart, guestCart?.items?.length || 0);
    
    const userCart = await Cart.findByUser(req.user.id);
    console.log('🛒 User cart found:', !!userCart, userCart?.items?.length || 0);

    const mergedCart = await Cart.mergeCarts(guestCart, userCart, req.user.id);
    console.log('🛒 Merge successful:', mergedCart?.items?.length || 0);

    // Populate product details
    await mergedCart.populate({
      path: 'items.product',
      select: 'name images brand category'
    });

    res.json({
      success: true,
      message: 'Carts merged successfully',
      data: {
        cart: mergedCart,
        summary: mergedCart.getSummary()
      }
    });
  } catch (error) {
    console.error('❌ Merge carts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to merge carts',
      error: error.message
    });
  }
});

// @desc    Remove loyalty points from cart
// @route   DELETE /api/cart/loyalty
// @access  Private
const removeLoyaltyPoints = asyncHandler(async (req, res) => {
  const cart = await Cart.findByUser(req.user.id);
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  await cart.removeLoyaltyPoints();

  // Populate product and variant details
  const { cart: cartDoc, transformedCart } = await populateCartWithVariants(cart);

  res.json({
    success: true,
    message: 'Loyalty points removed successfully',
    data: {
      cart: transformedCart,
      summary: cartDoc.getSummary ? cartDoc.getSummary() : null
    }
  });
});

module.exports = {
  getCart,
  getGuestCart,
  addToCart,
  addToGuestCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyDiscountCode,
  removeDiscountCode,
  useLoyaltyPoints,
  removeLoyaltyPoints,
  mergeCarts
};
