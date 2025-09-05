import axios from 'axios';
import { logger } from '../utils/logger.js';
import ShipRocketLogger from '../utils/shiprocketLogger.js';

/**
 * ShipRocket Shipping Integration Service
 */
class ShippingService {
  /**
   * Initialize ShippingService with credentials from environment variables
   * channelId is optional and can be null
   */
  constructor() {
    this.email = process.env.SHIPROCKET_EMAIL;
    this.password = process.env.SHIPROCKET_PASSWORD;
    this.channelId = process.env.SHIPROCKET_CHANNEL_ID; // Optional, can be null
    this.baseUrl = 'https://apiv2.shiprocket.in/v1/external';
    this.token = null;
    this.tokenExpiry = null;
  }
  /**
   * Get authentication token
   */
  async getToken() {
    try {
      // Check if we already have a valid token
      if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return this.token;
      }

      if (!this.email || !this.password) {
        throw new Error('ShipRocket credentials not configured');
      }

      const payload = {
        email: this.email,
        password: this.password
      };

      ShipRocketLogger.logRequest('auth/login', payload);

      const response = await axios.post(`${this.baseUrl}/auth/login`, payload);

      this.token = response.data.token;
      
      // Set token expiry to 9 days (ShipRocket tokens are valid for 10 days)
      this.tokenExpiry = new Date();
      this.tokenExpiry.setDate(this.tokenExpiry.getDate() + 9);
      
      ShipRocketLogger.logSuccess('auth/login', response.data);
      logger.info('ShipRocket authentication successful');
      return this.token;
    } catch (error) {
      ShipRocketLogger.logError('auth/login', error);
      logger.error('ShipRocket authentication failed:', error);
      throw new Error('ShipRocket authentication failed: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Create a new order in ShipRocket
   */
  async createOrder(orderData) {
    try {
      const token = await this.getToken();

      const {
        order_id,
        order_date,
        pickup_location,
        billing_customer_name,
        billing_last_name,
        billing_address,
        billing_address_2,
        billing_city,
        billing_pincode,
        billing_state,
        billing_country,
        billing_email,
        billing_phone,
        shipping_is_billing,
        shipping_customer_name,
        shipping_last_name,
        shipping_address,
        shipping_address_2,
        shipping_city,
        shipping_pincode,
        shipping_state,
        shipping_country,
        shipping_email,
        shipping_phone,
        order_items,
        payment_method,
        shipping_charges,
        giftwrap_charges,
        transaction_charges,
        total_discount,
        sub_total,
        length,
        breadth,
        height,
        weight,
        comment
      } = orderData;

      // Validate required fields
      if (!order_id || !order_date || !billing_customer_name || !billing_address ||
          !billing_city || !billing_pincode || !billing_state || !billing_country ||
          !billing_email || !billing_phone || !order_items || !payment_method) {
        const missingFields = [];
        if (!order_id) missingFields.push('order_id');
        if (!order_date) missingFields.push('order_date');
        if (!billing_customer_name) missingFields.push('billing_customer_name');
        if (!billing_address) missingFields.push('billing_address');
        if (!billing_city) missingFields.push('billing_city');
        if (!billing_pincode) missingFields.push('billing_pincode');
        if (!billing_state) missingFields.push('billing_state');
        if (!billing_country) missingFields.push('billing_country');
        if (!billing_email) missingFields.push('billing_email');
        if (!billing_phone) missingFields.push('billing_phone');
        if (!order_items) missingFields.push('order_items');
        if (!payment_method) missingFields.push('payment_method');
        
        const errorMessage = `Missing required order parameters: ${missingFields.join(', ')}`;
        ShipRocketLogger.logError('orders/create/adhoc', { message: errorMessage }, order_id);
        throw new Error(errorMessage);
      }

      // Validate order items
      if (!Array.isArray(order_items) || order_items.length === 0) {
        const errorMessage = 'Order items must be a non-empty array';
        ShipRocketLogger.logError('orders/create/adhoc', { message: errorMessage }, order_id);
        throw new Error(errorMessage);
      }

      // Validate each order item
      for (const item of order_items) {
        if (!item.name || !item.units || item.selling_price === undefined) {
          const missingItemFields = [];
          if (!item.name) missingItemFields.push('name');
          if (!item.units) missingItemFields.push('units');
          if (item.selling_price === undefined) missingItemFields.push('selling_price');
          
          const errorMessage = `Missing required fields in order item: ${missingItemFields.join(', ')}`;
          ShipRocketLogger.logError('orders/create/adhoc', { message: errorMessage }, order_id);
          throw new Error(errorMessage);
        }
      }

      /**
       * Channel ID is optional for ShipRocket integration
       * If not provided, the order will be created without a channel ID
       * This allows flexibility in order creation
       */
      if (!this.channelId) {
        logger.warn('ShipRocket channel ID not configured, proceeding without channel ID');
      }

      const payload = {
        order_id,
        order_date,
        pickup_location: pickup_location || 'Primary',
        ...(this.channelId && { channel_id: this.channelId }),
        comment: comment || '',
        billing_customer_name,
        billing_last_name: billing_last_name || '',
        billing_address,
        billing_address_2: billing_address_2 || '',
        billing_city,
        billing_pincode,
        billing_state,
        billing_country,
        billing_email,
        billing_phone,
        shipping_is_billing: shipping_is_billing || true,
        shipping_customer_name: shipping_customer_name || billing_customer_name,
        shipping_last_name: shipping_last_name || billing_last_name || '',
        shipping_address: shipping_address || billing_address,
        shipping_address_2: shipping_address_2 || billing_address_2 || '',
        shipping_city: shipping_city || billing_city,
        shipping_pincode: shipping_pincode || billing_pincode,
        shipping_state: shipping_state || billing_state,
        shipping_country: shipping_country || billing_country,
        shipping_email: shipping_email || billing_email,
        shipping_phone: shipping_phone || billing_phone,
        order_items: order_items.map(item => ({
          name: item.name || 'Product',
          sku: item.sku || '',
          units: item.units || 1,
          selling_price: item.selling_price || item.sellingPrice || 0, // Support both formats
          discount: item.discount || 0,
          tax: item.tax || 0,
          hsn: item.hsn || ''
        })),
        payment_method,
        shipping_charges: shipping_charges || 0,
        giftwrap_charges: giftwrap_charges || 0,
        transaction_charges: transaction_charges || 0,
        total_discount: total_discount || 0,
        sub_total: sub_total || 0,
        length: length || 10,
        breadth: breadth || 10,
        height: height || 10,
        weight: weight || 0.5
      };

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Log the request
      ShipRocketLogger.logRequest('orders/create/adhoc', payload);

      const response = await axios.post(
        `${this.baseUrl}/orders/create/adhoc`,
        payload,
        { headers }
      );

      // Log the success response
      ShipRocketLogger.logSuccess('orders/create/adhoc', response.data, order_id);
      logger.info(`ShipRocket order created: ${order_id}`);

      // Check if shipment_id is missing
      if (!response.data.shipment_id) {
        const guidance = ShipRocketLogger.checkShipmentIdMissing({ data: response.data });
        logger.warn(`ShipRocket order created but shipment_id is missing: ${order_id}. ${guidance}`);
      }

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // Log the error with detailed analysis
      ShipRocketLogger.logError('orders/create/adhoc', error, orderData.order_id);
      
      // Get troubleshooting guidance
      const guidance = ShipRocketLogger.analyzeError(error);
      logger.error(`Error creating ShipRocket order: ${guidance}`);
      
      return {
        success: false,
        error: error.response?.data || error.message,
        guidance
      };
    }
  }

  /**
   * Generate AWB (tracking number) for an order
   */
  async generateAWB(shipmentId, courier_id = null) {
    try {
      const token = await this.getToken();

      if (!shipmentId) {
        throw new Error('Shipment ID is required');
      }

      const payload = {
        shipment_id: shipmentId
      };

      if (courier_id) {
        payload.courier_id = courier_id;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Log the request
      ShipRocketLogger.logRequest('courier/assign/awb', payload);

      const response = await axios.post(
        `${this.baseUrl}/courier/assign/awb`,
        payload,
        { headers }
      );

      // Log the success response
      ShipRocketLogger.logSuccess('courier/assign/awb', response.data, shipmentId);
      logger.info(`AWB generated for shipment: ${shipmentId}`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // Log the error with detailed analysis
      ShipRocketLogger.logError('courier/assign/awb', error, shipmentId);
      
      // Get troubleshooting guidance
      const guidance = ShipRocketLogger.analyzeError(error);
      logger.error(`Error generating AWB for shipment ${shipmentId}: ${guidance}`);
      
      return {
        success: false,
        error: error.response?.data || error.message,
        guidance
      };
    }
  }

  /**
   * Get shipping label for an order
   */
  async getShippingLabel(shipmentId) {
    try {
      const token = await this.getToken();

      if (!shipmentId) {
        throw new Error('Shipment ID is required');
      }

      const payload = { shipment_id: [shipmentId] };
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Log the request
      ShipRocketLogger.logRequest('courier/generate/label', payload);

      const response = await axios.post(
        `${this.baseUrl}/courier/generate/label`,
        payload,
        { headers }
      );

      // Log the success response
      ShipRocketLogger.logSuccess('courier/generate/label', response.data, shipmentId);
      logger.info(`Shipping label generated for shipment: ${shipmentId}`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // Log the error
      ShipRocketLogger.logError('courier/generate/label', error, shipmentId);
      logger.error(`Error generating shipping label for shipment ${shipmentId}:`, error);
      
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Track shipment
   */
  async trackShipment(awbCode) {
    try {
      const token = await this.getToken();

      if (!awbCode) {
        throw new Error('AWB code is required');
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Log the request
      ShipRocketLogger.logRequest(`courier/track/awb/${awbCode}`, {});

      const response = await axios.get(
        `${this.baseUrl}/courier/track/awb/${awbCode}`,
        { headers }
      );

      // Log the success response
      ShipRocketLogger.logSuccess(`courier/track/awb/${awbCode}`, response.data, awbCode);
      logger.info(`Tracking info fetched for AWB: ${awbCode}`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // Log the error
      ShipRocketLogger.logError(`courier/track/awb/${awbCode}`, error, awbCode);
      logger.error(`Error tracking shipment with AWB ${awbCode}:`, error);
      
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(shipmentId) {
    try {
      const token = await this.getToken();

      if (!shipmentId) {
        throw new Error('Shipment ID is required');
      }

      const payload = { shipment_id: shipmentId };
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Log the request
      ShipRocketLogger.logRequest('orders/cancel/shipment/request', payload);

      const response = await axios.post(
        `${this.baseUrl}/orders/cancel/shipment/request`,
        payload,
        { headers }
      );

      // Log the success response
      ShipRocketLogger.logSuccess('orders/cancel/shipment/request', response.data, shipmentId);
      logger.info(`Cancellation requested for shipment: ${shipmentId}`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // Log the error
      ShipRocketLogger.logError('orders/cancel/shipment/request', error, shipmentId);
      logger.error(`Error cancelling shipment ${shipmentId}:`, error);
      
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Get available courier services for a shipment
   */
  async getCourierServiceability(pickupPostcode, deliveryPostcode, weight, cod = 0) {
    try {
      const token = await this.getToken();

      if (!pickupPostcode || !deliveryPostcode || !weight) {
        throw new Error('Pickup postcode, delivery postcode, and weight are required');
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Log the request
      ShipRocketLogger.logRequest('courier/serviceability', {
        pickup_postcode: pickupPostcode,
        delivery_postcode: deliveryPostcode,
        weight,
        cod
      });

      const response = await axios.get(
        `${this.baseUrl}/courier/serviceability?pickup_postcode=${pickupPostcode}&delivery_postcode=${deliveryPostcode}&weight=${weight}&cod=${cod}`,
        { headers }
      );

      // Log the success response
      ShipRocketLogger.logSuccess('courier/serviceability', response.data);
      logger.info(`Courier serviceability checked for delivery to ${deliveryPostcode}`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // Log the error
      ShipRocketLogger.logError('courier/serviceability', error);
      logger.error('Error checking courier serviceability:', error);
      
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Get order details from ShipRocket
   */
  async getOrderDetails(orderId) {
    try {
      const token = await this.getToken();

      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Log the request
      ShipRocketLogger.logRequest(`orders/show/${orderId}`, {});

      const response = await axios.get(
        `${this.baseUrl}/orders/show/${orderId}`,
        { headers }
      );

      // Log the success response
      ShipRocketLogger.logSuccess(`orders/show/${orderId}`, response.data, orderId);
      logger.info(`Order details fetched for order: ${orderId}`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // Log the error
      ShipRocketLogger.logError(`orders/show/${orderId}`, error, orderId);
      logger.error(`Error fetching order details for ${orderId}:`, error);
      
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Get pickup locations
   */
  async getPickupLocations() {
    try {
      const token = await this.getToken();

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Log the request
      ShipRocketLogger.logRequest('settings/company/pickup', {});

      const response = await axios.get(
        `${this.baseUrl}/settings/company/pickup`,
        { headers }
      );

      // Log the success response
      ShipRocketLogger.logSuccess('settings/company/pickup', response.data);
      logger.info('Pickup locations fetched successfully');
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // Log the error
      ShipRocketLogger.logError('settings/company/pickup', error);
      logger.error('Error fetching pickup locations:', error);
      
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Get all orders from ShipRocket
   */
  async getAllOrders() {
    try {
      const token = await this.getToken();

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Log the request
      ShipRocketLogger.logRequest('orders', {});

      const response = await axios.get(
        `${this.baseUrl}/orders`,
        { headers }
      );

      // Log the success response
      ShipRocketLogger.logSuccess('orders', response.data);
      logger.info('All orders fetched successfully from ShipRocket');
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // Log the error
      ShipRocketLogger.logError('orders', error);
      logger.error('Error fetching orders from ShipRocket:', error);
      
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }
}

// Create and export a singleton instance
const shippingService = new ShippingService();
export default shippingService;