import express from 'express';
import { verifyToken, isAdmin, isSubAdmin, isAdminOrSubAdmin } from '../middlewares/auth.middleware.js';
import {
  createCollection,
  getCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  addProductsToCollection,
  removeProductsFromCollection
} from '../controllers/collection.controller.js';
import { productUpload } from '../config/multer.js';

const router = express.Router();

// Get all collections - public route
router.get('/', getCollections);

// Get collection by ID - public route
router.get('/:id', getCollectionById);

// Protected routes - Admin/SubAdmin only
// Create collection
router.post(
  '/',
  verifyToken,
  isAdminOrSubAdmin,
  productUpload.single('image'),
  createCollection
);

// Update collection
router.put(
  '/:id',
  verifyToken,
  isAdminOrSubAdmin,
  productUpload.single('image'),
  updateCollection
);

// Delete collection
router.delete(
  '/:id',
  verifyToken,
  isAdminOrSubAdmin,
  deleteCollection
);

// Add products to collection
router.post(
  '/:id/products',
  verifyToken,
  isAdminOrSubAdmin,
  addProductsToCollection
);

// Remove products from collection
router.delete(
  '/:id/products',
  verifyToken,
  isAdminOrSubAdmin,
  removeProductsFromCollection
);

export default router;