const Joi = require('joi');

// User validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
  fullName: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Full name must be at least 2 characters long',
    'string.max': 'Full name cannot exceed 100 characters',
    'any.required': 'Full name is required'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'any.required': 'New password is required'
  })
});

// Product validation schemas
const productSchema = Joi.object({
  name: Joi.string().min(2).max(200).required().messages({
    'string.min': 'Product name must be at least 2 characters long',
    'string.max': 'Product name cannot exceed 200 characters',
    'any.required': 'Product name is required'
  }),
  description: Joi.string().min(50).max(2000).required().messages({
    'string.min': 'Description must be at least 50 characters long',
    'string.max': 'Description cannot exceed 2000 characters',
    'any.required': 'Description is required'
  }),
  shortDescription: Joi.string().max(200).required().messages({
    'string.max': 'Short description cannot exceed 200 characters',
    'any.required': 'Short description is required'
  }),
  brand: Joi.string().max(50).required().messages({
    'string.max': 'Brand name cannot exceed 50 characters',
    'any.required': 'Brand is required'
  }),
  category: Joi.string().valid(
    'laptops', 'desktops', 'processors', 'graphics-cards', 'memory',
    'storage', 'motherboards', 'monitors', 'keyboards', 'mice',
    'headsets', 'accessories', 'cooling', 'cases', 'power-supplies'
  ).required().messages({
    'any.only': 'Invalid category',
    'any.required': 'Category is required'
  }),
  basePrice: Joi.number().min(0).required().messages({
    'number.min': 'Base price cannot be negative',
    'any.required': 'Base price is required'
  }),
  variants: Joi.array().min(2).items(Joi.object({
    name: Joi.string().required(),
    price: Joi.number().min(0).required(),
    stock: Joi.number().min(0).required(),
    sku: Joi.string().required(),
    attributes: Joi.object({
      color: Joi.string(),
      storage: Joi.string(),
      ram: Joi.string(),
      screenSize: Joi.string(),
      processor: Joi.string(),
      graphics: Joi.string()
    })
  })).required().messages({
    'array.min': 'Product must have at least 2 variants',
    'any.required': 'Product variants are required'
  })
});

// Cart validation schemas
const addToCartSchema = Joi.object({
  productId: Joi.string().required().messages({
    'any.required': 'Product ID is required'
  }),
  variantId: Joi.string().required().messages({
    'any.required': 'Variant ID is required'
  }),
  quantity: Joi.number().integer().min(1).max(99).default(1).messages({
    'number.min': 'Quantity must be at least 1',
    'number.max': 'Quantity cannot exceed 99'
  })
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(0).max(99).required().messages({
    'number.min': 'Quantity must be at least 0',
    'number.max': 'Quantity cannot exceed 99',
    'any.required': 'Quantity is required'
  })
});

// Order validation schemas
const createOrderSchema = Joi.object({
  shippingAddress: Joi.object({
    fullName: Joi.string().required(),
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().default('Vietnam'),
    phone: Joi.string()
  }).required(),
  paymentMethod: Joi.string().valid(
    'credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cod'
  ).required(),
  discountCode: Joi.string(),
  loyaltyPointsUsed: Joi.number().min(0)
});

// Review validation schemas
const reviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot exceed 5',
    'any.required': 'Rating is required'
  }),
  title: Joi.string().max(100).required().messages({
    'string.max': 'Review title cannot exceed 100 characters',
    'any.required': 'Review title is required'
  }),
  comment: Joi.string().min(10).max(1000).required().messages({
    'string.min': 'Comment must be at least 10 characters long',
    'string.max': 'Comment cannot exceed 1000 characters',
    'any.required': 'Comment is required'
  })
});

// Discount code validation schemas
const discountCodeSchema = Joi.object({
  code: Joi.string().length(5).pattern(/^[A-Z0-9]+$/).required().messages({
    'string.length': 'Discount code must be exactly 5 characters',
    'string.pattern.base': 'Discount code must contain only uppercase letters and numbers',
    'any.required': 'Discount code is required'
  }),
  description: Joi.string().max(200).required().messages({
    'string.max': 'Description cannot exceed 200 characters',
    'any.required': 'Description is required'
  }),
  discountType: Joi.string().valid('percentage', 'fixed').required(),
  discountValue: Joi.number().min(0).required().messages({
    'number.min': 'Discount value cannot be negative',
    'any.required': 'Discount value is required'
  }),
  maxUses: Joi.number().integer().min(1).max(10).required().messages({
    'number.min': 'Maximum uses must be at least 1',
    'number.max': 'Maximum uses cannot exceed 10',
    'any.required': 'Maximum uses is required'
  }),
  minOrderAmount: Joi.number().min(0).default(0),
  maxDiscountAmount: Joi.number().min(0)
});

// Address validation schema
const addressSchema = Joi.object({
  type: Joi.string().valid('default', 'shipping', 'billing').default('shipping'),
  fullName: Joi.string().required(),
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zipCode: Joi.string().required(),
  country: Joi.string().default('Vietnam'),
  phone: Joi.string(),
  isDefault: Joi.boolean().default(false)
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    next();
  };
};

// Query validation middleware
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Query validation error',
        errors
      });
    }
    
    next();
  };
};

module.exports = {
  // Schemas
  registerSchema,
  loginSchema,
  changePasswordSchema,
  productSchema,
  addToCartSchema,
  updateCartItemSchema,
  createOrderSchema,
  reviewSchema,
  discountCodeSchema,
  addressSchema,
  
  // Middleware
  validate,
  validateQuery
};
