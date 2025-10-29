const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Product and User References
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      // User is required ONLY for ratings (not for comments)
      return this.rating != null && this.rating > 0;
    }
  },
  // Anonymous user info (for comments without login)
  anonymousUser: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  
  // Review Content
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    default: null // Rating is optional (only required for logged-in users)
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Review title cannot exceed 100 characters']
  },
  comment: {
    type: String,
    required: function() {
      // At least comment OR rating must be provided
      return !this.rating && !this.comment;
    },
    trim: true,
    minlength: [10, 'Comment must be at least 10 characters'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  
  // Review Images (optional)
  images: [{
    url: {
      type: String,
      required: [true, 'Image URL is required']
    },
    alt: {
      type: String,
      trim: true
    }
  }],
  
  // Review Status
  isVerified: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Helpful Votes
  helpfulVotes: {
    type: Number,
    default: 0,
    min: [0, 'Helpful votes cannot be negative']
  },
  totalVotes: {
    type: Number,
    default: 0,
    min: [0, 'Total votes cannot be negative']
  },
  
  // Admin Response
  adminResponse: {
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Admin response cannot exceed 500 characters']
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  
  // Review Metadata
  verifiedPurchase: {
    type: Boolean,
    default: false
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
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
reviewSchema.index({ product: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ isActive: 1 });
reviewSchema.index({ isApproved: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ product: 1, isActive: 1, isApproved: 1 });

// Compound index to prevent duplicate reviews (only for authenticated users)
reviewSchema.index({ product: 1, user: 1 }, { 
  unique: true,
  partialFilterExpression: { user: { $exists: true, $ne: null } }
});

// Pre-save middleware to update updatedAt
reviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Post-save middleware to update product rating
reviewSchema.post('save', async function() {
  if (this.isActive && this.isApproved) {
    await this.constructor.updateProductRating(this.product);
  }
});

// Post-remove middleware to update product rating
reviewSchema.post('remove', async function() {
  await this.constructor.updateProductRating(this.product);
});

// Static method to update product average rating
reviewSchema.statics.updateProductRating = async function(productId) {
  const Product = mongoose.model('Product');
  
  const stats = await this.aggregate([
    { 
      $match: { 
        product: productId, 
        isActive: true, 
        isApproved: true 
      } 
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);
  
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      reviewCount: stats[0].reviewCount
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      averageRating: 0,
      reviewCount: 0
    });
  }
};

// Instance method to vote helpful
reviewSchema.methods.voteHelpful = function() {
  this.helpfulVotes += 1;
  this.totalVotes += 1;
  return this.save();
};

// Instance method to vote not helpful
reviewSchema.methods.voteNotHelpful = function() {
  this.totalVotes += 1;
  return this.save();
};

// Instance method to get helpful percentage
reviewSchema.methods.getHelpfulPercentage = function() {
  if (this.totalVotes === 0) return 0;
  return Math.round((this.helpfulVotes / this.totalVotes) * 100);
};

// Instance method to add admin response
reviewSchema.methods.addAdminResponse = function(comment, adminId) {
  this.adminResponse = {
    comment: comment,
    respondedBy: adminId,
    respondedAt: new Date()
  };
  return this.save();
};

// Instance method to approve review
reviewSchema.methods.approve = function() {
  this.isApproved = true;
  this.isActive = true;
  return this.save();
};

// Instance method to reject review
reviewSchema.methods.reject = function() {
  this.isApproved = false;
  this.isActive = false;
  return this.save();
};

// Static method to find reviews by product
reviewSchema.statics.findByProduct = function(productId, options = {}) {
  const query = { 
    product: productId, 
    isActive: true, 
    isApproved: true 
  };
  
  if (options.rating) {
    query.rating = options.rating;
  }
  
  if (options.verifiedOnly) {
    query.verifiedPurchase = true;
  }
  
  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder === 'asc' ? 1 : -1;
  
  return this.find(query)
    .populate('user', 'fullName profilePicture')
    .sort({ [sortBy]: sortOrder });
};

// Static method to find reviews by user
reviewSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId, isActive: true })
    .populate('product', 'name images')
    .sort({ createdAt: -1 });
};

// Static method to get product rating distribution
reviewSchema.statics.getRatingDistribution = function(productId) {
  return this.aggregate([
    { 
      $match: { 
        product: productId, 
        isActive: true, 
        isApproved: true 
      } 
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: -1 }
    }
  ]);
};

// Static method to get recent reviews
reviewSchema.statics.getRecentReviews = function(limit = 10) {
  return this.find({ isActive: true, isApproved: true })
    .populate('product', 'name images')
    .populate('user', 'fullName')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get top rated reviews
reviewSchema.statics.getTopRatedReviews = function(limit = 10) {
  return this.find({ isActive: true, isApproved: true })
    .populate('product', 'name images')
    .populate('user', 'fullName')
    .sort({ rating: -1, helpfulVotes: -1 })
    .limit(limit);
};

// Static method to get review statistics
reviewSchema.statics.getStatistics = function(productId = null) {
  const matchStage = { isActive: true, isApproved: true };
  
  if (productId) {
    matchStage.product = productId;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating'
        },
        totalHelpfulVotes: { $sum: '$helpfulVotes' },
        totalVotes: { $sum: '$totalVotes' }
      }
    },
    {
      $project: {
        totalReviews: 1,
        averageRating: { $round: ['$averageRating', 2] },
        ratingDistribution: {
          fiveStar: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 5] } } } },
          fourStar: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 4] } } } },
          threeStar: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 3] } } } },
          twoStar: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 2] } } } },
          oneStar: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 1] } } } }
        },
        helpfulPercentage: {
          $cond: {
            if: { $gt: ['$totalVotes', 0] },
            then: { $round: [{ $multiply: [{ $divide: ['$totalHelpfulVotes', '$totalVotes'] }, 100] }, 2] },
            else: 0
          }
        }
      }
    }
  ]);
};

// Virtual for helpful percentage
reviewSchema.virtual('helpfulPercentage').get(function() {
  return this.getHelpfulPercentage();
});

// Virtual for review age in days
reviewSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for is recent review
reviewSchema.virtual('isRecent').get(function() {
  return this.ageInDays <= 7;
});

// Virtual for has admin response
reviewSchema.virtual('hasAdminResponse').get(function() {
  return !!(this.adminResponse && this.adminResponse.comment);
});

// Ensure virtual fields are serialized
reviewSchema.set('toJSON', { virtuals: true });
reviewSchema.set('toObject', { virtuals: true });

// Indexes for performance
reviewSchema.index({ product: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ product: 1, rating: 1 });

module.exports = mongoose.model('Review', reviewSchema);
