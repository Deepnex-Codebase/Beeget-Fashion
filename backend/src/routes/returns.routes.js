import express from 'express';
import { verifyToken, isAdmin, isSubAdmin, isOwnerOrAdmin } from '../middlewares/auth.middleware.js';
import {
  createReturn,
  getUserReturns,
  getReturnById,
  updateReturnStatus,
  processRefund
} from '../controllers/returns.controller.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// User routes - require authentication
router.post('/', createReturn);
router.get('/user', getUserReturns);
router.get('/:id', isOwnerOrAdmin, getReturnById);

// Admin/SubAdmin only routes
router.patch('/:id/status', isSubAdmin, updateReturnStatus);
router.post('/:id/refund', isAdmin, processRefund);

export default router;