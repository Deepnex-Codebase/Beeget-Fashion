import express from 'express';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';
import {
  getUsers,
  getUserById,
  updateUserRole,
  banUser,
  unbanUser,
  deleteUser,
  updateUser,
  registerSubadmin
} from '../controllers/user.controller.js';

const router = express.Router();

// All routes require authentication and admin privileges
router.use(verifyToken, isAdmin);

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

export default router;