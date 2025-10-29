import React, { createContext, useContext, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const OrderContext = createContext();

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  const createOrder = async (orderData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/orders', orderData);
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create order';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/orders/my');
      setOrders(response.data.data);
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to get orders';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getOrder = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/orders/${id}`);
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to get order';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`/orders/${id}/status`, { status });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update order status';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`/orders/${id}/status`, {
        status: 'cancelled',
        note: 'Cancelled by customer'
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to cancel order';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    orders,
    loading,
    error,
    createOrder,
    getOrders,
    getOrder,
    updateOrderStatus,
    cancelOrder,
    clearError: () => setError(null)
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};
