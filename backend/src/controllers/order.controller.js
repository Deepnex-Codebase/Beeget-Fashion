import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Coupon from "../models/coupon.model.js";
import { AppError } from "../middlewares/error.middleware.js";
import { logger } from "../utils/logger.js";
import paymentService from "../services/payment.service.js";
import shippingService from "../services/shipping.service.js";
import { sendOrderConfirmationEmail } from "../services/email.service.js";
import {
  sendOrderConfirmationSMS,
  sendShippingUpdateSMS,
} from "../services/sms.service.js";

/**
 * Create a new order
 */
export const  createOrder = async (req, res, next) => {
  // console.log(req.body);
  try {
    const { items, shipping, payment, couponCode, guestSessionId } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError("Order must contain at least one item", 400);
    }

    if (!shipping || !shipping.address) {
      throw new AppError("Shipping address is required", 400);
    }

    if (!payment || !payment.method) {
      throw new AppError("Payment method is required", 400);
    }

    // Get user ID if authenticated
    const userId = req.user ? req.user.id : null;

    // If not authenticated, ensure guest session ID is provided
    if (!userId && !guestSessionId) {
      throw new AppError(
        "Guest session ID is required for non-authenticated users",
        400
      );
    }

    // Validate and process items
    const processedItems = [];
    let subtotal = 0;
    let totalGST = 0;

    for (const item of items) {
      const { productId, variantSku, qty } = item;

      if (!productId || !variantSku || !qty) {
        throw new AppError(
          "Each item must have productId, variantSku, and qty",
          400
        );
      }

      // Find product
      const product = await Product.findById(productId);
      if (!product) {
        throw new AppError(`Product with ID ${productId} not found`, 404);
      }

      // Try to find variant by SKU first
      let variant = product.variants.find((v) => v.sku === variantSku);
      
      // If variant not found and SKU looks like a fallback (contains product ID), try to find by attributes
      if (!variant && variantSku.includes(productId.toString())) {
        // Extract size and color from fallback SKU (format: productId-size-color)
        const skuParts = variantSku.split('-');
        const size = skuParts.length > 1 ? skuParts[1] : 'default';
        const color = skuParts.length > 2 ? skuParts[2] : 'default';
        
        // Try to find variant by attributes
        variant = product.variants.find(v => {
          if (!v.attributes) return false;
          
          // Check if attributes are stored as Map or plain object
          const variantSize = v.attributes instanceof Map ? 
            v.attributes.get('size') : 
            v.attributes.size;
            
          const variantColor = v.attributes instanceof Map ? 
            v.attributes.get('color') : 
            v.attributes.color;
          
          // Match by size and color, ignoring 'default' values
          return (size === 'default' || variantSize === size) && 
                 (color === 'default' || variantColor === color);
        });
        
        // If still no variant, use the first available variant
        if (!variant && product.variants.length > 0) {
          variant = product.variants[0];
        }
      }
      
      // If no variant found, throw error
      if (!variant) {
        throw new AppError(
          `Variant with SKU ${variantSku} not found for product ${productId}`,
          404
        );
      }

      // Check stock
      if (variant.stock < qty) {
        throw new AppError(`Insufficient stock for variant ${variantSku}`, 400);
      }

      // Calculate item price and GST
      const price = variant.price;
      const gstAmount = (price * product.gstRate) / 100;
      const totalPrice = price * qty;
      const totalGSTForItem = gstAmount * qty;

      // Add to processed items
      processedItems.push({
        productId: productId,
        variantSku: variantSku,
        qty,
        price,
        gstRate: product.gstRate,
        gstAmount: gstAmount,
        totalPrice,
      });

      // Update subtotal and GST
      subtotal += totalPrice;
      totalGST += totalGSTForItem;
    }

    // Apply coupon if provided
    let discount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode });

      console.log(coupon)

      if (!coupon) {
        throw new AppError("Invalid coupon code", 400);
      }

      // Check coupon validity
      const validationResult = coupon.isValid(subtotal);
      if (!validationResult.valid) {
        throw new AppError(validationResult.reason || "Coupon validation failed", 400);
      }

      // Calculate discount
      if (coupon.discountType === "percent") {
        discount = (subtotal * coupon.value) / 100;
      } else {
        discount = coupon.value;
      }

      // Ensure discount doesn't exceed subtotal
      if (discount > subtotal) {
        discount = subtotal;
      }

      // Update coupon usage
      coupon.usedCount += 1;
      await coupon.save();

      appliedCoupon = {
        code: coupon.code,
        discountType: coupon.discountType,
        value: coupon.value,
        discount,
      };
    }

    // Calculate total
    const total = subtotal - discount;

    // Create order
    const order = new Order({
      userId: userId,
      guestSessionId: !userId ? guestSessionId : undefined,
      items: processedItems,
      shipping,
      payment: {
        ...payment,
        status: "PENDING",
      },
      coupon: appliedCoupon,
      subtotal,
      discount,
      total,
      totalGST,
      statusHistory: [
        {
          status: "CREATED",
          timestamp: new Date(),
          note: "Order created",
        },
      ],
    });

    await order.save();

    // Update product stock
    for (const item of processedItems) {
      await Product.updateOne(
        { _id: item.productId, "variants.sku": item.variantSku },
        { $inc: { "variants.$.stock": -item.qty } }
      );
    }

    // If payment method is CASHFREE, create payment order
    if (payment.method === "CASHFREE") {
      // Get customer details from request body or fallback to shipping address
      let customerName = req.body.customerName || shipping.address.name || "Customer";
      let customerEmail = req.body.customerEmail || shipping.address.email || "guest@example.com";
      let customerPhone = req.body.customerPhone || shipping.address.phone;

      // If still missing and user is authenticated, get from user profile
      if (userId && (!customerName || !customerEmail || !customerPhone)) {
        const user = await User.findById(userId);
        if (user) {
          customerName = customerName || user.name || "Customer";
          customerEmail = customerEmail || user.email || "guest@example.com";
          customerPhone = customerPhone || user.whatsappNumber || shipping.address.phone;
        }
      }
      
      // Ensure we have valid phone number
      if (!customerPhone) {
        customerPhone = "0000000000"; // Fallback phone number
      }

      // Create payment order with popup checkout
      const paymentOrder = await paymentService.createPopupCheckoutOrder({
        orderId: order._id.toString(),
        orderAmount: order.total,
        customerName,
        customerEmail,
        customerPhone,
        returnUrl: `${process.env.FRONTEND_URL}/payment/callback`,
        notifyUrl: `${process.env.API_URL}/api/orders/payment/webhook`,
      });

      if (!paymentOrder.success) {
        throw new AppError("Failed to create payment order", 500);
      }

      // Return order with payment token and details for popup checkout
      return res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: {
          order,
          orderId: order._id.toString(),
          paymentToken: paymentOrder.data.token,
          paymentDetails: {
            orderId: paymentOrder.data.orderId,
            orderAmount: paymentOrder.data.orderAmount,
            appId: paymentOrder.data.appId,
            customerName: paymentOrder.data.customerName,
            customerEmail: paymentOrder.data.customerEmail,
            customerPhone: paymentOrder.data.customerPhone
          }
        },
      });
    }

    // For COD orders, send confirmation
    if (payment.method === "COD") {
      // Update order status
      order.status = "CONFIRMED";
      order.statusHistory.push({
        status: "CONFIRMED",
        timestamp: new Date(),
        note: "Order confirmed (COD)",
      });

      await order.save();

      // Send confirmation email if user exists
      if (userId) {
        const user = await User.findById(userId);
        if (user && user.email) {
          await sendOrderConfirmationEmail(user.email, order);
        }

        // Send confirmation SMS if phone number exists
        if (user && user.whatsappNumber) {
          await sendOrderConfirmationSMS(
            user.whatsappNumber,
            order._id.toString()
          );
        }
        
      }
    }

    // Return created order
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all orders with pagination and filters
 */
