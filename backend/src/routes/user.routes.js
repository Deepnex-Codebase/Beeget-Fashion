import express from 'express';
import { verifyToken, isAdmin, isAdminOrSubAdmin } from '../middlewares/auth.middleware.js';
import {
  getUsers,
  getUserById,
  updateUserRole,
  banUser,
  unbanUser,
  deleteUser,
  updateUser,
  registerSubadmin,
  updateSubadminDepartment,
  createTempUser
} from '../controllers/user.controller.js';
import { testEmailConfiguration } from '../services/email.service.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// All routes require authentication and admin/subadmin privileges
router.use(verifyToken, isAdminOrSubAdmin);

// User management routes
router.get('/', getUsers);
router.get('/:userId', getUserById);
router.put('/:userId/role', updateUserRole);

// New routes for user management
router.put('/:userId', updateUser);
router.delete('/:userId', deleteUser);
router.put('/:userId/ban', banUser);
router.put('/:userId/unban', unbanUser);

// Subadmin management
router.post('/register-subadmin', registerSubadmin);
// Admin can update subadmin's department and permissions
router.patch('/subadmin/:userId/department', updateSubadminDepartment);

// Create temporary user for reviews
router.post('/temp', createTempUser);

// Test email configuration
router.get('/test-email', async (req, res) => {
  try {
    logger.info('Testing email configuration...');
    const result = await testEmailConfiguration();
    
    if (result.success) {
      logger.info('Email test successful');
      return res.status(200).json({
        success: true,
        message: 'Email test successful',
        data: result
      });
    } else {
      logger.error(`Email test failed: ${result.error}`);
      return res.status(500).json({
        success: false,
        message: 'Email test failed',
        error: result.error
      });
    }
  } catch (error) {
    logger.error(`Error testing email configuration: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error testing email configuration',
      error: error.message
    });
  }
});

export default router;