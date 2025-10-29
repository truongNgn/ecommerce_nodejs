const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Order Identification
  orderNumber: {
    type: String,
    required: [true, 'Order number is required'],
    unique: true,
    trim: true,
    default: function() {
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substr(2, 5).toUpperCase();
      return `ORD-${timestamp.slice(-8)}-${random}`;
    }
  },
  
  // Customer Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return !this.guestInfo;
    }
  },
  guestInfo: {
    email: {
      type: String,
      required: function() {
        return !this.user;
      },
      lowercase: true,
      trim: true
    },
    fullName: {
      type: String,
      required: function() {
        return !this.user;
      },
      trim: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  
  // Order Items
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required']
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      required: false // Some products may not have variants
    },
    productName: {
      type: String,
      required: [true, 'Product name is required']
    },
    variantName: {
      type: String,
      default: 'Default'
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    total: {
      type: Number,
      required: [true, 'Item total is required'],
      min: [0, 'Item total cannot be negative']
    }
  }],
  
  // Shipping Information
  shippingAddress: {
    fullName: {
      type: String,
      required: [true, 'Shipping name is required'],
      trim: true
    },
    street: {
      type: String,
      required: [true, 'Shipping street is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'Shipping city is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'Shipping state is required'],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, 'Shipping zip code is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Shipping country is required'],
      trim: true,
      default: 'Vietnam'
    },
    phone: {
      type: String,
      trim: true
    }
  },
  
  // Billing Information (optional, defaults to shipping)
  billingAddress: {
    fullName: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String
  },
  
  // Payment Information
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cod', 'credit', 'bank'],
    default: 'credit_card'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String,
    trim: true
  },
  paymentDate: Date,
  
  // Order Status Tracking (MANDATORY: Complete history with timestamps)
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  statusHistory: [{
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      trim: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Pricing Breakdown
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  tax: {
    type: Number,
    required: [true, 'Tax is required'],
    min: [0, 'Tax cannot be negative']
  },
  shipping: {
    type: Number,
    required: [true, 'Shipping cost is required'],
    min: [0, 'Shipping cost cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative']
  },
  
  // Discount Information
  discountCode: {
    type: String,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed']
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
  loyaltyPointsEarned: {
    type: Number,
    default: 0,
    min: [0, 'Loyalty points earned cannot be negative']
  },
  
  // Shipping Information
  trackingNumber: {
    type: String,
    trim: true
  },
  carrier: {
    type: String,
    trim: true
  },
  estimatedDelivery: Date,
  actualDelivery: Date,
  
  // Notes and Comments
  customerNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Customer notes cannot exceed 500 characters']
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'guestInfo.email': 1 });
orderSchema.index({ paymentStatus: 1 });

// Pre-validate middleware to ensure orderNumber is set before validation
orderSchema.pre('validate', function(next) {
  // Always generate order number if not present
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.orderNumber = `ORD-${timestamp.slice(-8)}-${random}`;
    console.log('📦 Generated order number in validate:', this.orderNumber);
  }
  
  // Normalize payment method
  if (this.paymentMethod) {
    const paymentMethodMap = {
      'credit': 'credit_card',
      'bank': 'bank_transfer',
      'card': 'credit_card'
    };
    
    if (paymentMethodMap[this.paymentMethod]) {
      this.paymentMethod = paymentMethodMap[this.paymentMethod];
      console.log('📦 Normalized payment method:', this.paymentMethod);
    }
  }
  
  // Ensure status is set
  if (!this.status) {
    this.status = 'pending';
    console.log('📦 Set default status:', this.status);
  }
  
  next();
});

// Pre-save middleware to ensure statusHistory is initialized
orderSchema.pre('save', function(next) {
  // Ensure statusHistory is initialized
  if (!this.statusHistory || this.statusHistory.length === 0) {
    this.statusHistory = [{
      status: this.status,
      timestamp: new Date(),
      note: 'Order created'
    }];
  }
  
  next();
});

