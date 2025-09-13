import express from 'express';
import { verifyToken, isAdmin, isSubAdmin, isAdminOrSubAdmin } from '../middlewares/auth.middleware.js';
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} from '../controllers/category.controller.js';
import { productUpload } from '../config/multer.js';

const router = express.Router();

// Get all categories - public route
router.get('/', getCategories);

// Get category by ID - public route
router.get('/:id', getCategoryById);

// Protected routes - Admin/SubAdmin only
// Create category
router.post(
  '/',
  verifyToken,
  isAdminOrSubAdmin,
  productUpload.single('image'),
  createCategory
);

// Update category
router.put(
  '/:id',
  verifyToken,
  isAdminOrSubAdmin,
  productUpload.single('image'),
  updateCategory
);

// Delete category
router.delete(
  '/:id',
  verifyToken,
  isAdminOrSubAdmin,
  deleteCategory
);

export default router;