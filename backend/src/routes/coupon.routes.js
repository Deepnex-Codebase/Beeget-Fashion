import express from 'express';
import { verifyToken, isAdmin, isSubAdmin, isAdminOrSubAdmin } from '../middlewares/auth.middleware.js';
import {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon
} from '../controllers/coupon.controller.js';

const router = express.Router();

// Public routes
router.post('/validate', validateCoupon);

// Protected routes - require authentication
router.use(verifyToken);

// Admin/SubAdmin routes
router.post('/', isAdminOrSubAdmin, createCoupon);
router.get('/', isAdminOrSubAdmin, getCoupons);
router.get('/:id', isAdminOrSubAdmin, getCouponById);
router.put('/:id', isAdminOrSubAdmin, updateCoupon);
router.delete('/:id', isAdminOrSubAdmin, deleteCoupon);

export default router;