// Pre-save middleware to update status history
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: `Status changed to ${this.status}`
    });
  }
  this.updatedAt = Date.now();
  next();
});

// Instance method to update order status
orderSchema.methods.updateStatus = function(newStatus, note = '', updatedBy = null) {
  if (this.status === newStatus) {
    return Promise.resolve(this);
  }
  
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note: note,
    updatedBy: updatedBy
  });
  
  return this.save();
};

// Instance method to calculate loyalty points earned (10% of total)
// Formula: 100 points = 100,000 VND → points = (total / 1000) * 0.1 = total / 10000
orderSchema.methods.calculateLoyaltyPoints = function() {
  this.loyaltyPointsEarned = Math.floor(this.total / 10000);
  return this.save();
};

// Instance method to get order summary
orderSchema.methods.getSummary = function() {
  return {
    orderNumber: this.orderNumber,
    status: this.status,
    total: this.total,
    itemCount: this.items.reduce((total, item) => total + item.quantity, 0),
    createdAt: this.createdAt,
    customerName: this.user ? this.user.fullName : this.guestInfo.fullName,
    customerEmail: this.user ? this.user.email : this.guestInfo.email
  };
};

// Instance method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

// Instance method to check if order can be returned
orderSchema.methods.canBeReturned = function() {
  return this.status === 'delivered' && 
         this.actualDelivery && 
         (Date.now() - this.actualDelivery.getTime()) <= (7 * 24 * 60 * 60 * 1000); // 7 days
};

// Instance method to get current status info
orderSchema.methods.getCurrentStatus = function() {
  const latestStatus = this.statusHistory[this.statusHistory.length - 1];
  return {
    status: this.status,
    timestamp: latestStatus.timestamp,
    note: latestStatus.note,
    updatedBy: latestStatus.updatedBy
  };
};

// Static method to find orders by user
orderSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.dateFrom && options.dateTo) {
    query.createdAt = {
      $gte: new Date(options.dateFrom),
      $lte: new Date(options.dateTo)
    };
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to find orders by status
orderSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to get order statistics
orderSchema.statics.getStatistics = function(dateFrom, dateTo) {
  const matchStage = {
    createdAt: {
      $gte: new Date(dateFrom),
      $lte: new Date(dateTo)
    }
  };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' },
        statusCounts: {
          $push: '$status'
        }
      }
    },
    {
      $project: {
        totalOrders: 1,
        totalRevenue: 1,
        averageOrderValue: { $round: ['$averageOrderValue', 2] },
        statusBreakdown: {
          pending: { $size: { $filter: { input: '$statusCounts', cond: { $eq: ['$$this', 'pending'] } } } },
          confirmed: { $size: { $filter: { input: '$statusCounts', cond: { $eq: ['$$this', 'confirmed'] } } } },
          shipped: { $size: { $filter: { input: '$statusCounts', cond: { $eq: ['$$this', 'shipped'] } } } },
          delivered: { $size: { $filter: { input: '$statusCounts', cond: { $eq: ['$$this', 'delivered'] } } } },
          cancelled: { $size: { $filter: { input: '$statusCounts', cond: { $eq: ['$$this', 'cancelled'] } } } }
        }
      }
    }
  ]);
};

// Virtual for customer name
orderSchema.virtual('customerName').get(function() {
  return this.user ? this.user.fullName : this.guestInfo.fullName;
});

// Virtual for customer email
orderSchema.virtual('customerEmail').get(function() {
  return this.user ? this.user.email : this.guestInfo.email;
});

// Virtual for order age in days
orderSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for is guest order
orderSchema.virtual('isGuestOrder').get(function() {
  return !this.user;
});

// Ensure virtual fields are serialized
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

// Indexes for performance
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'guestInfo.email': 1 });

module.exports = mongoose.model('Order', orderSchema);
