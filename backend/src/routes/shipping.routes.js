import express from 'express';
import shippingService from '../services/shipping.service.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middlewares/error.middleware.js';

const router = express.Router();

/**
 * Test ShipRocket connection
 * GET /api/shipping/test-connection
 */
router.get('/test-connection', async (req, res, next) => {
  try {
    const result = await shippingService.validateConnection();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'ShipRocket connection is working properly',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'ShipRocket connection failed',
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error testing ShipRocket connection:', error);
    next(new AppError('Failed to test ShipRocket connection', 500));
  }
});

/**
 * Get pickup locations
 * GET /api/shipping/pickup-locations
 */
router.get('/pickup-locations', async (req, res, next) => {
  try {
    const result = await shippingService.getPickupLocations();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error fetching pickup locations:', error);
    next(new AppError('Failed to fetch pickup locations', 500));
  }
});

/**
 * Check courier serviceability
 * POST /api/shipping/check-serviceability
 */
router.post('/check-serviceability', async (req, res, next) => {
  try {
    const { pickupPostcode, deliveryPostcode, weight, cod } = req.body;
    
    if (!pickupPostcode || !deliveryPostcode || !weight) {
      return res.status(400).json({
        success: false,
        message: 'Pickup postcode, delivery postcode, and weight are required'
      });
    }
    
    const result = await shippingService.getCourierServiceability(
      pickupPostcode,
      deliveryPostcode,
      weight,
      cod || 0
    );
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error checking courier serviceability:', error);
    next(new AppError('Failed to check courier serviceability', 500));
  }
});

/**
 * Track shipment
 * GET /api/shipping/track/:shipmentId
 */
router.get('/track/:shipmentId', async (req, res, next) => {
  try {
    const { shipmentId } = req.params;
    
    if (!shipmentId) {
      return res.status(400).json({
        success: false,
        message: 'Shipment ID is required'
      });
    }
    
    const result = await shippingService.trackShipment(shipmentId);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error tracking shipment:', error);
    next(new AppError('Failed to track shipment', 500));
  }
});

/**
 * Get order details from ShipRocket
 * GET /api/shipping/order/:orderId
 */
router.get('/order/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }
    
    const result = await shippingService.getOrderDetails(orderId);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error fetching order details:', error);
    next(new AppError('Failed to fetch order details', 500));
  }
});

export default router;