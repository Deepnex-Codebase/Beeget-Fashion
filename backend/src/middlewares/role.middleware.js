import { AppError } from './error.middleware.js';

/**
 * Middleware to authorize users based on roles
 * Must be used after authenticate middleware
 * @param {string|string[]} roles - Role or array of roles allowed to access the route
 * @returns {function} Express middleware function
 */
export const authorize = (roles) => {
  // Convert single role to array
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    // Check if user exists and has roles property
    if (!req.user || !req.user.roles) {
      return next(new AppError('Authentication required', 'UNAUTHORIZED', 401));
    }
    
    // Check if user has at least one of the required roles
    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    
    if (!hasRole) {
      return next(new AppError(`Access denied. Required role: ${allowedRoles.join(' or ')}`, 'FORBIDDEN', 403));
    }
    
    next();
  };
};