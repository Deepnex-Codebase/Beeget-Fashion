import express from 'express';
import { verifyToken, isAdmin, isSubAdmin } from '../middlewares/auth.middleware.js';
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

// Admin only routes
router.post('/', isAdmin, createCoupon);
router.get('/', isSubAdmin, getCoupons);
router.get('/:id', isSubAdmin, getCouponById);
router.put('/:id', isAdmin, updateCoupon);
router.delete('/:id', isAdmin, deleteCoupon);

export default router;