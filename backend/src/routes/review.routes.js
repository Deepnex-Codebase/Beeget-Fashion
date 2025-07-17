import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  getUserReviews
} from '../controllers/review.controller.js';
import { reviewUpload } from '../config/multer.js';

const router = express.Router();

// Public routes
router.get('/product/:productId', getProductReviews);

// Protected routes - require authentication
router.use(verifyToken);
// Apply verifyToken middleware first, then multer middleware
router.post('/', reviewUpload.array('images', 5), createReview);
router.put('/:id', reviewUpload.array('images', 5), updateReview);
router.delete('/:id', deleteReview);
router.get('/user', getUserReviews);

export default router;