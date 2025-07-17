import Wishlist from '../models/wishlist.model.js';
import Product from '../models/product.model.js';
import { AppError } from '../middlewares/error.middleware.js';
import { logger } from '../utils/logger.js';

/**
 * Get the user's wishlist
 */
export const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Find wishlist or create a new one if it doesn't exist
    let wishlist = await Wishlist.findOne({ userId })
      .populate({
        path: 'items.productId',
        select: 'title variants images slug salePrice'
      });
    
    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [] });
      await wishlist.save();
    }
    
    logger.info(`Wishlist retrieved for user ${userId}`);
    return res.status(200).json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    logger.error(`Error getting wishlist: ${error.message}`);
    return next(new AppError('Failed to get wishlist', 500));
  }
};

/**
 * Add item to wishlist
 */
export const addToWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;
    
    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }
    
    // Find user's wishlist or create a new one
    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [] });
    }
    
    // Check if product already exists in wishlist
    const existingItemIndex = wishlist.items.findIndex(item => 
      item.productId.toString() === productId
    );
    
    if (existingItemIndex > -1) {
      // Product already in wishlist, return success
      logger.info(`Product already in wishlist for user ${userId}`);
      return res.status(200).json({
        success: true,
        message: 'Product already in wishlist',
        data: wishlist
      });
    } else {
      // Add new item
      // Get price from variants if available
      const price = product.variants && product.variants.length > 0 
        ? product.variants[0].price 
        : 0;
      
      // Get stock information
      const hasStock = product.variants && product.variants.some(v => v.stock > 0);
      
      // Get variant count
      const variantCount = product.variants ? product.variants.length : 0;
        
      const productDetails = {
        title: product.title,
        price: price,
        image: product.images && product.images.length > 0 ? product.images[0] : null,
        slug: product.slug,
        hasStock: hasStock,
        variantCount: variantCount,
        salePrice: product.salePrice || null
      };
      
      wishlist.items.push({
        productId,
        addedAt: new Date(),
        productDetails
      });
    }
    
    await wishlist.save();
    
    // Return updated wishlist with populated product details
    const updatedWishlist = await Wishlist.findById(wishlist._id)
      .populate({
        path: 'items.productId',
        select: 'title variants images slug salePrice'
      });
    
    logger.info(`Item added to wishlist for user ${userId}`);
    return res.status(200).json({
      success: true,
      data: updatedWishlist
    });
  } catch (error) {
    logger.error(`Error adding to wishlist: ${error.message}`);
    return next(new AppError('Failed to add item to wishlist', 500));
  }
};

/**
 * Remove item from wishlist
 */
export const removeWishlistItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    
    // Find user's wishlist
    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return next(new AppError('Wishlist not found', 404));
    }
    
    // Find the item index
    const itemIndex = wishlist.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return next(new AppError('Wishlist item not found', 404));
    }
    
    // Remove the item using pull operator
    wishlist.items.pull({ _id: itemId });
    await wishlist.save();
    
    // Return updated wishlist with populated product details
    const updatedWishlist = await Wishlist.findById(wishlist._id)
      .populate({
        path: 'items.productId',
        select: 'title variants images slug salePrice'
      });
    
    logger.info(`Item removed from wishlist for user ${userId}`);
    return res.status(200).json({
      success: true,
      data: updatedWishlist
    });
  } catch (error) {
    logger.error(`Error removing wishlist item: ${error.message}`);
    return next(new AppError('Failed to remove wishlist item', 500));
  }
};

/**
 * Clear wishlist
 */
export const clearWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Find user's wishlist
    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return next(new AppError('Wishlist not found', 404));
    }
    
    // Clear all items
    wishlist.items = [];
    await wishlist.save();
    
    logger.info(`Wishlist cleared for user ${userId}`);
    return res.status(200).json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    logger.error(`Error clearing wishlist: ${error.message}`);
    return next(new AppError('Failed to clear wishlist', 500));
  }
};

/**
 * Check if product is in wishlist
 */
export const checkWishlistItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    
    // Find user's wishlist
    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(200).json({
        success: true,
        exists: false
      });
    }
    
    // Check if product exists in wishlist
    const exists = wishlist.items.some(item => item.productId.toString() === productId);
    
    return res.status(200).json({
      success: true,
      exists
    });
  } catch (error) {
    logger.error(`Error checking wishlist item: ${error.message}`);
    return next(new AppError('Failed to check wishlist item', 500));
  }
};