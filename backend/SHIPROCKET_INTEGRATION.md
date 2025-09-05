# ShipRocket Integration Guide

## Overview

This document provides information about the ShipRocket integration in the Beeget Fashion e-commerce platform. ShipRocket is used for order fulfillment, shipping, and tracking.

## Configuration

The following environment variables are used for ShipRocket integration:

```
SHIPROCKET_EMAIL=your_shiprocket_email
SHIPROCKET_PASSWORD=your_shiprocket_password
SHIPROCKET_CHANNEL_ID=your_channel_id (optional)
```

## Channel ID Configuration

The `SHIPROCKET_CHANNEL_ID` is now optional. This means:

1. If provided in the environment variables, it will be used as the default channel ID for all orders
2. If not provided, orders will be created in ShipRocket without a channel ID
3. This allows flexibility in order creation and management

## Implementation Details

### Order Model

In the `order.model.js` file, the `channelId` field is defined as optional:

```javascript
channelId: {
  type: String,
  required: false,
  default: process.env.SHIPROCKET_CHANNEL_ID || null
}
```

### Shipping Service

In the `shipping.service.js` file, the `channelId` is conditionally included in the payload when creating an order:

```javascript
const payload = {
  order_id,
  order_date,
  pickup_location: pickup_location || 'Primary',
  ...(this.channelId && { channel_id: this.channelId }),
  // other fields...
};
```

## Order Creation Flow

1. When an order is created (especially for COD orders), the system automatically creates the order in ShipRocket
2. If a channel ID is configured, it will be included in the ShipRocket order
3. If no channel ID is configured, the order will be created without a channel ID
4. The system logs a warning if no channel ID is configured but proceeds with order creation

## Tracking and Shipment IDs

After successful order creation in ShipRocket:

1. The shipment ID from ShipRocket is stored in `order.shipping.shipmentId`
2. An AWB (tracking number) is generated and stored in `order.shipping.trackingId`

## Error Handling

The system is designed to continue processing even if ShipRocket integration fails. Errors are logged but do not prevent order creation in the main system.

---

For more details, refer to the implementation in `shipping.service.js` and `order.controller.js`.