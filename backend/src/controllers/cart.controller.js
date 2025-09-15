import mongoose from 'mongoose';
import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';
import Coupon from '../models/coupon.model.js';
import { AppError } from '../middlewares/error.middleware.js';
import { logger } from '../utils/logger.js';

/**
 * Helper function to add item to cart (used by both user and guest cart)
 */
const addItemToCart = async (cart, productId, quantity, size, color, req) => {
  // Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
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
    // Get the variant SKU from the request or find it based on attributes
    let variantSku = req && req.body && req.body.variantSku;
    let selectedVariant = null;
    
    // If no variantSku provided, try to find the matching variant
    if (product.variants && product.variants.length > 0) {
      if (variantSku) {
        selectedVariant = product.variants.find(v => v.sku === variantSku);
      }
      
      if (!selectedVariant) {
        selectedVariant = product.variants.find(v => 
          (!size || (v.attributes && v.attributes.get('size') === size)) && 
          (!color || (v.attributes && v.attributes.get('color') === color))
        );
      }
      
      if (!selectedVariant) {
        // Use the first variant as fallback
        selectedVariant = product.variants[0];
      }
    }
    
    // Calculate prices based on selected variant or product
    const price = selectedVariant ? 
      (isNaN(parseFloat(selectedVariant.price)) ? 0 : parseFloat(selectedVariant.price)) : 
      (isNaN(parseFloat(product.price)) ? 0 : parseFloat(product.price));
      
    const sellingPrice = selectedVariant ? 
      (isNaN(parseFloat(selectedVariant.sellingPrice)) ? price : parseFloat(selectedVariant.sellingPrice)) : 
      (isNaN(parseFloat(product.sellingPrice)) ? price : parseFloat(product.sellingPrice));
      
    const mrp = selectedVariant ? 
      (isNaN(parseFloat(selectedVariant.mrp)) ? price : parseFloat(selectedVariant.mrp)) : 
      (isNaN(parseFloat(product.mrp)) ? price : parseFloat(product.mrp));
    
    const productDetails = {
      title: product.title,
      price: price,
      sellingPrice: sellingPrice,
      mrp: mrp,
      image: product.images && product.images.length > 0 ? product.images[0] : null,
      slug: product.slug,
      gstRate: product.gstRate || 0 // Add GST rate to product details
    };
    
    if (!variantSku && selectedVariant) {
      variantSku = selectedVariant.sku;
    }
    
    // variantSku is already handled above
    
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
  return await Cart.findById(cart._id)
    .populate({
      path: 'items.productId',
      select: 'title price images slug variants'
    });
};

/**
 * Helper function to update cart item (used by both user and guest cart)
 */
const updateCartItemHelper = async (cart, itemId, quantity) => {
  // Find the item in the cart
  const cartItem = cart.items.id(itemId);
  if (!cartItem) {
    throw new AppError('Cart item not found', 404);
  }
  
  // Update quantity
  cartItem.quantity = parseInt(quantity);
  
  // Get the latest product data to update price and GST rate
  const product = await Product.findById(cartItem.productId);
  if (product) {
    // Update the GST rate
    cartItem.gstRate = product.gstRate || 0;
    
    // Find the matching variant based on SKU or attributes
    let selectedVariant = null;
    if (product.variants && product.variants.length > 0) {
      if (cartItem.variantSku) {
        selectedVariant = product.variants.find(v => v.sku === cartItem.variantSku);
      }
      
      if (!selectedVariant) {
        selectedVariant = product.variants.find(v => 
          (!cartItem.size || (v.attributes && v.attributes.get('size') === cartItem.size)) && 
          (!cartItem.color || (v.attributes && v.attributes.get('color') === cartItem.color))
        );
      }
      
      if (!selectedVariant) {
        // Use the first variant as fallback
        selectedVariant = product.variants[0];
      }
    }
    
    // Calculate prices based on selected variant or product
    const price = selectedVariant ? 
      (isNaN(parseFloat(selectedVariant.price)) ? 0 : parseFloat(selectedVariant.price)) : 
      (isNaN(parseFloat(product.price)) ? 0 : parseFloat(product.price));
      
    const sellingPrice = selectedVariant ? 
      (isNaN(parseFloat(selectedVariant.sellingPrice)) ? price : parseFloat(selectedVariant.sellingPrice)) : 
      (isNaN(parseFloat(product.sellingPrice)) ? price : parseFloat(product.sellingPrice));
      
    const mrp = selectedVariant ? 
      (isNaN(parseFloat(selectedVariant.mrp)) ? price : parseFloat(selectedVariant.mrp)) : 
      (isNaN(parseFloat(product.mrp)) ? price : parseFloat(product.mrp));
    
    // Update the stored product details with the latest prices and GST rate
    cartItem.productDetails.price = price;
    cartItem.productDetails.sellingPrice = sellingPrice;
    cartItem.productDetails.mrp = mrp;
    cartItem.productDetails.gstRate = product.gstRate || 0;
    
    // Update the GST rate in the cart item
    cartItem.gstRate = product.gstRate || 0;
  }
  
  await cart.save();
  
  // Return updated cart with populated product details including variants
  return await Cart.findById(cart._id)
    .populate({
      path: 'items.productId',
      select: 'title price images slug variants'
    });
};

