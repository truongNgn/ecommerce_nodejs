import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { getToken, setToken, removeToken } from '../utils/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = getToken();
        if (token) {
          const response = await api.get('/auth/me');
          setUser(response.data.data);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        removeToken();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data.data;
      
      setToken(token);
      setUser(userData);
      
      // Merge guest cart with user cart if session exists
      const sessionId = localStorage.getItem('guestSessionId');
      if (sessionId) {
        try {
          const mergeResponse = await api.post('/cart/merge', { sessionId });
          console.log('🛒 Cart merge successful:', mergeResponse.data);
          localStorage.removeItem('guestSessionId'); // Clear guest session
          
          // Trigger cart reload by dispatching a custom event
          window.dispatchEvent(new CustomEvent('cartMerged'));
          
          // Also try to reload cart directly after a short delay
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('cartMerged'));
          }, 1000);
        } catch (mergeError) {
          console.warn('Failed to merge guest cart:', mergeError);
          // Don't fail login if cart merge fails
        }
      }
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth/register', userData);
      const { token, user: newUser } = response.data.data;
      
      setToken(token);
      setUser(newUser);
      
      // Merge guest cart with user cart if session exists
      const sessionId = localStorage.getItem('guestSessionId');
      if (sessionId) {
        try {
          const mergeResponse = await api.post('/cart/merge', { sessionId });
          console.log('🛒 Cart merge successful:', mergeResponse.data);
          localStorage.removeItem('guestSessionId'); // Clear guest session
          
          // Trigger cart reload by dispatching a custom event
          window.dispatchEvent(new CustomEvent('cartMerged'));
          
          // Also try to reload cart directly after a short delay
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('cartMerged'));
          }, 1000);
        } catch (mergeError) {
          console.warn('Failed to merge guest cart:', mergeError);
          // Don't fail registration if cart merge fails
        }
      }
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setError(null);
  };

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put('/auth/profile', profileData);
      setUser(response.data.data.user);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password change failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const socialLogin = async (provider) => {
    try {
      setLoading(true);
      setError(null);
      
      // Redirect to backend OAuth endpoint
      const oauthUrl = `http://localhost:5000/api/auth/${provider}`;
      
      console.log('🔐 Social login redirect:', {
        provider,
        oauthUrl
      });
      
      window.location.href = oauthUrl;
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Social login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const handleSocialCallback = async (token, refreshToken) => {
    try {
      setLoading(true);
      setError(null);
      
      setToken(token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      // Get user data
      const response = await api.get('/auth/me');
      setUser(response.data.data);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Social login callback failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    socialLogin,
    handleSocialCallback,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
