const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email credentials not configured. Email sending will fail.');
    console.warn('Please set EMAIL_USER and EMAIL_PASS environment variables.');
  }
  
  console.log('📧 Email Service Configuration:', {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER || 'namhuynhfree@gmail.com',
    hasPassword: !!process.env.EMAIL_PASS,
    passwordLength: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0
  });
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || 'namhuynhfree@gmail.com',
      pass: process.env.EMAIL_PASS || 'jcih afyb kjrk tgay'
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates in development
    }
  });
  
  return transporter;
};

// Send email
const sendEmail = async (options) => {
  try {
    console.log('📧 Attempting to send email:', {
      to: options.email,
      subject: options.subject,
      from: process.env.EMAIL_USER
    });
    
    const transporter = createTransporter();
    
    // Test connection first
    await transporter.verify();
    console.log('✅ Email server connection verified');
    
    const mailOptions = {
      from: `"TechStore" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || options.message
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', {
      error: error.message,
      code: error.code,
      response: error.response,
      command: error.command
    });
    
    // Provide more specific error messages
    if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Please check your email credentials.');
    } else if (error.code === 'ECONNECTION') {
      throw new Error('Email server connection failed. Please check your network connection.');
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error('Email server timeout. Please try again later.');
    } else {
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  const message = `
    <h1>Welcome to TechStore!</h1>
    <p>Hi ${user.fullName},</p>
    <p>Thank you for registering with TechStore. We're excited to have you on board!</p>
    <p>You can now browse our collection of computers and computer components.</p>
    <p>Happy shopping!</p>
    <br>
    <p>Best regards,<br>TechStore Team</p>
  `;
  
  return sendEmail({
    email: user.email,
    subject: 'Welcome to TechStore!',
    html: message
  });
};

// Send email verification
const sendEmailVerification = async (user, verificationUrl) => {
  const message = `
    <h1>Verify Your Email</h1>
    <p>Hi ${user.fullName},</p>
    <p>Please verify your email address by clicking the link below:</p>
    <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn't create an account, please ignore this email.</p>
    <br>
    <p>Best regards,<br>TechStore Team</p>
  `;
  
  return sendEmail({
    email: user.email,
    subject: 'Verify Your Email - TechStore',
    html: message
  });
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetUrl) => {
  const message = `
    <h1>Password Reset Request</h1>
    <p>Hi ${user.fullName},</p>
    <p>You requested a password reset for your TechStore account.</p>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
    <p>This link will expire in 10 minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
    <br>
    <p>Best regards,<br>TechStore Team</p>
  `;
  
  return sendEmail({
    email: user.email,
    subject: 'Password Reset - TechStore',
    html: message
  });
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (user, order) => {
  const message = `
    <h1>Order Confirmation</h1>
    <p>Hi ${user.fullName},</p>
    <p>Thank you for your order! Your order has been confirmed.</p>
    <br>
    <h3>Order Details:</h3>
    <p><strong>Order Number:</strong> ${order.orderNumber}</p>
    <p><strong>Order Date:</strong> ${order.createdAt.toLocaleDateString()}</p>
    <p><strong>Total Amount:</strong> $${order.total.toFixed(2)}</p>
    <br>
    <h3>Items Ordered:</h3>
    ${order.items.map(item => `
      <p>• ${item.productName} - ${item.variantName} (Qty: ${item.quantity}) - $${item.total.toFixed(2)}</p>
    `).join('')}
    <br>
    <h3>Shipping Address:</h3>
    <p>${order.shippingAddress.fullName}<br>
    ${order.shippingAddress.street}<br>
    ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
    ${order.shippingAddress.country}</p>
    <br>
    <p>We'll send you another email when your order ships.</p>
    <p>Thank you for shopping with TechStore!</p>
    <br>
    <p>Best regards,<br>TechStore Team</p>
  `;
  
  return sendEmail({
    email: user.email,
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: message
  });
};

// Send order status update email
const sendOrderStatusUpdateEmail = async (user, order, newStatus) => {
  const statusMessages = {
    confirmed: 'Your order has been confirmed and is being prepared.',
    processing: 'Your order is being processed.',
    shipped: 'Your order has been shipped!',
    delivered: 'Your order has been delivered.',
    cancelled: 'Your order has been cancelled.',
    returned: 'Your order has been returned.'
  };
  
  const message = `
    <h1>Order Status Update</h1>
    <p>Hi ${user.fullName},</p>
    <p>Your order status has been updated.</p>
    <br>
    <h3>Order Details:</h3>
    <p><strong>Order Number:</strong> ${order.orderNumber}</p>
    <p><strong>New Status:</strong> ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</p>
    <p><strong>Message:</strong> ${statusMessages[newStatus] || 'Your order status has been updated.'}</p>
    <br>
    ${newStatus === 'shipped' && order.trackingNumber ? `
      <h3>Tracking Information:</h3>
      <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
      <p><strong>Carrier:</strong> ${order.carrier || 'Not specified'}</p>
    ` : ''}
    <br>
    <p>Thank you for shopping with TechStore!</p>
    <br>
    <p>Best regards,<br>TechStore Team</p>
  `;
  
  return sendEmail({
    email: user.email,
    subject: `Order Update - ${order.orderNumber}`,
    html: message
  });
};

// Send low stock alert email (for admin)
const sendLowStockAlertEmail = async (adminEmail, products) => {
  const message = `
    <h1>Low Stock Alert</h1>
    <p>The following products are running low on stock:</p>
    <br>
    <ul>
      ${products.map(product => `
        <li><strong>${product.name}</strong> - ${product.variantName}: ${product.stock} units remaining</li>
      `).join('')}
    </ul>
    <br>
    <p>Please consider restocking these items.</p>
    <br>
    <p>TechStore Admin System</p>
  `;
  
  return sendEmail({
    email: adminEmail,
    subject: 'Low Stock Alert - TechStore',
    html: message
  });
};

// Send new order notification email (for admin)
const sendNewOrderNotificationEmail = async (adminEmail, order) => {
  const message = `
    <h1>New Order Notification</h1>
    <p>A new order has been placed:</p>
    <br>
    <h3>Order Details:</h3>
    <p><strong>Order Number:</strong> ${order.orderNumber}</p>
    <p><strong>Customer:</strong> ${order.customerName}</p>
    <p><strong>Email:</strong> ${order.customerEmail}</p>
    <p><strong>Order Date:</strong> ${order.createdAt.toLocaleDateString()}</p>
    <p><strong>Total Amount:</strong> $${order.total.toFixed(2)}</p>
    <br>
    <h3>Items Ordered:</h3>
    ${order.items.map(item => `
      <p>• ${item.productName} - ${item.variantName} (Qty: ${item.quantity}) - $${item.total.toFixed(2)}</p>
    `).join('')}
    <br>
    <p>Please process this order as soon as possible.</p>
    <br>
    <p>TechStore Admin System</p>
  `;
  
  return sendEmail({
    email: adminEmail,
    subject: `New Order - ${order.orderNumber}`,
    html: message
  });
};

// Send newsletter email
const sendNewsletterEmail = async (subscribers, subject, content) => {
  const message = `
    <h1>${subject}</h1>
    <div>${content}</div>
    <br>
    <p>Best regards,<br>TechStore Team</p>
    <br>
    <p><a href="#" style="color: #666; text-decoration: none;">Unsubscribe</a></p>
  `;
  
  const promises = subscribers.map(subscriber => 
    sendEmail({
      email: subscriber.email,
      subject: subject,
      html: message
    })
  );
  
  return Promise.all(promises);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendLowStockAlertEmail,
  sendNewOrderNotificationEmail,
  sendNewsletterEmail
};
