import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth endpoints
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    me: '/auth/me',
    profile: '/auth/profile',
    changePassword: '/auth/change-password',
    forgotPassword: '/auth/forgot-password',
    resetPassword: (token) => `/auth/reset-password/${token}`,
    verifyEmail: (token) => `/auth/verify-email/${token}`,
    resendVerification: '/auth/resend-verification',
    refreshToken: '/auth/refresh-token',
  },
  
  // Product endpoints
  products: {
    list: '/products',
    detail: (id) => `/products/${id}`,
    create: '/products',
    update: (id) => `/products/${id}`,
    delete: (id) => `/products/${id}`,
    search: '/products/search',
    categories: '/products/categories',
    brands: '/products/brands',
    featured: '/products/featured',
    new: '/products/new',
    bestsellers: '/products/bestsellers',
  },
  
  // Cart endpoints
  cart: {
    get: '/cart',
    add: '/cart/add',
    update: '/cart/update',
    remove: (productId, variantId) => `/cart/remove/${productId}/${variantId}`,
    clear: '/cart/clear',
    discount: '/cart/discount',
    loyalty: '/cart/loyalty',
  },
  
  // Order endpoints
  orders: {
    create: '/orders',
    list: '/orders',
    detail: (id) => `/orders/${id}`,
    updateStatus: (id) => `/orders/${id}/status`,
    myOrders: '/orders/my',
  },
  
  // User endpoints
  users: {
    list: '/users',
    detail: (id) => `/users/${id}`,
    create: '/users',
    update: (id) => `/users/${id}`,
    delete: (id) => `/users/${id}`,
    addresses: {
      list: '/users/addresses',
      create: '/users/addresses',
      update: (id) => `/users/addresses/${id}`,
      delete: (id) => `/users/addresses/${id}`
    }
  },
  
  // Admin endpoints
  admin: {
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    orders: '/admin/orders',
    products: '/admin/products',
    discounts: '/admin/discounts',
    analytics: '/admin/analytics',
  },
  
  // Review endpoints
  reviews: {
    list: (productId) => `/products/${productId}/reviews`,
    create: (productId) => `/products/${productId}/reviews`,
    update: (productId, reviewId) => `/products/${productId}/reviews/${reviewId}`,
    delete: (productId, reviewId) => `/products/${productId}/reviews/${reviewId}`,
  },
  
  // File upload endpoints
  upload: {
    images: '/upload/images',
    avatar: '/upload/avatar',
  },
};

// Helper functions for common API calls
export const apiHelpers = {
  // Product helpers
  getProducts: (params = {}) => {
    return api.get(endpoints.products.list, { params });
  },
  
  getProduct: (id) => {
    return api.get(endpoints.products.detail(id));
  },
  
  searchProducts: (query, filters = {}) => {
    return api.get(endpoints.products.search, {
      params: { q: query, ...filters }
    });
  },
  
  // Cart helpers
  getCart: () => {
    return api.get(endpoints.cart.get);
  },
  
  addToCart: (productId, variantId, quantity) => {
    return api.post(endpoints.cart.add, {
      productId,
      variantId,
      quantity
    });
  },
  
  updateCartItem: (productId, variantId, quantity) => {
    return api.put(endpoints.cart.update, {
      productId,
      variantId,
      quantity
    });
  },
  
  removeFromCart: (productId, variantId) => {
    return api.delete(endpoints.cart.remove(productId, variantId));
  },
  
  // Order helpers
  createOrder: (orderData) => {
    return api.post(endpoints.orders.create, orderData);
  },
  
  getOrders: (params = {}) => {
    return api.get(endpoints.orders.list, { params });
  },
  
  getOrder: (id) => {
    return api.get(endpoints.orders.detail(id));
  },
  
  // User helpers
  updateProfile: (profileData) => {
    return api.put(endpoints.auth.profile, profileData);
  },
  
  changePassword: (passwordData) => {
    return api.put(endpoints.auth.changePassword, passwordData);
  },
  
  // Admin helpers
  getDashboard: () => {
    return api.get(endpoints.admin.dashboard);
  },
  
  getAdminUsers: (params = {}) => {
    return api.get(endpoints.admin.users, { params });
  },
  
  getAdminOrders: (params = {}) => {
    return api.get(endpoints.admin.orders, { params });
  },
  
  updateOrderStatus: (id, status) => {
    return api.put(endpoints.orders.updateStatus(id), { status });
  },
  
  // Review helpers
  getReviews: (productId) => {
    return api.get(endpoints.reviews.list(productId));
  },
  
  createReview: (productId, reviewData) => {
    return api.post(endpoints.reviews.create(productId), reviewData);
  },
  
  // File upload helpers
  uploadImage: (file, type = 'product') => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    
    return api.post(endpoints.upload.images, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Error handling
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return data.message || 'Bad request';
      case 401:
        return 'Unauthorized access';
      case 403:
        return 'Access forbidden';
      case 404:
        return 'Resource not found';
      case 422:
        return data.message || 'Validation error';
      case 500:
        return 'Internal server error';
      default:
        return data.message || 'An error occurred';
    }
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your connection.';
  } else {
    // Other error
    return error.message || 'An unexpected error occurred';
  }
};

// Request/Response logging (development only)
if (process.env.NODE_ENV === 'development') {
  api.interceptors.request.use(
    (config) => {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
      return config;
    },
    (error) => {
      console.error('API Request Error:', error);
      return Promise.reject(error);
    }
  );
  
  api.interceptors.response.use(
    (response) => {
      console.log('API Response:', response.status, response.config.url);
      return response;
    },
    (error) => {
      console.error('API Response Error:', error.response?.status, error.config?.url);
      return Promise.reject(error);
    }
  );
}

// Attach endpoints to api object for easier access
api.endpoints = endpoints;

export { api };
export default api;
