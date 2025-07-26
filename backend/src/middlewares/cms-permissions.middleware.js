import { AppError } from './error.middleware.js';

/**
 * Middleware to check if user has Editor role or higher
 * Must be used after verifyToken middleware
 */
export const isEditor = (req, res, next) => {
  if (!req.user || !req.user.roles) {
    return next(new AppError('Authentication required', 'UNAUTHORIZED', 401));
  }
  
  if (!Array.isArray(req.user.roles)) {
    return next(new AppError('Invalid user roles', 'FORBIDDEN', 403));
  }
  
  // Check if user has admin or editor role
  if (!req.user.roles.includes('admin') && !req.user.roles.includes('editor')) {
    return next(new AppError('Editor access required', 'FORBIDDEN', 403));
  }
  
  next();
};

/**
 * Middleware to check if user has Viewer role or higher
 * Must be used after verifyToken middleware
 */
export const isViewer = (req, res, next) => {
  if (!req.user || !req.user.roles) {
    return next(new AppError('Authentication required', 'UNAUTHORIZED', 401));
  }
  
  if (!Array.isArray(req.user.roles)) {
    return next(new AppError('Invalid user roles', 'FORBIDDEN', 403));
  }
  
  // Check if user has admin, editor, or viewer role
  if (
    !req.user.roles.includes('admin') && 
    !req.user.roles.includes('editor') && 
    !req.user.roles.includes('viewer')
  ) {
    return next(new AppError('Viewer access required', 'FORBIDDEN', 403));
  }
  
  next();
};

/**
 * Middleware to prevent deletion for non-admin users
 * Must be used after verifyToken middleware
 */
export const preventDeletion = (req, res, next) => {
  if (req.method === 'DELETE' && !req.user.roles.includes('admin')) {
    return next(new AppError('Admin access required for deletion', 'FORBIDDEN', 403));
  }
  
  next();
};