const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  // User or Session identification
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return !this.sessionId;
    }
  },
  sessionId: {
    type: String,
    required: function() {
      return !this.user;
    },
    trim: true
  },
  
  // Cart Items
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required']
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [99, 'Quantity cannot exceed 99']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Cart Summary
  subtotal: {
    type: Number,
    default: 0,
    min: [0, 'Subtotal cannot be negative']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  shipping: {
    type: Number,
    default: 0,
    min: [0, 'Shipping cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  total: {
    type: Number,
    default: 0,
    min: [0, 'Total cannot be negative']
  },
  
  // Applied Discount Code
  discountCode: {
    type: String,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    min: [0, 'Discount value cannot be negative']
  },
  
  // Loyalty Points
  loyaltyPointsUsed: {
    type: Number,
    default: 0,
    min: [0, 'Loyalty points used cannot be negative']
  },
  
  // Cart Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Cart expires in 30 days for guests, 7 days for users
      const days = this.user ? 7 : 30;
      return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
cartSchema.index({ user: 1 });
cartSchema.index({ sessionId: 1 });
cartSchema.index({ isActive: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  this.calculateTotals();
  this.updatedAt = Date.now();
  next();
});

// Instance method to calculate cart totals
cartSchema.methods.calculateTotals = function() {
  // Calculate subtotal
  this.subtotal = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  // Calculate tax (10% of subtotal)
  this.tax = Math.round(this.subtotal * 0.1);
  
  // Calculate shipping (free for orders over 1,000,000 VND, otherwise 50,000 VND)
  this.shipping = this.subtotal >= 1000000 ? 0 : 50000;
  
  // Calculate discount from discount code
  let discountAmount = 0;
  if (this.discountCode && this.discountValue > 0) {
    if (this.discountType === 'percentage') {
      discountAmount = Math.round(this.subtotal * (this.discountValue / 100));
    } else {
      discountAmount = Math.min(this.discountValue, this.subtotal);
    }
  }
  
  // Calculate loyalty points discount (1 point = 1,000 VND)
  const loyaltyDiscount = this.loyaltyPointsUsed || 0;
  
  // Calculate total discount
  this.discount = discountAmount;
  
  // Calculate final total
  this.total = Math.max(0, this.subtotal + this.tax + this.shipping - this.discount - loyaltyDiscount);
  
  console.log('🛒 Cart totals calculated:', {
    subtotal: this.subtotal,
    tax: this.tax,
    shipping: this.shipping,
    discount: this.discount,
    loyaltyDiscount: loyaltyDiscount,
    total: this.total
  });
};

// Instance method to add item to cart
cartSchema.methods.addItem = function(productId, variantId, quantity, price) {
  // Check if item already exists
  const existingItem = this.items.find(item => {
    const productMatch = item.product.toString() === productId.toString();
    const variantMatch = variantId ? 
      (item.variant && item.variant.toString() === variantId.toString()) :
      (!item.variant);
    return productMatch && variantMatch;
  });
  
  if (existingItem) {
    // Update quantity
    existingItem.quantity += quantity;
    existingItem.price = price; // Update price in case it changed
  } else {
    // Add new item
    this.items.push({
      product: productId,
      variant: variantId,
      quantity: quantity,
      price: price
    });
  }
  
  this.calculateTotals();
  return this.save();
};

// Instance method to update item quantity
cartSchema.methods.updateItemQuantity = function(productId, variantId, quantity) {
  const item = this.items.find(item => {
    const productMatch = item.product.toString() === productId.toString();
    const variantMatch = variantId ? 
      (item.variant && item.variant.toString() === variantId.toString()) :
      (!item.variant);
    return productMatch && variantMatch;
  });
  
  if (!item) {
    throw new Error('Item not found in cart');
  }
  
  if (quantity <= 0) {
    return this.removeItem(productId, variantId);
  }
  
  item.quantity = quantity;
  this.calculateTotals();
  return this.save();
};

// Instance method to remove item from cart
cartSchema.methods.removeItem = function(productId, variantId) {
  this.items = this.items.filter(item => {
    const productMatch = item.product.toString() === productId.toString();
    const variantMatch = variantId ? 
      (item.variant && item.variant.toString() === variantId.toString()) :
      (!item.variant);
    return !(productMatch && variantMatch);
  });
  
  this.calculateTotals();
  return this.save();
};

// Instance method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.subtotal = 0;
  this.tax = 0;
  this.shipping = 0;
  this.discount = 0;
  this.total = 0;
  this.discountCode = undefined;
  this.discountType = 'percentage';
  this.discountValue = 0;
  this.loyaltyPointsUsed = 0;
  
  return this.save();
};

// Instance method to apply discount code
cartSchema.methods.applyDiscountCode = function(discountCode, discountType, discountValue) {
  this.discountCode = discountCode;
  this.discountType = discountType;
  this.discountValue = discountValue;
  
  this.calculateTotals();
  return this.save();
};

// Instance method to remove discount code
cartSchema.methods.removeDiscountCode = function() {
  this.discountCode = undefined;
  this.discountType = 'percentage';
  this.discountValue = 0;
  
  this.calculateTotals();
  return this.save();
};

// Instance method to use loyalty points
// Formula: 100 points = 100,000 VND → discount = points * 1000
cartSchema.methods.useLoyaltyPoints = function(points) {
  const pointsValue = points * 1000; // Convert points to VND
  this.loyaltyPointsUsed = Math.min(pointsValue, this.subtotal); // Don't exceed subtotal
  this.calculateTotals();
  return this.save();
};

// Instance method to remove loyalty points
cartSchema.methods.removeLoyaltyPoints = function() {
  this.loyaltyPointsUsed = 0;
  this.calculateTotals();
  return this.save();
};

// Instance method to get item count
cartSchema.methods.getItemCount = function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
};

