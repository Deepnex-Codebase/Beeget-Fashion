import Coupon from '../models/coupon.model.js';
import { AppError } from '../middlewares/error.middleware.js';
import { logger } from '../utils/logger.js';

/**
 * Create a new coupon
 */
export const createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      type,
      value,
      minOrderValue,
      maxUsage,
      maxUsagePerUser,
      startDate,
      endDate,
      isActive
    } = req.body;

    // Validate required fields
    if (!code || !type || value === undefined) {
      throw new AppError('Code, type, and value are required', 400);
    }

    // Validate coupon type
    if (type !== 'percentage' && type !== 'fixed') {
      throw new AppError('Coupon type must be either percentage or fixed', 400);
    }

    // Validate percentage value
    if (type === 'percentage' && (value <= 0 || value > 100)) {
      throw new AppError('Percentage value must be between 1 and 100', 400);
    }

    // Validate fixed value
    if (type === 'fixed' && value <= 0) {
      throw new AppError('Fixed value must be greater than 0', 400);
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      throw new AppError('Coupon code already exists', 409);
    }

    // Map type to discountType
    let discountType;
    if (type === 'percentage') {
      discountType = 'percent';
    } else if (type === 'fixed') {
      discountType = 'fixed';
    }

    // Set default dates if not provided
    const now = new Date();
    const validFrom = startDate ? new Date(startDate) : now;
    
    // Set validUntil to at least one day in the future if not provided or if it's in the past
    let validUntil;
    if (endDate) {
      validUntil = new Date(endDate);
      // If the provided end date is in the past, set it to one year from now
      if (validUntil <= now) {
        validUntil = new Date(now.setFullYear(now.getFullYear() + 1));
      }
    } else {
      // Default to one year from now
      validUntil = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    }

    // Create new coupon
    const coupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      value,
      minOrderValue: minOrderValue || 0,
      usageLimit: maxUsage || null,
      usedCount: 0,
      validFrom,
      validUntil
    });

    await coupon.save();

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: {
        coupon
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all coupons with pagination and filters
 */
export const getCoupons = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      isActive,
      search
    } = req.query;

    // Build query
    const query = {};

    // Add active filter if provided
    if (isActive !== undefined) {
      const now = new Date();
      if (isActive === 'true') {
        // Active coupons: current date is between validFrom and validUntil
        query.validFrom = { $lte: now };
        query.validUntil = { $gte: now };
      } else {
        // Inactive coupons: current date is outside validFrom and validUntil
        query.$or = [
          { validFrom: { $gt: now } },
          { validUntil: { $lt: now } }
        ];
      }
    }

    // Add search filter if provided
    if (search) {
      // If we already have $or from isActive filter
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { $or: [
            { code: { $regex: search, $options: 'i' } },
            { discountType: { $regex: search, $options: 'i' } }
          ]}
        ];
        delete query.$or;
      } else {
        query.$or = [
          { code: { $regex: search, $options: 'i' } },
          { discountType: { $regex: search, $options: 'i' } }
        ];
      }
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    // Execute query with pagination and sorting
    const coupons = await Coupon.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await Coupon.countDocuments(query);

    // Return coupons
    res.status(200).json({
      success: true,
      data: {
        coupons,
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
 * Get coupon by ID
 */
export const getCouponById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find coupon
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }

    // Return coupon
    res.status(200).json({
      success: true,
      data: {
        coupon
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update coupon
 */
export const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      type,
      value,
      minOrderValue,
      maxUsage,
      maxUsagePerUser,
      startDate,
      endDate,
      isActive
    } = req.body;

    // Find coupon
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }

    // Validate coupon type if provided
    if (type && type !== 'percentage' && type !== 'fixed') {
      throw new AppError('Coupon type must be either percentage or fixed', 400);
    }

    // Validate percentage value if provided
    if (type === 'percentage' && value !== undefined && (value <= 0 || value > 100)) {
      throw new AppError('Percentage value must be between 1 and 100', 400);
    }

    // Validate fixed value if provided
    if (type === 'fixed' && value !== undefined && value <= 0) {
      throw new AppError('Fixed value must be greater than 0', 400);
    }

    // Update fields if provided
    if (type) {
      if (type === 'percentage') {
        coupon.discountType = 'percent';
      } else if (type === 'fixed') {
        coupon.discountType = 'fixed';
      }
    }
    if (value !== undefined) coupon.value = value;
    if (minOrderValue !== undefined) coupon.minOrderValue = minOrderValue;
    if (maxUsage !== undefined) coupon.usageLimit = maxUsage;
    
    // Update dates with validation
    const now = new Date();
    if (startDate) {
      coupon.validFrom = new Date(startDate);
    }
    
    if (endDate) {
      const newValidUntil = new Date(endDate);
      // If the provided end date is in the past, set it to one year from now
      if (newValidUntil <= now) {
        coupon.validUntil = new Date(new Date().setFullYear(now.getFullYear() + 1));
      } else {
        coupon.validUntil = newValidUntil;
      }
    }

    await coupon.save();

    // Return updated coupon
    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      data: {
        coupon
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete coupon
 */
export const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find and delete coupon
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate coupon
 */
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderValue, userId } = req.body;

    // Validate required fields
    if (!code) {
      throw new AppError('Coupon code is required', 400);
    }

    if (!orderValue || isNaN(orderValue)) {
      throw new AppError('Valid order value is required', 400);
    }

    // Find coupon
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

    // Validate coupon
    const validationResult = coupon.isValid(orderValue, userId);

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
      discount = (orderValue * coupon.value) / 100;
      
      // If there's a maximum discount value set
      if (coupon.maxDiscountValue && discount > coupon.maxDiscountValue) {
        discount = coupon.maxDiscountValue;
      }
    } else {
      discount = coupon.value;
    }

    // Ensure discount doesn't exceed order value
    if (discount > orderValue) {
      discount = orderValue;
    }

    // Return coupon details with calculated discount
    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        coupon: {
          _id: coupon._id,
          code: coupon.code,
          discountType: coupon.discountType,
          value: coupon.value,
          minOrderValue: coupon.minOrderValue,
          discount: parseFloat(discount.toFixed(2)),
          discountedTotal: parseFloat((orderValue - discount).toFixed(2))
        }
      }
    });
  } catch (error) {
    logger.error('Error validating coupon:', error);
    next(error);
  }
};