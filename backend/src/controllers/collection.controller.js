import Collection from '../models/collection.model.js';
import Product from '../models/product.model.js';
import { AppError } from '../middlewares/error.middleware.js';
import { logger } from '../utils/logger.js';
import { deleteFile, getFileUrl } from '../config/multer.js';
import path from 'path';

/**
 * Create a new collection
 */
export const createCollection = async (req, res, next) => {
  console.log(req.body)

  try {
    const {
      name,
      description,
      image,
      active,
      order,
      startDate,
      endDate,
      products
    } = req.body;

    // Validate required fields
    if (!name) {
      throw new AppError('Collection name is required', 400);
    }

    // Process uploaded image
    let imageUrl = image;
    if (req.file) {
      imageUrl = getFileUrl(req.file.path);
    }

    // Create new collection
    const collection = new Collection({
      name,
      description,
      image: imageUrl,
      active: active !== undefined ? active : true,
      order: order || 0,
      startDate: startDate || null,
      endDate: endDate || null,
      products: products || []
    });

    await collection.save();

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      data: {
        collection
      }
    });
  } catch (error) {
    // Delete uploaded file if there was an error
    if (req.file) {
      deleteFile(req.file.path);
    }
    next(error);
  }
};

/**
 * Get all collections
 */
export const getCollections = async (req, res, next) => {
  try {
    // Query parameters
    const { active } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by active status if specified
    if (active !== undefined) {
      query.active = active === 'true';
    }
    
    // Get collections
    const collections = await Collection.find(query).sort({ order: 1, createdAt: -1 });
    
    // Filter collections by date if needed
    const now = new Date();
    const filteredCollections = active === 'true' ? 
      collections.filter(collection => {
        // Check if collection is active based on dates
        if (!collection.active) return false;
        if (collection.startDate && collection.startDate > now) return false;
        if (collection.endDate && collection.endDate < now) return false;
        return true;
      }) : 
      collections;

    // Return collections
    res.status(200).json({
      success: true,
      data: filteredCollections
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get collection by ID
 */
export const getCollectionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find collection
    const collection = await Collection.findById(id).populate('products');
    if (!collection) {
      throw new AppError('Collection not found', 404);
    }

    // Return collection
    res.status(200).json({
      success: true,
      data: {
        collection
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update collection
 */
export const updateCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Add detailed logging
    console.log('Update Collection - Request params:', { id });
    console.log('Update Collection - Request body:', req.body);
    
    if (!id || id === 'undefined') {
      throw new AppError('Invalid collection ID', 400);
    }
    
    const {
      name,
      description,
      image,
      active,
      order,
      startDate,
      endDate,
      products,
      removeImage
    } = req.body;

    // Find collection
    console.log('Attempting to find collection with ID:', id);
    const collection = await Collection.findById(id);
    if (!collection) {
      throw new AppError('Collection not found', 404);
    }
    console.log('Found collection:', collection._id);

    // Update fields if provided
    if (name !== undefined) collection.name = name;
    if (description !== undefined) collection.description = description;
    if (active !== undefined) collection.active = active;
    if (order !== undefined) collection.order = order;
    if (startDate !== undefined) collection.startDate = startDate || null;
    if (endDate !== undefined) collection.endDate = endDate || null;
    if (products !== undefined) {
      console.log('Updating products:', products);
      collection.products = products;
    }

    // Handle image removal if specified
    if (removeImage && collection.image) {
      try {
        // Extract file path from URL
        const urlPath = new URL(collection.image).pathname;
        const filePath = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;
        if (filePath) {
          deleteFile(filePath);
        }
      } catch (error) {
        logger.error('Error removing image:', error);
      }
      collection.image = null;
    }

    // Add new image if uploaded
    if (req.file) {
      // Delete old image if exists
      if (collection.image) {
        try {
          const urlPath = new URL(collection.image).pathname;
          const filePath = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;
          if (filePath) {
            deleteFile(filePath);
          }
        } catch (error) {
          logger.error('Error removing old image:', error);
        }
      }
      // Set new image
      collection.image = getFileUrl(req.file.path);
    } else if (image && image !== collection.image) {
      // Update image URL if provided in request body
      collection.image = image;
    }

    console.log('Saving collection with updated data');
    try {
      await collection.save();
      console.log('Collection saved successfully');
    } catch (saveError) {
      console.error('Error saving collection:', saveError);
      throw saveError;
    }

    // Return updated collection
    res.status(200).json({
      success: true,
      message: 'Collection updated successfully',
      data: {
        collection
      }
    });
  } catch (error) {
    console.error('Update collection error:', error);
    // Delete uploaded file if there was an error
    if (req.file) {
      deleteFile(req.file.path);
    }
    next(error);
  }
};

/**
 * Delete collection
 */
export const deleteCollection = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find collection
    const collection = await Collection.findById(id);
    if (!collection) {
      throw new AppError('Collection not found', 404);
    }

    // Delete image if exists
    if (collection.image) {
      try {
        const urlPath = new URL(collection.image).pathname;
        const filePath = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;
        if (filePath) {
          deleteFile(filePath);
        }
      } catch (error) {
        logger.error('Error deleting collection image:', error);
      }
    }

    // Delete collection
    await Collection.findByIdAndDelete(id);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Collection deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add products to collection
 */
export const addProductsToCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds)) {
      throw new AppError('Product IDs must be provided as an array', 400);
    }

    // Find collection
    const collection = await Collection.findById(id);
    if (!collection) {
      throw new AppError('Collection not found', 404);
    }

    // Verify products exist
    const products = await Product.find({ _id: { $in: productIds } });
    if (products.length !== productIds.length) {
      throw new AppError('One or more products not found', 404);
    }

    // Add products to collection (avoid duplicates)
    const existingProductIds = collection.products.map(id => id.toString());
    const newProductIds = productIds.filter(id => !existingProductIds.includes(id.toString()));
    
    collection.products = [...collection.products, ...newProductIds];
    await collection.save();

    res.status(200).json({
      success: true,
      message: 'Products added to collection successfully',
      data: {
        collection
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove products from collection
 */
export const removeProductsFromCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds)) {
      throw new AppError('Product IDs must be provided as an array', 400);
    }

    // Find collection
    const collection = await Collection.findById(id);
    if (!collection) {
      throw new AppError('Collection not found', 404);
    }

    // Remove products from collection
    collection.products = collection.products.filter(
      productId => !productIds.includes(productId.toString())
    );
    
    await collection.save();

    res.status(200).json({
      success: true,
      message: 'Products removed from collection successfully',
      data: {
        collection
      }
    });
  } catch (error) {
    next(error);
  }
};