// All controller functions are exported individually with 'export' keyword

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
 * Get a guest cart by guestSessionId
 */
export const getGuestCart = async (req, res, next) => {
  try {
    const { guestSessionId } = req.params;
    
    if (!guestSessionId) {
      return next(new AppError('Guest session ID is required', 400));
    }
    
    // Find cart or create a new one if it doesn't exist
    let cart = await Cart.findOne({ guestSessionId })
      .populate({
        path: 'items.productId',
        select: 'title price images slug variants'
      });
    
    if (!cart) {
      cart = new Cart({ guestSessionId, items: [] });
      await cart.save();
    }
    
    logger.info(`Cart retrieved for guest session ${guestSessionId}`);
    return res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    logger.error(`Error getting guest cart: ${error.message}`);
    return next(new AppError('Failed to get guest cart', 500));
  }
};

/**
 * Add item to cart
 */
export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1, size = null, color = null, variantSku = null } = req.body;
    
    // Find user's cart or create a new one
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }
    
    // Use helper function to add item to cart
    const updatedCart = await addItemToCart(cart, productId, quantity, size, color, req);
    
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
 * Add item to guest cart
 */
export const addToGuestCart = async (req, res, next) => {
  try {
    const { guestSessionId } = req.params;
    const { productId, quantity = 1, size = null, color = null, variantSku = null } = req.body;
    
    if (!guestSessionId) {
      return next(new AppError('Guest session ID is required', 400));
    }
    
    // Find guest's cart or create a new one
    let cart = await Cart.findOne({ guestSessionId });
    if (!cart) {
      cart = new Cart({ guestSessionId, items: [] });
    }
    
    // Use helper function to add item to cart
    const updatedCart = await addItemToCart(cart, productId, quantity, size, color, req);
    
    logger.info(`Item added to cart for guest session ${guestSessionId}`);
    return res.status(200).json({
      success: true,
      data: updatedCart
    });
  } catch (error) {
    logger.error(`Error adding to guest cart: ${error.message}`);
    return next(new AppError('Failed to add item to guest cart', 500));
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
    
    // Use helper function to update cart item
    const updatedCart = await updateCartItemHelper(cart, itemId, quantity);
    
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
 * Update guest cart item quantity
 */
export const updateGuestCartItem = async (req, res, next) => {
  try {
    const { guestSessionId, itemId } = req.params;
    const { quantity } = req.body;
    
    if (!guestSessionId) {
      return next(new AppError('Guest session ID is required', 400));
    }
    
    // Find guest's cart
    const cart = await Cart.findOne({ guestSessionId });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }
    
    // Use helper function to update cart item
    const updatedCart = await updateCartItemHelper(cart, itemId, quantity);
    
    logger.info(`Cart item updated for guest session ${guestSessionId}`);
    return res.status(200).json({
      success: true,
      data: updatedCart
    });
  } catch (error) {
    logger.error(`Error updating guest cart item: ${error.message}`);
    return next(new AppError('Failed to update guest cart item', 500));
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
 * Remove item from guest cart
 */
export const removeGuestCartItem = async (req, res, next) => {
  try {
    const { guestSessionId, itemId } = req.params;
    
    if (!guestSessionId) {
      return next(new AppError('Guest session ID is required', 400));
    }
    
    // Find guest's cart
    const cart = await Cart.findOne({ guestSessionId });
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
    
    logger.info(`Item removed from cart for guest session ${guestSessionId}`);
    return res.status(200).json({
      success: true,
      data: updatedCart
    });
  } catch (error) {
    logger.error(`Error removing guest cart item: ${error.message}`);
    return next(new AppError('Failed to remove item from guest cart', 500));
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
    cart.coupon = null;
    cart.couponDiscount = 0;
    await cart.save();
    
    logger.info(`Cart cleared for user ${userId}`);
    return res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: cart
    });
  } catch (error) {
    logger.error(`Error clearing cart: ${error.message}`);
    return next(new AppError('Failed to clear cart', 500));
  }
};

/**
 * Clear guest cart
 */
export const clearGuestCart = async (req, res, next) => {
  try {
    const { guestSessionId } = req.params;
    
    if (!guestSessionId) {
      return next(new AppError('Guest session ID is required', 400));
    }
    
    const cart = await Cart.findOne({ guestSessionId });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }
    
    cart.items = [];
    cart.coupon = null;
    cart.couponDiscount = 0;
    await cart.save();
    
    logger.info(`Cart cleared for guest session ${guestSessionId}`);
    return res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: cart
    });
  } catch (error) {
    logger.error(`Error clearing guest cart: ${error.message}`);
    return next(new AppError('Failed to clear guest cart', 500));
  }
};

