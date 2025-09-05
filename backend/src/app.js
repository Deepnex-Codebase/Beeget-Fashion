import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import path from 'path';

// Import middleware
import { errorHandler } from './middlewares/error.middleware.js';
import { logger } from './utils/logger.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import userRoutes from './routes/user.routes.js';
import cartRoutes from './routes/cart.routes.js';
import categoryRoutes from './routes/category.routes.js';
import collectionRoutes from './routes/collection.routes.js';
import promotionRoutes from './routes/promotion.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import returnsRoutes from './routes/returns.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import reviewRoutes from './routes/review.routes.js';
import cmsRoutes from './routes/cms.routes.js';
import siteContentRoutes from './routes/site-content.routes.js';
import guestVerificationRoutes from './routes/guest-verification.routes.js';
import shippingRoutes from './routes/shipping.routes.js';
import shiprocketRoutes from './routes/shiprocket.routes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// MongoDB connection is handled in server.js

// Apply security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? process.env.ALLOWED_ORIGINS?.split(',') || true : true,
  exposedHeaders: ['Authorization'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Pre-flight OPTIONS response

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit for development
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: { 
      code: 'RATE_LIMIT_EXCEEDED', 
      message: 'Too many requests, please try again later.' 
    }
  }
});

// Apply rate limiter to sensitive routes
app.use('/api/auth', apiLimiter);
app.use('/api/users', apiLimiter);

// Configure static file serving with security headers
const staticFileMiddleware = (req, res, next) => {
  // Set security headers for static files
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  // Add cache control for better performance
  res.header('Cache-Control', 'public, max-age=86400'); // 24 hours
  next();
};

// Serve static files from uploads directory
app.use('/uploads', staticFileMiddleware, express.static(
  path.join(process.cwd(), 'uploads'),
));

// Custom handler for missing files in uploads directory
app.use('/uploads/*', (req, res) => {
  // Instead of throwing an error, return a default image or a 404 response
  res.status(404).json({
    error: {
      code: 'RESOURCE_NOT_FOUND',
      message: 'The requested resource could not be found'
    }
  });
});

// API routes configuration
const apiRoutes = [
  { path: '/api/auth', router: authRoutes },
  { path: '/api/products', router: productRoutes },
  { path: '/api/orders', router: orderRoutes },
  { path: '/api/coupons', router: couponRoutes },
  { path: '/api/users', router: userRoutes },
  { path: '/api/cart', router: cartRoutes },
  { path: '/api/categories', router: categoryRoutes },
  { path: '/api/collections', router: collectionRoutes },
  { path: '/api/promotions', router: promotionRoutes },
  { path: '/api/notifications', router: notificationRoutes },
  { path: '/api/returns', router: returnsRoutes },
  { path: '/api/wishlist', router: wishlistRoutes },
  { path: '/api/reviews', router: reviewRoutes },
  { path: '/api/cms', router: cmsRoutes },
  { path: '/api/site-content', router: siteContentRoutes },
  { path: '/api/guest-verification', router: guestVerificationRoutes },
  { path: '/api/shipping', router: shippingRoutes },
  { path: '/api/shiprocket', router: shiprocketRoutes }
];

// Register all API routes
apiRoutes.forEach(route => {
  app.use(route.path, route.router);
  logger.info(`Registered route: ${route.path}`);
});

// API status and health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'operational',
    apiVersion: '1.0',
    timestamp: new Date().toISOString()
  });
});

// Handle 404 routes - must be before error handler
app.use((req, res, next) => {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'NOT_FOUND';
  next(error); // Forward to error handler
});

// Global error handling middleware
app.use(errorHandler);

// Graceful shutdown handling is in server.js

export default app;