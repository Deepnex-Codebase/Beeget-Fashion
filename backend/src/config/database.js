import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

/**
 * Connect to MongoDB
 */
export const connectToMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    console.log(mongoURI)
    if (!mongoURI) {
      logger.error('MongoDB URI is not defined in environment variables');
      process.exit(1);
    }

    logger.info(`Attempting to connect to MongoDB with URI: ${mongoURI.substring(0, 20)}...`);
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    // Connect to MongoDB
    const connection = await mongoose.connect(mongoURI, options);
    
    logger.info(`MongoDB connected: ${connection.connection.host}`);
    logger.info(`MongoDB database name: ${connection.connection.name}`);
    logger.info(`MongoDB connection state: ${mongoose.connection.readyState}`);

    // Handle MongoDB connection errors
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });

    return connection;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    logger.error(`Full error: ${JSON.stringify(error)}`);
    process.exit(1);
  }
};

export default { connectToMongoDB };