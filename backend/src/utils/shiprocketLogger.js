import { logger } from './logger.js';

/**
 * ShipRocket Logger Utility
 * 
 * A specialized logger for ShipRocket API interactions that provides
 * detailed logging for requests, responses, and errors.
 */
class ShipRocketLogger {
  /**
   * Log a ShipRocket API request
   * @param {string} endpoint - The API endpoint being called
   * @param {object} payload - The request payload
   */
  static logRequest(endpoint, payload) {
    logger.info(`ShipRocket API Request to ${endpoint}`, {
      endpoint,
      payload: this.sanitizePayload(payload),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log a successful ShipRocket API response
   * @param {string} endpoint - The API endpoint that was called
   * @param {object} response - The response data
   * @param {string} orderId - The order ID (optional)
   */
  static logSuccess(endpoint, response, orderId = null) {
    const logData = {
      endpoint,
      status: 'success',
      timestamp: new Date().toISOString()
    };

    if (orderId) {
      logData.orderId = orderId;
    }

    // Extract important fields from response
    if (response) {
      if (response.shipment_id) logData.shipment_id = response.shipment_id;
      if (response.order_id) logData.order_id = response.order_id;
      if (response.awb_code) logData.awb_code = response.awb_code;
      if (response.status) logData.status_code = response.status;
      if (response.status_code) logData.status_code = response.status_code;
      
      // Include full response for debugging
      logData.response = response;
    }

    logger.info(`ShipRocket API Success: ${endpoint}`, logData);
  }

  /**
   * Log a failed ShipRocket API response
   * @param {string} endpoint - The API endpoint that was called
   * @param {object} error - The error object
   * @param {string} orderId - The order ID (optional)
   */
  static logError(endpoint, error, orderId = null) {
    const logData = {
      endpoint,
      status: 'error',
      timestamp: new Date().toISOString()
    };

    if (orderId) {
      logData.orderId = orderId;
    }

    // Extract error details
    if (error) {
      if (error.response) {
        // Axios error with response
        logData.status_code = error.response.status;
        logData.error_data = error.response.data;
        
        // Extract specific ShipRocket error messages
        if (error.response.data) {
          if (error.response.data.message) {
            logData.error_message = error.response.data.message;
          }
          
          // Extract validation errors
          if (error.response.data.errors) {
            logData.validation_errors = error.response.data.errors;
          }
        }
      } else if (error.request) {
        // Request was made but no response received
        logData.error_type = 'no_response';
        logData.error_message = 'No response received from ShipRocket API';
      } else {
        // Error in setting up the request
        logData.error_type = 'request_setup';
        logData.error_message = error.message;
      }
    }

    logger.error(`ShipRocket API Error: ${endpoint}`, logData);
  }

  /**
   * Sanitize sensitive data from payload for logging
   * @param {object} payload - The payload to sanitize
   * @returns {object} - Sanitized payload
   */
  static sanitizePayload(payload) {
    if (!payload) return {};
    
    // Create a deep copy to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(payload));
    
    // Mask sensitive fields if they exist
    if (sanitized.password) sanitized.password = '******';
    if (sanitized.token) sanitized.token = '******';
    if (sanitized.Authorization) sanitized.Authorization = '******';
    
    return sanitized;
  }

  /**
   * Analyze ShipRocket error and provide troubleshooting guidance
   * @param {object} error - The error object from ShipRocket
   * @returns {string} - Troubleshooting guidance
   */
  static analyzeError(error) {
    if (!error) return 'Unknown error occurred';
    
    let guidance = 'ShipRocket API Error: ';
    
    // Handle common ShipRocket error scenarios
    if (error.response && error.response.status) {
      const status = error.response.status;
      const data = error.response.data || {};
      
      switch (status) {
        case 400:
          guidance += 'Bad request. Please check your payload format.';
          break;
        case 401:
          guidance += 'Authentication failed. Please check your credentials.';
          break;
        case 404:
          guidance += 'Resource not found. Please check the endpoint URL.';
          break;
        case 422:
          guidance += 'Validation failed. Please check the following fields:';
          
          // Extract validation errors
          if (data.errors) {
            Object.keys(data.errors).forEach(field => {
              guidance += `\n- ${field}: ${data.errors[field].join(', ')}`;
            });
          } else if (data.message) {
            guidance += `\n- ${data.message}`;
          }
          break;
        case 429:
          guidance += 'Too many requests. Please try again later.';
          break;
        case 500:
          guidance += 'ShipRocket server error. Please try again later.';
          break;
        default:
          guidance += `Status code ${status}. ${data.message || 'Unknown error'}`;
      }
    } else if (error.message) {
      guidance += error.message;
    } else {
      guidance += 'Unknown error occurred';
    }
    
    return guidance;
  }

  /**
   * Check if shipment_id is missing and provide guidance
   * @param {object} response - The ShipRocket API response
   * @returns {string|null} - Guidance if shipment_id is missing, null otherwise
   */
  static checkShipmentIdMissing(response) {
    if (!response || !response.data) {
      return 'Response or response data is missing';
    }
    
    if (!response.data.shipment_id) {
      let guidance = 'ShipRocket response is missing shipment_id. Possible causes:';
      guidance += '\n1. Order validation failed on ShipRocket side';
      guidance += '\n2. Required fields are missing in the order payload';
      guidance += '\n3. Duplicate order ID might exist in ShipRocket';
      guidance += '\n4. ShipRocket API changes or temporary issues';
      
      // Check for specific error messages
      if (response.data.message) {
        guidance += `\n\nShipRocket message: ${response.data.message}`;
      }
      
      return guidance;
    }
    
    return null;
  }
}

export default ShipRocketLogger;