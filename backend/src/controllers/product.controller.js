import Product from '../models/product.model.js';
import { AppError } from '../middlewares/error.middleware.js';
import { logger } from '../utils/logger.js';
import { deleteFile, getFileUrl } from '../config/multer.js';
import path from 'path';
import mongoose from 'mongoose';

/**
 * Create a new product
 */
export const createProduct = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      variants,
      gstRate
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !variants || variants.length === 0) {
      throw new AppError('Missing required product fields', 400);
    }

    // Parse variants if it's a string (from form-data)
    let parsedVariants = variants;
    if (typeof variants === 'string') {
      try {
        parsedVariants = JSON.parse(variants);
      } catch (error) {
        throw new AppError('Invalid variants format', 400);
      }
    }

    // Validate variants
    if (!Array.isArray(parsedVariants)) {
      throw new AppError('Variants must be an array', 400);
    }

    // Check if all variants have required fields
    parsedVariants.forEach((variant, index) => {
      if (!variant.sku || !variant.price || !variant.stock || !variant.attributes) {
        throw new AppError(`Variant at index ${index} is missing required fields`, 400);
      }
    });

    // Process uploaded images
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        // Just store the URL as string as per the model definition
        images.push(getFileUrl(file.path));
      });
    }

    // Create new product
    const product = new Product({
      title,
      description,
      category,
      variants: parsedVariants,
      images,
      gstRate: gstRate || 18 // Default GST rate
    });

    await product.save();

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        product
      }
    });
  } catch (error) {
    // Delete uploaded files if there was an error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        deleteFile(file.path);
      });
    }
    next(error);
  }
};

/**
 * Get all products with pagination and filters
 */
export const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      category,
      minPrice,
      maxPrice,
      search
    } = req.query;

    // Build query
    const query = {};

    // Add category filter if provided
    if (category) {
      // Check if category is a valid ObjectId before adding to query
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      }
      // If category is not valid, we don't add it to the query
      // This prevents the CastError when an invalid ObjectId is provided
    }

    // Add price range filter if provided
    if (minPrice || maxPrice) {
      query['variants.price'] = {};
      if (minPrice) query['variants.price'].$gte = Number(minPrice);
      if (maxPrice) query['variants.price'].$lte = Number(maxPrice);
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'variants.sku': { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    // Execute query with pagination and sorting
    const products = await Product.find(query)
      .populate('category', 'name description')
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    // Return products
    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product by ID
 */
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Find product and populate category
    const product = await Product.findById(id).populate('category', 'name description');
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Return product
    res.status(200).json({
      success: true,
      data: {
        product
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update product
 */
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      variants,
      gstRate,
      removeImages
    } = req.body;

    // Find product
    const product = await Product.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Update fields if provided
    if (title) product.title = title;
    if (description) product.description = description;
    if (category) product.category = category;
    if (gstRate) product.gstRate = gstRate;

    // Parse variants if it's a string (from form-data)
    if (variants) {
      let parsedVariants = variants;
      if (typeof variants === 'string') {
        try {
          parsedVariants = JSON.parse(variants);
        } catch (error) {
          throw new AppError('Invalid variants format', 400);
        }
      }

      // Validate variants
      if (!Array.isArray(parsedVariants)) {
        throw new AppError('Variants must be an array', 400);
      }

      // Check if all variants have required fields
      parsedVariants.forEach((variant, index) => {
        if (!variant.sku || !variant.price || !variant.stock || !variant.attributes) {
          throw new AppError(`Variant at index ${index} is missing required fields`, 400);
        }
      });

      product.variants = parsedVariants;
    }

    // Handle image removal if specified
    if (removeImages) {
      let imagesToRemove = removeImages;
      if (typeof removeImages === 'string') {
        try {
          imagesToRemove = JSON.parse(removeImages);
        } catch (error) {
          throw new AppError('Invalid removeImages format', 400);
        }
      }

      if (Array.isArray(imagesToRemove) && imagesToRemove.length > 0) {
        // Delete files from storage
        imagesToRemove.forEach(imageUrl => {
          // Extract file path from URL
          const urlPath = new URL(imageUrl).pathname;
          const filePath = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;
          if (filePath) {
            deleteFile(filePath);
          }
        });

        // Remove images from product
        product.images = product.images.filter(imageUrl => 
          !imagesToRemove.includes(imageUrl)
        );
      }
    }

    // Add new images if uploaded
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        // Just store the URL as string as per the model definition
        product.images.push(getFileUrl(file.path));
      });
    }

    await product.save();

    // Return updated product
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: {
        product
      }
    });
  } catch (error) {
    // Delete uploaded files if there was an error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        deleteFile(file.path);
      });
    }
    next(error);
  }
};

/**
 * Delete product
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find product
    const product = await Product.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Delete product images from storage
    if (product.images && product.images.length > 0) {
      product.images.forEach(imageUrl => {
        // Extract file path from URL
        const urlPath = new URL(imageUrl).pathname;
        const filePath = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;
        if (filePath) {
          deleteFile(filePath);
        }
      });
    }

    // Delete product from database
    await Product.findByIdAndDelete(id);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update product stock
 */
export const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { variantSku, quantity } = req.body;

    // Validate required fields
    if (!variantSku || quantity === undefined) {
      throw new AppError('Variant SKU and quantity are required', 400);
    }

    // Find product
    const product = await Product.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Find variant
    const variantIndex = product.variants.findIndex(v => v.sku === variantSku);
    if (variantIndex === -1) {
      throw new AppError('Variant not found', 404);
    }

    // Update stock
    product.variants[variantIndex].stock = Number(quantity);
    await product.save();

    // Return updated product
    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        product
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product categories
 */
export const getCategories = async (req, res, next) => {
  try {
    // Import Category model
    const Category = (await import('../models/category.model.js')).default;
    
    // Get all categories
    const categories = await Category.find({ active: true });

    // Return categories
    res.status(200).json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    next(error);
  }
};