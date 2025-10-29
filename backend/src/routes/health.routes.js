/**
 * Health Check Routes
 * Provides endpoints for Docker Swarm health monitoring
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/**
 * @route   GET /api/health
 * @desc    Basic health check endpoint
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'ecommerce-backend',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    res.status(200).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route   GET /api/health/ready
 * @desc    Readiness probe - checks if service is ready to accept traffic
 * @access  Public
 */
router.get('/ready', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    if (dbState !== 1) {
      return res.status(503).json({
        status: 'not_ready',
        reason: 'database_not_connected',
        database: {
          state: dbStatus[dbState],
          readyState: dbState,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Service is ready
    res.status(200).json({
      status: 'ready',
      checks: {
        database: 'connected',
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB',
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route   GET /api/health/live
 * @desc    Liveness probe - checks if service is alive
 * @access  Public
 */
router.get('/live', (req, res) => {
  try {
    res.status(200).json({
      status: 'alive',
      pid: process.pid,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'dead',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route   GET /api/health/detailed
 * @desc    Detailed health check with all system metrics
 * @access  Public
 */
router.get('/detailed', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const healthCheck = {
      status: dbState === 1 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: {
        name: 'ecommerce-backend',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid,
        uptime: {
          seconds: Math.floor(process.uptime()),
          formatted: formatUptime(process.uptime()),
        },
      },
      database: {
        status: dbStatus[dbState],
        readyState: dbState,
        host: mongoose.connection.host || 'unknown',
        name: mongoose.connection.name || 'unknown',
      },
      system: {
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
          unit: 'MB',
        },
        cpu: {
          user: Math.round(cpuUsage.user / 1000),
          system: Math.round(cpuUsage.system / 1000),
          unit: 'microseconds',
        },
        platform: process.platform,
        nodeVersion: process.version,
      },
    };

    const statusCode = dbState === 1 ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

module.exports = router;
