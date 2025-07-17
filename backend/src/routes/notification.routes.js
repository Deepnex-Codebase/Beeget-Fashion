import express from 'express';
import {
  createNotification,
  getNotifications,
  getNotificationById,
  deleteNotification,
  markNotificationAsRead,
  getUserNotifications,
  getUnreadCount
} from '../controllers/notification.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

// Admin routes (require admin role)
router.post('/', verifyToken, authorize('admin'), createNotification);
router.get('/', verifyToken, authorize('admin'), getNotifications);
router.get('/:id', verifyToken, authorize('admin'), getNotificationById);
router.delete('/:id', verifyToken, authorize('admin'), deleteNotification);

// User routes
router.get('/user/notifications', verifyToken, getUserNotifications);
router.get('/user/unread-count', verifyToken, getUnreadCount);
router.patch('/:id/read', verifyToken, markNotificationAsRead);

export default router;