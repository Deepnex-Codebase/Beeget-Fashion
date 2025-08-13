import express from 'express';
import multer from 'multer';
import { verifyToken, isAdmin, isSubAdmin } from '../middlewares/auth.middleware.js';
import { hasDepartmentPermission } from '../middlewares/role.middleware.js';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateStock as updateProductStock,
  getCategories as getProductCategories,
  bulkUploadProducts,
  bulkUploadImages
} from '../controllers/product.controller.js';
import { productUpload, productMediaUpload, tempUpload, videoUpload } from '../config/multer.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/categories', getProductCategories);
router.get('/:id', getProductById);

// Protected routes - require authentication and admin/subadmin privileges
router.use(verifyToken);

// Admin/SubAdmin only routes
router.post('/', isAdmin, productMediaUpload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'video', maxCount: 1 }
]), createProduct);
router.post('/bulk-upload', isAdmin, tempUpload.single('file'), bulkUploadProducts);
router.post('/bulk-upload-images', isAdmin, productUpload.array('images', 50), bulkUploadImages);
router.put('/:id', isAdmin, productMediaUpload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'video', maxCount: 1 }
]), updateProduct);
router.delete('/:id', isAdmin, deleteProduct);
router.patch('/:id/stock', isSubAdmin, hasDepartmentPermission('products', 'manage_products'), updateProductStock);

export default router;