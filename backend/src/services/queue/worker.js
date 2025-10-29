#!/usr/bin/env node

/**
 * Email Queue Worker
 * 
 * This worker processes email jobs from the Redis queue
 * Run this as a separate process: node src/services/queue/worker.js
 */

const { getEmailQueue, processEmailQueue } = require('./emailQueue');
const { createRedisClient, pingRedis } = require('./redisClient');

// Load environment variables
require('dotenv').config();

console.log('🚀 Starting Email Queue Worker...');
console.log(`📅 Started at: ${new Date().toISOString()}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📡 Redis URL: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);

// Initialize Redis connection
const initializeWorker = async () => {
  try {
    // Connect to Redis
    const redisClient = createRedisClient();
    
    // Wait for Redis to be ready
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Redis connection timeout'));
      }, 10000); // 10 second timeout

      redisClient.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });

      redisClient.once('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    // Ping Redis to confirm connection
    const isConnected = await pingRedis();
    if (!isConnected) {
      throw new Error('Redis ping failed');
    }

    console.log('✅ Redis connection established');

    // Get email queue
    const emailQueue = getEmailQueue();
    console.log('✅ Email queue initialized');

    // Register processors
    processEmailQueue(emailQueue);
    console.log('✅ Queue processors registered');

    // Log queue stats periodically
    setInterval(async () => {
      try {
        const { getQueueStats } = require('./emailQueue');
        const stats = await getQueueStats();
        if (stats) {
          console.log('📊 Queue Stats:', {
            waiting: stats.waiting,
            active: stats.active,
            completed: stats.completed,
            failed: stats.failed,
            delayed: stats.delayed,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('❌ Failed to log queue stats:', error.message);
      }
    }, 60000); // Every minute

    console.log('✅ Worker started successfully');
    console.log('👂 Listening for email jobs...');

  } catch (error) {
    console.error('❌ Failed to initialize worker:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Handle graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n⚠️ Received ${signal}, shutting down gracefully...`);
  
  try {
    const { closeQueue } = require('./emailQueue');
    const { closeRedisConnection } = require('./redisClient');
    
    // Close queue
    await closeQueue();
    
    // Close Redis connection
    await closeRedisConnection();
    
    console.log('✅ Worker shut down successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
};

// Handle process signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown('unhandledRejection');
});

// Start the worker
initializeWorker().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
