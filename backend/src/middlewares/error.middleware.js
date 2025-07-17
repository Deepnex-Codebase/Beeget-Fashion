import { logger } from '../utils/logger.js';

/**
 * Global error handler middleware
 * Processes all errors and sends appropriate response
 */
export const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`${err.name}: ${err.message}`, { 
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Default error values
  let statusCode = 500;
  let errorCode = 'SERVER_ERROR';
  let errorMessage = 'An unexpected error occurred';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'INVALID_INPUT';
    errorMessage = err.message;
  } else if (err.name === 'MongoServerError' && err.code === 11000) {
    statusCode = 400;
    errorCode = 'DUPLICATE_KEY';
    errorMessage = 'A record with this information already exists';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    errorMessage = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    errorMessage = 'Token has expired';
  } else if (err.statusCode && err.errorCode) {
    // Handle custom application errors
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    errorMessage = err.message;
  }

  // Send error response
  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: errorMessage
    }
  });
};

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(message, errorCode, statusCode) {
    super(message);
    this.name = 'AppError';
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}