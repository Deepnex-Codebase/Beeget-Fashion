import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import {
  getWishlist,
  addToWishlist,
  removeWishlistItem,
  clearWishlist,
  checkWishlistItem
} from '../controllers/wishlist.controller.js';

const router = express.Router();

// All wishlist routes require authentication
router.use(verifyToken);

// Wishlist routes
router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/:itemId', removeWishlistItem);
router.delete('/', clearWishlist);
router.get('/check/:productId', checkWishlistItem);

export default router;