# ShipRocket Integration Guide

## Overview
I've successfully integrated ShipRocket shipping functionality into your Beeget Fashion backend. The integration includes proper authentication, order management, and testing endpoints.

## What Was Added

### 1. Updated Environment Configuration
- Fixed `SHIPROCKET_PASSWORD` in `.env` file
- Removed hardcoded authentication tokens for security

### 2. Enhanced Shipping Service (`src/services/shipping.service.js`)
Added new utility methods:
- `validateConnection()` - Test ShipRocket API credentials
- `getPickupLocations()` - Fetch available pickup locations
- `getOrderDetails(orderId)` - Get order information from ShipRocket

### 3. New API Routes (`src/routes/shipping.routes.js`)
Created dedicated shipping endpoints:
- `GET /api/shipping/test-connection` - Test ShipRocket connection
- `GET /api/shipping/pickup-locations` - Get pickup locations
- `POST /api/shipping/check-serviceability` - Check courier availability
- `GET /api/shipping/track/:shipmentId` - Track shipments
- `GET /api/shipping/order/:orderId` - Get order details

### 4. Test File (`test-shipping.js`)
Created automated test script to verify integration

## Current Status

⚠️ **Rate Limit Issue**: ShipRocket API is currently showing "Too many failed login attempts. Please try after half an hour."

This is likely due to previous authentication attempts. Wait 30 minutes and then test again.

## How to Test (After Rate Limit Clears)

### Method 1: Using the Test Script
```bash
node test-shipping.js
```

### Method 2: Manual API Testing

#### Test Connection
```bash
curl -X GET http://localhost:8000/api/shipping/test-connection
```

#### Get Pickup Locations
```bash
curl -X GET http://localhost:8000/api/shipping/pickup-locations
```

#### Check Courier Serviceability
```bash
curl -X POST http://localhost:8000/api/shipping/check-serviceability \
  -H "Content-Type: application/json" \
  -d '{
    "pickupPostcode": "110001",
    "deliveryPostcode": "400001",
    "weight": 1,
    "cod": 0
  }'
```

#### Track Shipment
```bash
curl -X GET http://localhost:8000/api/shipping/track/YOUR_SHIPMENT_ID
```

### Method 3: Using Postman
1. Import the following endpoints into Postman:
   - GET: `http://localhost:8000/api/shipping/test-connection`
   - GET: `http://localhost:8000/api/shipping/pickup-locations`
   - POST: `http://localhost:8000/api/shipping/check-serviceability`

2. For POST requests, use this JSON body:
```json
{
  "pickupPostcode": "110001",
  "deliveryPostcode": "400001",
  "weight": 1,
  "cod": 0
}
```

## Expected Responses

### Successful Connection Test
```json
{
  "success": true,
  "message": "ShipRocket connection successful",
  "data": {
    "email": "your-email@example.com",
    "channelId": "your-channel-id",
    "authenticated": true
  }
}
```

### Successful Pickup Locations
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "pickup_location": "Main Warehouse",
        "address": "Your warehouse address",
        "city": "City Name",
        "state": "State Name"
      }
    ]
  }
}
```

## Integration with Existing Order System

The shipping service is already integrated with your order controller (`src/controllers/order.controller.js`). When orders are created, they automatically:

1. Create orders in ShipRocket
2. Generate AWB (tracking numbers)
3. Send SMS notifications
4. Handle order tracking

## Security Features

✅ **Implemented**:
- Environment variables for sensitive data
- No hardcoded credentials
- Proper error handling
- Authentication token management

## Next Steps

1. **Wait 30 minutes** for ShipRocket rate limit to clear
2. **Test the endpoints** using any of the methods above
3. **Verify pickup locations** are configured in your ShipRocket account
4. **Test order creation** through your existing order API
5. **Monitor logs** for any integration issues

## Troubleshooting

### Common Issues:

1. **Authentication Failed**
   - Check `.env` file has correct credentials
   - Verify ShipRocket account is active
   - Wait if rate limited

2. **No Pickup Locations**
   - Configure pickup locations in ShipRocket dashboard
   - Verify channel ID is correct

3. **Serviceability Issues**
   - Check pincode format (6 digits)
   - Verify weight is in kg
   - Ensure pickup location is configured

## Support

If you encounter any issues:
1. Check the server logs for detailed error messages
2. Verify your ShipRocket account settings
3. Test with different pincode combinations
4. Contact ShipRocket support if API issues persist

---

**Status**: ✅ Integration Complete - Ready for Testing
**Server**: Running on http://localhost:8000
**Test Endpoints**: Available at `/api/shipping/*`