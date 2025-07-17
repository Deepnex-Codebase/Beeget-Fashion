import axios from 'axios';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

/**
 * Cashfree Payment Gateway Integration Service
 */
class PaymentService {
  constructor() {
    this.apiId = process.env.CASHFREE_APP_ID;
    this.secretKey = process.env.CASHFREE_SECRET_KEY;
    this.baseUrl = process.env.CASHFREE_ENVIRONMENT === 'PROD' 
      ? 'https://api.cashfree.com/pg/orders'
      : 'https://sandbox.cashfree.com/pg/orders';
    
    // Log payment service initialization
    logger.info(`Payment service initialized with ${process.env.CASHFREE_ENVIRONMENT} environment`);
    
    // Validate credentials
    if (!this.apiId || !this.secretKey) {
      logger.error('Cashfree credentials not configured properly');
    }
  }

  /**
   * Generate signature for Cashfree payment
   */
  generateSignature(postData) {
    const sortedKeys = Object.keys(postData).sort();
    let signatureData = '';
    
    for (let key of sortedKeys) {
      signatureData += key + postData[key];
    }
    
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(signatureData)
      .digest('base64');
  }

  /**
   * Create a new payment order
   */
  async createOrder(orderData) {
    try {
      if (!this.apiId || !this.secretKey) {
        throw new Error('Cashfree credentials not configured');
      }

      const {
        orderId,
        orderAmount,
        orderCurrency = 'INR',
        customerName,
        customerEmail,
        customerPhone,
        returnUrl,
        notifyUrl
      } = orderData;

      // Validate required fields
      if (!orderId || !orderAmount || !customerEmail || !customerPhone || !returnUrl) {
        throw new Error('Missing required payment parameters');
      }

      const payload = {
        appId: this.apiId,
        orderId: orderId,
        orderAmount: orderAmount,
        orderCurrency: orderCurrency,
        orderNote: 'Payment for Begget Fashion order',
        customerName: customerName || 'Customer',
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        returnUrl: returnUrl,
        notifyUrl: notifyUrl || '',
        source: 'popup' // Use popup checkout for better UX
      };

      const headers = {
        'Content-Type': 'application/json',
        'x-client-id': this.apiId,
        'x-client-secret': this.secretKey
      };

      const response = await axios.post(
        `${this.baseUrl}/orders`, 
        payload, 
        { headers }
      );

      logger.info(`Payment order created: ${orderId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Error creating payment order:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Create a new payment order with popup checkout
   */
  async createPopupCheckoutOrder(orderData) {
    try {
      if (!this.apiId || !this.secretKey) {
        throw new Error('Cashfree credentials not configured');
      }

      const {
        orderId,
        orderAmount,
        orderCurrency = 'INR',
        customerName,
        customerEmail,
        customerPhone,
        returnUrl,
        notifyUrl
      } = orderData;

      // Validate required fields
      if (!orderId || !orderAmount || !customerEmail || !customerPhone) {
        throw new Error('Missing required payment parameters');
      }

      const payload = {
        order_id: orderId,
        order_amount: orderAmount,
        order_currency: orderCurrency,
        order_note: 'Payment for Begget Fashion order',
        customer_details: {
          customer_id: orderId,
          customer_name: customerName || 'Customer',
          customer_email: customerEmail,
          customer_phone: customerPhone
        },
        order_meta: {
          return_url: returnUrl || '',
          notify_url: notifyUrl || ''
        }
      };

      // Generate token for popup checkout
      const tokenResponse = await this.generateToken(payload);
      
      if (!tokenResponse.success) {
        throw new Error('Failed to generate payment token');
      }
      
      logger.info(`Popup checkout payment order created: ${orderId}`);
      return {
        success: true,
        data: {
          token: tokenResponse.data.payment_session_id || tokenResponse.data.cf_order_id,
          orderId: orderId,
          orderAmount: orderAmount,
          appId: this.apiId,
          customerName: customerName,
          customerEmail: customerEmail,
          customerPhone: customerPhone
        }
      };
    } catch (error) {
      logger.error('Error creating popup checkout payment order:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }
  
  /**
   * Generate token for Cashfree popup checkout
   */
  async generateToken(orderData) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-client-id': this.apiId,
        'x-client-secret': this.secretKey,
        'x-api-version': '2023-08-01'
      };

      const response = await axios.post(
        `${this.baseUrl}`,
        orderData,
        { headers }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Error generating payment token:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(postData) {
    try {
      const { orderId, orderAmount, referenceId, txStatus, paymentMode, txMsg, txTime, signature } = postData;
      
      if (!orderId || !orderAmount || !referenceId || !txStatus || !signature) {
        throw new Error('Missing required parameters for signature verification');
      }

      const data = orderId + orderAmount + referenceId + txStatus + paymentMode + txMsg + txTime;
      const computedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(data)
        .digest('base64');

      const isValid = computedSignature === signature;
      
      if (isValid) {
        logger.info(`Payment signature verified for order: ${orderId}`);
      } else {
        logger.warn(`Invalid payment signature for order: ${orderId}`);
      }

      return {
        success: isValid,
        data: postData
      };
    } catch (error) {
      logger.error('Error verifying payment signature:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get payment status for an order
   */
  async getPaymentStatus(orderId) {
    try {
      if (!this.apiId || !this.secretKey) {
        throw new Error('Cashfree credentials not configured');
      }

      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const headers = {
        'Content-Type': 'application/json',
        'x-client-id': this.apiId,
        'x-client-secret': this.secretKey,
        'x-api-version': '2023-08-01' // Add API version as required by Cashfree
      };

      // The baseUrl already includes '/pg/orders', so we just need to append the order_id
      const response = await axios.get(
        `${this.baseUrl}/${orderId}`,
        { headers }
      );

      logger.info(`Payment status fetched for order: ${orderId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error(`Error fetching payment status for order ${orderId}:`, error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Initiate refund for an order
   */
  async initiateRefund(refundData) {
    try {
      if (!this.apiId || !this.secretKey) {
        throw new Error('Cashfree credentials not configured');
      }

      const {
        orderId,
        refundAmount,
        refundNote,
        referenceId
      } = refundData;

      // Validate required fields
      if (!orderId || !refundAmount || !referenceId) {
        throw new Error('Missing required refund parameters');
      }

      const payload = {
        refundAmount: refundAmount,
        refundNote: refundNote || 'Refund for Begget Fashion order',
        referenceId: referenceId
      };

      const headers = {
        'Content-Type': 'application/json',
        'x-client-id': this.apiId,
        'x-client-secret': this.secretKey
      };

      const response = await axios.post(
        `${this.baseUrl}/orders/${orderId}/refunds`,
        payload,
        { headers }
      );

      logger.info(`Refund initiated for order: ${orderId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Error initiating refund:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Get refund status
   */
  async getRefundStatus(orderId, refundId) {
    try {
      if (!this.apiId || !this.secretKey) {
        throw new Error('Cashfree credentials not configured');
      }

      if (!orderId || !refundId) {
        throw new Error('Order ID and Refund ID are required');
      }

      const headers = {
        'Content-Type': 'application/json',
        'x-client-id': this.apiId,
        'x-client-secret': this.secretKey
      };

      const response = await axios.get(
        `${this.baseUrl}/orders/${orderId}/refunds/${refundId}`,
        { headers }
      );

      logger.info(`Refund status fetched for order: ${orderId}, refund: ${refundId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error(`Error fetching refund status for order ${orderId}, refund ${refundId}:`, error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }
}

export default new PaymentService();