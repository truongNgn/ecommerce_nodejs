const Redis = require('ioredis');

let redisClient = null;

/**
 * Create and configure Redis client
 */
const createRedisClient = () => {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  console.log('📡 Connecting to Redis:', redisUrl);

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      console.log(`🔄 Redis reconnecting... attempt ${times}, delay: ${delay}ms`);
      return delay;
    },
    reconnectOnError: (err) => {
      console.error('❌ Redis connection error:', err.message);
      return true;
    }
  });

  // Event handlers
  redisClient.on('connect', () => {
    console.log('✅ Redis client connected');
  });

  redisClient.on('ready', () => {
    console.log('✅ Redis client ready');
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis client error:', err.message);
  });

  redisClient.on('close', () => {
    console.log('⚠️ Redis client connection closed');
  });

  redisClient.on('reconnecting', () => {
    console.log('🔄 Redis client reconnecting...');
  });

  return redisClient;
};

/**
 * Get Redis client instance
 */
const getRedisClient = () => {
  if (!redisClient) {
    return createRedisClient();
  }
  return redisClient;
};

/**
 * Close Redis connection
 */
const closeRedisConnection = async () => {
  if (redisClient) {
    console.log('🔌 Closing Redis connection...');
    await redisClient.quit();
    redisClient = null;
    console.log('✅ Redis connection closed');
  }
};

/**
 * Check Redis connection health
 */
const isRedisConnected = () => {
  return redisClient && redisClient.status === 'ready';
};

/**
 * Ping Redis to check connection
 */
const pingRedis = async () => {
  try {
    const client = getRedisClient();
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('❌ Redis ping failed:', error.message);
    return false;
  }
};

module.exports = {
  createRedisClient,
  getRedisClient,
  closeRedisConnection,
  isRedisConnected,
  pingRedis
};
