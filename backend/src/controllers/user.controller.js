import User from '../models/user.model.js';
import { AppError } from '../middlewares/error.middleware.js';
import { logger } from '../utils/logger.js';

/**
 * Get all users with pagination, search, and filters
 * Admin only endpoint
 */
export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', verification = '', startDate = '', endDate = '', role = '' } = req.query;
    
    // Build query
    const query = {};
    
    // Add role filter if provided
    if (role) {
      query.roles = role;
    }
    
    // Add verification filter if provided
    if (verification) {
      query.isVerified = verification === 'verified';
    }
    
    // Add date range filter if provided
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.createdAt = { $lte: new Date(endDate) };
    }
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { whatsappNumber: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Execute query with pagination
    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limitNum);
    
    // Format response
    const formattedUsers = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      whatsapp: user.whatsappNumber,
      isVerified: user.isVerified,
      isBanned: user.isBanned,
      banReason: user.banReason,
      role: user.roles[0], // For simplicity in the frontend
      roles: user.roles,
      department: user.department,
      permissions: user.permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    
    // Return response
    res.status(200).json({
      success: true,
      data: formattedUsers,
      pagination: {
        total: totalUsers,
        pages: totalPages,
        page: pageNum,
        limit: limitNum
      }
    });
  } catch (error) {
    logger.error(`Error in getUsers: ${error.message}`);
    next(error);
  }
};

/**
 * Get user by ID
 * Admin only endpoint
 */
export const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Find user
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Return user data
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error(`Error in getUserById: ${error.message}`);
    next(error);
  }
};

/**
 * Update user role
 * Admin only endpoint
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    // Validate role
    if (!role) {
      throw new AppError('Role is required', 400);
    }
    
    // Check if role is valid
    const validRoles = ['user', 'admin', 'subadmin'];
    if (!validRoles.includes(role)) {
      throw new AppError('Invalid role', 400);
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Update role
    user.roles = [role];
    await user.save();
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: {
        userId: user._id,
        roles: user.roles
      }
    });
  } catch (error) {
    logger.error(`Error in updateUserRole: ${error.message}`);
    next(error);
  }
};

/**
 * Ban a user
 * Admin only endpoint
 */
export const banUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Check if user is admin
    if (user.roles.includes('admin')) {
      throw new AppError('Cannot ban an admin user', 403);
    }
    
    // Ban user
    user.isBanned = true;
    user.banReason = reason || '';
    await user.save();
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'User banned successfully',
      data: {
        userId: user._id,
        isBanned: user.isBanned,
        banReason: user.banReason
      }
    });
  } catch (error) {
    logger.error(`Error in banUser: ${error.message}`);
    next(error);
  }
};

/**
 * Unban a user
 * Admin only endpoint
 */
export const unbanUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Unban user
    user.isBanned = false;
    user.banReason = '';
    await user.save();
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'User unbanned successfully',
      data: {
        userId: user._id,
        isBanned: user.isBanned
      }
    });
  } catch (error) {
    logger.error(`Error in unbanUser: ${error.message}`);
    next(error);
  }
};

/**
 * Delete a user
 * Admin only endpoint
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Check if user is admin
    if (user.roles.includes('admin')) {
      throw new AppError('Cannot delete an admin user', 403);
    }
    
    // Delete user
    await User.findByIdAndDelete(userId);
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error(`Error in deleteUser: ${error.message}`);
    next(error);
  }
};

/**
 * Update a user
 * Admin only endpoint
 */
export const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { name, email, role } = req.body;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) {
      // Validate role
      const validRoles = ['user', 'admin', 'subadmin'];
      if (!validRoles.includes(role)) {
        throw new AppError('Invalid role', 400);
      }
      user.roles = [role];
    }
    
    await user.save();
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        isVerified: user.isVerified,
        isBanned: user.isBanned,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    logger.error(`Error in updateUser: ${error.message}`);
    next(error);
  }
};

/**
 * Register a new subadmin
 * Admin only endpoint
 */
export const registerSubadmin = async (req, res, next) => {
  try {
    const { name, email, password, department, permissions } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required', 400);
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }
    
    // Create new user with subadmin role
    const newUser = new User({
      name,
      email,
      passwordHash: password, // Will be hashed by pre-save hook
      roles: ['subadmin'],
      isVerified: true, // Auto-verify subadmins
      department: department || '',
      permissions: permissions || []
    });
    
    // Save user
    await newUser.save();
    
    // Import the email service
    const { sendSubadminWelcomeEmail } = await import('../services/email.service.js');
    
    // Send welcome email to the new subadmin
    await sendSubadminWelcomeEmail(
      email,
      name,
      password, // Send the original password before it's hashed
      department,
      permissions
    );
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'Subadmin registered successfully',
      data: {
        userId: newUser._id,
        name: newUser.name,
        email: newUser.email,
        roles: newUser.roles,
        department: newUser.department,
        permissions: newUser.permissions
      }
    });
  } catch (error) {
    logger.error(`Error in registerSubadmin: ${error.message}`);
    next(error);
  }
};