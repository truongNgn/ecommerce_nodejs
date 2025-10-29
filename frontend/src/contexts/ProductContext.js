import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const ProductContext = createContext();

export const useProduct = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCategories();
    loadBrands();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/products/categories');
      setCategories(response.data.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadBrands = async () => {
    try {
      const response = await api.get('/products/brands');
      setBrands(response.data.data);
    } catch (error) {
      console.error('Failed to load brands:', error);
    }
  };

  const searchProducts = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          queryParams.append(key, filters[key]);
        }
      });
      
      const response = await api.get(`/products?${queryParams.toString()}`);
      setProducts(response.data.data);
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to search products';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getProduct = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/products/${id}`);
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to get product';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getFeaturedProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/products/featured?limit=8');
      setProducts(response.data.data);
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to get featured products';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getBestSellers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/products/bestsellers?limit=8');
      setProducts(response.data.data);
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to get best sellers';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getNewProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/products/new?limit=8');
      setProducts(response.data.data);
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to get new products';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getProductsByCategory = async (category) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/products?category=${category}`);
      setProducts(response.data.data);
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to get products by category';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    products,
    categories,
    brands,
    loading,
    error,
    searchProducts,
    getProduct,
    getFeaturedProducts,
    getBestSellers,
    getNewProducts,
    getProductsByCategory,
    clearError: () => setError(null)
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};