export const getOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "desc",
      status,
      startDate,
      endDate,
      search,
    } = req.query;

    // Build query
    const query = {};

    // Add user filter for non-admin users
    if (req.user.role !== "admin" && req.user.role !== "sub-admin") {
      query.userId = req.user.id;
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDateTime;
      }
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : null },
        { "shipping.address.name": { $regex: search, $options: "i" } },
        { "shipping.address.email": { $regex: search, $options: "i" } },
        { "shipping.address.phone": { $regex: search, $options: "i" } },
        { "items.variant": { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === "asc" ? 1 : -1;

    // Execute query with pagination and sorting
    const orders = await Order.find(query)
      .populate("userId", "name email whatsappNumber")
      .populate("items.productId", "title images")
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find order
    const order = await Order.findById(id)
      .populate("userId", "name email whatsappNumber")
      .populate("items.productId", "title images category");

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Check if user is authorized to view this order
    if (
      req.user.role !== "admin" &&
      req.user.role !== "sub-admin" &&
      order.userId &&
      order.userId._id.toString() !== req.user.id
    ) {
      throw new AppError("You are not authorized to view this order", 403);
    }

    // Return order
    res.status(200).json({
      success: true,
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note, trackingId } = req.body;

    // Validate required fields
    if (!status) {
      throw new AppError("Status is required", 400);
    }

    // Valid status values
    const validStatuses = [
      "CREATED",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "RETURNED",
    ];

    if (!validStatuses.includes(status)) {
      throw new AppError("Invalid status value", 400);
    }

    // Find order
    const order = await Order.findById(id).populate(
      "userId",
      "email whatsappNumber"
    );
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Update order status
    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Order status updated to ${status}`,
    });

    // Update tracking ID if provided
    if (trackingId && status === "SHIPPED") {
      order.shipping.trackingId = trackingId;
    }

    await order.save();

    // Send notifications based on status
    if (order.userId) {
      // Send email notification
      if (order.userId.email) {
        // Email notifications would be implemented here
        // Different email templates based on status
      }

      // Send SMS notification for important status changes
      if (
        order.userId.whatsappNumber &&
        ["SHIPPED", "DELIVERED", "OUT_FOR_DELIVERY"].includes(status)
      ) {
        await sendShippingUpdateSMS(
          order.userId.whatsappNumber,
          order._id.toString(),
          status,
          order.shipping.trackingId
        );
      }
    }

    // If status is SHIPPED and we have a tracking ID, create shipment in ShipRocket
    if (
      status === "SHIPPED" &&
      trackingId &&
      order.shipping &&
      order.shipping.address
    ) {
      try {
        // Create shipment in ShipRocket if not already created
        // First check if we already have a shipment ID stored
        if (!order.shipping.shipmentId) {
          // If no shipment ID, it means we need to create the order in ShipRocket first
          const shipRocketOrderData = {
            order_id: order._id.toString(),
            order_date: new Date(order.createdAt).toISOString().split('T')[0],
            pickup_location: 'Primary',
            billing_customer_name: order.shipping.address.name,
            billing_address: order.shipping.address.street,
            billing_city: order.shipping.address.city,
            billing_pincode: order.shipping.address.pincode,
            billing_state: order.shipping.address.state,
            billing_country: order.shipping.address.country || 'India',
            billing_email: order.shipping.address.email,
            billing_phone: order.shipping.address.phone,
            shipping_is_billing: true,
            order_items: order.items.map(item => ({
              name: item.productId.title || 'Product',
              sku: item.variantSku,
              units: item.qty,
              selling_price: item.price,
              discount: 0,
              tax: item.gstAmount || 0
            })),
            payment_method: order.payment.method === 'COD' ? 'COD' : 'Prepaid',
            sub_total: order.total
          };

          const shipRocketResponse = await shippingService.createOrder(shipRocketOrderData);
          
          if (shipRocketResponse.success && shipRocketResponse.data && shipRocketResponse.data.shipment_id) {
            // Store the shipment ID for future reference
            order.shipping.shipmentId = shipRocketResponse.data.shipment_id;
            await order.save();
            
            logger.info(`Order ${order._id} created in ShipRocket with shipment ID: ${order.shipping.shipmentId}`);
            
            // Generate AWB (tracking number) if we have a shipment ID
            if (order.shipping.shipmentId) {
              const awbResponse = await shippingService.generateAWB(order.shipping.shipmentId);
              
              if (awbResponse.success) {
                logger.info(`AWB generated for order ${order._id}: ${awbResponse.data.awb_code}`);
              } else {
                logger.error(`Failed to generate AWB for order ${order._id}:`, awbResponse.error);
              }
            }
          } else {
            logger.error(`Failed to create order ${order._id} in ShipRocket:`, shipRocketResponse.error);
          }
        }
      } catch (shipRocketError) {
        logger.error(`Error in ShipRocket integration for order ${order._id}:`, shipRocketError);
        // Continue processing even if ShipRocket integration fails
      }
    }

    // Return updated order
    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process payment callback
 */
export const processPaymentCallback = async (req, res, next) => {
  try {
    const paymentData = req.body;
     console.log(paymentData)
    // Log the incoming callback data for debugging
    logger.info('Received payment callback data:', JSON.stringify(paymentData));

    // Extract order ID from the callback data
    // Cashfree callback data structure can vary, so we need to handle different formats
    let orderId = '';
    
    // Check all possible locations where order ID might be present
    if (paymentData.data && paymentData.data.order && paymentData.data.order.order_id) {
      orderId = paymentData.data.order.order_id;
    } else if (paymentData.order_id) {
      orderId = paymentData.order_id;
    } else if (paymentData.data && paymentData.data.order_id) {
      orderId = paymentData.data.order_id;
    } else if (paymentData.data && paymentData.data.orderId) {
      orderId = paymentData.data.orderId;
    } else if (paymentData.order && paymentData.order.id) {
      orderId = paymentData.order.id;
    } else if (paymentData.data && paymentData.data.test_object && paymentData.data.test_object.order_id) {
      // Handle test_object case
      orderId = paymentData.data.test_object.order_id;
    } else if (paymentData.orderId) {
      // Direct orderId from frontend
      orderId = paymentData.orderId;
    }
    
    logger.info(`Extracted order ID from callback: ${orderId}`);
    
    if (!orderId) {
      logger.error('Order ID not found in callback data');
      return res.status(400).json({
        success: false,
        message: 'Order ID not found in callback data',
      });
    }

    // Find order
    const order = await Order.findById(orderId).populate(
      'userId',
      'email whatsappNumber'
    );
    
    if (!order) {
      logger.error(`Order not found for ID: ${orderId}`);
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Extract payment status from callback data (handle different formats)
    let paymentStatus = '';
    
    if (paymentData.txStatus) {
      paymentStatus = paymentData.txStatus;
    } else if (paymentData.transaction_status) {
      paymentStatus = paymentData.transaction_status;
    } else if (paymentData.payment_status) {
      paymentStatus = paymentData.payment_status;
    } else if (paymentData.data && paymentData.data.payment_status) {
      paymentStatus = paymentData.data.payment_status;
    } else if (paymentData.data && paymentData.data.txStatus) {
      paymentStatus = paymentData.data.txStatus;
    } else if (paymentData.order && paymentData.order.status) {
      paymentStatus = paymentData.order.status;
    }
    
    // Check if this is a request from frontend
    const isFromFrontend = req.headers['x-source'] === 'frontend' || 
                          req.headers['content-type'] === 'application/json' ||
                          (paymentData.orderId && !paymentStatus);
``    
    // Check if this is a status check request
    const isStatusCheck = paymentStatus === 'STATUS_CHECK';
    
    // If it's a status check request, verify payment status with Cashfree
    if (isFromFrontend && (isStatusCheck || !paymentStatus)) {
      try {
        // Verify payment status with Cashfree API
        const paymentStatusResponse = await paymentService.getPaymentStatus(orderId);
        
        if (paymentStatusResponse.success) {
          const cashfreePaymentStatus = paymentStatusResponse.data.order_status || 
                                       paymentStatusResponse.data.payment_status || 
                                       paymentStatusResponse.data.txStatus || 
                                       'PENDING';
          
          logger.info(`Verified payment status from Cashfree for order ${orderId}: ${cashfreePaymentStatus}`);
          
          // Update order payment status based on verified status from Cashfree
          const isSuccessfulPayment = ['SUCCESS', 'PAID', 'OK', 'COMPLETED', 'CAPTURED', 'AUTHORIZED']
            .includes(cashfreePaymentStatus.toUpperCase());
          
          if (isSuccessfulPayment && order.payment.status !== 'PAID') {
            // Update payment status to PAID only if Cashfree confirms it
            order.payment.status = 'PAID';
            order.status = 'CONFIRMED';
            await order.save();
            logger.info(`Updated order ${orderId} status to PAID based on Cashfree verification`);
          } else if (!isSuccessfulPayment && order.payment.status !== 'FAILED' && 
                    ['FAILED', 'FAILURE', 'CANCELLED'].includes(cashfreePaymentStatus.toUpperCase())) {
            // Update payment status to FAILED if Cashfree confirms it failed
            order.payment.status = 'FAILED';
            order.status = 'PAYMENT_FAILED';
            await order.save();
            logger.info(`Updated order ${orderId} status to FAILED based on Cashfree verification`);
          }
          
          // Return current payment status for frontend status check requests
          console.log('Returning verified payment status for frontend status check request:', {
            orderId: order._id,
            paymentStatus: order.payment.status,
            orderStatus: order.status
          });
          return res.status(200).json({
            success: true,
            data: {
              orderId: order._id,
              paymentStatus: order.payment.status,
              orderStatus: order.status
            }
          });
        } else {
          // If Cashfree verification fails, return current status
          logger.warn(`Failed to verify payment status with Cashfree for order ${orderId}`);
          return res.status(200).json({
            success: true,
            data: {
              orderId: order._id,
              paymentStatus: order.payment.status,
              orderStatus: order.status
            }
          });
        }
      } catch (verificationError) {
        logger.error(`Error verifying payment status with Cashfree for order ${orderId}:`, verificationError);
        // Return current status if verification fails
        return res.status(200).json({
          success: true,
          data: {
            orderId: order._id,
            paymentStatus: order.payment.status,
            orderStatus: order.status
          }
        });
      }
    }
    
    logger.info(`Extracted payment status from callback: ${paymentStatus} for order: ${orderId}`);

    // For real orders (not test orders), verify payment status with Cashfree API
    let isSuccessful = false;
    
    if (!orderId.startsWith('test_order_')) {
      try {
        // Verify payment status with Cashfree API
        const paymentStatusResponse = await paymentService.getPaymentStatus(orderId);
        
        if (paymentStatusResponse.success) {
          const cashfreePaymentStatus = paymentStatusResponse.data.order_status || 
                                       paymentStatusResponse.data.payment_status || 
                                       paymentStatusResponse.data.txStatus || 
                                       'PENDING';
          
          logger.info(`Webhook: Verified payment status from Cashfree for order ${orderId}: ${cashfreePaymentStatus}`);
          
          // Determine if payment is successful based on verified status from Cashfree
          isSuccessful = ['SUCCESS', 'PAID', 'OK', 'COMPLETED', 'CAPTURED', 'AUTHORIZED']
            .includes(cashfreePaymentStatus.toUpperCase());
        } else {
          // If Cashfree verification fails, fall back to webhook data
          logger.warn(`Webhook: Failed to verify payment status with Cashfree for order ${orderId}, using webhook data`);
          isSuccessful = ['SUCCESS', 'PAID', 'OK', 'COMPLETED', 'CAPTURED', 'AUTHORIZED']
            .includes(paymentStatus.toUpperCase());
        }
      } catch (verificationError) {
        logger.error(`Webhook: Error verifying payment status with Cashfree for order ${orderId}:`, verificationError);
        // Fall back to webhook data if verification fails
        isSuccessful = ['SUCCESS', 'PAID', 'OK', 'COMPLETED', 'CAPTURED', 'AUTHORIZED']
          .includes(paymentStatus.toUpperCase());
      }
    } else {
      // For test orders, use the webhook data directly
      isSuccessful = ['SUCCESS', 'PAID', 'OK', 'COMPLETED', 'CAPTURED', 'AUTHORIZED']
        .includes(paymentStatus.toUpperCase());
    }

    if (isSuccessful) {
      // Extract reference ID (transaction ID) from callback data
      let referenceId = 'unknown';
      
      if (paymentData.referenceId) {
        referenceId = paymentData.referenceId;
      } else if (paymentData.transaction_id) {
        referenceId = paymentData.transaction_id;
      } else if (paymentData.cf_transaction_id) {
        referenceId = paymentData.cf_transaction_id;
      } else if (paymentData.data && paymentData.data.transaction_id) {
        referenceId = paymentData.data.transaction_id;
      } else if (paymentData.data && paymentData.data.referenceId) {
        referenceId = paymentData.data.referenceId;
      } else if (paymentData.data && paymentData.data.test_object && paymentData.data.test_object.transaction_id) {
        // Handle test_object case
        referenceId = paymentData.data.test_object.transaction_id;
      } else if (paymentData.type === 'WEBHOOK') {
        // For test webhooks, generate a test transaction ID if not found
        referenceId = `test_txn_${Date.now()}`;
        logger.info(`Generated test transaction ID for webhook: ${referenceId}`);
      }

      // Update payment status
      order.payment.status = 'PAID';
      // Update payment method from COD to CASHFREE if it was COD
      if (order.payment.method === 'COD') {
        order.payment.method = 'CASHFREE';
      }
      order.payment.transactionId = referenceId;
      order.payment.paymentDetails = paymentData;

      // Update order status
      order.status = 'CONFIRMED';
      order.statusHistory.push({
        status: 'CONFIRMED',
        timestamp: new Date(),
        note: 'Payment completed successfully via callback',
      });

      try {
        await order.save();
        logger.info(`Order ${orderId} marked as PAID and CONFIRMED via callback`);

        // Send confirmation email if user exists
        if (order.userId && order.userId.email) {
          try {
            await sendOrderConfirmationEmail(order.userId.email, order);
            logger.info(`Confirmation email sent for order ${orderId}`);
          } catch (emailError) {
            logger.error(`Error sending confirmation email for order ${orderId}:`, emailError);
          }
        }

        // Send confirmation SMS if phone number exists
        if (order.userId && order.userId.whatsappNumber) {
          try {
            await sendOrderConfirmationSMS(
              order.userId.whatsappNumber,
              order._id.toString()
            );
            logger.info(`Confirmation SMS sent for order ${orderId}`);
          } catch (smsError) {
            logger.error(`Error sending confirmation SMS for order ${orderId}:`, smsError);
          }
        }

        // Create order in ShipRocket after successful payment
        try {
          if (order.shipping && order.shipping.address) {
            const shipRocketOrderData = {
              order_id: order._id.toString(),
              order_date: new Date(order.createdAt).toISOString().split('T')[0],
              pickup_location: 'Primary',
              billing_customer_name: order.shipping.address.name,
              billing_address: order.shipping.address.street,
              billing_city: order.shipping.address.city,
              billing_pincode: order.shipping.address.pincode,
              billing_state: order.shipping.address.state,
              billing_country: order.shipping.address.country || 'India',
              billing_email: order.shipping.address.email,
              billing_phone: order.shipping.address.phone,
              shipping_is_billing: true,
              order_items: order.items.map(item => ({
                name: item.productId.title || 'Product',
                sku: item.variantSku,
                units: item.qty,
                selling_price: item.price,
                discount: 0,
                tax: item.gstAmount || 0
              })),
              payment_method: order.payment.method === 'COD' ? 'COD' : 'Prepaid',
              sub_total: order.total
            };

            const shipRocketResponse = await shippingService.createOrder(shipRocketOrderData);
            
            if (shipRocketResponse.success) {
              logger.info(`Order ${order._id} created in ShipRocket successfully`);
            } else {
              logger.error(`Failed to create order ${order._id} in ShipRocket:`, shipRocketResponse.error);
            }
          }
        } catch (shipRocketError) {
          logger.error(`Error creating ShipRocket order for ${order._id}:`, shipRocketError);
          // Continue processing even if ShipRocket integration fails
        }

        // For API requests from frontend, return JSON response
        if (req.headers['content-type'] === 'application/json' || req.headers['accept'] === 'application/json') {
          return res.status(200).json({
            success: true,
            message: 'Payment processed successfully',
            data: {
              orderId: order._id,
              paymentStatus: order.payment.status,
              orderStatus: order.status
            }
          });
        }

        // Redirect to success page for direct callbacks
        return res.redirect(`${process.env.FRONTEND_URL}/payment/success.html?orderId=${orderId}`);
      } catch (saveError) {
        logger.error(`Error saving order ${orderId}:`, saveError);
        return res.status(500).json({
          success: false,
          message: 'Error updating order status',
          error: saveError.message
        });
      }
    } else {
      // Update payment status
      order.payment.status = 'FAILED';
      order.payment.paymentDetails = paymentData;

      // Update order status
      order.status = 'PAYMENT_FAILED';
      order.statusHistory.push({
        status: 'PAYMENT_FAILED',
        timestamp: new Date(),
        note: `Payment failed via callback: ${paymentData.txMsg || paymentData.error_message || 'Unknown error'}`,
      });

      try {
        await order.save();
        logger.info(`Order ${orderId} marked as FAILED via callback`);

        // For API requests from frontend, return JSON response
        if (req.headers['content-type'] === 'application/json' || req.headers['accept'] === 'application/json') {
          return res.status(200).json({
            success: false,
            message: 'Payment failed',
            data: {
              orderId: order._id,
              paymentStatus: order.payment.status,
              orderStatus: order.status,
              error: paymentData.txMsg || paymentData.error_message || 'Unknown error'
            }
          });
        }

        // Redirect to failure page for direct callbacks
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failure.html?orderId=${orderId}`);
      } catch (saveError) {
        logger.error(`Error saving failed order ${orderId}:`, saveError);
        return res.status(500).json({
          success: false,
          message: 'Error updating order status',
          error: saveError.message
        });
      }
    }
  } catch (error) {
    logger.error('Error processing payment callback:', error);
    
    // For API requests from frontend, return JSON response
    if (req.headers['content-type'] === 'application/json' || req.headers['accept'] === 'application/json') {
      return res.status(500).json({
        success: false,
        message: 'An error occurred while processing your payment',
        error: error.message
      });
    }
    
    return res.redirect(`${process.env.FRONTEND_URL}/payment/failure.html?error=${encodeURIComponent('An error occurred while processing your payment')}`);
  }
};

