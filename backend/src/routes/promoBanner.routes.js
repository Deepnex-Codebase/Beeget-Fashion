import express from 'express';
import promoBannerController from '../controllers/promoBanner.controller.js';
import { verifyToken, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public route - get active banner
router.get('/active', promoBannerController.getActiveBanner);

// Admin routes - protected
router.use(verifyToken);
router.use(restrictTo('admin'));

router
  .route('/')
  .get(promoBannerController.getAllBanners)
  .post(promoBannerController.createBanner);

router
  .route('/:id')
  .get(promoBannerController.getBanner)
  .patch(promoBannerController.updateBanner)
  .delete(promoBannerController.deleteBanner);

router.patch('/:id/activate', promoBannerController.activateBanner);

export default router;