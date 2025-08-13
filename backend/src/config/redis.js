import { createClient } from 'redis';
import { logger } from '../utils/logger.js';

// Redis client singleton
let redisClient = null;

// Fallback in-memory storage with Map for better performance
const inMemoryStore = new Map();

/**
 * Connect to Redis server with optimized configuration
 */
export const connectToRedis = async () => {
  // Check if Redis is enabled in environment
  const redisEnabled = process.env.REDIS_ENABLED === 'true';
  
  if (!redisEnabled) {
    logger.info('Redis is disabled. Using in-memory storage for caching.');
    return null;
  }
  
  try {
    const redisHost = process.env.REDIS_HOST || '127.0.0.1';
    const redisPort = process.env.REDIS_PORT || 6379;
    const redisPassword = process.env.REDIS_PASSWORD || '';
    const redisUsername = process.env.REDIS_USERNAME || '';
    
    // Create Redis client with optimized configuration
    redisClient = createClient({
      url: `redis://${redisHost}:${redisPort}`,
      username: redisUsername || undefined,
      password: redisPassword || undefined,
      socket: {
        reconnectStrategy: (retries) => {
          // Exponential backoff with max delay of 10 seconds
          const delay = Math.min(Math.pow(2, retries) * 100, 10000);
          logger.info(`Redis reconnecting in ${delay}ms...`);
          return delay;
        },
        connectTimeout: 10000, // 10 seconds connection timeout
        keepAlive: 5000, // 5 seconds keep-alive
      }
    });
    
    // Set up event handlers
    redisClient.on('error', (err) => {
      logger.error(`Redis error: ${err.message}`);
    });
    
    redisClient.on('reconnecting', () => {
      logger.warn('Redis reconnecting...');
    });
    
    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });
    
    // Connect to Redis
    await redisClient.connect();
    logger.info('Redis connected successfully');
    
    return redisClient;
  } catch (error) {
    logger.error(`Error connecting to Redis: ${error.message}`);
    logger.info('Falling back to in-memory storage');
    return null;
  }
};

/**
 * Get Redis client instance
 * @returns {Object|null} Redis client or null if not connected
 */
export const getRedisClient = () => {
  return redisClient;
};

/**
 * Check if Redis is connected and ready
 * @returns {boolean} True if Redis is connected and ready
 */
export const isRedisReady = () => {
  return !!(redisClient && redisClient.isReady);
};

/**
 * Store OTP in Redis or in-memory fallback
 * @param {string} key - The key to store the OTP under (usually email or phone)
 * @param {string} otp - The OTP to store
 * @param {number} expiryInMinutes - OTP expiry time in minutes
 * @returns {Promise<boolean>} Success status
 */
