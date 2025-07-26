import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

let transporter = null;

/**
 * Initialize email transporter
 */
export const initializeEmailTransporter = () => {
  try {
    // Get email configuration from environment variables
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const fromEmail = process.env.FROM_EMAIL || process.env.EMAIL_FROM;
    
    if (!host || !port || !user || !pass) {
      logger.warn('Email configuration is incomplete. Email service will not work.');
      return null;
    }
    
    // Create transporter
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === '465',
      auth: {
        user,
        pass
      }
    });
    
    logger.info('Email transporter initialized successfully');
    return transporter;
  } catch (error) {
    logger.error(`Error initializing email transporter: ${error.message}`);
    return null;
  }
};

/**
 * Generate a random OTP
 * @param {number} length - Length of OTP
 * @returns {string} - Generated OTP
 */
export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let OTP = '';
  
  for (let i = 0; i < length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  
  return OTP;
};

/**
 * Send OTP email
 * @param {string} email - Recipient email
 * @param {string} otp - OTP to send
 * @param {string} name - Recipient name
 */
export const sendOTPEmail = async (email, otp, name = '') => {
  try {
    if (!transporter) {
      transporter = initializeEmailTransporter();
      if (!transporter) {
        throw new Error('Email transporter not initialized');
      }
    }
    
    const fromEmail = process.env.FROM_EMAIL || process.env.EMAIL_FROM;
    const brandName = process.env.EMAIL_FROM_NAME || 'Begget Fashion';
    
    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: `${otp} is your verification code - ${brandName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">${brandName}</h2>
          <p>Hello ${name || 'there'},</p>
          <p>Your verification code is:</p>
          <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <p>Thanks,<br>${brandName} Team</p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Error sending OTP email: ${error.message}`);
    return false;
  }
};

/**
 * Send order confirmation email
 * @param {string} email - Recipient email
 * @param {Object} order - Order details
 */
