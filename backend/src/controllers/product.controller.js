import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import { AppError } from '../middlewares/error.middleware.js';
import { logger } from '../utils/logger.js';
import { deleteFile, getFileUrl } from '../config/multer.js';
import { validateProduct, validateVariant, PRODUCT_CONFIG } from '../config/productConfig.js';
import path from 'path';
import mongoose from 'mongoose';
import fs from 'fs';
import csv from 'csv-parser';
import { Readable } from 'stream';

/**
 * Helper function to clean up uploaded files in case of error
 */
const cleanupUploadedFiles = (files) => {
  if (!files) return;
  
  // Handle image files
  if (files.images && files.images.length > 0) {
    logger.warn(`Cleaning up ${files.images.length} image files due to error`);
    files.images.forEach(file => {
      try {
        deleteFile(file.path);
        logger.info(`Deleted image file: ${file.path}`);
      } catch (deleteError) {
        logger.error(`Failed to delete image file ${file.path}: ${deleteError.message}`);
      }
    });
  }
  
  // Handle video files
  if (files.video && files.video.length > 0) {
    logger.warn(`Cleaning up video file due to error`);
    try {
      deleteFile(files.video[0].path);
      logger.info(`Deleted video file: ${files.video[0].path}`);
    } catch (deleteError) {
      logger.error(`Failed to delete video file ${files.video[0].path}: ${deleteError.message}`);
    }
  }
};

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
      gstRate,
      media_type, // Add media_type field to determine if main media is video or image
      // Extract product detail fields
      color,
      colors, // Add support for multiple colors
      comboOf,
      fabric,
      fitShape,
      length,
      neck,
      occasion,
      pattern,
      printType,
      sleeveType,
      stitchingType,
      countryOfOrigin,
      brand,
      embellishment,
      ornamentation,
      sleeveStyling,
      importerDetails,
      sleeveLength,
      stitchType,
      manufacturerDetails,
      packerDetails
    } = req.body;

    // Parse variants if it's a string (from form-data)
    let parsedVariants = variants;
    if (typeof variants === 'string') {
      try {
        parsedVariants = JSON.parse(variants);
      } catch (error) {
        throw new AppError('Invalid variants format', 400);
      }
    }
    
    // Ensure each variant has the required Shiprocket fields with defaults if not provided
    if (Array.isArray(parsedVariants)) {
      parsedVariants = parsedVariants.map(variant => ({
        ...variant,
        // Add default Shiprocket fields if not provided
        hsn: variant.hsn || '6204', // Default HSN code for ready-made garments
        weight: variant.weight || 0.3, // Default weight in kg
        dimensions: variant.dimensions || {
          length: 30,
          breadth: 25,
          height: 2
        },
        // Ensure selling price is set
        sellingPrice: variant.sellingPrice || variant.price || variant.mrp,
        // Set isInStock based on stock
        isInStock: variant.stock > 0,
        // Setup marketplace prices
        marketplacePrices: {
          meesho: variant.meeshoPrice,
          wrongDefective: variant.wrongDefectivePrice
        }
      }));
    }

    // Use dynamic validation from config
    const productValidation = validateProduct({
      title,
      description,
      category,
      variants: parsedVariants
    });

    if (!productValidation.isValid) {
      const firstError = productValidation.errors[0];
      throw new AppError(firstError.message, 400);
    }

    // Process uploaded images and videos
    const images = [];
    let video = null;
    
    // Handle images
    if (req.files && req.files.images) {
      logger.info(`Processing ${req.files.images.length} product images`);
      req.files.images.forEach(file => {
        const fileUrl = getFileUrl(file.path);
        logger.info(`Added image: ${file.originalname}, URL: ${fileUrl}`);
        images.push(fileUrl);
      });
    }
    
    // Handle video
    if (req.files && req.files.video && req.files.video.length > 0) {
      const videoFile = req.files.video[0];
      logger.info(`Processing video: ${videoFile.originalname}, size: ${videoFile.size} bytes, mimetype: ${videoFile.mimetype}`);
      
      try {
        video = getFileUrl(videoFile.path);
        logger.info(`Video processed successfully, URL: ${video}`);
      } catch (error) {
        logger.error(`Error processing video: ${error.message}`);
        throw new AppError('Failed to process video file', 500);
      }
    }

    // Create new product
    const product = new Product({
      title,
      description,
      category,
      variants: parsedVariants,
      images,
      // Set primaryImage to the first image if available
      primaryImage: images.length > 0 ? images[0] : null,
      video, // Add video field
      media_type: media_type || (video ? 'video' : 'image'), // Set media_type based on uploaded content
      gstRate: gstRate || PRODUCT_CONFIG.DEFAULTS.gstRate,
      // Add product detail fields
      color,
      // Parse colors if it's a string (from form-data)
      colors: colors ? (typeof colors === 'string' ? JSON.parse(colors) : colors) : undefined,
      comboOf,
      fabric,
      fitShape,
      length,
      neck,
      occasion,
      pattern,
      printType,
      sleeveType,
      stitchingType,
      countryOfOrigin,
      brand,
      embellishment,
      ornamentation,
      sleeveStyling,
      importerDetails,
      sleeveLength,
      stitchType,
      manufacturerDetails,
      packerDetails
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
    cleanupUploadedFiles(req.files);
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
          logger.info(`Filtering products by collection ${collection}, found ${collectionDoc.products.length} products`);
        } else {
          // If collection exists but has no products, return empty result
          logger.info(`Collection ${collection} exists but has no products`);
          query._id = { $in: [] }; // This will return no results
        }
      } else {
        logger.warn(`Invalid collection ID: ${collection}`);
      }
    }

    // Add price range filter if provided
    if (minPrice || maxPrice) {
      query['variants.sellingPrice'] = {};
      if (minPrice) query['variants.sellingPrice'].$gte = Number(minPrice);
      if (maxPrice) query['variants.sellingPrice'].$lte = Number(maxPrice);
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
      removeImages,
      // Extract product detail fields
      color,
      colors, // Add support for multiple colors
      comboOf,
      fabric,
      fitShape,
      length,
      neck,
      occasion,
      pattern,
      printType,
      sleeveType,
      stitchingType,
      countryOfOrigin,
      brand,
      embellishment,
      ornamentation,
      sleeveStyling,
      importerDetails,
      sleeveLength,
      stitchType,
      manufacturerDetails,
      packerDetails
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
    
    // Update product detail fields if provided
    if (color !== undefined) product.color = color;
    // Update colors array if provided
    if (colors) {
      // Parse colors if it's a string (from form-data)
      let parsedColors = colors;
      if (typeof colors === 'string') {
        try {
          parsedColors = JSON.parse(colors);
        } catch (error) {
          throw new AppError('Invalid colors format', 400);
        }
      }
      product.colors = parsedColors;
    }
    if (comboOf !== undefined) product.comboOf = comboOf;
    if (fabric !== undefined) product.fabric = fabric;
    if (fitShape !== undefined) product.fitShape = fitShape;
    if (length !== undefined) product.length = length;
    if (neck !== undefined) product.neck = neck;
    if (occasion !== undefined) product.occasion = occasion;
    if (pattern !== undefined) product.pattern = pattern;
    if (printType !== undefined) product.printType = printType;
    if (sleeveType !== undefined) product.sleeveType = sleeveType;
    if (stitchingType !== undefined) product.stitchingType = stitchingType;
    if (countryOfOrigin !== undefined) product.countryOfOrigin = countryOfOrigin;
    if (brand !== undefined) product.brand = brand;
    if (embellishment !== undefined) product.embellishment = embellishment;
    if (ornamentation !== undefined) product.ornamentation = ornamentation;
    if (sleeveStyling !== undefined) product.sleeveStyling = sleeveStyling;
    if (importerDetails !== undefined) product.importerDetails = importerDetails;
    if (sleeveLength !== undefined) product.sleeveLength = sleeveLength;
    if (stitchType !== undefined) product.stitchType = stitchType;
    if (manufacturerDetails !== undefined) product.manufacturerDetails = manufacturerDetails;
    if (packerDetails !== undefined) product.packerDetails = packerDetails;

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

      // Use dynamic validation from config
      if (!Array.isArray(parsedVariants)) {
        throw new AppError('Variants must be an array', 400);
      }

      // Validate each variant using dynamic config
      parsedVariants.forEach((variant, index) => {
        const variantValidation = validateVariant(variant, index);
        if (!variantValidation.isValid) {
          const firstError = variantValidation.errors[0];
          throw new AppError(firstError.message, 400);
        }
      });
      
      // Ensure each variant has the required Shiprocket fields with defaults if not provided
      parsedVariants = parsedVariants.map(variant => {
        // Handle price fields
        const sellingPrice = variant.sellingPrice || variant.price || variant.mrp || 0;
        const mrp = variant.mrp || sellingPrice;
        
        // Handle marketplace prices
        const marketplacePrices = {
          meesho: variant.meeshoPrice || variant.marketplacePrices?.meesho || sellingPrice,
          wrongDefective: variant.wrongDefectivePrice || variant.marketplacePrices?.wrongDefective || sellingPrice * 0.8
        };
        
        // Set stock status
        const stock = variant.stock || 0;
        const isInStock = stock > 0;
        
        return {
          ...variant,
          // Set price fields
          sellingPrice,
          mrp,
          marketplacePrices,
          stock,
          isInStock,
          // Add default Shiprocket fields if not provided
          hsn: variant.hsn || '6204', // Default HSN code for ready-made garments
          weight: variant.weight || 0.3, // Default weight in kg
          dimensions: variant.dimensions || {
            length: 30,
            breadth: 25,
            height: 2
          }
        };
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

        // Check if primaryImage is being removed
        const isPrimaryImageRemoved = product.primaryImage && imagesToRemove.includes(product.primaryImage);
        
        // Remove images from product
        product.images = product.images.filter(imageUrl => 
          !imagesToRemove.includes(imageUrl)
        );
        
        // Update primaryImage if it was removed
        if (isPrimaryImageRemoved) {
          // Set to first available image or null if no images left
          product.primaryImage = product.images.length > 0 ? product.images[0] : null;
        }
      }
    }

    // Handle video update if provided
    if (req.files && req.files.video && req.files.video.length > 0) {
      // If there's an existing video, delete it first
      if (product.video) {
        try {
          const urlPath = new URL(product.video).pathname;
          const filePath = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;
          if (filePath) {
            deleteFile(filePath);
          }
        } catch (error) {
          logger.warn(`Failed to delete old video: ${error.message}`);
        }
      }
      
      // Update with new video
      logger.info(`Updating product video: ${req.files.video[0].originalname}`);
      product.video = getFileUrl(req.files.video[0].path);
      product.media_type = 'video';
    }
    
    // Add new images if uploaded
    if (req.files && req.files.images) {
      const newImageUrls = [];
      req.files.images.forEach(file => {
        // Store the URL as string as per the model definition
        const imageUrl = getFileUrl(file.path);
        product.images.push(imageUrl);
        newImageUrls.push(imageUrl);
      });
      
      // If no video is set but images are present, ensure media_type is image
      if (!product.video && product.images.length > 0) {
        product.media_type = 'image';
      }
      
      // Set primaryImage if it's not already set or if explicitly requested
      if (!product.primaryImage && product.images.length > 0) {
        product.primaryImage = product.images[0];
      } else if (newImageUrls.length > 0 && req.body.updatePrimaryImage === 'true') {
        // If updatePrimaryImage flag is set, use the first new image as primary
        product.primaryImage = newImageUrls[0];
      }
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
    cleanupUploadedFiles(req.files);
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
    // Update isInStock based on stock quantity
    product.variants[variantIndex].isInStock = Number(quantity) > 0;
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
      // Group rows by product title to handle multiple variants of the same product
      const productGroups = {};
      
      results.forEach(row => {
        // Create a unique key for each product (title + description + category)
        const productKey = `${row.title}__${row.description}__${row.category}`;
        
        // Parse variant attributes
        const attributes = {};
        if (row.color) attributes.color = row.color;
        if (row.size) attributes.size = row.size;
        
        // Create variant object with new fields including Shiprocket fields
        const sellingPrice = row.sellingPrice ? parseFloat(row.sellingPrice) : (row.price ? parseFloat(row.price) : parseFloat(row.mrp));
        const stock = parseInt(row.stock, 10) || 0;
        
        const variant = {
          sku: row.sku || '', // SKU is now optional
          sellingPrice: sellingPrice,
          mrp: parseFloat(row.mrp),
          marketplacePrices: {
            meesho: row.meeshoPrice ? parseFloat(row.meeshoPrice) : sellingPrice,
            wrongDefective: row.wrongDefectivePrice ? parseFloat(row.wrongDefectivePrice) : sellingPrice * 0.8
          },
          stock: stock,
          isInStock: stock > 0,
          bustSize: parseFloat(row.bustSize),
          shoulderSize: parseFloat(row.shoulderSize),
          waistSize: parseFloat(row.waistSize),
          sizeLength: parseFloat(row.sizeLength),
          hipSize: row.hipSize ? parseFloat(row.hipSize) : undefined,
          attributes,
          // Shiprocket Fields
          hsn: row.hsn || '6204', // Default HSN code for ready-made garments
          weight: row.weight ? parseFloat(row.weight) : 0.3, // Default weight in kg
          dimensions: {
            length: row.length ? parseFloat(row.length) : 30,
            breadth: row.breadth ? parseFloat(row.breadth) : 25,
            height: row.height ? parseFloat(row.height) : 2
          }
        };
        
        // Parse images (comma-separated URLs)
        const images = row.images ? row.images.split(',').map(img => img.trim()) : [];
        
        // If this product already exists in our groups, add the variant
        if (productGroups[productKey]) {
          productGroups[productKey].variants.push(variant);
          
          // Add any new images that aren't already in the product
          images.forEach(img => {
            if (!productGroups[productKey].images.includes(img)) {
              productGroups[productKey].images.push(img);
            }
          });
        } else {
          // Create a new product entry
          productGroups[productKey] = {
            title: row.title,
            description: row.description,
            category: row.category,
            variants: [variant],
            images: images,
            // Set primaryImage to the first image if available
            primaryImage: images.length > 0 ? images[0] : null,
            gstRate: row.gstRate ? parseFloat(row.gstRate) : PRODUCT_CONFIG.DEFAULTS.gstRate
          };
        }
      });
      
      // Convert the grouped products object to an array
      products = Object.values(productGroups);
    } 
    // Parse JSON file
    else if (fileExtension === '.json') {
      const fileContent = fs.readFileSync(req.file.path, 'utf8');
      const jsonData = JSON.parse(fileContent);
      
      if (Array.isArray(jsonData)) {
        // Validate each product in the JSON array using dynamic config
        jsonData.forEach((product, index) => {
          const productValidation = validateProduct(product);
          if (!productValidation.isValid) {
            const firstError = productValidation.errors[0];
            throw new AppError(`Product '${product.title || 'Unknown'}' at index ${index}: ${firstError.message}`, 400);
          }
        });
        
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
    const duplicateDetails = [];
    
    products.forEach(product => {
      product.variants.forEach(variant => {
        if (skus.has(variant.sku)) {
          duplicates.push(variant.sku);
          duplicateDetails.push(`SKU: ${variant.sku} (Product: ${product.title})`);
        } else {
          skus.add(variant.sku);
        }
      });
    });

    if (duplicates.length > 0) {
      throw new AppError(`Duplicate SKUs found in upload:\n${duplicateDetails.join('\n')}\n\nNote: Each SKU must be unique across all products. If you want to add multiple variants of the same product, use the same title, description, and category but different SKUs.`, 400);
    }

    // Check for existing SKUs in database
    const existingSkus = [];
    const existingSkuDetails = [];
    
    for (const sku of skus) {
      const existingProduct = await Product.findOne({ 'variants.sku': sku });
      if (existingProduct) {
        existingSkus.push(sku);
        existingSkuDetails.push(`SKU: ${sku} (Found in product: ${existingProduct.title})`);
      }
    }

    if (existingSkus.length > 0) {
      throw new AppError(`The following SKUs already exist in the database:\n${existingSkuDetails.join('\n')}\n\nPlease use unique SKUs for each variant.`, 400);
    }

    // Process categories - convert category names to category IDs
    for (const product of products) {
      // If category is a string (name) and not an ObjectId, try to find the category by name
      if (product.category && typeof product.category === 'string' && !mongoose.Types.ObjectId.isValid(product.category)) {
        // Try to find category by name
        const category = await Category.findOne({ 
          $or: [
            { name: { $regex: new RegExp('^' + product.category + '$', 'i') } },
            { name_hi: { $regex: new RegExp('^' + product.category + '$', 'i') } }
          ]
        });
        
        if (category) {
          // Replace category name with category ID
          product.category = category._id;
        } else {
          // If category not found, create a warning but don't fail the upload
          logger.warn(`Category not found: ${product.category} for product: ${product.title}`);
          // Keep the category as is - it will be handled as uncategorized
        }
      }
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

/**
 * Bulk upload images and return URLs
 */
export const bulkUploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new AppError('No images uploaded', 400);
    }

    // Process uploaded images
    const imageUrls = [];
    
    // Generate URLs for each uploaded image
    req.files.forEach(file => {
      imageUrls.push({
        filename: file.filename,
        originalname: file.originalname,
        url: getFileUrl(file.path)
      });
    });

    // Generate CSV content with image URLs
    const csvHeader = 'original_filename,image_url';
    const csvRows = imageUrls.map(img => `${img.originalname},${img.url}`);
    const csvContent = [csvHeader, ...csvRows].join('\n');

    // Import uploadDir from multer config
    const { uploadDir } = await import('../config/multer.js');
    
    // Create a temporary CSV file
    const csvFilename = `image_urls_${Date.now()}.csv`;
    const csvPath = path.join(uploadDir, 'temp', csvFilename);
    fs.writeFileSync(csvPath, csvContent);

    res.status(200).json({
      success: true,
      message: `${imageUrls.length} images uploaded successfully`,
      data: {
        images: imageUrls,
        csvUrl: getFileUrl(csvPath)
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