import { AppError } from './error.middleware.js';

/**
 * Middleware to check if user is an admin
 * Must be used after verifyToken middleware
 */
export const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.roles || !req.user.roles.includes('admin')) {
    return next(new AppError('Admin access required', 'FORBIDDEN', 403));
  }
  next();
};

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

/**
 * Middleware to check if subadmin has required department and permission
 * @param {string} department - Department required
 * @param {string|string[]} permissions - Permission(s) required
 * @returns {function} Express middleware function
 */
export const hasDepartmentPermission = (department, permissions) => {
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
  return (req, res, next) => {
    // Debug log to see what's in the request user object
    console.log('DEBUG - User object in hasDepartmentPermission:', JSON.stringify({
      id: req.user?.id,
      roles: req.user?.roles,
      department: req.user?.department,
      permissions: req.user?.permissions
    }, null, 2));
    console.log('DEBUG - Required department:', department);
    console.log('DEBUG - Required permissions:', requiredPermissions);
    
    // Only allow subadmin (or admin, who bypasses this check)
    if (!req.user || !req.user.roles) {
      return next(new AppError('Authentication required', 'UNAUTHORIZED', 401));
    }
    if (req.user.roles.includes('admin')) {
      console.log('DEBUG - User is admin, bypassing checks');
      return next(); // Admin bypasses department/permission check
    }
    if (!req.user.roles.includes('subadmin')) {
      return next(new AppError('Subadmin access required', 'FORBIDDEN', 403));
    }
    
    // Make sure department is set
    if (!req.user.department) {
      req.user.department = 'all';
      console.log('DEBUG - Set default department because it was undefined or empty');
    }
    
    // Check department - allow if department matches or if user has 'all' department
    const departmentMatch = req.user.department === department || req.user.department === 'all';
    console.log('DEBUG - User department:', req.user.department);
    console.log('DEBUG - Required department:', department);
    console.log('DEBUG - Department match:', departmentMatch);
    
    if (!departmentMatch) {
      return next(new AppError(`Access denied. Department: ${department} required`, 'FORBIDDEN', 403));
    }
    
    // Check at least one required permission or if user has 'all_permissions'
    // Make sure permissions is an array
    if (!req.user.permissions) {
      req.user.permissions = [];
      console.log('DEBUG - Set empty permissions array because it was undefined');
    } else if (!Array.isArray(req.user.permissions)) {
      req.user.permissions = [];
      console.log('DEBUG - Set empty permissions array because it was not an array');
    }
      

    
    const hasAllPermissions = req.user.permissions.includes('all_permissions');
    const hasSpecificPermission = requiredPermissions.some(p => req.user.permissions.includes(p));
    const hasPermission = hasAllPermissions || hasSpecificPermission;
    
    console.log('DEBUG - User permissions:', req.user.permissions);
    console.log('DEBUG - Has all permissions:', hasAllPermissions);
    console.log('DEBUG - Has specific permission:', hasSpecificPermission);
    console.log('DEBUG - Overall permission check:', hasPermission);
    
    if (!hasPermission) {
      return next(new AppError(`Access denied. Permission(s): ${requiredPermissions.join(', ')} required`, 'FORBIDDEN', 403));
    }
    
    console.log('DEBUG - All checks passed, proceeding to next middleware');
    next();
  };
};