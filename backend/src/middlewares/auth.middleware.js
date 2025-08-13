import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware.js';

/**
 * Middleware to verify JWT token
 * Extracts and verifies the JWT from the Authorization header
 */
export const verifyToken = (req, res, next) => {
  try {
    // Get the token from the Authorization header or cookies
    let token;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Check for token in cookies
      token = req.cookies.token;
    }
    
    if (!token) {
      throw new AppError('Access token is required', 'UNAUTHORIZED', 401);
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Set user data in request with proper defaults for subadmin
    const isSubadmin = decoded.roles && decoded.roles.includes('subadmin');
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      roles: decoded.roles || [],
      department: decoded.department || (isSubadmin ? 'all' : undefined),
      permissions: decoded.permissions || []
    };
    
    // Ensure permissions is always an array
    if (!Array.isArray(req.user.permissions)) {
      req.user.permissions = [];
    }
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AppError('Invalid token', 'UNAUTHORIZED', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('Token has expired', 'TOKEN_EXPIRED', 401));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware to check if user has admin role
 * Must be used after verifyToken middleware
 */
export const isAdmin = (req, res, next) => {
  // Check user exists
  if (!req.user) {
    return next(new AppError('Authentication required', 'UNAUTHORIZED', 401));
  }
  
  // Check roles exists
  if (!req.user.roles || !Array.isArray(req.user.roles)) {
    return next(new AppError('Invalid user roles', 'FORBIDDEN', 403));
  }
  
  // Check admin role
  if (!req.user.roles.includes('admin')) {
    return next(new AppError('Admin access required', 'FORBIDDEN', 403));
  }
  next();
};
/**
 * Middleware to check if user has subadmin role
 * Must be used after verifyToken middleware
 */
export const isSubAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 'UNAUTHORIZED', 401));
  }
  
  if (!req.user.roles || !Array.isArray(req.user.roles)) {
    console.log('DEBUG - Invalid user roles in isSubAdmin:', req.user.roles);
    return next(new AppError('Invalid user roles', 'FORBIDDEN', 403));
  }
  
  if (!(req.user.roles.includes('admin') || req.user.roles.includes('subadmin'))) {
    console.log('DEBUG - User does not have admin or subadmin role:', req.user.roles);
    return next(new AppError('Sub-admin access required', 'FORBIDDEN', 403));
  }
  
  console.log('DEBUG - Sub-admin access granted for user:', req.user.email);
  next();
};

/**
 * Middleware to check if user is accessing their own resource
 * or has admin privileges
 * Must be used after verifyToken middleware
 */
export const isOwnerOrAdmin = (req, res, next) => {
  const resourceUserId = req.params.userId || req.body.userId;
  
  if (
    !req.user || 
    (req.user.id !== resourceUserId && !req.user.roles.includes('admin'))
  ) {
    return next(new AppError('You do not have permission to access this resource', 'FORBIDDEN', 403));
  }
  
  next();
};