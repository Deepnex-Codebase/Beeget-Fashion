import axios from 'axios';
import { logger } from '../utils/logger.js';

/**
 * ShipRocket Shipping Integration Service
 */
class ShippingService {
  constructor() {
    this.email = process.env.SHIPROCKET_EMAIL;
    this.password = process.env.SHIPROCKET_PASSWORD;
    this.channelId = process.env.SHIPROCKET_CHANNEL_ID;
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

      const response = await axios.post(`${this.baseUrl}/auth/login`, {
        email: this.email,
        password: this.password
      });

      this.token = response.data.token;
      
      // Set token expiry to 9 days (ShipRocket tokens are valid for 10 days)
      this.tokenExpiry = new Date();
      this.tokenExpiry.setDate(this.tokenExpiry.getDate() + 9);
      
      logger.info('ShipRocket authentication successful');
      return this.token;
    } catch (error) {
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
        billing_address,
        billing_city,
        billing_pincode,
        billing_state,
        billing_country,
        billing_email,
        billing_phone,
        shipping_is_billing,
        shipping_customer_name,
        shipping_address,
        shipping_city,
        shipping_pincode,
        shipping_state,
        shipping_country,
        shipping_email,
        shipping_phone,
        order_items,
        payment_method,
        sub_total,
        length,
        breadth,
        height,
        weight
      } = orderData;

      // Validate required fields
      if (!order_id || !order_date || !billing_customer_name || !billing_address ||
          !billing_city || !billing_pincode || !billing_state || !billing_country ||
          !billing_email || !billing_phone || !order_items || !payment_method) {
        throw new Error('Missing required order parameters');
      }

      // Check if channel ID is configured
      if (!this.channelId) {
        throw new Error('ShipRocket channel ID not configured');
      }

      const payload = {
        order_id,
        order_date,
        pickup_location: pickup_location || 'Primary',
        channel_id: this.channelId,
        billing_customer_name,
        billing_last_name: '',
        billing_address,
        billing_address_2: '',
        billing_city,
        billing_pincode,
        billing_state,
        billing_country,
        billing_email,
        billing_phone,
        shipping_is_billing: shipping_is_billing || true,
        shipping_customer_name: shipping_customer_name || billing_customer_name,
        shipping_last_name: '',
        shipping_address: shipping_address || billing_address,
        shipping_address_2: '',
        shipping_city: shipping_city || billing_city,
        shipping_pincode: shipping_pincode || billing_pincode,
        shipping_state: shipping_state || billing_state,
        shipping_country: shipping_country || billing_country,
        shipping_email: shipping_email || billing_email,
        shipping_phone: shipping_phone || billing_phone,
        order_items,
        payment_method,
        sub_total,
        length: length || 10,
        breadth: breadth || 10,
        height: height || 10,
        weight: weight || 0.5
      };

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await axios.post(
        `${this.baseUrl}/orders/create/adhoc`,
        payload,
        { headers }
      );

      logger.info(`ShipRocket order created: ${order_id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Error creating ShipRocket order:', error);
      return {
        success: false,
        error: error.response?.data || error.message
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

      const response = await axios.post(
        `${this.baseUrl}/courier/assign/awb`,
        payload,
        { headers }
      );

      logger.info(`AWB generated for shipment: ${shipmentId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error(`Error generating AWB for shipment ${shipmentId}:`, error);
      return {
        success: false,
        error: error.response?.data || error.message
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

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await axios.post(
        `${this.baseUrl}/courier/generate/label`,
        { shipment_id: [shipmentId] },
        { headers }
      );

      logger.info(`Shipping label generated for shipment: ${shipmentId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
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

      const response = await axios.get(
        `${this.baseUrl}/courier/track/awb/${awbCode}`,
        { headers }
      );

      logger.info(`Tracking info fetched for AWB: ${awbCode}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
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

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await axios.post(
        `${this.baseUrl}/orders/cancel/shipment/request`,
        { shipment_id: shipmentId },
        { headers }
      );

      logger.info(`Cancellation requested for shipment: ${shipmentId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
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

      const response = await axios.get(
        `${this.baseUrl}/courier/serviceability?pickup_postcode=${pickupPostcode}&delivery_postcode=${deliveryPostcode}&weight=${weight}&cod=${cod}`,
        { headers }
      );

      logger.info(`Courier serviceability checked for delivery to ${deliveryPostcode}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
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

      const response = await axios.get(
        `${this.baseUrl}/orders/show/${orderId}`,
        { headers }
      );

      logger.info(`Order details fetched for order: ${orderId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
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

      const response = await axios.get(
        `${this.baseUrl}/settings/company/pickup`,
        { headers }
      );

      logger.info('Pickup locations fetched successfully');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Error fetching pickup locations:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Validate credentials and connection
   */
  async validateConnection() {
    try {
      const token = await this.getToken();
      
      if (!token) {
        throw new Error('Failed to authenticate with ShipRocket');
      }

      // Test the connection by fetching pickup locations
      const pickupResponse = await this.getPickupLocations();
      
      if (pickupResponse.success) {
        logger.info('ShipRocket connection validated successfully');
        return {
          success: true,
          message: 'ShipRocket connection is working properly',
          data: {
            authenticated: true,
            email: this.email,
            channelId: this.channelId
          }
        };
      } else {
        throw new Error('Failed to validate connection');
      }
    } catch (error) {
      logger.error('ShipRocket connection validation failed:', error);
      return {
        success: false,
        error: error.message || 'Connection validation failed'
      };
    }
  }
}

export default new ShippingService();