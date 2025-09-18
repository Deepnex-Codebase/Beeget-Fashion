import app from './app.js'; 
import { logger } from './utils/logger.js';
import mongoose from 'mongoose';
import { connectToMongoDB } from './config/database.js';
import { connectToRedis } from './config/redis.js';

// Environment variables with defaults
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'production';
const HOST = process.env.HOST || '0.0.0.0';

// Database connections
async function initializeServices() {
  try {
    // Connect to MongoDB
    await connectToMongoDB();
    logger.info('MongoDB connection established');
    
    // Connect to Redis (if available)
    try {
      await connectToRedis();
      logger.info('Redis connection established');
    } catch (redisError) {
      logger.warn(`Redis connection failed: ${redisError.message}`);
      logger.warn('Continuing without Redis cache');
    }
    
    return true;
  } catch (error) {
    logger.error(`Failed to initialize services: ${error.message}`);
    return false;
  }
}

// Initialize and start server
initializeServices().then(success => {
  if (!success) {
    logger.error('Failed to initialize required services. Exiting...');
    process.exit(1);
  }
  
  // Start the server
  const server = app.listen(PORT, HOST, () => {
    logger.info(`Server running in ${NODE_ENV} mode at http://${HOST}:${PORT}`);
    logger.info(`Health check available at http://${HOST}:${PORT}/health`);
  });

  // Setup graceful shutdown
  const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    
    // Set a timeout for forceful exit
    const forceExit = setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 15000); // 15 seconds
    
    try {
      // Close server first
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            logger.warn(`Error closing HTTP server: ${err.message}`);
            reject(err);
          } else {
            logger.info('HTTP server closed');
            resolve();
          }
        });
      });
      
      // Close Redis connection
      const { closeRedisConnection } = await import('./config/redis.js');
      await closeRedisConnection();
      
      // Close MongoDB connection
      await mongoose.connection.close(false);
      logger.info('MongoDB connection closed');
      
      // Clear timeout and exit gracefully
      clearTimeout(forceExit);
      logger.info('All connections closed successfully');
      process.exit(0);
    } catch (err) {
      logger.error(`Error during graceful shutdown: ${err.message}`);
      clearTimeout(forceExit);
      process.exit(1);
    }
  };
  
  // Handle various signals for graceful shutdown
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! 💥');
    logger.error(err);
    gracefulShutdown('uncaughtException');
  });
  
  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! 💥');
    logger.error(err);
    gracefulShutdown('unhandledRejection');
  });
});