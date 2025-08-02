import express from 'express';
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
import { productUpload, tempUpload } from '../config/multer.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/categories', getProductCategories);
router.get('/:id', getProductById);

// Protected routes - require authentication and admin/subadmin privileges
router.use(verifyToken);

// Admin/SubAdmin only routes
router.post('/', isAdmin, productUpload.array('images', 10), createProduct);
router.post('/bulk-upload', isAdmin, tempUpload.single('file'), bulkUploadProducts);
router.post('/bulk-upload-images', isAdmin, productUpload.array('images', 50), bulkUploadImages);
router.put('/:id', isAdmin, productUpload.array('images', 10), updateProduct);
router.delete('/:id', isAdmin, deleteProduct);
router.patch('/:id/stock', isSubAdmin, hasDepartmentPermission('products', 'manage_products'), updateProductStock);

export default router;