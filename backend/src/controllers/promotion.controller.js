import Promotion from '../models/promotion.model.js';
import Coupon from '../models/coupon.model.js';
import User from '../models/user.model.js';
import { AppError } from '../middlewares/error.middleware.js';
import { logger } from '../utils/logger.js';
import { sendCouponEmail } from '../services/email.service.js';

/**
 * Verify coupon code
 */
export const verifyCoupon = async (req, res, next) => {
  try {
    const { couponCode } = req.body;

    // Validate required fields
    if (!couponCode) {
      throw new AppError('Coupon code is required', 400);
    }

    // Find coupon in Coupon database
    let coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    let isPromotionCoupon = false;
    
    // If coupon not found in Coupon database, check in Promotion database
    if (!coupon) {
      // Find active promotion with matching coupon code
      const now = new Date();
      const promotion = await Promotion.findOne({
        active: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
        promotionType: 'coupon',
        // We'll check for coupon code in the promotion logic below
      });
      
      if (promotion) {
        // Check if this promotion has generated this coupon code
        // This would require checking if the coupon code matches the promotion's pattern
        // For simplicity, we'll just check if the coupon code starts with the promotion's prefix
        if (couponCode.toUpperCase().startsWith(promotion.couponPrefix)) {
          isPromotionCoupon = true;
          
          // Create a virtual coupon object from the promotion
          coupon = {
            code: couponCode.toUpperCase(),
            discountType: promotion.discountType === 'percentage' ? 'percent' : 'fixed',
            value: promotion.discountValue,
            minOrderValue: promotion.minOrderAmount || 0,
            usageLimit: promotion.maxUsageCount,
            usedCount: 0, // We don't track usage for promotion coupons in this implementation
            validFrom: promotion.startDate,
            validUntil: promotion.endDate
          };
        }
      }
      
      // If still no coupon found, return error
      if (!coupon) {
        return res.status(404).json({
          success: false,
          error: 'Invalid coupon code',
          message: 'The coupon code you entered is invalid or does not exist'
        });
      }
    }

    // Check if coupon is active - check if current date is between validFrom and validUntil
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return res.status(400).json({
        success: false,
        error: 'Coupon is expired or not yet active',
        message: 'This coupon is not valid at this time'
      });
    }

    // Check if coupon has reached usage limit (only for regular coupons, not promotion coupons)
    if (!isPromotionCoupon && coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        error: 'Coupon usage limit exceeded',
        message: 'This coupon has reached its maximum usage limit'
      });
    }

    // Return coupon details
    res.status(200).json({
      success: true,
      message: 'Coupon verified successfully',
      data: {
        discountType: coupon.discountType === 'percent' ? 'percentage' : 'fixed',
        discountValue: coupon.value,
        minimumPurchase: coupon.minOrderValue || 0,
        isPromotionCoupon: isPromotionCoupon
      }
    });
  } catch (error) {
    logger.error(`Error in verifyCoupon: ${error.message}`);
    next(error);
  }
};

/**
 * Create a new promotion
 */
export const createPromotion = async (req, res, next) => {
  try {
    const {
      name,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
      active,
      promotionType,
      couponPrefix,
      couponLength,
      couponExpireDays,
      minOrderAmount,
      maxUsageCount,
      image
    } = req.body;

    // Validate required fields
    if (!name || !discountType || discountValue === undefined || !startDate || !endDate) {
      throw new AppError('Missing required promotion fields', 400);
    }

    // Validate discount type
    if (discountType !== 'percentage' && discountType !== 'fixed') {
      throw new AppError('Discount type must be either percentage or fixed', 400);
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError('Invalid date format', 400);
    }

    if (start > end) {
      throw new AppError('Start date must be before end date', 400);
    }

    // Create promotion
    const promotion = new Promotion({
      name,
      description,
      discountType,
      discountValue,
      startDate: start,
      endDate: end,
      active: active !== undefined ? active : true,
      promotionType: promotionType || 'general',
      couponPrefix: couponPrefix || 'BG',
      couponLength: couponLength || 8,
      couponExpireDays: couponExpireDays || 30,
      minOrderAmount: minOrderAmount || 0,
      maxUsageCount: maxUsageCount || 1,
      image
    });

    await promotion.save();

    res.status(201).json({
      success: true,
      message: 'Promotion created successfully',
      data: promotion
    });
  } catch (error) {
    logger.error(`Error in createPromotion: ${error.message}`);
    next(error);
  }
};



/**
 * Get all promotions with optional filtering
 */
export const getPromotions = async (req, res, next) => {
  try {
    const { active, type, search } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by active status if provided
    if (active !== undefined) {
      query.active = active === 'true';
    }
    
    // Filter by promotion type if provided
    if (type) {
      query.promotionType = type;
    }
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query
    const promotions = await Promotion.find(query).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: promotions.length,
      data: promotions
    });
  } catch (error) {
    logger.error(`Error in getPromotions: ${error.message}`);
    next(error);
  }
};

/**
 * Get promotion by ID
 */
