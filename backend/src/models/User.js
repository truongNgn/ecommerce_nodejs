const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      return !this.socialLogin || Object.keys(this.socialLogin).length === 0;
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Phone is optional
        // Remove spaces and validate Vietnamese phone format
        const cleanPhone = v.replace(/\s/g, '');
        return /^(\+84|84|0)[1-9][0-9]{8,9}$/.test(cleanPhone);
      },
      message: 'Please enter a valid Vietnamese phone number'
    }
  },
  
  // Address Management (Multiple addresses)
  addresses: [{
    type: {
      type: String,
      enum: ['default', 'shipping', 'billing'],
      default: 'shipping'
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    zipCode: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: 'Vietnam'
    },
    phone: {
      type: String,
      trim: true
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  
  // Loyalty System
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: [0, 'Loyalty points cannot be negative']
  },
  
  // Role-based Access Control
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  
  // Social Authentication
  socialLogin: {
    provider: {
      type: String,
      enum: ['google', 'facebook']
    },
    providerId: {
      type: String
    },
    profilePicture: {
      type: String
    }
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  // Email Verification
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  
  // Timestamps
  lastLogin: Date,
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
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );
};

// Instance method to generate refresh token
userSchema.methods.getRefreshToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

// Instance method to add loyalty points
userSchema.methods.addLoyaltyPoints = function(points) {
  this.loyaltyPoints += points;
  return this.save();
};

// Instance method to use loyalty points
userSchema.methods.useLoyaltyPoints = function(points) {
  if (this.loyaltyPoints < points) {
    throw new Error('Insufficient loyalty points');
  }
  this.loyaltyPoints -= points;
  return this.save();
};

// Instance method to add address
userSchema.methods.addAddress = function(addressData) {
  // If this is the first address, make it default
  if (this.addresses.length === 0) {
    addressData.isDefault = true;
  }
  
  // If this address is set as default, unset others
  if (addressData.isDefault) {
    this.addresses.forEach(addr => addr.isDefault = false);
  }
  
  this.addresses.push(addressData);
  return this.save();
};

// Instance method to update address
userSchema.methods.updateAddress = function(addressId, addressData) {
  const address = this.addresses.id(addressId);
  if (!address) {
    throw new Error('Address not found');
  }
  
  // If this address is set as default, unset others
  if (addressData.isDefault) {
    this.addresses.forEach(addr => {
      if (addr._id.toString() !== addressId) {
        addr.isDefault = false;
      }
    });
  }
  
  Object.assign(address, addressData);
  return this.save();
};

// Instance method to remove address
userSchema.methods.removeAddress = function(addressId) {
  const address = this.addresses.id(addressId);
  if (!address) {
    throw new Error('Address not found');
  }
  
  const wasDefault = address.isDefault;
  
  // Remove the address from the array
  this.addresses.pull(addressId);
  
  // If we removed the default address, make another one default
  if (wasDefault && this.addresses.length > 0) {
    this.addresses[0].isDefault = true;
  }
  
  return this.save();
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

// Virtual for user's default address
userSchema.virtual('defaultAddress').get(function() {
  if (!this.addresses || this.addresses.length === 0) return null;
  return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
