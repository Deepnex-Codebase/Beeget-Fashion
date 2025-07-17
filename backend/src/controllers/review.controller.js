import Review from '../models/review.model.js';
import Product from '../models/product.model.js';
import { AppError } from '../middlewares/error.middleware.js';
import { logger } from '../utils/logger.js';
import { deleteFile, getFileUrl } from '../config/multer.js';
import mongoose from 'mongoose';

/**
 * Create a new review
 */
export const createReview = async (req, res, next) => {
  try {
    const { productId, rating, review } = req.body;
    
    // Check if user exists in request
    if (!req.user) {
      throw new AppError('User authentication required', 401);
    }
    
    // Get user ID from the JWT token (stored as 'id' not '_id')
    const userId = req.user.id;
    
    // Log for debugging
    logger.info(`Creating review for product ${productId} by user ${userId}`);
    logger.info(`Request user object: ${JSON.stringify(req.user)}`);
    
    if (!userId) {
      throw new AppError('User ID is required', 400);
    }

    // Validate required fields
    if (!productId || !rating || !review) {
      throw new AppError('Missing required review fields', 400);
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({ user: userId, product: productId });
    if (existingReview) {
      throw new AppError('You have already reviewed this product', 400);
    }

    // Process uploaded images
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        // Store the URL as string
        images.push(getFileUrl(file.path));
      });
    }

    // Create new review
    const newReview = new Review({
      product: productId,
      user: userId,
      rating: parseInt(rating),
      review,
      images
    });

    await newReview.save();

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: {
        review: newReview
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
 * Get reviews for a product
 */
export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    // Get reviews for the product
    const reviews = await Review.find({ product: productId })
      .populate('user', 'name email profileImage')
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await Review.countDocuments({ product: productId });

    // Calculate average rating
    const ratingStats = await Review.aggregate([
      { $match: { product: mongoose.Types.ObjectId.createFromHexString(productId) } },
      { 
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
        }
      }
    ]);

    const stats = ratingStats.length > 0 ? ratingStats[0] : {
      averageRating: 0,
      totalReviews: 0,
      rating5: 0,
      rating4: 0,
      rating3: 0,
      rating2: 0,
      rating1: 0
    };

    // Return reviews
    res.status(200).json({
      success: true,
      data: {
        reviews,
        stats,
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
 * Update a review
 */
export const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, review, removeImages } = req.body;
    const userId = req.user._id;

    // Find review
    const existingReview = await Review.findById(id);
    if (!existingReview) {
      throw new AppError('Review not found', 404);
    }

    // Check if user is the owner of the review
    if (existingReview.user.toString() !== userId.toString()) {
      throw new AppError('You are not authorized to update this review', 403);
    }

    // Update fields if provided
    if (rating) existingReview.rating = parseInt(rating);
    if (review) existingReview.review = review;

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

        // Remove images from review
        existingReview.images = existingReview.images.filter(imageUrl => 
          !imagesToRemove.includes(imageUrl)
        );
      }
    }

    // Add new images if uploaded
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        // Store the URL as string
        existingReview.images.push(getFileUrl(file.path));
      });
    }

    await existingReview.save();

    // Return updated review
    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: {
        review: existingReview
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
 * Delete a review
 */
export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    // Find review
    const review = await Review.findById(id);
    if (!review) {
      throw new AppError('Review not found', 404);
    }

    // Check if user is the owner of the review or an admin
    if (review.user.toString() !== userId.toString() && !isAdmin) {
      throw new AppError('You are not authorized to delete this review', 403);
    }

    // Delete review images from storage
    if (review.images && review.images.length > 0) {
      review.images.forEach(imageUrl => {
        // Extract file path from URL
        const urlPath = new URL(imageUrl).pathname;
        const filePath = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;
        if (filePath) {
          deleteFile(filePath);
        }
      });
    }

    // Delete review from database
    await Review.findByIdAndDelete(id);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's reviews
 */
export const getUserReviews = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    // Get user's reviews
    const reviews = await Review.find({ user: userId })
      .populate('product', 'title images')
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await Review.countDocuments({ user: userId });

    // Return reviews
    res.status(200).json({
      success: true,
      data: {
        reviews,
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