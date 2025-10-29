const socketIo = require('socket.io');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }

  // Initialize WebSocket service
  initialize(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
    console.log('🔌 WebSocket service initialized');
  }

  // Setup event handlers
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('👤 User connected:', socket.id);

      // Handle user authentication
      socket.on('authenticate', (userId) => {
        this.connectedUsers.set(socket.id, userId);
        socket.join(`user-${userId}`);
        console.log(`🔐 User ${userId} authenticated`);
      });

      // Handle joining product room
      socket.on('join-product-room', (productId) => {
        socket.join(`product-${productId}`);
        console.log(`👥 User ${socket.id} joined product room: ${productId}`);
      });

      // Handle leaving product room
      socket.on('leave-product-room', (productId) => {
        socket.leave(`product-${productId}`);
        console.log(`👋 User ${socket.id} left product room: ${productId}`);
      });

      // Handle joining cart room
      socket.on('join-cart-room', (userId) => {
        socket.join(`cart-${userId}`);
        console.log(`🛒 User ${socket.id} joined cart room: ${userId}`);
      });

      // Handle leaving cart room
      socket.on('leave-cart-room', (userId) => {
        socket.leave(`cart-${userId}`);
        console.log(`👋 User ${socket.id} left cart room: ${userId}`);
      });

      // Handle joining admin room
      socket.on('join-admin-room', () => {
        socket.join('admin');
        console.log(`👨‍💼 User ${socket.id} joined admin room`);
      });

      // Handle leaving admin room
      socket.on('leave-admin-room', () => {
        socket.leave('admin');
        console.log(`👋 User ${socket.id} left admin room`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const userId = this.connectedUsers.get(socket.id);
        if (userId) {
          this.connectedUsers.delete(socket.id);
          console.log(`👤 User ${userId} disconnected`);
        } else {
          console.log(`👤 User ${socket.id} disconnected`);
        }
      });
    });
  }

  // Broadcast new review to product room
  broadcastNewReview(productId, review) {
    if (this.io) {
      this.io.to(`product-${productId}`).emit('new-review', {
        type: 'new-review',
        productId,
        review
      });
      console.log(`📝 New review broadcasted for product ${productId}`);
    }
  }

  // Broadcast updated rating to product room
  broadcastUpdatedRating(productId, ratingData) {
    if (this.io) {
      this.io.to(`product-${productId}`).emit('updated-rating', {
        type: 'updated-rating',
        productId,
        ...ratingData
      });
      console.log(`⭐ Rating updated broadcasted for product ${productId}`);
    }
  }

  // Broadcast cart update to user
  broadcastCartUpdate(userId, cartData) {
    if (this.io) {
      this.io.to(`cart-${userId}`).emit('cart-updated', {
        type: 'cart-updated',
        userId,
        cart: cartData
      });
      console.log(`🛒 Cart update broadcasted for user ${userId}`);
    }
  }

  // Broadcast order status update to user
  broadcastOrderStatusUpdate(userId, orderData) {
    if (this.io) {
      this.io.to(`user-${userId}`).emit('order-status-changed', {
        type: 'order-status-changed',
        userId,
        order: orderData
      });
      console.log(`📦 Order status update broadcasted for user ${userId}`);
    }
  }

  // Broadcast new order to admin
  broadcastNewOrder(orderData) {
    if (this.io) {
      this.io.to('admin').emit('new-order', {
        type: 'new-order',
        order: orderData
      });
      console.log(`📦 New order broadcasted to admin`);
    }
  }

  // Broadcast low stock alert to admin
  broadcastLowStockAlert(products) {
    if (this.io) {
      this.io.to('admin').emit('low-stock-alert', {
        type: 'low-stock-alert',
        products
      });
      console.log(`⚠️ Low stock alert broadcasted to admin`);
    }
  }

  // Broadcast system notification
  broadcastSystemNotification(message, type = 'info') {
    if (this.io) {
      this.io.emit('system-notification', {
        type: 'system-notification',
        message,
        notificationType: type,
        timestamp: new Date()
      });
      console.log(`📢 System notification broadcasted: ${message}`);
    }
  }

  // Send notification to specific user
  sendUserNotification(userId, message, type = 'info') {
    if (this.io) {
      this.io.to(`user-${userId}`).emit('user-notification', {
        type: 'user-notification',
        message,
        notificationType: type,
        timestamp: new Date()
      });
      console.log(`📢 Notification sent to user ${userId}: ${message}`);
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get connected users
  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }

  // Check if user is connected
  isUserConnected(userId) {
    return Array.from(this.connectedUsers.values()).includes(userId);
  }

  // Force disconnect user
  disconnectUser(userId) {
    const socketId = Array.from(this.connectedUsers.entries())
      .find(([id, uid]) => uid === userId)?.[0];
    
    if (socketId && this.io) {
      this.io.sockets.sockets.get(socketId)?.disconnect();
      this.connectedUsers.delete(socketId);
      console.log(`🔌 User ${userId} force disconnected`);
    }
  }

  // Get socket instance
  getSocket() {
    return this.io;
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

module.exports = webSocketService;
