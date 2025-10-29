/**
 * Validation utilities for form inputs
 */

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password) => {
  const minLength = 6;
  return password && password.length >= minLength;
};

// Phone number validation (Vietnamese format)
export const validatePhone = (phone) => {
  const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Name validation
export const validateName = (name) => {
  return name && name.trim().length >= 2;
};

// Address validation
export const validateAddress = (address) => {
  return address && address.trim().length >= 10;
};

// Price validation
export const validatePrice = (price) => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) && numPrice >= 0;
};

// Quantity validation
export const validateQuantity = (quantity) => {
  const numQuantity = parseInt(quantity);
  return !isNaN(numQuantity) && numQuantity > 0 && numQuantity <= 99;
};

// Discount code validation
export const validateDiscountCode = (code) => {
  const codeRegex = /^[A-Z0-9]{5}$/;
  return codeRegex.test(code.toUpperCase());
};

// Credit card validation (basic)
export const validateCreditCard = (cardNumber) => {
  const cardRegex = /^[0-9]{13,19}$/;
  return cardRegex.test(cardNumber.replace(/\s/g, ''));
};

// CVV validation
export const validateCVV = (cvv) => {
  const cvvRegex = /^[0-9]{3,4}$/;
  return cvvRegex.test(cvv);
};

// Expiry date validation (MM/YY format)
export const validateExpiryDate = (expiry) => {
  const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
  if (!expiryRegex.test(expiry)) return false;
  
  const [month, year] = expiry.split('/');
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;
  
  const expYear = parseInt(year);
  const expMonth = parseInt(month);
  
  if (expYear < currentYear) return false;
  if (expYear === currentYear && expMonth < currentMonth) return false;
  
  return true;
};

// Form validation helpers
export const validateForm = (formData, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = formData[field];
    const fieldRules = rules[field];
    
    fieldRules.forEach(rule => {
      if (!rule.validator(value, formData)) {
        errors[field] = rule.message;
      }
    });
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Common validation rules
export const commonRules = {
  email: [
    {
      validator: (value, formData) => value && validateEmail(value),
      message: 'Please enter a valid email address'
    }
  ],
  password: [
    {
      validator: (value, formData) => value && validatePassword(value),
      message: 'Password must be at least 6 characters long'
    }
  ],
  confirmPassword: [
    {
      validator: (value, formData) => value === formData.password,
      message: 'Passwords do not match'
    }
  ],
  phone: [
    {
      validator: (value, formData) => !value || validatePhone(value),
      message: 'Please enter a valid phone number'
    }
  ],
  name: [
    {
      validator: (value, formData) => value && validateName(value),
      message: 'Name must be at least 2 characters long'
    }
  ],
  address: [
    {
      validator: (value, formData) => value && validateAddress(value),
      message: 'Address must be at least 10 characters long'
    }
  ],
  required: [
    {
      validator: (value, formData) => value && value.toString().trim().length > 0,
      message: 'This field is required'
    }
  ]
};

// Product form validation
export const productValidationRules = {
  name: [
    {
      validator: (value, formData) => value && value.trim().length >= 3,
      message: 'Product name must be at least 3 characters long'
    }
  ],
  description: [
    {
      validator: (value, formData) => value && value.trim().length >= 10,
      message: 'Description must be at least 10 characters long'
    }
  ],
  price: [
    {
      validator: (value, formData) => value && validatePrice(value),
      message: 'Please enter a valid price'
    }
  ],
  category: [
    {
      validator: (value, formData) => value && value.trim().length > 0,
      message: 'Please select a category'
    }
  ],
  brand: [
    {
      validator: (value, formData) => value && value.trim().length > 0,
      message: 'Please enter a brand'
    }
  ]
};

// User form validation
export const userValidationRules = {
  email: commonRules.email,
  password: commonRules.password,
  confirmPassword: commonRules.confirmPassword,
  fullName: commonRules.name,
  phone: commonRules.phone,
  address: commonRules.address
};

// Order form validation
export const orderValidationRules = {
  shippingAddress: [
    {
      validator: (value, formData) => value && value.trim().length >= 10,
      message: 'Shipping address is required'
    }
  ],
  paymentMethod: [
    {
      validator: (value, formData) => value && value.trim().length > 0,
      message: 'Please select a payment method'
    }
  ]
};

// Review form validation
export const reviewValidationRules = {
  rating: [
    {
      validator: (value, formData) => value && value >= 1 && value <= 5,
      message: 'Please select a rating'
    }
  ],
  comment: [
    {
      validator: (value, formData) => value && value.trim().length >= 10,
      message: 'Comment must be at least 10 characters long'
    }
  ]
};
