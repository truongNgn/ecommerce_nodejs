const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Basic Product Information
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    minlength: [50, 'Description must be at least 50 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  
  // Brand and Category
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    maxlength: [50, 'Brand name cannot exceed 50 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
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
  },
  
  // Product Variants (MANDATORY: Minimum 2 variants per product)
  variants: [{
    name: {
      type: String,
      required: [true, 'Variant name is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Variant price is required'],
      min: [0, 'Price cannot be negative']
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative']
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true
    },
    // Variant Attributes (for computers and components)
    attributes: {
      color: {
        type: String,
        trim: true
      },
      storage: {
        type: String,
        trim: true
      },
      ram: {
        type: String,
        trim: true
      },
      screenSize: {
        type: String,
        trim: true
      },
      processor: {
        type: String,
        trim: true
      },
      graphics: {
        type: String,
        trim: true
      },
      connectivity: [{
        type: String,
        trim: true
      }],
      weight: {
        type: String,
        trim: true
      },
      dimensions: {
        type: String,
        trim: true
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Product Images (MANDATORY: Minimum 3 images)
  images: [{
    url: {
      type: String,
      required: [true, 'Image URL is required']
    },
    alt: {
      type: String,
      trim: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  
  // Technical Specifications
  specifications: {
    processor: {
      type: String,
      trim: true
    },
    graphics: {
      type: String,
      trim: true
    },
    display: {
      type: String,
      trim: true
    },
    connectivity: [{
      type: String,
      trim: true
    }],
    ports: [{
      type: String,
      trim: true
    }],
    battery: {
      type: String,
      trim: true
    },
    operatingSystem: {
      type: String,
      trim: true
    },
    warranty: {
      type: String,
      trim: true
    }
  },
  
  // SEO and Marketing
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  keywords: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Pricing and Availability
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Base price cannot be negative']
  },
  isOnSale: {
    type: Boolean,
    default: false
  },
  salePrice: {
    type: Number,
    min: [0, 'Sale price cannot be negative']
  },
  saleStartDate: Date,
  saleEndDate: Date,
  
  // Inventory Management
  totalStock: {
    type: Number,
    default: 0,
    min: [0, 'Total stock cannot be negative']
  },
  lowStockThreshold: {
    type: Number,
    default: 5
  },
  
  // Reviews and Ratings
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: [0, 'Review count cannot be negative']
  },
  
  // Product Status
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isNew: {
    type: Boolean,
    default: true
  },
  
  // Sales tracking
  salesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Admin Management
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Indexes for performance optimization
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ basePrice: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isNew: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ salesCount: -1 });
productSchema.index({ 'variants.sku': 1 });

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Pre-save middleware to update total stock
productSchema.pre('save', function(next) {
  if (this.isModified('variants')) {
    this.totalStock = this.variants.reduce((total, variant) => {
      return total + (variant.isActive ? variant.stock : 0);
    }, 0);
  }
  next();
});

// Pre-save middleware to update updatedAt
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to get primary image
productSchema.methods.getPrimaryImage = function() {
  const primaryImage = this.images.find(img => img.isPrimary);
  return primaryImage || this.images[0] || null;
};

// Instance method to get available variants
productSchema.methods.getAvailableVariants = function() {
  if (!this.variants || this.variants.length === 0) return [];
  return this.variants.filter(variant => variant.isActive && variant.stock > 0);
};

// Instance method to get lowest price
productSchema.methods.getLowestPrice = function() {
  const availableVariants = this.getAvailableVariants();
  if (availableVariants.length === 0) return null;
  
  return Math.min(...availableVariants.map(variant => variant.price));
};

// Instance method to get highest price
productSchema.methods.getHighestPrice = function() {
  const availableVariants = this.getAvailableVariants();
  if (availableVariants.length === 0) return null;
  
  return Math.max(...availableVariants.map(variant => variant.price));
};

// Instance method to check if product is in stock
productSchema.methods.isInStock = function() {
  return this.totalStock > 0;
};

// Instance method to update average rating
productSchema.methods.updateAverageRating = async function() {
  const Review = mongoose.model('Review');
  const stats = await Review.aggregate([
    { $match: { product: this._id } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);
  
  if (stats.length > 0) {
    this.averageRating = Math.round(stats[0].averageRating * 10) / 10;
    this.reviewCount = stats[0].reviewCount;
  } else {
    this.averageRating = 0;
    this.reviewCount = 0;
  }
  
  return this.save();
};

// Static method to find products by category
productSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true });
};

// Static method to find featured products
productSchema.statics.findFeatured = function() {
  return this.find({ isFeatured: true, isActive: true });
};

// Static method to find new products
productSchema.statics.findNew = function() {
  return this.find({ isNew: true, isActive: true });
};

// Static method to find best selling products
productSchema.statics.findBestSelling = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ salesCount: -1 })
    .limit(limit);
};

// Static method to search products
productSchema.statics.searchProducts = function(query, filters = {}) {
  const searchQuery = {
    isActive: true,
    ...filters
  };
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  return this.find(searchQuery);
};

// Virtual for product URL
productSchema.virtual('url').get(function() {
  return `/products/${this.slug}`;
});

// Virtual for price range
productSchema.virtual('priceRange').get(function() {
  // Safety check for variants
  if (!this.variants || this.variants.length === 0) {
    return this.basePrice ? `$${this.basePrice}` : null;
  }
  
  const lowest = this.getLowestPrice();
  const highest = this.getHighestPrice();
  
  if (lowest === null || highest === null) return null;
  if (lowest === highest) return `$${lowest}`;
  return `$${lowest} - $${highest}`;
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