/**
 * Apply coupon to cart
 */
export const applyCoupon = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;
    
    if (!code) {
      return next(new AppError('Coupon code is required', 400));
    }
    
    // Find user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }
    
    // Calculate cart subtotal for coupon validation
    let subtotal = 0;
    for (const item of cart.items) {
      // Use sellingPrice for consistency with frontend calculation
      const itemPrice = item.productDetails.sellingPrice || item.productDetails.price || 0;
      subtotal += itemPrice * item.quantity;
    }
    
    // Verify coupon with coupon service
    try {
      // Find coupon in database
      const coupon = await Coupon.findOne({ code: code.toUpperCase() });
      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Invalid coupon code',
          error: {
            code: 'INVALID_COUPON',
            message: 'The coupon code you entered is invalid or does not exist'
          }
        });
      }
      
      // Check if coupon is active - check if current date is between validFrom and validUntil
      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validUntil) {
        return res.status(400).json({
          success: false,
          message: 'Coupon is expired or not yet active',
          error: {
            code: 'INACTIVE_COUPON',
            message: 'This coupon is not valid at this time'
          }
        });
      }
      
      // Validate coupon against cart value
      const validationResult = coupon.isValid(subtotal);
      
      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          message: validationResult.reason || 'Coupon validation failed',
          error: {
            code: validationResult.reason || 'VALIDATION_FAILED',
            message: validationResult.message || 'The coupon cannot be applied to this order'
          }
        });
      }
      
      // Calculate discount
      let discount = 0;
      if (coupon.discountType === 'percent') {
        discount = (subtotal * coupon.value) / 100;
        
        // If there's a maximum discount value set
        if (coupon.maxDiscountValue && discount > coupon.maxDiscountValue) {
          discount = coupon.maxDiscountValue;
        }
      } else {
        discount = coupon.value;
      }
      
      // Ensure discount doesn't exceed order value
      if (discount > subtotal) {
        discount = subtotal;
      }
      
      // Apply coupon to cart
      cart.coupon = code.toUpperCase();
      cart.couponDiscount = parseFloat(discount.toFixed(2));
      
      await cart.save();
      
      logger.info(`Coupon ${code} applied to cart for user ${userId}`);
      return res.status(200).json({
        success: true,
        message: 'Coupon applied successfully',
        data: {
          cart,
          couponDetails: {
            code: coupon.code,
            discountType: coupon.discountType,
            value: coupon.value,
            discount: cart.couponDiscount,
            discountedTotal: parseFloat((subtotal - cart.couponDiscount).toFixed(2))
          }
        }
      });
    } catch (error) {
      logger.error(`Error validating coupon: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to validate coupon',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'There was a problem validating your coupon. Please try again.'
        }
      });
    }
  } catch (error) {
    logger.error(`Error applying coupon: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to apply coupon',
      error: {
        code: 'COUPON_APPLICATION_ERROR',
        message: 'There was a problem applying your coupon. Please try again.'
      }
    });
  }
};

/**
 * Apply coupon to guest cart
 */
