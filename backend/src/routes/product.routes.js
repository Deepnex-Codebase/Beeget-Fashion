import express from 'express';
import { verifyToken, isAdmin, isSubAdmin } from '../middlewares/auth.middleware.js';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateStock as updateProductStock,
  getCategories as getProductCategories
} from '../controllers/product.controller.js';
import { productUpload } from '../config/multer.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/categories', getProductCategories);
router.get('/:id', getProductById);

// Protected routes - require authentication and admin/subadmin privileges
router.use(verifyToken);

// Admin/SubAdmin only routes
router.post('/', isAdmin, productUpload.array('images', 10), createProduct);
router.put('/:id', isAdmin, productUpload.array('images', 10), updateProduct);
router.delete('/:id', isAdmin, deleteProduct);
router.patch('/:id/stock', isSubAdmin, updateProductStock);

export default router;