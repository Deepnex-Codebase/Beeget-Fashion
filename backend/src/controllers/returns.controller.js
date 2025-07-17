import Return from '../models/return.model.js';
import Order from '../models/order.model.js';
import { AppError } from '../middlewares/error.middleware.js';
import { logger } from '../utils/logger.js';
import paymentService from '../services/payment.service.js';

/**
 * Create a new return request
 */
export const createReturn = async (req, res, next) => {
  try {
    const { orderId, items } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Return must contain order ID and at least one item', 400);
    }

    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Check if user owns the order or is admin
    if (order.userId.toString() !== userId && !req.user.roles.includes('admin')) {
      throw new AppError('Unauthorized to create return for this order', 403);
    }

    // Check if order is delivered
    if (order.orderStatus !== 'delivered') {
      throw new AppError('Only delivered orders can be returned', 400);
    }

    // Check if return already exists for this order
    const existingReturn = await Return.findOne({ orderId });
    if (existingReturn) {
      throw new AppError('A return request already exists for this order', 400);
    }

    // Create new return request
    const returnRequest = new Return({
      orderId,
      userId,
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        reason: item.reason,
        description: item.description
      }))
    });

    // Save return request
    await returnRequest.save();

    // Update order to mark that it has a return request
    order.hasReturnRequest = true;
    await order.save();

    // Log return creation
    logger.info(`Return request created for order ${orderId} by user ${userId}`);

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Return request created successfully',
      data: returnRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all returns for a user
 */
export const getUserReturns = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Find all returns for the user
    const returns = await Return.find({ userId })
      .populate('orderId', 'orderNumber createdAt totalAmount')
      .sort({ createdAt: -1 });

    // Return success response
    return res.status(200).json({
      success: true,
      count: returns.length,
      data: returns
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single return by ID
 */
export const getReturnById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find return by ID
    const returnRequest = await Return.findById(id)
      .populate('orderId', 'orderNumber createdAt totalAmount')
      .populate('items.productId', 'title images');

    // Check if return exists
    if (!returnRequest) {
      throw new AppError('Return request not found', 404);
    }

    // Check if user owns the return or is admin/subadmin
    if (
      returnRequest.userId.toString() !== userId &&
      !req.user.roles.includes('admin') &&
      !req.user.roles.includes('subadmin')
    ) {
      throw new AppError('Unauthorized to view this return request', 403);
    }

    // Return success response
    return res.status(200).json({
      success: true,
      data: returnRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update return status (admin/subadmin only)
 */
export const updateReturnStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { returnStatus, adminNotes, trackingInfo } = req.body;

    // Validate status
    if (!returnStatus) {
      throw new AppError('Return status is required', 400);
    }

    // Find return by ID
    const returnRequest = await Return.findById(id);

    // Check if return exists
    if (!returnRequest) {
      throw new AppError('Return request not found', 404);
    }

    // Update return status
    returnRequest.returnStatus = returnStatus;
    
    // Update admin notes if provided
    if (adminNotes) {
      returnRequest.adminNotes = adminNotes;
    }

    // Update tracking info if provided
    if (trackingInfo) {
      returnRequest.trackingInfo = {
        ...returnRequest.trackingInfo,
        ...trackingInfo
      };
    }

    // Save updated return
    await returnRequest.save();

    // Log status update
    logger.info(`Return request ${id} status updated to ${returnStatus} by admin ${req.user.id}`);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Return status updated successfully',
      data: returnRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process refund for a return (admin only)
 */
export const processRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { refundAmount } = req.body;

    // Validate refund amount
    if (!refundAmount || refundAmount <= 0) {
      throw new AppError('Valid refund amount is required', 400);
    }

    // Find return by ID
    const returnRequest = await Return.findById(id).populate('orderId');

    // Check if return exists
    if (!returnRequest) {
      throw new AppError('Return request not found', 404);
    }

    // Check if return is approved
    if (returnRequest.returnStatus !== 'approved') {
      throw new AppError('Return must be approved before processing refund', 400);
    }

    // Check if refund is already processed
    if (returnRequest.refundStatus === 'processed') {
      throw new AppError('Refund has already been processed', 400);
    }

    // Get order details
    const order = returnRequest.orderId;

    // Process refund through payment service if it was an online payment
    if (order.paymentMethod !== 'cod') {
      try {
        // Attempt to process refund through payment gateway
        // This is a placeholder - actual implementation would depend on your payment service
        // const refundResult = await paymentService.processRefund({
        //   orderId: order._id.toString(),
        //   refundAmount
        // });

        // For now, we'll simulate a successful refund
        const refundResult = { success: true, refundId: 'simulated-refund-' + Date.now() };

        if (refundResult.success) {
          // Update return with refund details
          returnRequest.refundStatus = 'processed';
          returnRequest.refundAmount = refundAmount;
          // You might want to store the refund ID from the payment gateway
          // returnRequest.refundId = refundResult.refundId;
        } else {
          returnRequest.refundStatus = 'failed';
        }
      } catch (error) {
        logger.error(`Refund processing error for return ${id}: ${error.message}`);
        returnRequest.refundStatus = 'failed';
      }
    } else {
      // For COD orders, just mark as processed
      returnRequest.refundStatus = 'processed';
      returnRequest.refundAmount = refundAmount;
    }

    // Save updated return
    await returnRequest.save();

    // Log refund processing
    logger.info(`Refund of ${refundAmount} processed for return ${id} by admin ${req.user.id}`);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: returnRequest
    });
  } catch (error) {
    next(error);
  }
};