export const getPromotionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const promotion = await Promotion.findById(id);
    
    if (!promotion) {
      throw new AppError('Promotion not found', 404);
    }
    
    res.status(200).json({
      success: true,
      data: promotion
    });
  } catch (error) {
    logger.error(`Error in getPromotionById: ${error.message}`);
    next(error);
  }
};

/**
 * Update promotion
 */
export const updatePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
      active,
      promotionType,
      couponPrefix,
      couponLength,
      couponExpireDays,
      minOrderAmount,
      maxUsageCount,
      image
    } = req.body;
    
    // Find promotion
    const promotion = await Promotion.findById(id);
    
    if (!promotion) {
      throw new AppError('Promotion not found', 404);
    }
    
    // Update fields if provided
    if (name) promotion.name = name;
    if (description !== undefined) promotion.description = description;
    if (discountType) promotion.discountType = discountType;
    if (discountValue !== undefined) promotion.discountValue = discountValue;
    
    // Update dates if provided
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        throw new AppError('Invalid start date format', 400);
      }
      promotion.startDate = start;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        throw new AppError('Invalid end date format', 400);
      }
      promotion.endDate = end;
    }
    
    // Validate dates
    if (promotion.startDate > promotion.endDate) {
      throw new AppError('Start date must be before end date', 400);
    }
    
    // Update other fields
    if (active !== undefined) promotion.active = active;
    if (promotionType) promotion.promotionType = promotionType;
    if (couponPrefix) promotion.couponPrefix = couponPrefix;
    if (couponLength) promotion.couponLength = couponLength;
    if (couponExpireDays) promotion.couponExpireDays = couponExpireDays;
    if (minOrderAmount !== undefined) promotion.minOrderAmount = minOrderAmount;
    if (maxUsageCount !== undefined) promotion.maxUsageCount = maxUsageCount;
    if (image !== undefined) promotion.image = image;
    
    // Save updated promotion
    await promotion.save();
    
    res.status(200).json({
      success: true,
      message: 'Promotion updated successfully',
      data: promotion
    });
  } catch (error) {
    logger.error(`Error in updatePromotion: ${error.message}`);
    next(error);
  }
};


/**
 * Delete promotion
 */
export const deletePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const promotion = await Promotion.findById(id);
    
    if (!promotion) {
      throw new AppError('Promotion not found', 404);
    }
    
    await promotion.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Promotion deleted successfully'
    });
  } catch (error) {
    logger.error(`Error in deletePromotion: ${error.message}`);
    next(error);
  }
};

/**
 * Generate coupons for a promotion
 */
export const generateCoupons = async (req, res, next) => {
  try {
    const { promotionId, userIds } = req.body;
    
    // Validate required fields
    if (!promotionId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new AppError('Promotion ID and user IDs array are required', 400);
    }
    
    // Find promotion
    const promotion = await Promotion.findById(promotionId);
    
    if (!promotion) {
      throw new AppError('Promotion not found', 404);
    }
    
    // Check if promotion is of type coupon
    if (promotion.promotionType !== 'coupon') {
      throw new AppError('Only coupon type promotions can generate coupons', 400);
    }
    
    // Check if promotion is active
    if (!promotion.active) {
      throw new AppError('Cannot generate coupons for inactive promotion', 400);
    }
    
    // Find users with explicit selection of name and email fields
    const users = await User.find({ _id: { $in: userIds } }).select('_id name email');
    
    if (users.length === 0) {
      throw new AppError('No valid users found', 404);
    }
    
    // Generate coupons for each user
    const coupons = [];
    let successCount = 0;
    let failedCount = 0;
    
    for (const user of users) {
      try {
        // Generate unique coupon code
        const prefix = promotion.couponPrefix;
        const length = promotion.couponLength;
        const randomPart = Math.random().toString(36).substring(2, 2 + length);
        const code = `${prefix}${randomPart}`.toUpperCase();
        
        // Calculate expiry date
        const validFrom = new Date(promotion.startDate);
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + promotion.couponExpireDays);
        
        // Ensure validUntil doesn't exceed promotion end date
        if (validUntil > promotion.endDate) {
          validUntil.setTime(promotion.endDate.getTime());
        }
        
        // Map discount type from promotion to coupon
        let discountType;
        if (promotion.discountType === 'percentage') {
          discountType = 'percent';
        } else {
          discountType = 'fixed';
        }
        
        // Create coupon
        const coupon = new Coupon({
          code,
          discountType,
          value: promotion.discountValue,
          minOrderValue: promotion.minOrderAmount,
          usageLimit: promotion.maxUsageCount,
          validFrom,
          validUntil,
          userId: user._id,
          promotionId: promotion._id
        });
        
        await coupon.save();
        coupons.push(coupon);
        
        // Send email to user with coupon details
        await sendCouponEmail(user.email, user.name || 'Valued Customer', coupon, promotion);
        
        successCount++;
      } catch (error) {
        logger.error(`Error generating coupon for user ${user._id}: ${error.message}`);
        failedCount++;
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Coupons generated successfully',
      data: {
        successCount,
        failedCount,
        coupons
      }
    });
  } catch (error) {
    logger.error(`Error in generateCoupons: ${error.message}`);
    next(error);
  }
};
