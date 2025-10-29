const mongoose = require('mongoose');

const discountCodeSchema = new mongoose.Schema({
  // Discount Code Information
  code: {
    type: String,
    required: [true, 'Discount code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        return v.length === 5 && /^[A-Z0-9]{5}$/.test(v);
      },
      message: 'Discount code must be exactly 5 alphanumeric characters'
    }
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  
  // Discount Configuration
  discountType: {
    type: String,
    required: [true, 'Discount type is required'],
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value cannot be negative']
  },
  
  // Usage Limits (MANDATORY: Max 10 uses per code)
  maxUses: {
    type: Number,
    required: [true, 'Maximum uses is required'],
    min: [1, 'Maximum uses must be at least 1'],
    max: [10, 'Maximum uses cannot exceed 10']
  },
  usedCount: {
    type: Number,
    default: 0,
    min: [0, 'Used count cannot be negative']
  },
  
  // Minimum Order Requirements
  minOrderAmount: {
    type: Number,
    default: 0,
    min: [0, 'Minimum order amount cannot be negative']
  },
  maxDiscountAmount: {
    type: Number,
    min: [0, 'Maximum discount amount cannot be negative']
  },
  
  // Applicable Products/Categories
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: String,
    enum: [
      'laptops',
      'desktops', 
      'processors',
      'graphics-cards',
      'memory',
      'storage',
      'motherboards',
      'monitors',
      'keyboards',
      'mice',
      'headsets',
      'accessories',
      'cooling',
      'cases',
      'power-supplies'
    ]
  }],
  
  // User Restrictions
  applicableUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isFirstTimeOnly: {
    type: Boolean,
    default: false
  },
  
  // Status and Validity
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Usage Tracking
  usageHistory: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    discountAmount: {
      type: Number,
      required: true,
      min: [0, 'Discount amount cannot be negative']
    },
    usedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Admin Management
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required']
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
discountCodeSchema.index({ code: 1 });
discountCodeSchema.index({ isActive: 1 });
discountCodeSchema.index({ isPublic: 1 });
discountCodeSchema.index({ createdAt: -1 });
discountCodeSchema.index({ usedCount: 1 });

// Pre-save middleware to update updatedAt
discountCodeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to check if code is valid
discountCodeSchema.methods.isValid = function() {
  return this.isActive && 
         this.usedCount < this.maxUses;
};

// Instance method to check if code can be used by user
discountCodeSchema.methods.canBeUsedBy = function(userId, orderAmount = 0) {
  // Check if code is valid
  if (!this.isValid()) {
    return { valid: false, reason: 'Code is not active or has reached maximum uses' };
  }
  
  // Check minimum order amount
  if (orderAmount < this.minOrderAmount) {
    return { 
      valid: false, 
      reason: `Minimum order amount of $${this.minOrderAmount} required` 
    };
  }
  
  // Check if user is in applicable users list (if specified)
  if (this.applicableUsers.length > 0 && !this.applicableUsers.includes(userId)) {
    return { valid: false, reason: 'Code is not applicable to this user' };
  }
  
  // Check first time only restriction
  if (this.isFirstTimeOnly) {
    const hasUsedBefore = this.usageHistory.some(usage => 
      usage.user.toString() === userId.toString()
    );
    if (hasUsedBefore) {
      return { valid: false, reason: 'Code can only be used once per user' };
    }
  }
  
  return { valid: true };
};

// Instance method to calculate discount amount
discountCodeSchema.methods.calculateDiscount = function(orderAmount) {
  let discountAmount = 0;
  
  if (this.discountType === 'percentage') {
    discountAmount = Math.round(orderAmount * (this.discountValue / 100) * 100) / 100;
  } else {
    discountAmount = this.discountValue;
  }
  
  // Apply maximum discount limit if specified
  if (this.maxDiscountAmount && discountAmount > this.maxDiscountAmount) {
    discountAmount = this.maxDiscountAmount;
  }
  
  // Ensure discount doesn't exceed order amount
  discountAmount = Math.min(discountAmount, orderAmount);
  
  return discountAmount;
};