export const sendOrderConfirmationEmail = async (email, order) => {
  try {
    logger.info(`Attempting to send order confirmation email to ${email} for order ${order._id}`);
    
    if (!transporter) {
      logger.info('Email transporter not found, initializing...');
      transporter = initializeEmailTransporter();
      if (!transporter) {
        logger.error('Failed to initialize email transporter');
        throw new Error('Email transporter not initialized');
      }
      logger.info('Email transporter initialized successfully');
    }
    
    const fromEmail = process.env.FROM_EMAIL || process.env.EMAIL_FROM;
    const brandName = process.env.EMAIL_FROM_NAME || 'Begget Fashion';
    
    // Generate order items HTML
    let itemsHtml = '';
    order.items.forEach(item => {
      itemsHtml += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${item.productId.title} (${item.variantSku})</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${item.qty}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">₹${item.price.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">₹${(item.price * item.qty).toFixed(2)}</td>
        </tr>
      `;
    });
    
    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: `Order Confirmation #${order._id} - ${brandName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">${brandName} - Order Confirmation</h2>
          <p>Hello ${order.shippingDetails.name},</p>
          <p>Thank you for your order! We've received your order and will process it shortly.</p>
          
          <h3 style="margin-top: 20px;">Order Details:</h3>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
          <p><strong>Payment Method:</strong> ${order.payment.method}</p>
          <p><strong>Payment Status:</strong> ${order.payment.status}</p>
          
          <h3 style="margin-top: 20px;">Items:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 10px; text-align: left;">Product</th>
                <th style="padding: 10px; text-align: center;">Quantity</th>
                <th style="padding: 10px; text-align: right;">Price</th>
                <th style="padding: 10px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Subtotal:</td>
                <td style="padding: 10px; text-align: right;">₹${order.payment.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Shipping:</td>
                <td style="padding: 10px; text-align: right;">₹${order.payment.shippingCost.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">GST:</td>
                <td style="padding: 10px; text-align: right;">₹${order.payment.tax.toFixed(2)}</td>
              </tr>
              ${order.payment.discount ? `
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Discount:</td>
                <td style="padding: 10px; text-align: right;">-₹${order.payment.discount.toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr style="background-color: #f5f5f5;">
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">₹${order.payment.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          
          <h3 style="margin-top: 20px;">Shipping Address:</h3>
          <p>
            ${order.shippingDetails.name}<br>
            ${order.shippingDetails.address.line1}<br>
            ${order.shippingDetails.address.line2 ? order.shippingDetails.address.line2 + '<br>' : ''}
            ${order.shippingDetails.address.city}, ${order.shippingDetails.address.state} ${order.shippingDetails.address.pincode}<br>
            ${order.shippingDetails.address.country}<br>
            Phone: ${order.shippingDetails.phone}
          </p>
          
          <p style="margin-top: 20px;">We'll send you another email when your order ships.</p>
          
          ${!order.userId ? `
          <div style="margin-top: 20px; padding: 15px; background-color: #f0f7ff; border-radius: 5px;">
            <h3 style="color: #0066cc; margin-top: 0;">Track Your Order</h3>
            <p>Create an account or log in to track your order status, view order history, and enjoy faster checkout next time.</p>
            <div style="margin-top: 15px;">
              <a href="${process.env.FRONTEND_URL}/register" style="display: inline-block; background-color: #0066cc; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; margin-right: 10px;">Create Account</a>
              <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; background-color: #ffffff; color: #0066cc; padding: 10px 15px; text-decoration: none; border-radius: 4px; border: 1px solid #0066cc;">Login</a>
            </div>
          </div>
          ` : ''}
          
          <p>Thanks for shopping with us!</p>
          <p>${brandName} Team</p>
        </div>
      `
    };
    
    logger.info(`Preparing to send email with options: ${JSON.stringify({ from: mailOptions.from, to: mailOptions.to, subject: mailOptions.subject })}`);
    
    try {
      const info = await transporter.sendMail(mailOptions);
      logger.info(`Order confirmation email sent to ${email}: ${info.messageId}`);
      return true;
    } catch (emailError) {
      logger.error(`Error in transporter.sendMail: ${emailError.message}`);
      logger.error(emailError.stack);
      throw emailError;
    }
  } catch (error) {
    logger.error(`Error sending order confirmation email: ${error.message}`);
    logger.error(error.stack);
    return false;
  }
};

/**
 * Send campaign email to multiple recipients
 * @param {Array} recipients - Array of recipient emails
 * @param {string} subject - Email subject
 * @param {string} htmlContent - Email HTML content
 */
export const sendCampaignEmail = async (recipients, subject, htmlContent) => {
  try {
    if (!transporter) {
      transporter = initializeEmailTransporter();
      if (!transporter) {
        throw new Error('Email transporter not initialized');
      }
    }
    
    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('Recipients must be a non-empty array');
    }
    
    const fromEmail = process.env.FROM_EMAIL || process.env.EMAIL_FROM;
    
    const mailOptions = {
      from: fromEmail,
      to: recipients.join(','),
      subject,
      html: htmlContent
    };
    
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Campaign email sent to ${recipients.length} recipients: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Error sending campaign email: ${error.message}`);
    return false;
  }
};

/**
 * Send coupon email to a user
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {Object} coupon - Coupon details
 * @param {Object} promotion - Promotion details
 */
export const sendCouponEmail = async (email, name, coupon, promotion) => {
  try {
    if (!transporter) {
      transporter = initializeEmailTransporter();
      if (!transporter) {
        throw new Error('Email transporter not initialized');
      }
    }
    
    const fromEmail = process.env.FROM_EMAIL || process.env.EMAIL_FROM;
    const brandName = process.env.EMAIL_FROM_NAME || 'Begget Fashion';
    
    // Format dates
    const validFrom = new Date(coupon.validFrom).toLocaleDateString();
    const validUntil = new Date(coupon.validUntil).toLocaleDateString();
    
    // Format discount value based on type
    const discountValue = coupon.discountType === 'percent' 
      ? `${coupon.value}%` 
      : `₹${coupon.value.toFixed(2)}`;
    
    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: `Your Special Coupon from ${brandName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">${brandName}</h2>
          <p>Hello ${name || 'there'},</p>
          <p>We're excited to offer you a special discount!</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #333;">${promotion.name}</h3>
            <p>${promotion.description}</p>
            <div style="background-color: #ffffff; padding: 15px; border: 2px dashed #333; margin: 15px auto; max-width: 300px;">
              <h2 style="margin: 0; color: #333; letter-spacing: 2px;">${coupon.code}</h2>
              <p style="margin: 10px 0 0;">Save ${discountValue} on your next order</p>
            </div>
            <p><strong>Valid From:</strong> ${validFrom}</p>
            <p><strong>Valid Until:</strong> ${validUntil}</p>
            ${coupon.minOrderValue ? `<p><strong>Minimum Order:</strong> ₹${coupon.minOrderValue.toFixed(2)}</p>` : ''}
            ${coupon.usageLimit ? `<p><strong>Usage Limit:</strong> ${coupon.usageLimit} time${coupon.usageLimit > 1 ? 's' : ''}</p>` : ''}
          </div>
          
          <p>To use your coupon, simply enter the code at checkout.</p>
          <p>Happy shopping!</p>
          <p>Thanks,<br>${brandName} Team</p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Coupon email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Error sending coupon email: ${error.message}`);
    return false;
  }
};

/**
 * Send welcome email to a new subadmin
 * @param {string} email - Subadmin email
 * @param {string} name - Subadmin name
 * @param {string} password - Subadmin password
 * @param {string} department - Assigned department
 * @param {Array} permissions - Assigned permissions
 */
export const sendSubadminWelcomeEmail = async (email, name, password, department, permissions) => {
  try {
    if (!transporter) {
      transporter = initializeEmailTransporter();
      if (!transporter) {
        throw new Error('Email transporter not initialized');
      }
    }
    
    const fromEmail = process.env.FROM_EMAIL || process.env.EMAIL_FROM;
    const brandName = process.env.EMAIL_FROM_NAME || 'Begget Fashion';
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // Format permissions for display
    const formattedPermissions = permissions && permissions.length > 0 
      ? permissions.map(perm => `<li>${perm.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>`).join('') 
      : '<li>No specific permissions assigned</li>';
    
    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: `Welcome to ${brandName} Admin Panel`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">${brandName} Admin Panel</h2>
          <p>Hello ${name},</p>
          <p>Welcome to the ${brandName} team! You have been registered as a SubAdmin in our system.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #333;">Your Account Details</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p><strong>Department:</strong> ${department || 'Not assigned'}</p>
            <h4 style="margin-bottom: 5px;">Assigned Permissions:</h4>
            <ul>
              ${formattedPermissions}
            </ul>
          </div>
          
          <p>You can log in to the admin panel using the link below:</p>
          <p style="text-align: center;">
            <a href="${loginUrl}/admin" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Login to Admin Panel</a>
          </p>
          
          <p style="margin-top: 20px;">For security reasons, we recommend changing your password after your first login.</p>
          <p>If you have any questions, please contact the administrator.</p>
          <p>Thanks,<br>${brandName} Team</p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Subadmin welcome email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Error sending subadmin welcome email: ${error.message}`);
    return false;
  }
};

// Initialize email transporter when the module is imported
const emailTransporter = initializeEmailTransporter();

// Test email transporter
if (emailTransporter) {
  logger.info('Testing email transporter...');
  emailTransporter.verify((error, success) => {
    if (error) {
      logger.error(`Email transporter verification failed: ${error.message}`);
    } else {
      logger.info('Email transporter is ready to send messages');
    }
  });
}

export default {
  initializeEmailTransporter,
  generateOTP,
  sendOTPEmail,
  sendOrderConfirmationEmail,
  sendCampaignEmail,
  sendCouponEmail,
  sendSubadminWelcomeEmail
};