/**
 * Process payment webhook
 */
export const processPaymentWebhook = async (req, res, next) => {
  try {
    const paymentData = req.body;
    console.log(paymentData)
    // Log the incoming webhook data for debugging
    logger.info('Received payment webhook data:', JSON.stringify(paymentData));

    // Extract order ID from the webhook data
    // Cashfree webhook data structure can vary, so we need to handle different formats
    console.log(paymentData)
    let orderId = '';
    // Check all possible locations where order ID might be present
    if (paymentData.data && paymentData.data.order && paymentData.data.order.order_id) {
      orderId = paymentData.data.order.order_id;
    } else if (paymentData.order_id) {
      orderId = paymentData.order_id;
    } else if (paymentData.data && paymentData.data.order_id) {
      orderId = paymentData.data.order_id;
    } else if (paymentData.data && paymentData.data.orderId) {
      orderId = paymentData.data.orderId;
    } else if (paymentData.order && paymentData.order.id) {
      orderId = paymentData.order.id;
    } else if (paymentData.data && paymentData.data.test_object && paymentData.data.test_object.order_id) {
      // Handle test_object case
      orderId = paymentData.data.test_object.order_id;
    }
    
    logger.info(`Extracted order ID from webhook: ${orderId}`);
    
    if (!orderId) {
      // For test webhooks, create a dummy order ID if not found
      if (paymentData.type === 'WEBHOOK' && paymentData.data && paymentData.data.test_object) {
        orderId = `test_order_${Date.now()}`;
        logger.info(`Created test order ID for webhook: ${orderId}`);
      } else {
        logger.error('Order ID not found in webhook data');
        return res.status(200).json({
          success: false,
          message: 'Order ID not found in webhook data',
        });
      }
    }

    // Check if this is a test order ID
    let order;
    if (orderId.startsWith('test_order_')) {
      // Create a dummy order object for test webhooks
      logger.info(`Creating dummy order object for test order ID: ${orderId}`);
      order = {
         _id: orderId,
         status: 'PENDING',
         payment: {
           status: 'PENDING',
           method: 'TEST',
           transactionId: ''
         },
         // Add other required fields as needed
         save: async function() {
           logger.info(`Test order ${this._id} would be saved here`);
           return this;
         }
       };
    } else {
      // Find real order without verifying signature first
      order = await Order.findById(orderId).populate(
        'userId',
        'email whatsappNumber'
      );
      
      if (!order) {
        logger.error(`Order not found for ID: ${orderId}`);
        // Return 200 to acknowledge webhook even if order not found
        return res.status(200).json({
          success: false,
          message: 'Order not found',
        });
      }
    }

    // Skip signature verification for now as webhook data format may vary
    // Instead, directly check payment status from the webhook data
    
    // Extract payment status from webhook data (handle different formats)
    let paymentStatus = '';
    
    if (paymentData.data && paymentData.data.payment && paymentData.data.payment.payment_status) {
      paymentStatus = paymentData.data.payment.payment_status;
    } else if (paymentData.transaction_status) {
      paymentStatus = paymentData.transaction_status;
    } else if (paymentData.payment_status) {
      paymentStatus = paymentData.payment_status;
    } else if (paymentData.data && paymentData.data.payment_status) {
      paymentStatus = paymentData.data.payment_status;
    } else if (paymentData.data && paymentData.data.txStatus) {
      paymentStatus = paymentData.data.txStatus;
    } else if (paymentData.order && paymentData.order.status) {
      paymentStatus = paymentData.order.status;
    } else if (paymentData.data && paymentData.data.test_object && paymentData.data.test_object.payment_status) {
      // Handle test_object case
      paymentStatus = paymentData.data.test_object.payment_status;
    } else if (paymentData.type === 'WEBHOOK') {
      // For test webhooks, default to SUCCESS if no payment status found
      paymentStatus = 'SUCCESS';
      logger.info(`Using default payment status for test webhook: ${paymentStatus}`);
    }
    
    logger.info(`Extracted payment status from webhook: ${paymentStatus} for order: ${orderId}`);

    // For real orders (not test orders), verify payment status with Cashfree API
    let isSuccessful = false;
    
    if (!orderId.startsWith('test_order_')) {
      try {
        // Verify payment status with Cashfree API
        const paymentStatusResponse = await paymentService.getPaymentStatus(orderId);
        
        if (paymentStatusResponse.success) {
          const cashfreePaymentStatus = paymentStatusResponse.data.order_status || 
                                       paymentStatusResponse.data.payment_status || 
                                       paymentStatusResponse.data.txStatus || 
                                       'PENDING';
          
          logger.info(`Webhook: Verified payment status from Cashfree for order ${orderId}: ${cashfreePaymentStatus}`);
          
          // Determine if payment is successful based on verified status from Cashfree
          isSuccessful = ['SUCCESS', 'PAID', 'OK', 'COMPLETED', 'CAPTURED', 'AUTHORIZED']
            .includes(cashfreePaymentStatus.toUpperCase());
        } else {
          // If Cashfree verification fails, fall back to webhook data
          logger.warn(`Webhook: Failed to verify payment status with Cashfree for order ${orderId}, using webhook data`);
          isSuccessful = ['SUCCESS', 'PAID', 'OK', 'COMPLETED', 'CAPTURED', 'AUTHORIZED']
            .includes(paymentStatus.toUpperCase());
        }
      } catch (verificationError) {
        logger.error(`Webhook: Error verifying payment status with Cashfree for order ${orderId}:`, verificationError);
        // Fall back to webhook data if verification fails
        isSuccessful = ['SUCCESS', 'PAID', 'OK', 'COMPLETED', 'CAPTURED', 'AUTHORIZED']
          .includes(paymentStatus.toUpperCase());
      }
    } else {
      // For test orders, use the webhook data directly
      isSuccessful = ['SUCCESS', 'PAID', 'OK', 'COMPLETED', 'CAPTURED', 'AUTHORIZED']
        .includes(paymentStatus.toUpperCase());
    }

    if (isSuccessful) {
      // Extract reference ID (transaction ID) from webhook data
      let referenceId = 'unknown';
      
      if (paymentData.referenceId) {
        referenceId = paymentData.referenceId;
      } else if (paymentData.transaction_id) {
        referenceId = paymentData.transaction_id;
      } else if (paymentData.cf_transaction_id) {
        referenceId = paymentData.cf_transaction_id;
      } else if (paymentData.data && paymentData.data.transaction_id) {
        referenceId = paymentData.data.transaction_id;
      } else if (paymentData.data && paymentData.data.referenceId) {
        referenceId = paymentData.data.referenceId;
      } else if (paymentData.data && paymentData.data.test_object && paymentData.data.test_object.transaction_id) {
        // Handle test_object case
        referenceId = paymentData.data.test_object.transaction_id;
      } else if (paymentData.type === 'WEBHOOK') {
        // For test webhooks, generate a test transaction ID if not found
        referenceId = `test_txn_${Date.now()}`;
        logger.info(`Generated test transaction ID for webhook: ${referenceId}`);
      }

      // Update payment status
      order.payment.status = 'PAID';
      // Update payment method from COD to CASHFREE if it was COD
      if (order.payment.method === 'COD') {
        order.payment.method = 'CASHFREE';
      }
      order.payment.transactionId = referenceId;
      order.payment.paymentDetails = paymentData;

      // Update order status
      order.status = 'CONFIRMED';
      order.statusHistory.push({
        status: 'CONFIRMED',
        timestamp: new Date(),
        note: 'Payment completed successfully via webhook',
      });

      await order.save();
      logger.info(`Order ${orderId} marked as PAID and CONFIRMED via webhook`);

      // Only send emails and SMS for real orders (not test orders)
      if (!orderId.startsWith('test_order_')) {
        try {
          // Send confirmation email if user exists
          if (order.userId && order.userId.email) {
            await sendOrderConfirmationEmail(order.userId.email, order);
            logger.info(`Confirmation email sent for order ${orderId}`);
          }
        } catch (emailError) {
          logger.error(`Failed to send confirmation email for order ${orderId}:`, emailError);
          // Continue processing even if email fails
        }

        try {
          // Send confirmation SMS if phone number exists
          if (order.userId && order.userId.whatsappNumber) {
            await sendOrderConfirmationSMS(
              order.userId.whatsappNumber,
              order._id.toString()
            );
            logger.info(`Confirmation SMS sent for order ${orderId}`);
          }
        } catch (smsError) {
          logger.error(`Failed to send confirmation SMS for order ${orderId}:`, smsError);
          // Continue processing even if SMS fails
        }

        // Create order in ShipRocket after successful payment
        try {
          if (order.shipping && order.shipping.address) {
            const shipRocketOrderData = {
              order_id: order._id.toString(),
              order_date: new Date(order.createdAt).toISOString().split('T')[0],
              pickup_location: 'Primary',
              billing_customer_name: order.shipping.address.name,
              billing_address: order.shipping.address.street,
              billing_city: order.shipping.address.city,
              billing_pincode: order.shipping.address.pincode,
              billing_state: order.shipping.address.state,
              billing_country: order.shipping.address.country || 'India',
              billing_email: order.shipping.address.email,
              billing_phone: order.shipping.address.phone,
              shipping_is_billing: true,
              order_items: order.items.map(item => ({
                name: item.productId.title || 'Product',
                sku: item.variantSku,
                units: item.qty,
                selling_price: item.price,
                discount: 0,
                tax: item.gstAmount || 0
              })),
              payment_method: order.payment.method === 'COD' ? 'COD' : 'Prepaid',
              sub_total: order.total
            };

            const shipRocketResponse = await shippingService.createOrder(shipRocketOrderData);
            
            if (shipRocketResponse.success) {
              logger.info(`Order ${order._id} created in ShipRocket successfully via webhook`);
            } else {
              logger.error(`Failed to create order ${order._id} in ShipRocket via webhook:`, shipRocketResponse.error);
            }
          }
        } catch (shipRocketError) {
          logger.error(`Error creating ShipRocket order for ${order._id} via webhook:`, shipRocketError);
          // Continue processing even if ShipRocket integration fails
        }
      } else {
        logger.info(`Skipping email, SMS and ShipRocket integration for test order ${orderId}`);
      }
    } else {
      // Update payment status
      order.payment.status = 'FAILED';
      order.payment.paymentDetails = paymentData;

      // Update order status
      order.status = 'PAYMENT_FAILED';
      order.statusHistory.push({
        status: 'PAYMENT_FAILED',
        timestamp: new Date(),
        note: `Payment failed via webhook: ${paymentData.txMsg || paymentData.error_message || 'Unknown error'}`,
      });

      await order.save();
      logger.info(`Order ${orderId} marked as FAILED via webhook`);
    }

    // Acknowledge webhook - always return 200 for webhooks
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    logger.error('Error processing payment webhook:', error);
    // Still return 200 to acknowledge webhook receipt
    res.status(200).json({
      success: false,
      message: 'Error processing webhook',
    });
  }
};

