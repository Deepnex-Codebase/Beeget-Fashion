import express from 'express';
import { verifyToken, isAdmin, isSubAdmin } from '../middlewares/auth.middleware.js';
import {
  createPromotion,
  getPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  generateCoupons,
  verifyCoupon
} from '../controllers/promotion.controller.js';

const router = express.Router();

// Public routes - no authentication required
router.post('/verify-coupon', verifyCoupon);

// Protected routes - require authentication
router.use(verifyToken);

// Admin only routes
router.post('/', isAdmin, createPromotion);
router.get('/', isSubAdmin, getPromotions);
router.get('/:id', isSubAdmin, getPromotionById);
router.put('/:id', isAdmin, updatePromotion);
router.delete('/:id', isAdmin, deletePromotion);
router.post('/generate-coupons', isAdmin, generateCoupons);

export default router;