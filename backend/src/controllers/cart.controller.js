import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';
import { AppError } from '../middlewares/error.middleware.js';
import { logger } from '../utils/logger.js';

/**
 * Get the user's cart
 */
export const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Find cart or create a new one if it doesn't exist
    let cart = await Cart.findOne({ userId })
      .populate({
        path: 'items.productId',
        select: 'title price images slug variants'
      });
    
    if (!cart) {
      cart = new Cart({ userId, items: [] });
      await cart.save();
    }
    
    logger.info(`Cart retrieved for user ${userId}`);
    return res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    logger.error(`Error getting cart: ${error.message}`);
    return next(new AppError('Failed to get cart', 500));
  }
};

/**
 * Add item to cart
 */
export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1, size = null, color = null } = req.body;
    
    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }
    
    // Find user's cart or create a new one
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }
    
    // Check if product already exists in cart with same size/color
    const existingItemIndex = cart.items.findIndex(item => 
      item.productId.toString() === productId && 
      item.size === size && 
      item.color === color
    );
    
    if (existingItemIndex > -1) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += parseInt(quantity);
    } else {
      // Add new item
      const productDetails = {
        title: product.title,
        price: product.variants && product.variants.length > 0 ? parseFloat(product.variants[0].price) : 0,
        image: product.images && product.images.length > 0 ? product.images[0] : null,
        slug: product.slug
      };
      
      // Get the variant SKU from the request or find it based on attributes
      let variantSku = req.body.variantSku;
      
      // If no variantSku provided, try to find the matching variant
      if (!variantSku && product.variants && product.variants.length > 0) {
        const matchingVariant = product.variants.find(v => 
          (!size || (v.attributes && v.attributes.get('size') === size)) && 
          (!color || (v.attributes && v.attributes.get('color') === color))
        );
        
        if (matchingVariant) {
          variantSku = matchingVariant.sku;
        } else {
          // Use the first variant as fallback
          variantSku = product.variants[0].sku;
        }
      }
      
      cart.items.push({
        productId,
        quantity: parseInt(quantity),
        size,
        color,
        variantSku, // Add variantSku to cart item
        gstRate: product.gstRate || 0, // Add GST rate from product
        productDetails
      });
    }
    
    await cart.save();
    
    // Return updated cart with populated product details including variants
    const updatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.productId',
        select: 'title price images slug variants'
      });
    
    logger.info(`Item added to cart for user ${userId}`);
    return res.status(200).json({
      success: true,
      data: updatedCart
    });
  } catch (error) {
    logger.error(`Error adding to cart: ${error.message}`);
    return next(new AppError('Failed to add item to cart', 500));
  }
};

/**
 * Update cart item quantity
 */
export const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    // Find user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }
    
    // Find the item in the cart
    const cartItem = cart.items.id(itemId);
    if (!cartItem) {
      return next(new AppError('Cart item not found', 404));
    }
    
    // Update quantity
    cartItem.quantity = parseInt(quantity);
    
    // Get the latest product data to update price and GST rate
    const product = await Product.findById(cartItem.productId);
    if (product) {
      // Update the GST rate
      cartItem.gstRate = product.gstRate || 0;
      
      // Update the stored product details with the latest price
      if (product.variants && product.variants.length > 0) {
        cartItem.productDetails.price = parseFloat(product.variants[0].price);
      }
    }
    
    await cart.save();
    
    // Return updated cart with populated product details including variants
    const updatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.productId',
        select: 'title price images slug variants'
      });
    
    logger.info(`Cart item updated for user ${userId}`);
    return res.status(200).json({
      success: true,
      data: updatedCart
    });
  } catch (error) {
    logger.error(`Error updating cart item: ${error.message}`);
    return next(new AppError('Failed to update cart item', 500));
  }
};

/**
 * Remove item from cart
 */
export const removeCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    
    // Find user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }
    
    // Find the item index
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return next(new AppError('Cart item not found', 404));
    }
    
    // Remove the item using pull operator
    cart.items.pull({ _id: itemId });
    await cart.save();
    
    // Return updated cart with populated product details including variants
    const updatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.productId',
        select: 'title price images slug variants'
      });
    
    logger.info(`Item removed from cart for user ${userId}`);
    return res.status(200).json({
      success: true,
      data: updatedCart
    });
  } catch (error) {
    logger.error(`Error removing cart item: ${error.message}`);
    return next(new AppError('Failed to remove cart item', 500));
  }
};

/**
 * Clear cart
 */
export const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Find user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }
    
    // Clear all items
    cart.items = [];
    await cart.save();
    
    logger.info(`Cart cleared for user ${userId}`);
    return res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    logger.error(`Error clearing cart: ${error.message}`);
    return next(new AppError('Failed to clear cart', 500));
  }
};