import twilio from 'twilio';
import { logger } from '../utils/logger.js';

// Create Twilio client
let twilioClient = null;

/**
 * Initialize Twilio client
 */
export const initTwilioClient = () => {
  try {
    // Check if required environment variables are set
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;
    
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      throw new Error('Twilio configuration is incomplete in environment variables');
    }
    
    // Create Twilio client
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    
    logger.info('Twilio client initialized');
    return true;
  } catch (error) {
    logger.error('Twilio client initialization failed:', error);
    return false;
  }
};

/**
 * Generate a random 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP via SMS
 */
export const sendOTPSMS = async (phoneNumber, otp) => {
  try {
    if (!twilioClient) {
      initTwilioClient();
      
      if (!twilioClient) {
        throw new Error('Twilio client not initialized');
      }
    }
    
    // Format phone number to E.164 format if not already
    // This assumes Indian numbers, adjust as needed
    let formattedNumber = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      // If number starts with 0, replace with +91
      if (phoneNumber.startsWith('0')) {
        formattedNumber = '+91' + phoneNumber.substring(1);
      } 
      // If number starts with 91, add +
      else if (phoneNumber.startsWith('91')) {
        formattedNumber = '+' + phoneNumber;
      }
      // Otherwise, assume it's a 10-digit number and add +91
      else if (phoneNumber.length === 10) {
        formattedNumber = '+91' + phoneNumber;
      }
    }
    
    // SMS content
    const message = await twilioClient.messages.create({
      body: `Your Begget Fashion verification code is: ${otp}. Valid for ${process.env.OTP_TTL_MIN || 10} minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber
    });
    
    logger.info(`OTP SMS sent to ${formattedNumber}: ${message.sid}`);
    
    return { success: true, sid: message.sid };
  } catch (error) {
    logger.error('Error sending OTP SMS:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send order confirmation SMS
 */
export const sendOrderConfirmationSMS = async (phoneNumber, orderId) => {
  try {
    if (!twilioClient) {
      initTwilioClient();
      
      if (!twilioClient) {
        throw new Error('Twilio client not initialized');
      }
    }
    
    // Format phone number to E.164 format if not already
    let formattedNumber = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      // If number starts with 0, replace with +91
      if (phoneNumber.startsWith('0')) {
        formattedNumber = '+91' + phoneNumber.substring(1);
      } 
      // If number starts with 91, add +
      else if (phoneNumber.startsWith('91')) {
        formattedNumber = '+' + phoneNumber;
      }
      // Otherwise, assume it's a 10-digit number and add +91
      else if (phoneNumber.length === 10) {
        formattedNumber = '+91' + phoneNumber;
      }
    }
    
    // SMS content
    const message = await twilioClient.messages.create({
      body: `Thank you for your order with Begget Fashion! Your order #${orderId} has been confirmed. Track your order on our website.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber
    });
    
    logger.info(`Order confirmation SMS sent to ${formattedNumber}: ${message.sid}`);
    
    return { success: true, sid: message.sid };
  } catch (error) {
    logger.error('Error sending order confirmation SMS:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send shipping update SMS
 */
export const sendShippingUpdateSMS = async (phoneNumber, orderId, status, trackingId = null) => {
  try {
    if (!twilioClient) {
      initTwilioClient();
      
      if (!twilioClient) {
        throw new Error('Twilio client not initialized');
      }
    }
    
    // Format phone number to E.164 format if not already
    let formattedNumber = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      // If number starts with 0, replace with +91
      if (phoneNumber.startsWith('0')) {
        formattedNumber = '+91' + phoneNumber.substring(1);
      } 
      // If number starts with 91, add +
      else if (phoneNumber.startsWith('91')) {
        formattedNumber = '+' + phoneNumber;
      }
      // Otherwise, assume it's a 10-digit number and add +91
      else if (phoneNumber.length === 10) {
        formattedNumber = '+91' + phoneNumber;
      }
    }
    
    // Prepare message based on status
    let messageBody = '';
    
    switch (status) {
      case 'SHIPPED':
        messageBody = `Your Begget Fashion order #${orderId} has been shipped!`;
        if (trackingId) {
          messageBody += ` Track your package with tracking ID: ${trackingId}`;
        }
        break;
      case 'DELIVERED':
        messageBody = `Your Begget Fashion order #${orderId} has been delivered! Thank you for shopping with us.`;
        break;
      case 'OUT_FOR_DELIVERY':
        messageBody = `Your Begget Fashion order #${orderId} is out for delivery and will arrive today!`;
        break;
      default:
        messageBody = `Your Begget Fashion order #${orderId} status has been updated to: ${status}`;
    }
    
    // SMS content
    const message = await twilioClient.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber
    });
    
    logger.info(`Shipping update SMS sent to ${formattedNumber}: ${message.sid}`);
    
    return { success: true, sid: message.sid };
  } catch (error) {
    logger.error('Error sending shipping update SMS:', error);
    return { success: false, error: error.message };
  }
};

export default {
  initTwilioClient,
  generateOTP,
  sendOTPSMS,
  sendOrderConfirmationSMS,
  sendShippingUpdateSMS
};