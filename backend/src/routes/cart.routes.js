import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  getGuestCart,
  addToGuestCart,
  updateGuestCartItem,
  removeGuestCartItem,
  clearGuestCart,
  applyCoupon,
  applyGuestCoupon,
  removeCoupon,
  removeGuestCoupon
} from '../controllers/cart.controller.js';

const router = express.Router();

// Guest cart routes (no authentication required)
router.get('/guest/:guestSessionId', getGuestCart);
router.post('/guest/:guestSessionId', addToGuestCart);
router.patch('/guest/:guestSessionId/:itemId', updateGuestCartItem);
router.delete('/guest/:guestSessionId/:itemId', removeGuestCartItem);
router.delete('/guest/:guestSessionId', clearGuestCart);
router.post('/guest/:guestSessionId/apply-coupon', applyGuestCoupon);
router.post('/guest/:guestSessionId/remove-coupon', removeGuestCoupon);

// All authenticated cart routes require authentication
router.use(verifyToken);

// Authenticated cart routes
router.get('/', getCart);
router.post('/', addToCart);
router.patch('/:itemId', updateCartItem);
router.delete('/:itemId', removeCartItem);
router.delete('/', clearCart);
router.post('/apply-coupon', applyCoupon);
router.post('/remove-coupon', removeCoupon);

export default router;