export const applyGuestCoupon = async (req, res, next) => {
  try {
    const { guestSessionId } = req.params;
    const { code } = req.body;
    
    if (!guestSessionId) {
      return next(new AppError('Guest session ID is required', 400));
    }
    
    if (!code) {
      return next(new AppError('Coupon code is required', 400));
    }
    
    // Find guest's cart
    const cart = await Cart.findOne({ guestSessionId });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }
    
    // Calculate cart subtotal for coupon validation
    let subtotal = 0;
    for (const item of cart.items) {
      // Use sellingPrice for consistency with frontend calculation
      const itemPrice = item.productDetails.sellingPrice || item.productDetails.price || 0;
      subtotal += itemPrice * item.quantity;
    }
    
    // Verify coupon with coupon service
    try {
      // Find coupon in database
      const coupon = await Coupon.findOne({ code: code.toUpperCase() });
      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Invalid coupon code',
          error: {
            code: 'INVALID_COUPON',
            message: 'The coupon code you entered is invalid or does not exist'
          }
        });
      }
      
      // Check if coupon is active - check if current date is between validFrom and validUntil
      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validUntil) {
        return res.status(400).json({
          success: false,
          message: 'Coupon is expired or not yet active',
          error: {
            code: 'INACTIVE_COUPON',
            message: 'This coupon is not valid at this time'
          }
        });
      }
      
      // Validate coupon against cart value
      const validationResult = coupon.isValid(subtotal);
      
      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          message: validationResult.reason || 'Coupon validation failed',
          error: {
            code: validationResult.reason || 'VALIDATION_FAILED',
            message: validationResult.message || 'The coupon cannot be applied to this order'
          }
        });
      }
      
      // Calculate discount
      let discount = 0;
      if (coupon.discountType === 'percent') {
        discount = (subtotal * coupon.value) / 100;
        
        // If there's a maximum discount value set
        if (coupon.maxDiscountValue && discount > coupon.maxDiscountValue) {
          discount = coupon.maxDiscountValue;
        }
      } else {
        discount = coupon.value;
      }
      
      // Ensure discount doesn't exceed order value
      if (discount > subtotal) {
        discount = subtotal;
      }
      
      // Apply coupon to cart
      cart.coupon = code.toUpperCase();
      cart.couponDiscount = parseFloat(discount.toFixed(2));
      
      await cart.save();
      
      logger.info(`Coupon ${code} applied to cart for guest session ${guestSessionId}`);
      return res.status(200).json({
        success: true,
        message: 'Coupon applied successfully',
        data: {
          cart,
          couponDetails: {
            code: coupon.code,
            discountType: coupon.discountType,
            value: coupon.value,
            discount: cart.couponDiscount,
            discountedTotal: parseFloat((subtotal - cart.couponDiscount).toFixed(2))
          }
        }
      });
    } catch (error) {
      logger.error(`Error validating coupon: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to validate coupon',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'There was a problem validating your coupon. Please try again.'
        }
      });
    }
  } catch (error) {
    logger.error(`Error applying coupon to guest cart: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to apply coupon',
      error: {
        code: 'COUPON_APPLICATION_ERROR',
        message: 'There was a problem applying your coupon. Please try again.'
      }
    });
  }
};

/**
 * Remove coupon from cart
 */
export const removeCoupon = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Find user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }
    
    // Remove coupon and discount
    cart.coupon = null;
    cart.couponDiscount = 0;
    await cart.save();
    
    logger.info(`Coupon removed from cart for user ${userId}`);
    return res.status(200).json({
      success: true,
      message: 'Coupon removed successfully',
      data: cart
    });
  } catch (error) {
    logger.error(`Error removing coupon: ${error.message}`);
    return next(new AppError('Failed to remove coupon', 500));
  }
};

/**
 * Remove coupon from guest cart
 */
export const removeGuestCoupon = async (req, res, next) => {
  try {
    const { guestSessionId } = req.params;
    
    if (!guestSessionId) {
      return next(new AppError('Guest session ID is required', 400));
    }
    
    // Find guest's cart
    const cart = await Cart.findOne({ guestSessionId });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }
    
    // Remove coupon and discount
    cart.coupon = null;
    cart.couponDiscount = 0;
    await cart.save();
    
    logger.info(`Coupon removed from cart for guest session ${guestSessionId}`);
    return res.status(200).json({
      success: true,
      message: 'Coupon removed successfully',
      data: cart
    });
  } catch (error) {
    logger.error(`Error removing coupon from guest cart: ${error.message}`);
    return next(new AppError('Failed to remove coupon from guest cart', 500));
  }
};

// End of cart controller