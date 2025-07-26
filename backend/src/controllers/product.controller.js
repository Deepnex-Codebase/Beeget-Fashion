import Product from '../models/product.model.js';
import { AppError } from '../middlewares/error.middleware.js';
import { logger } from '../utils/logger.js';
import { deleteFile, getFileUrl } from '../config/multer.js';
import path from 'path';
import mongoose from 'mongoose';
import fs from 'fs';
import csv from 'csv-parser';
import { Readable } from 'stream';

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
      search,
      collection
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

    // Add collection filter if provided
    if (collection) {
      // Check if collection is a valid ObjectId before proceeding
      if (mongoose.Types.ObjectId.isValid(collection)) {
        // Find the collection and get its product IDs
        const collectionDoc = await mongoose.model('Collection').findById(collection);
        if (collectionDoc && collectionDoc.products && collectionDoc.products.length > 0) {
          // Filter products by their IDs in the collection
          query._id = { $in: collectionDoc.products };
          console.log(`Filtering products by collection ${collection}, found ${collectionDoc.products.length} products`);
        } else {
          // If collection exists but has no products, return empty result
          console.log(`Collection ${collection} exists but has no products`);
          query._id = { $in: [] }; // This will return no results
        }
      } else {
        console.log(`Invalid collection ID: ${collection}`);
      }
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

/**
 * Bulk upload products from CSV/JSON file
 */
export const bulkUploadProducts = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let products = [];

    // Parse CSV file
    if (fileExtension === '.csv') {
      const results = [];
      const fileStream = fs.createReadStream(req.file.path);
      
      await new Promise((resolve, reject) => {
        fileStream
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve())
          .on('error', (error) => reject(error));
      });

      // Process CSV data
      products = results.map(row => {
        // Parse images (comma-separated URLs)
        const images = row.images ? row.images.split(',').map(img => img.trim()) : [];
        
        // Parse variant attributes
        const attributes = {};
        if (row.color) attributes.color = row.color;
        if (row.size) attributes.size = row.size;
        
        return {
          title: row.title,
          description: row.description,
          category: row.category_id,
          variants: [
            {
              sku: row.sku,
              price: parseFloat(row.price),
              stock: parseInt(row.stock, 10),
              attributes
            }
          ],
          images,
          gstRate: row.gstRate ? parseFloat(row.gstRate) : 18
        };
      });
    } 
    // Parse JSON file
    else if (fileExtension === '.json') {
      const fileContent = fs.readFileSync(req.file.path, 'utf8');
      const jsonData = JSON.parse(fileContent);
      
      if (Array.isArray(jsonData)) {
        products = jsonData;
      } else {
        throw new AppError('JSON file must contain an array of products', 400);
      }
    } 
    else {
      throw new AppError('Unsupported file format. Please upload CSV or JSON file', 400);
    }

    // Validate products
    if (products.length === 0) {
      throw new AppError('No valid products found in the file', 400);
    }

    // Check for duplicate SKUs within the upload
    const skus = new Set();
    const duplicates = [];
    
    products.forEach(product => {
      product.variants.forEach(variant => {
        if (skus.has(variant.sku)) {
          duplicates.push(variant.sku);
        } else {
          skus.add(variant.sku);
        }
      });
    });

    if (duplicates.length > 0) {
      throw new AppError(`Duplicate SKUs found in upload: ${duplicates.join(', ')}`, 400);
    }

    // Check for existing SKUs in database
    const existingSkus = [];
    for (const sku of skus) {
      const existingProduct = await Product.findOne({ 'variants.sku': sku });
      if (existingProduct) {
        existingSkus.push(sku);
      }
    }

    if (existingSkus.length > 0) {
      throw new AppError(`SKUs already exist in database: ${existingSkus.join(', ')}`, 400);
    }

    // Insert products in bulk
    const result = await Product.insertMany(products);

    // Delete the temporary file
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      success: true,
      message: `${result.length} products uploaded successfully`,
      data: {
        count: result.length
      }
    });
  } catch (error) {
    // Delete the temporary file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};