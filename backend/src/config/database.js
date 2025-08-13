import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

/**
 * Connect to MongoDB with optimized configuration
 */
export const connectToMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    // Mask sensitive information in logs
    const maskedURI = mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    logger.info(`Attempting to connect to MongoDB: ${maskedURI}`);
    
    // Optimized MongoDB connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout for server selection
      socketTimeoutMS: 45000, // 45 seconds timeout for socket operations
      maxPoolSize: 50, // Maximum number of connections in the connection pool
      minPoolSize: 10, // Minimum number of connections in the connection pool
      heartbeatFrequencyMS: 10000, // 10 seconds heartbeat frequency
    };

    // Connect to MongoDB
    const connection = await mongoose.connect(mongoURI, options);
    
    logger.info(`MongoDB connected: ${connection.connection.host}`);
    logger.info(`MongoDB database name: ${connection.connection.name}`);

    // Set up MongoDB connection event handlers
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
    });

    return connection;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    logger.error(`Full error: ${JSON.stringify(error)}`);
    process.exit(1);
  }
};

export default { connectToMongoDB };