import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated, user } = useAuth();

  // Get or create session ID for guest users
  const getSessionId = () => {
    let sessionId = localStorage.getItem('guestSessionId');
    if (!sessionId) {
      sessionId = 'guest_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('guestSessionId', sessionId);
    }
    return sessionId;
  };

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (isAuthenticated) {
        const response = await api.get('/cart');
        setCart(response.data.data.cart?.items || []);
      } else {
        // Load guest cart from backend using session ID
        const sessionId = getSessionId();
        const response = await api.get('/cart', {
          headers: { 'x-session-id': sessionId }
        });
        setCart(response.data.data.cart?.items || []);
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Listen for cart merge events
  useEffect(() => {
    const handleCartMerged = () => {
      console.log('🛒 Cart merged event received, reloading cart...');
      loadCart();
    };

    window.addEventListener('cartMerged', handleCartMerged);
    
    return () => {
      window.removeEventListener('cartMerged', handleCartMerged);
    };
  }, [loadCart]);

  const addToCart = async (product, variant, quantity = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const requestData = {
        product: product._id,
        variant: variant?._id,
        quantity
      };

      const headers = {};
      if (!isAuthenticated) {
        headers['x-session-id'] = getSessionId();
      }

      const response = await api.post('/cart/add', requestData, { headers });
      // Backend returns { data: { cart: {...}, summary: {...} } }
      setCart(response.data.data.cart?.items || []);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add to cart';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (productId, variantId, quantity) => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = {};
      if (!isAuthenticated) {
        headers['x-session-id'] = getSessionId();
      }

      const response = await api.put('/cart/update', {
        product: productId,
        variant: variantId,
        quantity
      }, { headers });
      setCart(response.data.data.cart?.items || []);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update cart';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId, variantId) => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = {};
      if (!isAuthenticated) {
        headers['x-session-id'] = getSessionId();
      }

      const response = await api.delete(`/cart/remove/${productId}/${variantId}`, { headers });
      setCart(response.data.data.cart?.items || []);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to remove from cart';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = {};
      if (!isAuthenticated) {
        headers['x-session-id'] = getSessionId();
      }

      await api.delete('/cart/clear', { headers });
      setCart([]);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to clear cart';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const applyDiscountCode = async (code) => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = {};
      if (!isAuthenticated) {
        headers['x-session-id'] = getSessionId();
      }

      const response = await api.post('/cart/discount', { discountCode: code }, { headers });
      // Update cart with discount applied
      const cartData = response.data.data.cart;
      
      // Store discount info in cart state while keeping items array
      if (cartData) {
        setCart(prev => ({
          ...prev,
          items: cartData.items || [],
          discountCode: cartData.discountCode,
          discountAmount: cartData.discount || 0
        }));
      } else {
        setCart(cartData?.items || []);
      }
      
      return { success: true, discount: response.data.data.discount };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Invalid discount code';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const removeDiscountCode = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = {};
      if (!isAuthenticated) {
        headers['x-session-id'] = getSessionId();
      }

      const response = await api.delete('/cart/discount', { headers });
      setCart(response.data.data.cart?.items || []);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to remove discount';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const applyLoyaltyPoints = async (points) => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = {};
      if (!isAuthenticated) {
        headers['x-session-id'] = getSessionId();
      }

      const response = await api.post('/cart/loyalty', { points }, { headers });
      const cartData = response.data.data.cart;
      
      // Store loyalty points info in cart state while keeping items array
      if (cartData) {
        setCart(prev => ({
          ...prev,
          items: cartData.items || [],
          loyaltyPointsUsed: cartData.loyaltyPointsUsed || 0
        }));
      } else {
        setCart(cartData?.items || []);
      }
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to use loyalty points';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const removeLoyaltyPoints = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = {};
      if (!isAuthenticated) {
        headers['x-session-id'] = getSessionId();
      }

      const response = await api.delete('/cart/loyalty', { headers });
      setCart(response.data.data.cart?.items || []);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to remove loyalty points';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getCartItems = () => {
    // Handle both array and object cart formats
    return Array.isArray(cart) ? cart : (cart?.items || []);
  };
  
  const getCartTotal = () => {
    const subtotal = getCartSubtotal();
    const discount = getDiscountAmount();
    const loyaltyPoints = getLoyaltyPointsUsed();
    const shipping = getShippingCost();
    const tax = getTaxAmount();
    
    return subtotal + shipping + tax - discount - loyaltyPoints;
  };
  
  const getCartSubtotal = () => {
    // Handle both array and object cart formats
    const items = Array.isArray(cart) ? cart : (cart?.items || []);
    return items.reduce((total, item) => {
      // Use variant price if exists, otherwise use product basePrice
      const itemPrice = item.variant?.price || item.product?.basePrice || 0;
      return total + (itemPrice * item.quantity);
    }, 0);
  };
  
  const getDiscountAmount = () => {
    // Get discount amount from cart data
    if (cart && cart.discountAmount) {
      return cart.discountAmount;
    }
    return 0;
  };
  
  const getLoyaltyPointsUsed = () => {
    // Get loyalty points used from cart data
    if (cart && cart.loyaltyPointsUsed) {
      return cart.loyaltyPointsUsed;
    }
    return 0;
  };
  
  const getShippingCost = () => {
    const subtotal = getCartSubtotal();
    return subtotal > 1000000 ? 0 : 50000; // Free shipping over 1M VND
  };
  
  const getTaxAmount = () => {
    const subtotal = getCartSubtotal();
    return subtotal * 0.1; // 10% tax
  };

  const isEmpty = () => {
    return !cart || cart.length === 0;
  };

  const mergeCarts = async (sessionId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/cart/merge', { sessionId });
      
      if (response.data.success) {
        setCart(response.data.data.cart);
        return { success: true, data: response.data.data };
      } else {
        setError(response.data.message);
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to merge carts';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    cart,
    loading,
    error,
    getCartItems,
    getCartTotal,
    getCartSubtotal,
    getDiscountAmount,
    getLoyaltyPointsUsed,
    getShippingCost,
    getTaxAmount,
    isEmpty,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    applyDiscountCode,
    removeDiscountCode,
    applyLoyaltyPoints,
    removeLoyaltyPoints,
    mergeCarts,
    loadCart,
    clearError: () => setError(null)
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
