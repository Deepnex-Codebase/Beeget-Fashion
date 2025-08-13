import Review from '../models/review.model.js';
import Product from '../models/product.model.js';
import User from '../models/user.model.js';
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
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', rating, with_photos } = req.query;

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
    
    // Build filter query
    const filterQuery = { product: productId };
    
    // Add rating filter if provided
    if (rating) {
      filterQuery.rating = Number(rating);
    }
    
    // Add with_photos filter if provided
    if (with_photos === 'true') {
      filterQuery.images = { $exists: true, $not: { $size: 0 } };
    }
    
    // Get reviews for the product with filters
    const reviews = await Review.find(filterQuery)
      .populate('user', 'name email profileImage')
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));
      
    // Get total count for pagination with the same filters
    const total = await Review.countDocuments(filterQuery);

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
    const isAdmin = req.user.roles && req.user.roles.includes('admin');

    // Find review
    const review = await Review.findById(id);
    if (!review) {
      throw new AppError('Review not found', 404);
    }

    // Check if user is the owner of the review or an admin
    if (!isAdmin) {
      // Only check ownership if not admin and both user IDs exist
      if (!review.user || !userId) {
        throw new AppError('User identification error', 400);
      }
      
      // Compare user IDs
      const reviewUserId = review.user.toString ? review.user.toString() : String(review.user);
      const currentUserId = userId.toString ? userId.toString() : String(userId);
      
      if (reviewUserId !== currentUserId) {
        throw new AppError('You are not authorized to delete this review', 403);
      }
    }

    // Delete review images from storage
    if (review.images && review.images.length > 0) {
      review.images.forEach(imageUrl => {
        // Check if imageUrl is valid before processing
        if (imageUrl && typeof imageUrl === 'string') {
          try {
            // Extract file path from URL
            const urlPath = new URL(imageUrl).pathname;
            const filePath = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;
            if (filePath) {
              deleteFile(filePath);
            }
          } catch (err) {
            console.error(`Error processing image URL: ${imageUrl}`, err);
            // Continue with next image even if this one fails
          }
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
      .populate('product', 'title images price')
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

/**
 * Admin: Create a review on behalf of a user
 */
export const adminCreateReview = async (req, res, next) => {
  try {
    const { productId, rating, review, userId } = req.body;
    
    // Validate required fields
    if (!productId || !rating || !review || !userId) {
      throw new AppError('Missing required review fields', 400);
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({ user: userId, product: productId });
    if (existingReview) {
      throw new AppError('This user has already reviewed this product', 400);
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
      message: 'Review created successfully by admin',
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
 * Admin: Get all reviews with filtering options
 */
export const adminGetAllReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', productId, userId, rating } = req.query;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;
    
    // Build filter query
    const filterQuery = {};
    
    // Add product filter if provided
    if (productId) {
      filterQuery.product = productId;
    }
    
    // Add user filter if provided
    if (userId) {
      filterQuery.user = userId;
    }
    
    // Add rating filter if provided
    if (rating) {
      filterQuery.rating = Number(rating);
    }
    
    // Get reviews with filters
    const reviews = await Review.find(filterQuery)
      .populate('user', 'name email profileImage')
      .populate('product', 'title images price')
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));
      
    // Get total count for pagination with the same filters
    const total = await Review.countDocuments(filterQuery);

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