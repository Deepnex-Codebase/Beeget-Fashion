# ShipRocket Debugging Guide

## Common Issues and Solutions

### 1. Missing `shipment_id` in Response

**Problem**: ShipRocket API returns a response without `shipment_id`.

**Possible Causes**:
- Validation errors in your payload
- Duplicate order ID in ShipRocket
- Channel ID issues
- ShipRocket API changes

**Solutions**:

1. **Check Required Fields**:
   - Ensure all required fields are provided (see SHIPROCKET_INTEGRATION_GUIDE.md)
   - Verify field formats (especially dates, phone numbers, and email addresses)

2. **Check for Duplicate Order ID**:
   - Ensure your `order_id` is unique in ShipRocket
   - Try with a different `order_id` to test

3. **Verify Channel ID**:
   - Confirm your channel ID is correct
   - Try creating an order without a channel ID

4. **Check ShipRocket Dashboard**:
   - Log in to ShipRocket and check if the order was created despite the error
   - Look for any error messages in the dashboard

### 2. 422 Validation Error

**Problem**: ShipRocket returns a 422 error with validation messages.

**Solutions**:

1. **Check Error Details**:
   - Look at the `errors` field in the response for specific validation errors
   - Fix each validation error mentioned

2. **Common Validation Issues**:
   - Invalid phone number format (must be 10 digits)
   - Invalid email format
   - Invalid pincode
   - Missing required fields
   - Invalid order date format (must be YYYY-MM-DD HH:MM)

### 3. Order Not Visible in ShipRocket Panel

**Problem**: Order is created via API but not visible in ShipRocket dashboard.

**Solutions**:

1. **Check API Response**:
   - Verify you received a successful response with `order_id` and `shipment_id`
   - Log the complete response for debugging

2. **Check Channel Settings**:
   - Ensure you're looking in the correct channel in ShipRocket
   - Try switching between channels in the dashboard

3. **Wait for Processing**:
   - Some orders may take time to appear in the dashboard
   - Check again after a few minutes

4. **Verify Order Status**:
   - Use the ShipRocket API to get order details
   - Check if the order status indicates any issues

### 4. Authentication Failures

**Problem**: Unable to authenticate with ShipRocket API.

**Solutions**:

1. **Check Credentials**:
   - Verify email and password are correct
   - Try logging in to ShipRocket dashboard with the same credentials

2. **Check Environment Variables**:
   - Ensure `SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD` are set correctly
   - Check for whitespace or special characters in the values

3. **Token Expiry**:
   - ShipRocket tokens expire after 10 days
   - Ensure your code handles token expiry and refreshes when needed

### 5. AWB Generation Failures

**Problem**: Unable to generate AWB (tracking number) for an order.

**Solutions**:

1. **Check Shipment ID**:
   - Ensure you're using the correct `shipment_id` from the order creation response
   - Verify the shipment exists in ShipRocket

2. **Check Order Status**:
   - AWB can only be generated for orders in certain statuses
   - Ensure the order is in a valid state for AWB generation

3. **Check Courier Availability**:
   - AWB generation depends on courier availability for your pickup location
   - Try specifying a courier ID if you know which courier to use

## Debugging with ShipRocket Logger

The `shiprocketLogger` utility provides detailed logging for ShipRocket API interactions. Here's how to use it effectively:

### 1. Log Analysis

Check the logs for:

- **Request Payload**: Ensure all required fields are present and formatted correctly
- **Response Data**: Look for error messages or missing fields
- **Status Codes**: Identify the type of error (400, 401, 422, etc.)

### 2. Enable Verbose Logging

For more detailed logging, you can temporarily increase the log level:

```javascript
// In your application's startup code
import { logger } from '../utils/logger.js';
logger.level = 'debug'; // Set to 'debug' for more detailed logs
```

### 3. Test with Postman

If you're still having issues, try making the same API calls using Postman:

1. Get a token using the authentication endpoint
2. Use the token to make a test order creation request
3. Compare the response with what you're getting in your application

## ShipRocket API Response Analysis

### Successful Order Creation Response

A successful order creation response should look like this:

```json
{
  "order_id": 123456,
  "shipment_id": 987654,
  "status": "NEW",
  "status_code": 1,
  "onboarding_completed_now": 0,
  "awb_code": null,
  "courier_company_id": null,
  "courier_name": null
}
```

Key fields to check:
- `order_id`: ShipRocket's internal order ID
- `shipment_id`: The shipment ID needed for AWB generation
- `status`: Should be "NEW" for a newly created order

### Error Response Analysis

Error responses typically include:

```json
{
  "message": "Error message here",
  "errors": {
    "field_name": [
      "Validation error message"
    ]
  }
}
```

Common error messages and their meanings:

- **"The order id has already been taken"**: You're trying to create an order with an ID that already exists in ShipRocket
- **"The billing phone must be 10 digits"**: Phone number format is incorrect
- **"The billing pincode must be 6 digits"**: Pincode format is incorrect
- **"The order items field is required"**: Missing or empty order_items array

## Advanced Troubleshooting

### 1. Network Issues

If you suspect network issues:

1. Check your server's connectivity to ShipRocket's API servers
2. Verify there are no firewall rules blocking outbound connections
3. Implement request timeouts and retry logic

### 2. Payload Formatting

Ensure your payload is correctly formatted:

1. Check date formats (YYYY-MM-DD HH:MM)
2. Ensure numeric fields are sent as numbers, not strings
3. Verify array fields are properly formatted

### 3. Database Consistency

Ensure your database is consistent with ShipRocket:

1. Store ShipRocket's `shipment_id` and `order_id` in your database
2. Implement a reconciliation process to check for discrepancies
3. Handle cases where an order exists in ShipRocket but not in your database (or vice versa)

## Getting Help from ShipRocket

If you've tried everything and still can't resolve the issue:

1. Contact ShipRocket support with detailed information about the issue
2. Provide them with request/response logs (with sensitive information removed)
3. Ask for specific guidance on the error messages you're receiving

ShipRocket support can be reached at:
- Email: support@shiprocket.com
- Phone: 011-4056-9444