// Instance method to check if cart is empty
cartSchema.methods.isEmpty = function() {
  return this.items.length === 0;
};

// Instance method to get cart summary
cartSchema.methods.getSummary = function() {
  return {
    itemCount: this.getItemCount(),
    subtotal: this.subtotal,
    tax: this.tax,
    shipping: this.shipping,
    discount: this.discount,
    total: this.total,
    discountCode: this.discountCode,
    loyaltyPointsUsed: this.loyaltyPointsUsed
  };
};

// Static method to find cart by user
cartSchema.statics.findByUser = function(userId) {
  return this.findOne({ user: userId, isActive: true });
};

// Static method to find cart by session
cartSchema.statics.findBySession = function(sessionId) {
  return this.findOne({ sessionId: sessionId, isActive: true });
};

// Static method to merge guest cart with user cart
cartSchema.statics.mergeCarts = async function(guestCart, userCart, userId) {
  if (!guestCart || guestCart.isEmpty()) {
    return userCart;
  }
  
  if (!userCart || userCart.isEmpty()) {
    // Create new user cart and copy items from guest cart
    userCart = new this({
      user: userId, // Use the provided user ID
      items: guestCart.items,
      subtotal: guestCart.subtotal,
      tax: guestCart.tax,
      shipping: guestCart.shipping,
      discount: guestCart.discount,
      loyaltyDiscount: guestCart.loyaltyDiscount,
      total: guestCart.total,
      isActive: true
    });
    return userCart.save();
  }
  
  // Merge items from guest cart to user cart
  for (const guestItem of guestCart.items) {
    await userCart.addItem(
      guestItem.product,
      guestItem.variant,
      guestItem.quantity,
      guestItem.price
    );
  }
  
  // Deactivate guest cart
  guestCart.isActive = false;
  await guestCart.save();
  
  return userCart;
};

// Virtual for cart total items
cartSchema.virtual('totalItems').get(function() {
  return this.getItemCount();
});

// Virtual for cart status
cartSchema.virtual('status').get(function() {
  if (this.isEmpty()) return 'empty';
  if (this.total <= 0) return 'invalid';
  return 'active';
});

// Ensure virtual fields are serialized
cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

// Indexes for performance
cartSchema.index({ user: 1 });
cartSchema.index({ sessionId: 1 });
cartSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Cart', cartSchema);
