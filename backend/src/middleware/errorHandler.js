const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let message = 'Duplicate field value entered';
    
    // Extract field name from error
    const field = Object.keys(err.keyValue)[0];
    if (field === 'email') {
      message = 'Email already exists';
    } else if (field === 'code') {
      message = 'Discount code already exists';
    } else if (field === 'orderNumber') {
      message = 'Order number already exists';
    }
    
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = { message, statusCode: 400 };
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = 'Too many files';
    error = { message, statusCode: 400 };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected field';
    error = { message, statusCode: 400 };
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = { message, statusCode: 429 };
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Validation error handler
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(val => val.message);
  return {
    message: 'Validation Error',
    errors: errors
  };
};

// Duplicate key error handler
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return {
    message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
  };
};

// JWT error handler
const handleJWTError = () => {
  return {
    message: 'Invalid token'
  };
};

const handleJWTExpiredError = () => {
  return {
    message: 'Token expired'
  };
};

// File upload error handler
const handleFileUploadError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return {
      message: 'File too large',
      maxSize: '5MB'
    };
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return {
      message: 'Too many files',
      maxFiles: 5
    };
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return {
      message: 'Unexpected field in file upload'
    };
  }
  
  return {
    message: 'File upload error'
  };
};

// Database connection error handler
const handleDatabaseError = (err) => {
  if (err.name === 'MongoNetworkError') {
    return {
      message: 'Database connection failed'
    };
  }
  
  if (err.name === 'MongoTimeoutError') {
    return {
      message: 'Database operation timeout'
    };
  }
  
  return {
    message: 'Database error'
  };
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Close server & exit process
  process.exit(1);
});

module.exports = {
  errorHandler,
  asyncHandler,
  notFound,
  handleValidationError,
  handleDuplicateKeyError,
  handleJWTError,
  handleJWTExpiredError,
  handleFileUploadError,
  handleDatabaseError,
  AppError
};
