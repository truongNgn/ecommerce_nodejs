const Queue = require('bull');
const { getRedisClient } = require('./redisClient');
const emailService = require('../emailService');

/**
 * Create Email Queue
 * Uses Bull for robust job processing with Redis as the backend
 */
const createEmailQueue = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  const emailQueue = new Queue('email', redisUrl, {
    defaultJobOptions: {
      attempts: 3, // Retry failed jobs up to 3 times
      backoff: {
        type: 'exponential', // Exponential backoff strategy
        delay: 2000 // Start with 2 second delay
      },
      removeOnComplete: 100, // Keep only last 100 completed jobs
      removeOnFail: 200 // Keep only last 200 failed jobs
    },
    limiter: {
      max: 10, // Max 10 jobs
      duration: 1000 // Per 1 second (prevent email spam)
    }
  });

  // Event handlers for monitoring
  emailQueue.on('active', (job) => {
    console.log(`📧 Email job ${job.id} started processing`);
  });

  emailQueue.on('completed', (job, result) => {
    console.log(`✅ Email job ${job.id} completed successfully`);
  });

  emailQueue.on('failed', (job, err) => {
    console.error(`❌ Email job ${job.id} failed:`, err.message);
  });

  emailQueue.on('stalled', (job) => {
    console.warn(`⚠️ Email job ${job.id} stalled`);
  });

  emailQueue.on('error', (error) => {
    console.error('❌ Email queue error:', error.message);
  });

  return emailQueue;
};

// Initialize queue
let emailQueue = null;

/**
 * Get or create email queue instance
 */
const getEmailQueue = () => {
  if (!emailQueue) {
    emailQueue = createEmailQueue();
    console.log('✅ Email queue initialized');
  }
  return emailQueue;
};

/**
 * Add email job to queue
 * @param {string} type - Email type (welcome, order-confirmation, password-reset, etc.)
 * @param {object} data - Email data
 * @param {object} options - Job options (priority, delay, etc.)
 */
const addEmailJob = async (type, data, options = {}) => {
  try {
    const queue = getEmailQueue();
    
    const job = await queue.add(
      type,
      {
        type,
        ...data,
        timestamp: new Date().toISOString()
      },
      {
        priority: options.priority || 5, // Default priority
        delay: options.delay || 0, // Immediate by default
        ...options
      }
    );

    console.log(`📨 Email job added to queue: ${job.id} (type: ${type})`);
    return job;
  } catch (error) {
    console.error('❌ Failed to add email job to queue:', error.message);
    
    // Fallback: Try to send email directly if queue fails
    console.log('⚠️ Attempting direct email send as fallback...');
    try {
      await sendEmailDirectly(type, data);
      console.log('✅ Email sent directly (fallback)');
    } catch (fallbackError) {
      console.error('❌ Direct email send also failed:', fallbackError.message);
      throw new Error('Failed to queue or send email');
    }
  }
};

/**
 * Send email directly (fallback when queue is unavailable)
 */
const sendEmailDirectly = async (type, data) => {
  switch (type) {
    case 'welcome':
      return emailService.sendWelcomeEmail(data.user);
    
    case 'order-confirmation':
      return emailService.sendOrderConfirmation(data.order, data.user);
    
    case 'password-reset':
      return emailService.sendPasswordReset(data.user, data.resetToken);
    
    case 'order-status-update':
      return emailService.sendOrderStatusUpdate(data.order, data.user);
    
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
};

/**
 * Process email queue jobs
 * This function should be called by the worker process
 */
const processEmailQueue = (queue) => {
  // Process each email type
  queue.process('welcome', async (job) => {
    console.log(`📧 Processing welcome email for: ${job.data.user.email}`);
    await emailService.sendWelcomeEmail(job.data.user);
    return { success: true, email: job.data.user.email };
  });

  queue.process('order-confirmation', async (job) => {
    console.log(`📧 Processing order confirmation for order: ${job.data.order.orderNumber}`);
    await emailService.sendOrderConfirmation(job.data.order, job.data.user);
    return { success: true, orderNumber: job.data.order.orderNumber };
  });

  queue.process('password-reset', async (job) => {
    console.log(`📧 Processing password reset email for: ${job.data.user.email}`);
    await emailService.sendPasswordReset(job.data.user, job.data.resetToken);
    return { success: true, email: job.data.user.email };
  });

  queue.process('order-status-update', async (job) => {
    console.log(`📧 Processing order status update for order: ${job.data.order.orderNumber}`);
    await emailService.sendOrderStatusUpdate(job.data.order, job.data.user);
    return { success: true, orderNumber: job.data.order.orderNumber };
  });

  console.log('✅ Email queue processor registered');
};

/**
 * Get queue statistics
 */
const getQueueStats = async () => {
  try {
    const queue = getEmailQueue();
    
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount()
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed
    };
  } catch (error) {
    console.error('❌ Failed to get queue stats:', error.message);
    return null;
  }
};

/**
 * Clean completed and failed jobs
 */
const cleanQueue = async (grace = 0) => {
  try {
    const queue = getEmailQueue();
    await queue.clean(grace, 'completed');
    await queue.clean(grace, 'failed');
    console.log('✅ Queue cleaned successfully');
  } catch (error) {
    console.error('❌ Failed to clean queue:', error.message);
  }
};

/**
 * Close queue connection
 */
const closeQueue = async () => {
  if (emailQueue) {
    console.log('🔌 Closing email queue...');
    await emailQueue.close();
    emailQueue = null;
    console.log('✅ Email queue closed');
  }
};

module.exports = {
  getEmailQueue,
  addEmailJob,
  processEmailQueue,
  getQueueStats,
  cleanQueue,
  closeQueue
};
