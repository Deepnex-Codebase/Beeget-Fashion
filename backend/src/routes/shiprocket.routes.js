import express from 'express';
import { verifyToken, isAdmin, isSubAdmin, isAdminOrSubAdmin } from '../middlewares/auth.middleware.js';
import { logger } from '../utils/logger.js';
import shippingService from '../services/shipping.service.js';
import { AppError } from '../middlewares/error.middleware.js';

const router = express.Router();

/**
 * Get order status distribution from ShipRocket
 * GET /api/shiprocket/orders/status
 * Requires admin or subadmin authentication
 */
router.get('/orders/status', verifyToken, isAdminOrSubAdmin, async (req, res, next) => {
  try {
    // Get all orders from ShipRocket
    const result = await shippingService.getAllOrders();
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch orders from ShipRocket',
        error: result.error
      });
    }
    
    // Extract orders from the response
    const orders = result.data?.data || [];
    
    // Calculate order status distribution
    const orderStatusDistribution = {
      'processing': 0,
      'ready-to-ship': 0,
      'shipped': 0,
      'delivered': 0,
      'cancelled': 0
    };
    
    // Map ShipRocket status to our standard statuses
    orders.forEach(order => {
      const status = order.status?.toLowerCase() || '';
      
      // Map ShipRocket statuses to our standard statuses
      if (status.includes('processing') || status.includes('new') || status === 'awb_assigned') {
        orderStatusDistribution['processing'] += 1;
      } else if (status.includes('ready') || status === 'pickup_scheduled' || status === 'pickup_generated') {
        orderStatusDistribution['ready-to-ship'] += 1;
      } else if (status.includes('ship') || status.includes('in_transit') || status.includes('out_for_delivery')) {
        orderStatusDistribution['shipped'] += 1;
      } else if (status.includes('deliver') || status === 'completed') {
        orderStatusDistribution['delivered'] += 1;
      } else if (status.includes('cancel') || status.includes('rto') || status === 'failed') {
        orderStatusDistribution['cancelled'] += 1;
      } else {
        // Default to processing for unknown statuses
        orderStatusDistribution['processing'] += 1;
      }
    });
    
    // Return the order status distribution
    return res.status(200).json({
      success: true,
      data: orderStatusDistribution
    });
  } catch (error) {
    logger.error('Error fetching order status distribution:', error);
    next(new AppError('Failed to fetch order status distribution', 500));
  }
});

export default router;