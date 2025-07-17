import { createClient } from 'redis';
import { logger } from '../utils/logger.js';

let redisClient = null;
let inMemoryOTPStore = {}; // Fallback in-memory storage for OTPs

/**
 * Connect to Redis server
 */
export const connectToRedis = async () => {
  // Check if Redis is enabled in environment
  const redisEnabled = process.env.REDIS_ENABLED === 'true';
  
  if (!redisEnabled) {
    logger.info('Redis is disabled. Using in-memory storage for OTPs.');
    return null;
  }
  
  try {
    const redisHost = process.env.REDIS_HOST || '127.0.0.1';
    const redisPort = process.env.REDIS_PORT || 6379;
    const redisPassword = process.env.REDIS_PASSWORD || '';
    
    // Create Redis client
    redisClient = createClient({
      url: `redis://${redisHost}:${redisPort}`,
      password: redisPassword || undefined
    });
    
    // Handle Redis errors
    redisClient.on('error', (err) => {
      logger.error(`Redis error: ${err}`);
    });
    
    // Connect to Redis
    await redisClient.connect();
    logger.info('Redis connected successfully');
    
    // Handle process termination
    process.on('SIGINT', async () => {
      if (redisClient) {
        await redisClient.quit();
        logger.info('Redis connection closed due to app termination');
      }
    });
    
    return redisClient;
  } catch (error) {
    logger.error(`Error connecting to Redis: ${error.message}`);
    logger.info('Falling back to in-memory storage for OTPs');
    return null;
  }
};

/**
 * Get Redis client instance
 */
export const getRedisClient = () => {
  return redisClient;
};

/**
 * Store OTP in Redis or in-memory fallback
 * @param {string} key - The key to store the OTP under (usually email or phone)
 * @param {string} otp - The OTP to store
 * @param {number} expiryInMinutes - OTP expiry time in minutes
 */
export const storeOTP = async (key, otp, expiryInMinutes = 10) => {
  try {
    const redisEnabled = process.env.REDIS_ENABLED === 'true';
    const expiryInSeconds = expiryInMinutes * 60;
    
    if (redisEnabled && redisClient && redisClient.isReady) {
      // Store in Redis with expiry
      await redisClient.setEx(`otp:${key}`, expiryInSeconds, otp);
      logger.debug(`OTP stored in Redis for ${key}`);
    } else {
      // Store in memory with expiry
      inMemoryOTPStore[key] = {
        otp,
        expiresAt: Date.now() + (expiryInSeconds * 1000)
      };
      logger.debug(`OTP stored in memory for ${key}`);
      
      // Set up automatic cleanup after expiry
      setTimeout(() => {
        if (inMemoryOTPStore[key]) {
          delete inMemoryOTPStore[key];
          logger.debug(`Expired OTP removed from memory for ${key}`);
        }
      }, expiryInSeconds * 1000);
    }
    
    return true;
  } catch (error) {
    logger.error(`Error storing OTP: ${error.message}`);
    return false;
  }
};

/**
 * Verify OTP from Redis or in-memory fallback
 * @param {string} key - The key the OTP is stored under
 * @param {string} otp - The OTP to verify
 * @returns {Object} - Object with valid flag and reason if invalid
 */
export const verifyOTP = async (key, otp) => {
  try {
    const redisEnabled = process.env.REDIS_ENABLED === 'true';
    
    if (redisEnabled && redisClient && redisClient.isReady) {
      // Get from Redis
      const storedOTP = await redisClient.get(`otp:${key}`);
      
      if (!storedOTP) {
        return { valid: false, reason: 'EXPIRED_OTP' };
      }
        
      if (storedOTP === otp) {
        // Delete OTP after successful verification
        await redisClient.del(`otp:${key}`);
        return { valid: true };
      }
    } else {
      // Get from memory
      const otpData = inMemoryOTPStore[key];
      
      if (!otpData) {
        return { valid: false, reason: 'EXPIRED_OTP' };
      }
      
      if (otpData.expiresAt < Date.now()) {
        // Delete expired OTP
        delete inMemoryOTPStore[key];
        return { valid: false, reason: 'EXPIRED_OTP' };
      }
      
      if (otpData.otp === otp) {
        // Delete OTP after successful verification
        delete inMemoryOTPStore[key];
        return { valid: true };
      }
    }
    
    return { valid: false, reason: 'INVALID_OTP' };
  } catch (error) {
    logger.error(`Error verifying OTP: ${error.message}`);
    return { valid: false, reason: 'SERVER_ERROR' };
  }
};

export default {
  connectToRedis,
  getRedisClient,
  storeOTP,
  verifyOTP
};