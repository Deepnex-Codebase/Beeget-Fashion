import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

// Ensure upload directories exist
const createDirectoryIfNotExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info(`Created directory: ${dirPath}`);
  }
};

// Base upload directory
const uploadDir = process.env.UPLOAD_DIR || 'uploads';

// Create base directory and subdirectories
const initializeUploadDirectories = () => {
  // Create base upload directory
  createDirectoryIfNotExists(uploadDir);
  
  // Create subdirectories for different types of uploads
  createDirectoryIfNotExists(path.join(uploadDir, 'products'));
  createDirectoryIfNotExists(path.join(uploadDir, 'users'));
  createDirectoryIfNotExists(path.join(uploadDir, 'invoices'));
  createDirectoryIfNotExists(path.join(uploadDir, 'reviews'));
  createDirectoryIfNotExists(path.join(uploadDir, 'temp'));
};

// Initialize directories
initializeUploadDirectories();

// Storage configuration for product images
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(uploadDir, 'products');
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Storage configuration for user profile images
const userStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(uploadDir, 'users');
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Storage configuration for invoice PDFs
const invoiceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(uploadDir, 'invoices');
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Storage configuration for review images
const reviewStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(uploadDir, 'reviews');
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Storage configuration for temporary files
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(uploadDir, 'temp');
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Storage configuration for CMS/site content images
const cmsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(uploadDir, 'cms');
    createDirectoryIfNotExists(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  // Accept only image files
  const filetypes = /jpeg|jpg|png|gif|webp/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  
  cb(new Error('Only image files are allowed!'), false);
};

// File filter for PDFs
const pdfFileFilter = (req, file, cb) => {
  // Accept only PDF files
  const filetypes = /pdf/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  
  cb(new Error('Only PDF files are allowed!'), false);
};

// File size limits
const maxSize = {
  product: 5 * 1024 * 1024, // 5MB
  user: 2 * 1024 * 1024,    // 2MB
  invoice: 10 * 1024 * 1024, // 10MB
  review: 3 * 1024 * 1024,   // 3MB
  temp: 20 * 1024 * 1024,    // 20MB
  cms: 5 * 1024 * 1024       // 5MB for CMS images
};

// Configure multer instances
const productUpload = multer({
  storage: productStorage,
  limits: { fileSize: maxSize.product },
  fileFilter: imageFileFilter
});

const userUpload = multer({
  storage: userStorage,
  limits: { fileSize: maxSize.user },
  fileFilter: imageFileFilter
});

const invoiceUpload = multer({
  storage: invoiceStorage,
  limits: { fileSize: maxSize.invoice },
  fileFilter: pdfFileFilter
});

const tempUpload = multer({
  storage: tempStorage,
  limits: { fileSize: maxSize.temp }
});

const reviewUpload = multer({
  storage: reviewStorage,
  limits: { fileSize: maxSize.review },
  fileFilter: imageFileFilter
});

const cmsUpload = multer({
  storage: cmsStorage,
  limits: { fileSize: maxSize.cms },
  fileFilter: imageFileFilter
});

// Helper function to delete a file
export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`Deleted file: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Error deleting file ${filePath}:`, error);
    return false;
  }
};

// Helper function to get file URL
export const getFileUrl = (filePath) => {
  if (!filePath) return null;
  
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 8000}`;
  return `${baseUrl}/${filePath.replace(/\\/g, '/')}`;
};

export {
  productUpload,
  userUpload,
  invoiceUpload,
  reviewUpload,
  tempUpload,
  cmsUpload,
  uploadDir
};