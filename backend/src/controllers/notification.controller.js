import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import Promotion from '../models/promotion.model.js';
import { AppError } from '../middlewares/error.middleware.js';
import { logger } from '../utils/logger.js';
import { sendCampaignEmail, initializeEmailTransporter } from '../services/email.service.js';

/**
 * Create a new notification and send to all users
 */
export const createNotification = async (req, res, next) => {
  try {
    const {
      title,
      message,
      type,
      link,
      image,
      promotionId
    } = req.body;

    // Validate required fields
    if (!title || !message) {
      throw new AppError('Title and message are required', 400);
    }

    // Validate promotion ID if type is promotion
    if (type === 'promotion' && !promotionId) {
      throw new AppError('Promotion ID is required for promotion notifications', 400);
    }

    // Check if promotion exists if promotionId is provided
    let promotion;
    if (promotionId) {
      promotion = await Promotion.findById(promotionId);
      if (!promotion) {
        throw new AppError('Promotion not found', 404);
      }
      
      // Check if promotion is active
      if (!promotion.isActive()) {
        throw new AppError('Cannot create notification for inactive promotion', 400);
      }
    }

    // Create notification
    const notification = new Notification({
      title,
      message,
      type: type || 'update',
      link,
      image,
      promotionId,
      createdBy: req.user ? req.user._id : null,
      active: true
    });

    await notification.save();

    // Send email notification to all users
    try {
      // Initialize email transporter if not already initialized
      initializeEmailTransporter();
      
      // Get all verified users' emails
      const users = await User.find({ isVerified: true }, 'email');
      const emails = users.map(user => user.email);
      
      if (emails.length > 0) {
        // Prepare HTML content based on notification type
        let htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333; text-align: center;">Begget Fashion</h2>
            <h3 style="color: #333;">${title}</h3>
            <p style="margin-bottom: 20px;">${message}</p>
        `;
        
        // Add promotion details if it's a promotion notification
        if (type === 'promotion' && promotion) {
          htmlContent += `
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <h4 style="margin-top: 0;">Promotion Details</h4>
              <p><strong>Name:</strong> ${promotion.name}</p>
              <p><strong>Discount:</strong> ${promotion.discountType === 'percentage' ? `${promotion.discountValue}%` : `₹${promotion.discountValue}`}</p>
              <p><strong>Valid Until:</strong> ${new Date(promotion.endDate).toLocaleDateString()}</p>
            </div>
          `;
        }
        
        // Add link if provided
        if (link) {
          htmlContent += `
            <p>
              <a href="${link}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Learn More</a>
            </p>
          `;
        }
        
        // Add image if provided
        if (image) {
          htmlContent += `
            <div style="margin-top: 20px;">
              <img src="${image}" alt="Notification Image" style="max-width: 100%; height: auto; border-radius: 5px;">
            </div>
          `;
        }
        
        // Close the HTML content
        htmlContent += `
            <p style="margin-top: 20px; font-size: 12px; color: #777;">You received this email because you are subscribed to notifications from Begget Fashion.</p>
          </div>
        `;
        
        // Send the email to all users
        await sendCampaignEmail(
          emails,
          title,
          htmlContent
        );
        
        logger.info(`Notification email sent to ${emails.length} users`);
      }
    } catch (emailError) {
      // Log the error but don't fail the request
      logger.error(`Error sending notification emails: ${emailError.message}`);
    }

    res.status(201).json({
      success: true,
      message: 'Notification created and sent to all users successfully',
      data: notification
    });
  } catch (error) {
    logger.error(`Error in createNotification: ${error.message}`);
    next(error);
  }
};

/**
 * Get all notifications with pagination, search and filtering
 */
export const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, type } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by type if provided
    if (type) {
      query.type = type;
    }
    
    // Search in title and message if search term is provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination values
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'name email')
      .populate('promotionId', 'name discountType discountValue');
    
    // Get total count for pagination
    const total = await Notification.countDocuments(query);
    
    // Add promotion name to notification objects
    const notificationsWithPromotion = notifications.map(notification => {
      const notificationObj = notification.toObject();
      if (notificationObj.promotionId) {
        notificationObj.promotionName = notificationObj.promotionId.name;
      }
      return notificationObj;
    });
    
    res.status(200).json({
      success: true,
      data: notificationsWithPromotion,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error(`Error in getNotifications: ${error.message}`);
    next(error);
  }
};

/**
 * Get a single notification by ID
 */
export const getNotificationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findById(id)
      .populate('createdBy', 'name email')
      .populate('promotionId', 'name discountType discountValue');
    
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    
    // Add promotion name to notification object
    const notificationObj = notification.toObject();
    if (notificationObj.promotionId) {
      notificationObj.promotionName = notificationObj.promotionId.name;
    }
    
    res.status(200).json({
      success: true,
      data: notificationObj
    });
  } catch (error) {
    logger.error(`Error in getNotificationById: ${error.message}`);
    next(error);
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findById(id);
    
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    
    await Notification.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    logger.error(`Error in deleteNotification: ${error.message}`);
    next(error);
  }
};

/**
 * Mark notification as read for a user
 */
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const notification = await Notification.findById(id);
    
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    
    // Check if notification is already read by user
    if (notification.read.includes(userId)) {
      return res.status(200).json({
        success: true,
        message: 'Notification already marked as read'
      });
    }
    
    // Add user to read array
    notification.read.push(userId);
    await notification.save();
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    logger.error(`Error in markNotificationAsRead: ${error.message}`);
    next(error);
  }
};

/**
 * Get notifications for current user
 */
export const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, unreadOnly = false } = req.query;
    
    // Build query
    const query = { active: true };
    
    // Filter for unread notifications if requested
    if (unreadOnly === 'true') {
      query.read = { $ne: userId };
    }
    
    // Calculate pagination values
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('promotionId', 'name discountType discountValue');
    
    // Get total count for pagination
    const total = await Notification.countDocuments(query);
    
    // Add read status and promotion name to notification objects
    const notificationsWithStatus = notifications.map(notification => {
      const notificationObj = notification.toObject();
      notificationObj.isRead = notification.read.includes(userId);
      if (notificationObj.promotionId) {
        notificationObj.promotionName = notificationObj.promotionId.name;
      }
      return notificationObj;
    });
    
    res.status(200).json({
      success: true,
      data: notificationsWithStatus,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error(`Error in getUserNotifications: ${error.message}`);
    next(error);
  }
};

/**
 * Get unread notification count for current user
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Count notifications where user ID is not in read array
    const count = await Notification.countDocuments({
      active: true,
      read: { $ne: userId }
    });
    
    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    logger.error(`Error in getUnreadCount: ${error.message}`);
    next(error);
  }
};