// Instance method to use the discount code
discountCodeSchema.methods.useCode = function(userId, orderId, discountAmount) {
  if (!this.isValid()) {
    throw new Error('Discount code is not valid');
  }
  
  if (this.usedCount >= this.maxUses) {
    throw new Error('Discount code has reached maximum uses');
  }
  
  // Add to usage history
  this.usageHistory.push({
    user: userId,
    order: orderId,
    discountAmount: discountAmount,
    usedAt: new Date()
  });
  
  // Increment used count
  this.usedCount += 1;
  
  return this.save();
};

// Instance method to get usage statistics
discountCodeSchema.methods.getUsageStats = function() {
  const totalDiscountGiven = this.usageHistory.reduce((total, usage) => {
    return total + usage.discountAmount;
  }, 0);
  
  const averageDiscount = this.usageHistory.length > 0 
    ? totalDiscountGiven / this.usageHistory.length 
    : 0;
  
  return {
    totalUses: this.usedCount,
    maxUses: this.maxUses,
    remainingUses: this.maxUses - this.usedCount,
    usagePercentage: Math.round((this.usedCount / this.maxUses) * 100),
    totalDiscountGiven: totalDiscountGiven,
    averageDiscount: Math.round(averageDiscount * 100) / 100
  };
};

// Instance method to get recent usage
discountCodeSchema.methods.getRecentUsage = function(limit = 10) {
  return this.usageHistory
    .sort((a, b) => b.usedAt - a.usedAt)
    .slice(0, limit);
};

// Instance method to deactivate code
discountCodeSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

// Instance method to activate code
discountCodeSchema.methods.activate = function() {
  this.isActive = true;
  return this.save();
};

// Static method to find valid codes
discountCodeSchema.statics.findValidCodes = function() {
  return this.find({ 
    isActive: true,
    $expr: { $lt: ['$usedCount', '$maxUses'] }
  });
};

// Static method to find code by code string
discountCodeSchema.statics.findByCode = function(code) {
  return this.findOne({ 
    code: code.toUpperCase(),
    isActive: true
  });
};

// Static method to get code statistics
discountCodeSchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalCodes: { $sum: 1 },
        activeCodes: {
          $sum: { $cond: ['$isActive', 1, 0] }
        },
        totalUses: { $sum: '$usedCount' },
        totalMaxUses: { $sum: '$maxUses' },
        totalDiscountGiven: {
          $sum: {
            $reduce: {
              input: '$usageHistory',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.discountAmount'] }
            }
          }
        }
      }
    },
    {
      $project: {
        totalCodes: 1,
        activeCodes: 1,
        inactiveCodes: { $subtract: ['$totalCodes', '$activeCodes'] },
        totalUses: 1,
        totalMaxUses: 1,
        remainingUses: { $subtract: ['$totalMaxUses', '$totalUses'] },
        usagePercentage: {
          $cond: {
            if: { $gt: ['$totalMaxUses', 0] },
            then: { $round: [{ $multiply: [{ $divide: ['$totalUses', '$totalMaxUses'] }, 100] }, 2] },
            else: 0
          }
        },
        totalDiscountGiven: 1
      }
    }
  ]);
};

// Virtual for remaining uses
discountCodeSchema.virtual('remainingUses').get(function() {
  return this.maxUses - this.usedCount;
});

// Virtual for usage percentage
discountCodeSchema.virtual('usagePercentage').get(function() {
  return Math.round((this.usedCount / this.maxUses) * 100);
});

// Virtual for is fully used
discountCodeSchema.virtual('isFullyUsed').get(function() {
  return this.usedCount >= this.maxUses;
});

// Virtual for is expired
discountCodeSchema.virtual('isExpired').get(function() {
  return this.usedCount >= this.maxUses;
});

// Ensure virtual fields are serialized
discountCodeSchema.set('toJSON', { virtuals: true });
discountCodeSchema.set('toObject', { virtuals: true });

// Indexes for performance
discountCodeSchema.index({ code: 1 }, { unique: true });
discountCodeSchema.index({ isActive: 1 });
discountCodeSchema.index({ createdAt: -1 });
discountCodeSchema.index({ applicableCategories: 1 });

module.exports = mongoose.model('DiscountCode', discountCodeSchema);
