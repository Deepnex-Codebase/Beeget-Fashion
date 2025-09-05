# ShipRocket Integration Guide

## Overview

This guide provides detailed information about integrating ShipRocket with your Node.js + MongoDB application. It includes API endpoints, required headers, payload structure, and troubleshooting tips.

## Authentication

ShipRocket uses token-based authentication. The token is valid for 10 days.

### API Endpoint

```
POST https://apiv2.shiprocket.in/v1/external/auth/login
```

### Headers

```
Content-Type: application/json
```

### Payload

```json
{
  "email": "your_shiprocket_email@example.com",
  "password": "your_shiprocket_password"
}
```

### Response

```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user_id": 12345,
  "first_name": "Your",
  "last_name": "Name",
  "email": "your_shiprocket_email@example.com",
  "company_id": 67890,
  "created_at": "2023-01-01T12:00:00.000000Z"
}
```

## Creating an Order

### API Endpoint

```
POST https://apiv2.shiprocket.in/v1/external/orders/create/adhoc
```

### Headers

```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
```

### Minimum Required Payload

Below is the minimum required payload to create an order in ShipRocket:

```json
{
  "order_id": "BG123456",
  "order_date": "2023-06-15 12:30",
  "pickup_location": "Primary",
  "channel_id": "12345",
  "comment": "Order for testing",
  "billing_customer_name": "John Doe",
  "billing_last_name": "",
  "billing_address": "123 Main St",
  "billing_address_2": "Apt 4B",
  "billing_city": "Mumbai",
  "billing_pincode": "400001",
  "billing_state": "Maharashtra",
  "billing_country": "India",
  "billing_email": "john@example.com",
  "billing_phone": "9876543210",
  "shipping_is_billing": true,
  "shipping_customer_name": "",
  "shipping_last_name": "",
  "shipping_address": "",
  "shipping_address_2": "",
  "shipping_city": "",
  "shipping_pincode": "",
  "shipping_state": "",
  "shipping_country": "",
  "shipping_email": "",
  "shipping_phone": "",
  "order_items": [
    {
      "name": "Product Name",
      "sku": "PRD123",
      "units": 1,
      "selling_price": 999,
      "discount": 0,
      "tax": 0,
      "hsn": 12345678
    }
  ],
  "payment_method": "Prepaid",
  "shipping_charges": 0,
  "giftwrap_charges": 0,
  "transaction_charges": 0,
  "total_discount": 0,
  "sub_total": 999,
  "length": 10,
  "breadth": 10,
  "height": 10,
  "weight": 0.5
}
```

### Required Fields Explanation

1. **order_id**: Your unique order identifier (must be unique in ShipRocket)
2. **order_date**: Date and time of order creation (format: YYYY-MM-DD HH:MM)
3. **billing_customer_name**: Customer's first name
4. **billing_address**: Street address
5. **billing_city**: City name
6. **billing_pincode**: PIN code/ZIP code
7. **billing_state**: State name
8. **billing_country**: Country name
9. **billing_email**: Customer's email address
10. **billing_phone**: Customer's phone number
11. **order_items**: Array of products (must contain at least one item)
12. **payment_method**: Payment method (Prepaid/COD)

### Order Items Required Fields

1. **name**: Product name
2. **units**: Quantity
3. **selling_price**: Price per unit

## Mapping MongoDB Order Model to ShipRocket Payload

Here's how to map your MongoDB Order model to the ShipRocket payload:

```javascript
const shipRocketOrderData = {
  order_id: order.order_id,
  order_date: order.createdAt.toISOString().split('T').join(' ').substring(0, 16),
  pickup_location: "Primary",
  channel_id: process.env.SHIPROCKET_CHANNEL_ID,
  
  // Billing details
  billing_customer_name: order.shipping.address.name.split(' ')[0],
  billing_last_name: order.shipping.address.name.split(' ').slice(1).join(' '),
  billing_address: order.shipping.address.street,
  billing_address_2: order.shipping.address.landmark || '',
  billing_city: order.shipping.address.city,
  billing_pincode: order.shipping.address.pincode,
  billing_state: order.shipping.address.state,
  billing_country: order.shipping.address.country || 'India',
  billing_email: order.shipping.address.email,
  billing_phone: order.shipping.address.phone,
  
  // Use billing as shipping if shipping_is_billing is true
  shipping_is_billing: true,
  
  // Order items
  order_items: order.items.map(item => ({
    name: item.name,
    sku: item.variantSku,
    units: item.qty,
    selling_price: item.sellingPrice,
    discount: (item.mrp - item.sellingPrice) * item.qty,
    tax: item.gstAmount * item.qty,
    hsn: item.hsn || ''
  })),
  
  // Payment details
  payment_method: order.payment.method === 'COD' ? 'COD' : 'Prepaid',
  shipping_charges: order.shipping.charges || 0,
  giftwrap_charges: 0,
  transaction_charges: 0,
  total_discount: order.discount || 0,
  sub_total: order.subtotal,
  
  // Package dimensions (default values if not available)
  length: 10,
  breadth: 10,
  height: 10,
  weight: 0.5
};
```

## Generating AWB (Tracking Number)

### API Endpoint

```
POST https://apiv2.shiprocket.in/v1/external/courier/assign/awb
```

### Headers

```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
```

### Payload

```json
{
  "shipment_id": 123456
}
```

## Troubleshooting

### Missing `shipment_id` in Response

If the `shipment_id` is missing in the response, it could be due to:

1. **Validation Errors**: Check if all required fields are provided correctly.
2. **Duplicate Order ID**: The order ID might already exist in ShipRocket.
3. **Channel ID Issues**: Ensure your channel ID is correct if you're using one.
4. **API Changes**: ShipRocket might have updated their API.

### Common Error Codes

- **400**: Bad request - Check your payload format
- **401**: Authentication failed - Check your credentials
- **422**: Validation failed - Check the error details for specific field issues
- **429**: Too many requests - Rate limit exceeded
- **500**: ShipRocket server error

### Debugging Tips

1. Use the `shiprocketLogger` utility to log all requests and responses.
2. Check the ShipRocket dashboard to see if the order was created despite errors.
3. Verify that all required fields have valid values.
4. Ensure your authentication token is valid and not expired.

## Minimum Data Required for Order to Show in ShipRocket Panel

For an order to appear in the ShipRocket panel, you must provide:

1. Valid `order_id` (unique in ShipRocket)
2. Valid `order_date` (in correct format)
3. Complete billing information
4. At least one item in `order_items` with name, units, and selling_price
5. Valid `payment_method`

Missing any of these will likely result in the order not appearing in the ShipRocket panel or appearing with errors.

## Best Practices

1. **Always validate** required fields before sending to ShipRocket
2. **Log all requests and responses** for debugging
3. **Handle errors gracefully** and provide clear error messages
4. **Store ShipRocket IDs** (shipment_id, order_id, AWB) in your database
5. **Implement retry logic** for failed requests
6. **Use a separate channel** for testing if possible