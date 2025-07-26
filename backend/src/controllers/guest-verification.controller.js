import { generateOTP, sendOTPEmail } from '../services/email.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { logger } from '../utils/logger.js';

// Store OTPs in memory with expiry time (10 minutes)
const otpStore = new Map();

/**
 * Send OTP to guest user's email
 */
export const sendGuestOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      throw new AppError('Email is required', 400);
    }

    // Generate OTP
    const otp = generateOTP(6);
    
    // Store OTP with expiry time (10 minutes)
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 10);
    
    otpStore.set(email, {
      otp,
      expiryTime,
      verified: false
    });

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, 'Guest');

    if (!emailSent) {
      throw new AppError('Failed to send OTP email', 500);
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email',
      data: {
        email,
        expiryTime
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP sent to guest user's email
 */
export const verifyGuestOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // Validate required fields
    if (!email || !otp) {
      throw new AppError('Email and OTP are required', 400);
    }

    // Check if OTP exists for the email
    if (!otpStore.has(email)) {
      throw new AppError('No OTP found for this email. Please request a new OTP', 400);
    }

    const otpData = otpStore.get(email);

    // Check if OTP has expired
    if (new Date() > otpData.expiryTime) {
      // Remove expired OTP
      otpStore.delete(email);
      throw new AppError('OTP has expired. Please request a new OTP', 400);
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      throw new AppError('Invalid OTP. Please try again', 400);
    }

    // Mark as verified
    otpData.verified = true;
    otpStore.set(email, otpData);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        email,
        verified: true
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if email is verified
 */
export const checkEmailVerification = async (req, res, next) => {
  try {
    const { email } = req.params;

    // Validate email
    if (!email) {
      throw new AppError('Email is required', 400);
    }

    // Check if email exists in OTP store and is verified
    const isVerified = otpStore.has(email) && otpStore.get(email).verified;

    // Return verification status
    res.status(200).json({
      success: true,
      data: {
        email,
        verified: isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};