/**
 * Cancel order
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Find order
    const order = await Order.findById(id);
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    // Check if user is authorized to cancel this order
    if (
      req.user.role !== "admin" &&
      req.user.role !== "sub-admin" &&
      order.userId &&
      order.userId.toString() !== req.user.id
    ) {
      throw new AppError("You are not authorized to cancel this order", 403);
    }

    // Check if order can be cancelled
    const cancelableStatuses = [
      "CREATED",
      "CONFIRMED",
      "PROCESSING",
      "PAYMENT_FAILED",
    ];
    
    // Get current status from statusHistory if status field is not present
    const currentStatus = order.status || 
      (order.statusHistory && order.statusHistory.length > 0 ? 
        order.statusHistory[order.statusHistory.length - 1].status : 
        "CREATED");
        
    if (!cancelableStatuses.includes(currentStatus)) {
      throw new AppError(
        `Order cannot be cancelled in ${currentStatus} status`,
        400
      );
    }

    // Update order status
    // Add status field if it doesn't exist
    order.status = "CANCELLED";
    
    // Add to status history
    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    
    order.statusHistory.push({
      status: "CANCELLED",
      timestamp: new Date(),
      note: reason || "Order cancelled by user",
    });

    await order.save();

    // Restore product stock
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.productId, "variants.sku": item.variantSku },
        { $inc: { "variants.$.stock": item.qty } }
      );
    }

    // Process refund if payment was completed
    if (order.payment && order.payment.status === "COMPLETED" && order.payment.transactionId) {
      // Initiate refund through payment gateway
      // This would be implemented based on the payment gateway integration
      logger.info(`Refund would be initiated for order ${order._id} with transaction ID ${order.payment.transactionId}`);
    }

    // Return updated order
    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request return/exchange
 */