export const storeOTP = async (key, otp, expiryInMinutes = 10) => {
  if (!key || !otp) {
    logger.error('Invalid key or OTP provided');
    return false;
  }

  try {
    const redisEnabled = process.env.REDIS_ENABLED === 'true';
    const expiryInSeconds = expiryInMinutes * 60;
    const otpKey = `otp:${key}`;
    
    if (redisEnabled && isRedisReady()) {
      // Store in Redis with expiry
      await redisClient.setEx(otpKey, expiryInSeconds, otp);
      logger.debug(`OTP stored in Redis for ${key}`);
    } else {
      // Store in memory with expiry using Map
      const expiresAt = Date.now() + (expiryInSeconds * 1000);
      inMemoryStore.set(key, { otp, expiresAt });
      logger.debug(`OTP stored in memory for ${key}`);
      
      // Set up automatic cleanup after expiry
      setTimeout(() => {
        const storedData = inMemoryStore.get(key);
        if (storedData && storedData.expiresAt <= Date.now()) {
          inMemoryStore.delete(key);
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
  if (!key || !otp) {
    return { valid: false, reason: 'INVALID_PARAMETERS' };
  }

  try {
    const redisEnabled = process.env.REDIS_ENABLED === 'true';
    const otpKey = `otp:${key}`;
    
    if (redisEnabled && isRedisReady()) {
      // Get from Redis
      const storedOTP = await redisClient.get(otpKey);
      
      if (!storedOTP) {
        return { valid: false, reason: 'EXPIRED_OTP' };
      }
        
      if (storedOTP === otp) {
        // Delete OTP after successful verification
        await redisClient.del(otpKey);
        return { valid: true };
      }
    } else {
      // Get from memory
      const otpData = inMemoryStore.get(key);
      
      if (!otpData) {
        return { valid: false, reason: 'EXPIRED_OTP' };
      }
      
      if (otpData.expiresAt < Date.now()) {
        // Delete expired OTP
        inMemoryStore.delete(key);
        return { valid: false, reason: 'EXPIRED_OTP' };
      }
      
      if (otpData.otp === otp) {
        // Delete OTP after successful verification
        inMemoryStore.delete(key);
        return { valid: true };
      }
    }
    
    return { valid: false, reason: 'INVALID_OTP' };
  } catch (error) {
    logger.error(`Error verifying OTP: ${error.message}`);
    return { valid: false, reason: 'SERVER_ERROR' };
  }
};

/**
 * Store a key-value pair in Redis or in-memory cache
 * @param {string} key - The key to store the value under
 * @param {string|Object} value - The value to store
 * @param {number} expiryInSeconds - Expiry time in seconds
 * @returns {Promise<boolean>} Success status
 */
export const cacheSet = async (key, value, expiryInSeconds = 3600) => {
  if (!key) {
    logger.error('Invalid key provided for caching');
    return false;
  }

  try {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    if (isRedisReady()) {
      await redisClient.setEx(key, expiryInSeconds, stringValue);
      logger.debug(`Cached value for key: ${key}`);
    } else {
      const expiresAt = Date.now() + (expiryInSeconds * 1000);
      inMemoryStore.set(key, { value: stringValue, expiresAt });
      
      // Set up automatic cleanup after expiry
      setTimeout(() => {
        const storedData = inMemoryStore.get(key);
        if (storedData && storedData.expiresAt <= Date.now()) {
          inMemoryStore.delete(key);
          logger.debug(`Expired cache removed for key: ${key}`);
        }
      }, expiryInSeconds * 1000);
    }
    
    return true;
  } catch (error) {
    logger.error(`Error caching value: ${error.message}`);
    return false;
  }
};

/**
 * Get a value from Redis or in-memory cache
 * @param {string} key - The key to retrieve
 * @param {boolean} parseJson - Whether to parse the value as JSON
 * @returns {Promise<any>} The retrieved value or null
 */
export const cacheGet = async (key, parseJson = false) => {
  if (!key) {
    return null;
  }

  try {
    let value = null;
    
    if (isRedisReady()) {
      value = await redisClient.get(key);
    } else {
      const storedData = inMemoryStore.get(key);
      
      if (storedData) {
        if (storedData.expiresAt < Date.now()) {
          inMemoryStore.delete(key);
          return null;
        }
        value = storedData.value;
      }
    }
    
    if (!value) {
      return null;
    }
    
    return parseJson ? JSON.parse(value) : value;
  } catch (error) {
    logger.error(`Error retrieving cached value: ${error.message}`);
    return null;
  }
};

/**
 * Delete a key from Redis or in-memory cache
 * @param {string} key - The key to delete
 * @returns {Promise<boolean>} Success status
 */
export const cacheDelete = async (key) => {
  if (!key) {
    return false;
  }

  try {
    if (isRedisReady()) {
      await redisClient.del(key);
    } else {
      inMemoryStore.delete(key);
    }
    
    return true;
  } catch (error) {
    logger.error(`Error deleting cached value: ${error.message}`);
    return false;
  }
};

/**
 * Close Redis connection gracefully
 */
export const closeRedisConnection = async () => {
  if (redisClient && redisClient.isReady) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed gracefully');
    } catch (error) {
      logger.error(`Error closing Redis connection: ${error.message}`);
    }
  }
};

export default {
  connectToRedis,
  getRedisClient,
  isRedisReady,
  storeOTP,
  verifyOTP,
  cacheSet,
  cacheGet,
  cacheDelete,
  closeRedisConnection
};