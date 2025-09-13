import express from 'express';
import { verifyToken, isAdmin, isSubAdmin, isAdminOrSubAdmin } from '../middlewares/auth.middleware.js';
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

// Admin/SubAdmin routes
router.post('/', isAdminOrSubAdmin, createPromotion);
router.get('/', isAdminOrSubAdmin, getPromotions);
router.get('/:id', isAdminOrSubAdmin, getPromotionById);
router.put('/:id', isAdminOrSubAdmin, updatePromotion);
router.delete('/:id', isAdminOrSubAdmin, deletePromotion);
router.post('/generate-coupons', isAdminOrSubAdmin, generateCoupons);

export default router;