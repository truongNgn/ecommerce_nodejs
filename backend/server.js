const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const { createServer } = require('http');
const webSocketService = require('./src/services/websocketService');
const fs = require('fs');
const path = require('path');

// Load environment variables first
require('dotenv').config();

// Then load passport configuration
const passport = require('./src/config/passport');

const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting (disabled for development)
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // limit each IP to 1000 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.'
// });
// app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-session-id']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware (required for Passport)
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Debug session middleware
app.use((req, res, next) => {
  console.log('🔐 Session middleware:', {
    sessionID: req.sessionID,
    hasSession: !!req.session,
    hasPassport: !!req._passport
  });
  next();
});

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static('uploads'));

// ========================================
// 🔧 AUTO IMPORT DATA FUNCTION
// ========================================
async function autoImportData() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║         🔍 CHECKING IF DATA NEEDS TO BE IMPORTED...              ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');

    // Check if users collection has data
    const usersCount = await mongoose.connection.collection('users').countDocuments();
    
    if (usersCount > 0) {
      console.log(`✅ Database already has ${usersCount} users. Skipping import.\n`);
      return;
    }

    console.log('📦 Database is empty. Starting auto import...\n');

    // Import function (inline version from import-data.js)
    const DB_BACKUP_PATH = path.join(__dirname, 'db');

    // Convert MongoDB JSON
    function convertMongoJSON(obj) {
      if (obj === null || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(convertMongoJSON);
      if (obj.$oid) return obj.$oid;
      if (obj.$date) return new Date(obj.$date);
      if (obj.$numberInt) return parseInt(obj.$numberInt);
      if (obj.$numberLong) return parseInt(obj.$numberLong);
      if (obj.$numberDouble) return parseFloat(obj.$numberDouble);

      const converted = {};
      for (const key in obj) {
        converted[key] = convertMongoJSON(obj[key]);
      }
      return converted;
    }

    // Import collection
    async function importCollection(collectionName, filePath) {
      try {
        console.log(`📥 Importing ${collectionName}...`);
        
        if (!fs.existsSync(filePath)) {
          console.log(`⚠️  File not found: ${path.basename(filePath)}. Skipping...`);
          return;
        }

        const rawData = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(rawData);
        const convertedData = convertMongoJSON(jsonData);
        
        const collection = mongoose.connection.collection(collectionName);
        const count = await collection.countDocuments();
        
        if (count > 0) {
          console.log(`⚠️  ${collectionName} already has ${count} documents. Skipping...`);
          return;
        }
        
        if (convertedData.length > 0) {
          await collection.insertMany(convertedData);
          console.log(`✅ Imported ${convertedData.length} documents to ${collectionName}`);
        } else {
          console.log(`⚠️  No data to import for ${collectionName}`);
        }
      } catch (error) {
        console.error(`❌ Error importing ${collectionName}:`, error.message);
      }
    }

    // Import all collections
    const collections = [
      { name: 'users', file: 'ecommerce.users.json' },
      { name: 'products', file: 'ecommerce.products.json' },
      { name: 'carts', file: 'ecommerce.carts.json' },
      { name: 'orders', file: 'ecommerce.orders.json' },
      { name: 'reviews', file: 'ecommerce.reviews.json' },
      { name: 'discountcodes', file: 'ecommerce.discountcodes.json' }
    ];

    for (const { name, file } of collections) {
      const filePath = path.join(DB_BACKUP_PATH, file);
      await importCollection(name, filePath);
    }

    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║              ✅ AUTO IMPORT COMPLETED SUCCESSFULLY!               ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');

    // Display summary
    console.log('📊 Database Summary:');
    for (const { name } of collections) {
      try {
        const collection = mongoose.connection.collection(name);
        const count = await collection.countDocuments();
        console.log(`   ${name.padEnd(20)} : ${count} documents`);
      } catch (error) {
        console.log(`   ${name.padEnd(20)} : Error getting count`);
      }
    }
    console.log('\n');

  } catch (error) {
    console.error('❌ Auto import failed:', error.message);
    // Don't crash the server if import fails
  }
}

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ MongoDB connected successfully');
  
  // 🆕 AUTO IMPORT DATA (if enabled and database is empty)
  if (process.env.AUTO_IMPORT_DATA === 'true') {
    await autoImportData();
  }
})
.catch(err => console.error('❌ MongoDB connection error:', err));

// Initialize WebSocket service
webSocketService.initialize(server);

// Routes
app.use('/api/health', require('./src/routes/health.routes')); // Health check endpoints for Swarm
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/products', require('./src/routes/product.routes'));
app.use('/api/cart', require('./src/routes/cart.routes'));
app.use('/api/orders', require('./src/routes/order.routes'));
app.use('/api/users', require('./src/routes/user.routes'));
app.use('/api/admin', require('./src/routes/admin.routes'));
app.use('/api/reviews', require('./src/routes/review.routes'));
app.use('/api/discounts', require('./src/routes/discount.routes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'E-commerce API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('=== 404 HANDLER ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Original URL:', req.originalUrl);
  console.log('Path:', req.path);
  
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📱 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});

module.exports = { app, server, webSocketService };