export const requestReturnExchange = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, reason, items } = req.body;

    // Validate required fields
    if (
      !type ||
      !reason ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      throw new AppError("Type, reason, and items are required", 400);
    }

    // Valid types
    const validTypes = ["RETURN", "EXCHANGE"];
    if (!validTypes.includes(type)) {
      throw new AppError("Invalid request type", 400);
    }

    // Find order
    const order = await Order.findById(id);
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    
    // Get current status from statusHistory if status field is not present
    const currentStatus = order.status || 
      (order.statusHistory && order.statusHistory.length > 0 ? 
        order.statusHistory[order.statusHistory.length - 1].status : 
        "CREATED");

    // Check if user is authorized
    if (
      req.user.role !== "admin" &&
      req.user.role !== "sub-admin" &&
      order.userId &&
      order.userId.toString() !== req.user.id
    ) {
      throw new AppError(
        "You are not authorized to request return/exchange for this order",
        403
      );
    }

    // Check if order is eligible for return/exchange
    if (currentStatus !== "DELIVERED") {
      throw new AppError(
        "Only delivered orders are eligible for return/exchange",
        400
      );
    }

    // Check if return/exchange already requested
    if (order.returnExchange && order.returnExchange.status !== "REJECTED") {
      throw new AppError(
        "Return/exchange already requested for this order",
        400
      );
    }

    // Validate items
    for (const item of items) {
      const { variantSku, qty } = item;

      if (!variantSku || !qty) {
        throw new AppError("Each item must have variantSku and qty", 400);
      }

      // Check if item exists in order
      const orderItem = order.items.find((i) => i.variantSku === variantSku);
      if (!orderItem) {
        throw new AppError(
          `Item with SKU ${variantSku} not found in order`,
          404
        );
      }

      // Check if quantity is valid
      if (qty > orderItem.qty) {
        throw new AppError(
          `Return/exchange quantity cannot exceed ordered quantity for ${variantSku}`,
          400
        );
      }
    }

    // Create return/exchange request
    order.returnExchange = {
      type,
      reason,
      items,
      status: "PENDING",
      requestDate: new Date(),
      history: [
        {
          status: "PENDING",
          timestamp: new Date(),
          note: `${type} requested by user`,
        },
      ],
    };

    // Update order status history
    // Get current status from statusHistory if status field is not present
    const statusToRecord = order.status || 
      (order.statusHistory && order.statusHistory.length > 0 ? 
        order.statusHistory[order.statusHistory.length - 1].status : 
        "CREATED");
        
    order.statusHistory.push({
      status: statusToRecord,
      timestamp: new Date(),
      note: `${type} requested by user`,
    });

    await order.save();

    // Return updated order
    res.status(200).json({
      success: true,
      message: `${type} requested successfully`,
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process return/exchange request
 */
export const processReturnExchange = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note, refundAmount } = req.body;

    // Validate required fields
    if (!status) {
      throw new AppError("Status is required", 400);
    }

    // Valid status values
    const validStatuses = ["APPROVED", "REJECTED", "COMPLETED"];
    if (!validStatuses.includes(status)) {
      throw new AppError("Invalid status value", 400);
    }

    // Find order
    const order = await Order.findById(id).populate(
      "userId",
      "email whatsappNumber"
    );
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Check if return/exchange exists
    if (!order.returnExchange) {
      throw new AppError(
        "No return/exchange request found for this order",
        404
      );
    }

    // Check if user is authorized (only admin/sub-admin can process)
    if (req.user.role !== "admin" && req.user.role !== "sub-admin") {
      throw new AppError(
        "You are not authorized to process return/exchange requests",
        403
      );
    }

    // Update return/exchange status
    order.returnExchange.status = status;
    order.returnExchange.history.push({
      status,
      timestamp: new Date(),
      note: note || `Return/exchange ${status.toLowerCase()} by admin`,
    });

    // If approved, update order status
    if (status === "APPROVED") {
      const newStatus = order.returnExchange.type === "RETURN"
          ? "RETURN_APPROVED"
          : "EXCHANGE_APPROVED";
      order.status = newStatus;
      order.statusHistory.push({
        status: newStatus,
        timestamp: new Date(),
        note: note || `${order.returnExchange.type} approved by admin`,
      });
    }

    // If completed and it's a return, process refund
    if (status === "COMPLETED" && order.returnExchange.type === "RETURN") {
      // Calculate refund amount if not provided
      let calculatedRefundAmount = refundAmount;

      if (!calculatedRefundAmount) {
        calculatedRefundAmount = 0;
        for (const item of order.returnExchange.items) {
          const orderItem = order.items.find(
            (i) => i.variantSku === item.variantSku
          );
          if (orderItem) {
            calculatedRefundAmount += orderItem.price * item.qty;
          }
        }
      }

      // Update order status
      const newStatus = "RETURNED";
      order.status = newStatus;
      order.statusHistory.push({
        status: newStatus,
        timestamp: new Date(),
        note: note || "Return completed and refund processed",
      });

      // Process refund if payment was completed
      if (order.payment.status === "COMPLETED" && order.payment.transactionId) {
        // Initiate refund through payment gateway
        const refundResult = await paymentService.initiateRefund({
          orderId: order._id.toString(),
          refundAmount: calculatedRefundAmount,
          refundNote: note || "Refund for returned items",
          referenceId: order.payment.transactionId
        });
        
        if (refundResult.success) {
          // Store refund details in order
          order.payment.refund = {
            amount: calculatedRefundAmount,
            status: "INITIATED",
            refundId: refundResult.data?.refundId,
            processedAt: new Date()
          };
          
          logger.info(`Refund initiated for order ${order._id}, amount: ${calculatedRefundAmount}`);
        } else {
          logger.error(`Failed to initiate refund for order ${order._id}:`, refundResult.error);
        }
      }

      // Restore product stock
      for (const item of order.returnExchange.items) {
        await Product.updateOne(
          { "variants.sku": item.variantSku },
          { $inc: { "variants.$.stock": item.qty } }
        );
      }
      
      // Send notification to customer
      if (order.userId && order.userId.email) {
        // Send email notification about return completion
        // This would be implemented with email service
      }
    }

    // If completed and it's an exchange, update order status
    if (status === "COMPLETED" && order.returnExchange.type === "EXCHANGE") {
      const newStatus = "EXCHANGED";
      order.status = newStatus;
      order.statusHistory.push({
        status: newStatus,
        timestamp: new Date(),
        note: note || "Exchange completed",
      });
      
      // Send notification to customer
      if (order.userId && order.userId.email) {
        // Send email notification about exchange completion
        // This would be implemented with email service
      }
    }

    // If rejected, update order status back to previous state
    if (status === "REJECTED") {
      // Find the status before return/exchange request
      const previousStatus = order.statusHistory.find(
        (history) => history.timestamp < order.returnExchange.requestDate
      )?.status || "DELIVERED";
      
      // Ensure we have a valid status
      const statusToSet = previousStatus || "DELIVERED";
      order.status = statusToSet;
      order.statusHistory.push({
        status: statusToSet,
        timestamp: new Date(),
        note: note || `${order.returnExchange.type} request rejected`,
      });
    }

    await order.save();

    // Return updated order
    res.status(200).json({
      success: true,
      message: `Return/exchange ${status.toLowerCase()} successfully`,
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order statistics
 */
export const getOrderStats = async (req, res, next) => {
  try {

    const { startDate, endDate } = req.query;

    // Build date range query
    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        dateQuery.createdAt.$lte = endDateTime;
      }
    }

    // Get total orders
    const totalOrders = await Order.countDocuments(dateQuery);

    // Get total revenue (from completed orders)
    const revenueResult = await Order.aggregate([
      {
        $match: {
          ...dateQuery,
          "payment.status": "COMPLETED",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    const completedOrders =
      revenueResult.length > 0 ? revenueResult[0].totalOrders : 0;

    // Get orders by status
    const ordersByStatus = await Order.aggregate([
      {
        $match: dateQuery,
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get orders by payment method
    const ordersByPaymentMethod = await Order.aggregate([
      {
        $match: dateQuery,
      },
      {
        $group: {
          _id: "$payment.method",
          count: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $eq: ["$payment.status", "COMPLETED"] }, "$total", 0],
            },
          },
        },
      },
    ]);

    // Get top selling products
    const topProducts = await Order.aggregate([
      {
        $match: {
          ...dateQuery,
          "payment.status": "COMPLETED",
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: {
            product: "$items.productId",
            variant: "$items.variantSku",
          },
          quantity: { $sum: "$items.qty" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $project: {
          product: { $arrayElemAt: ["$productDetails.title", 0] },
          variant: "$_id.variant",
          quantity: 1,
          revenue: 1,
        },
      },
    ]);

    // Return statistics
    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        completedOrders,
        totalRevenue,
        ordersByStatus,
        ordersByPaymentMethod,
        topProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark an order as delivered
 */
export const markOrderDelivered = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    // Find order
    const order = await Order.findById(id).populate(
      "userId",
      "email whatsappNumber"
    );
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Check if order is already delivered
    const currentStatus = order.status || 
      (order.statusHistory.length > 0 
        ? order.statusHistory[order.statusHistory.length - 1].status 
        : "CREATED");

    if (currentStatus === "DELIVERED") {
      throw new AppError("Order is already marked as delivered", 400);
    }

    // Check if order is in a state that can be marked as delivered
    const deliverableStatuses = ["SHIPPED", "OUT_FOR_DELIVERY"];
    if (!deliverableStatuses.includes(currentStatus)) {
      throw new AppError(`Order must be in one of these statuses to be marked as delivered: ${deliverableStatuses.join(', ')}`, 400);
    }

    // Update order status
    order.status = "DELIVERED";
    order.statusHistory.push({
      status: "DELIVERED",
      timestamp: new Date(),
      note: note || `Order marked as delivered`,
    });

    await order.save();

    // Send notifications
    if (order.userId) {
      // Send email notification
      if (order.userId.email) {
        // Email notifications would be implemented here
        // Different email templates based on status
      }

      // Send SMS notification
      if (order.userId.whatsappNumber) {
        await sendShippingUpdateSMS(
          order.userId.whatsappNumber,
          order._id.toString(),
          "DELIVERED",
          order.shipping.trackingId
        );
      }
    }

    // Return updated order
    res.status(200).json({
      success: true,
      message: "Order marked as delivered successfully",
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark an order as shipped
 */
export const markOrderShipped = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note, trackingId } = req.body;

    // Find order
    const order = await Order.findById(id).populate(
      "userId",
      "email whatsappNumber"
    );
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Check if order is already shipped
    const currentStatus = order.status || 
      (order.statusHistory.length > 0 
        ? order.statusHistory[order.statusHistory.length - 1].status 
        : "CREATED");

    if (currentStatus === "SHIPPED") {
      throw new AppError("Order is already marked as shipped", 400);
    }

    // Check if order is in a state that can be marked as shipped
    const shippableStatuses = ["CONFIRMED", "PROCESSING"];
    if (!shippableStatuses.includes(currentStatus)) {
      throw new AppError(`Order must be in one of these statuses to be marked as shipped: ${shippableStatuses.join(', ')}`, 400);
    }

    // Update order status
    order.status = "SHIPPED";
    order.statusHistory.push({
      status: "SHIPPED",
      timestamp: new Date(),
      note: note || `Order marked as shipped`,
    });

    // Update tracking ID if provided
    if (trackingId) {
      order.shipping.trackingId = trackingId;
    }

    await order.save();

    // Send notifications
    if (order.userId) {
      // Send email notification
      if (order.userId.email) {
        // Email notifications would be implemented here
        // Different email templates based on status
      }

      // Send SMS notification
      if (order.userId.whatsappNumber) {
        await sendShippingUpdateSMS(
          order.userId.whatsappNumber,
          order._id.toString(),
          "SHIPPED",
          order.shipping.trackingId
        );
      }
    }

    // Return updated order
    res.status(200).json({
      success: true,
      message: "Order marked as shipped successfully",
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark an order as out for delivery
 */
export const markOrderOutForDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    // Find order
    const order = await Order.findById(id).populate(
      "userId",
      "email whatsappNumber"
    );
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Check if order is already out for delivery
    const currentStatus = order.status || 
      (order.statusHistory.length > 0 
        ? order.statusHistory[order.statusHistory.length - 1].status 
        : "CREATED");

    if (currentStatus === "OUT_FOR_DELIVERY") {
      throw new AppError("Order is already marked as out for delivery", 400);
    }

    // Check if order is in a state that can be marked as out for delivery
    const outForDeliveryStatuses = ["SHIPPED"];
    if (!outForDeliveryStatuses.includes(currentStatus)) {
      throw new AppError(`Order must be in one of these statuses to be marked as out for delivery: ${outForDeliveryStatuses.join(', ')}`, 400);
    }

    // Update order status
    order.status = "OUT_FOR_DELIVERY";
    order.statusHistory.push({
      status: "OUT_FOR_DELIVERY",
      timestamp: new Date(),
      note: note || `Order marked as out for delivery`,
    });

    await order.save();

    // Send notifications
    if (order.userId) {
      // Send email notification
      if (order.userId.email) {
        // Email notifications would be implemented here
        // Different email templates based on status
      }

      // Send SMS notification
      if (order.userId.whatsappNumber) {
        await sendShippingUpdateSMS(
          order.userId.whatsappNumber,
          order._id.toString(),
          "OUT_FOR_DELIVERY",
          order.shipping.trackingId
        );
      }
    }

    // Return updated order
    res.status(200).json({
      success: true,
      message: "Order marked as out for delivery successfully",
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete order - Only for orders with PENDING payment status
 */
export const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find order
    const order = await Order.findById(id);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Check if user is authorized to delete this order
    if (
      req.user.role !== "admin" &&
      req.user.role !== "sub-admin" &&
      order.userId &&
      order.userId.toString() !== req.user.id
    ) {
      throw new AppError("You are not authorized to delete this order", 403);
    }

    // Check if order can be deleted (only PENDING payment status orders can be deleted)
    if (order.payment && order.payment.status !== "PENDING") {
      throw new AppError(
        "Only orders with PENDING payment status can be deleted",
        400
      );
    }

    // Restore product stock
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.productId, "variants.sku": item.variantSku },
        { $inc: { "variants.$.stock": item.qty } }
      );
    }

    // Delete the order
    await Order.findByIdAndDelete(id);

    // Return success response
    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create payment for existing COD order - Converts COD to online payment
 */
export const createPaymentForOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    // Validate payment method
    if (!paymentMethod || paymentMethod !== 'CASHFREE') {
      throw new AppError("Invalid payment method", 400);
    }

    // Find order
    const order = await Order.findById(id).populate('userId', 'name email whatsappNumber');
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Check if user is authorized to pay for this order
    if (
      req.user.role !== "admin" &&
      req.user.role !== "sub-admin" &&
      order.userId &&
      order.userId._id.toString() !== req.user.id
    ) {
      throw new AppError("You are not authorized to pay for this order", 403);
    }

    // Check if order can be paid (only COD orders with PENDING payment status can be paid)
    if (order.payment.status !== "PENDING" || order.payment.method !== "COD") {
      throw new AppError(
        "Only COD orders with PENDING payment status can be paid online",
        400
      );
    }

    // Get customer details
    let customerName = order.userId?.name || order.shipping.address.name || "Customer";
    let customerEmail = order.userId?.email || order.shipping.address.email || "guest@example.com";
    let customerPhone = order.userId?.whatsappNumber || order.shipping.address.phone || "0000000000";

    // Create payment order with popup checkout
    const paymentOrder = await paymentService.createPopupCheckoutOrder({
      orderId: order._id.toString(),
      orderAmount: order.total,
      customerName,
      customerEmail,
      customerPhone,
      returnUrl: `${process.env.FRONTEND_URL}/payment/callback`,
      notifyUrl: `${process.env.API_URL}/api/orders/payment/webhook`,
    });

    if (!paymentOrder.success) {
      throw new AppError("Failed to create payment order", 500);
    }

    // Return order with payment token and details for popup checkout
    return res.status(200).json({
      success: true,
      message: "Payment order created successfully",
      data: {
        order,
        orderId: order._id.toString(),
        paymentToken: paymentOrder.data.token,
        paymentDetails: {
          orderId: paymentOrder.data.orderId,
          orderAmount: paymentOrder.data.orderAmount,
          appId: paymentOrder.data.appId,
          customerName: paymentOrder.data.customerName,
          customerEmail: paymentOrder.data.customerEmail,
          customerPhone: paymentOrder.data.customerPhone
        }
      },
    });
  } catch (error) {
    next(error);
  }
};
