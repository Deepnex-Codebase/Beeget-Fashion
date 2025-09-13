/**
 * Controller for pincode related operations
 */
import shippingService from '../services/shipping.service.js';
import { logger } from '../utils/logger.js';

/**
 * Check if a pincode is available for delivery using ShipRocket API
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const checkPincode = async (req, res) => {
  try {
    const { pincode } = req.params;
    
    // Validate pincode format
    if (!pincode || pincode.length !== 6 || !/^\d+$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pincode format. Pincode must be 6 digits.'
      });
    }
    
    // Check pincode serviceability using ShipRocket API
    const result = await shippingService.checkPincodeServiceability(pincode);
    
    if (!result.success) {
      logger.error(`Failed to check pincode ${pincode} with ShipRocket:`, result.error);
      // Fallback to default behavior if ShipRocket API fails
      return res.status(200).json({
        success: true,
        isAvailable: true, // Default to available
        deliveryDays: 3,   // Default delivery days
        message: `Delivery available to ${pincode} (estimated)`
      });
    }
    
    // Return response based on ShipRocket API result
    return res.status(200).json({
      success: true,
      isAvailable: result.isAvailable,
      deliveryDays: result.deliveryDays,
      minDeliveryDays: result.minDeliveryDays,
      maxDeliveryDays: result.maxDeliveryDays,
      message: result.isAvailable 
        ? `Delivery available to ${pincode}` 
        : `Sorry, we don't deliver to ${pincode} yet`
    });
  } catch (error) {
    logger.error('Error checking pincode:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check pincode availability'
    });
  }
};