import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const socketInstance = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: true
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setConnected(true);
      setError(null);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to server');
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinProductRoom = (productId) => {
    if (socket && connected) {
      socket.emit('join-product-room', productId);
    }
  };

  const leaveProductRoom = (productId) => {
    if (socket && connected) {
      socket.emit('leave-product-room', productId);
    }
  };

  const onReviewUpdate = (callback) => {
    if (socket) {
      socket.on('review-updated', callback);
    }
  };

  const onCartUpdate = (callback) => {
    if (socket) {
      socket.on('cart-updated', callback);
    }
  };

  const onOrderUpdate = (callback) => {
    if (socket) {
      socket.on('order-updated', callback);
    }
  };

  const removeReviewListener = () => {
    if (socket) {
      socket.off('review-updated');
    }
  };

  const removeCartListener = () => {
    if (socket) {
      socket.off('cart-updated');
    }
  };

  const removeOrderListener = () => {
    if (socket) {
      socket.off('order-updated');
    }
  };

  const value = {
    socket,
    connected,
    error,
    joinProductRoom,
    leaveProductRoom,
    onReviewUpdate,
    onCartUpdate,
    onOrderUpdate,
    removeReviewListener,
    removeCartListener,
    removeOrderListener
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
