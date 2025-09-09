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
  createDirectoryIfNotExists(path.join(uploadDir, 'videos'));
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

// Storage configuration for video uploads
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(uploadDir, 'videos');
    createDirectoryIfNotExists(dest);
    logger.info(`Video upload destination: ${dest}`);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    logger.info(`Generated video filename: ${uniqueFilename} for original: ${file.originalname}`);
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

// File filter for videos
const videoFileFilter = (req, file, cb) => {
  // Accept only video files
  const filetypes = /mp4|webm|ogg|mov|avi|mkv|flv|wmv|3gp/;
  const mimetype = file.mimetype.startsWith('video/') || file.mimetype === 'application/octet-stream';
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
  logger.info(`Video file check - Filename: ${file.originalname}, Mimetype: ${file.mimetype}`);
  
  if (mimetype && extname) {
    logger.info(`Video file accepted: ${file.originalname}`);
    return cb(null, true);
  }
  
  logger.warn(`Video file rejected: ${file.originalname} (${file.mimetype})`);
  cb(new Error('Only video files are allowed!'), false);
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
  product: 50 * 1024 * 1024, // 50MB
  user: 50 * 1024 * 1024,    // 50MB
  invoice: 50 * 1024 * 1024, // 50MB
  review: 50 * 1024 * 1024,   // 50MB
  temp: 50 * 1024 * 1024,    // 50MB
  cms: 50 * 1024 * 1024,      // 50MB for CMS images
  video: 500 * 1024 * 1024    // 500MB for videos
};

// Configure multer instances
const productUpload = multer({
  storage: productStorage,
  limits: { fileSize: maxSize.product },
  fileFilter: imageFileFilter
});

// Combined product and video upload configuration
const productMediaUpload = multer({
  storage: productStorage,
  fileFilter: (req, file, cb) => {
    // Check if it's a video field
    if (file.fieldname === 'video') {
      // Use video file filter
      const filetypes = /mp4|webm|ogg|mov|avi/;
      const mimetype = file.mimetype.startsWith('video/');
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      
      if (mimetype && extname) {
        // Set higher limit for video files
        file.size_limit = maxSize.video;
        return cb(null, true);
      }
      
      return cb(new Error('Only video files are allowed for video field!'), false);
    } else {
      // Use image file filter for other fields
      const filetypes = /jpeg|jpg|png|gif|webp/;
      const mimetype = filetypes.test(file.mimetype);
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      
      if (mimetype && extname) {
        // Set normal limit for image files
        file.size_limit = maxSize.product;
        return cb(null, true);
      }
      
      return cb(new Error('Only image files are allowed for image fields!'), false);
    }
  },
  limits: { fileSize: maxSize.video } // Set to the larger of the two limits
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

// Regular CMS upload configuration
const cmsUpload = multer({
  storage: cmsStorage,
  limits: { fileSize: maxSize.cms }, // 10MB limit for images
  fileFilter: imageFileFilter
});

// Special filter for PNG files only
const pngFileFilter = (req, file, cb) => {
  logger.info(`PNG filter processing: ${file.originalname}`);
  
  if (file.originalname.toLowerCase().endsWith('.png') || file.mimetype === 'image/png') {
    logger.info(`PNG file accepted: ${file.originalname}`);
    return cb(null, true);
  }
  
  logger.warn(`File rejected by PNG filter: ${file.originalname} (${file.mimetype})`);
  cb(null, false);
};

// Special configuration for PNG uploads
const pngUpload = multer({
  storage: cmsStorage,
  limits: { fileSize: maxSize.cms }, // 10MB limit for PNG images
  fileFilter: pngFileFilter
});

// Log multer configuration
logger.info('CMS Upload configuration initialized with:');
logger.info(`- Storage destination: ${uploadDir}/cms`);
logger.info(`- File size limit: ${maxSize.cms} bytes (${maxSize.cms / (1024 * 1024)} MB)`);
logger.info('- Supported formats: JPG, JPEG, PNG, GIF, WEBP, SVG, BMP, TIFF, TIF');

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: maxSize.video },
  fileFilter: videoFileFilter,
  preservePath: true
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
  productMediaUpload,
  userUpload,
  invoiceUpload,
  reviewUpload,
  tempUpload,
  cmsUpload,
  videoUpload,
  pngUpload,
  uploadDir
};