import express from 'express';
import { verifyToken, isAdmin, isSubAdmin, isOwnerOrAdmin } from '../middlewares/auth.middleware.js';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  processPaymentCallback as handlePaymentCallback,
  processPaymentWebhook as handlePaymentWebhook,
  cancelOrder,
  deleteOrder,
  requestReturnExchange as requestReturn,
  requestReturnExchange as requestExchange,
  processReturnExchange as processReturnExchangeRequest,
  getOrderStats,
  markOrderDelivered,
  markOrderShipped,
  markOrderOutForDelivery,
  createPaymentForOrder
} from '../controllers/order.controller.js';

const router = express.Router();

// Public routes - for payment callbacks and webhooks
// These must be defined BEFORE the verifyToken middleware
router.post('/payment/callback', handlePaymentCallback);
router.post('/payment/webhook', handlePaymentWebhook);

// Apply authentication middleware to all routes below this point
router.use(verifyToken);

// User routes - require authentication
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', isOwnerOrAdmin, getOrderById);
router.post('/:id/cancel', isOwnerOrAdmin, cancelOrder);
router.delete('/:id', isOwnerOrAdmin, deleteOrder);
router.post('/:id/return', isOwnerOrAdmin, requestReturn);
router.post('/:id/exchange', isOwnerOrAdmin, requestExchange);
router.post('/:id/pay', isOwnerOrAdmin, createPaymentForOrder);

// Admin/SubAdmin only routes
router.patch('/:id/status', isSubAdmin, updateOrderStatus);
router.patch('/:id/mark-shipped', isSubAdmin, markOrderShipped);
router.patch('/:id/mark-out-for-delivery', isSubAdmin, markOrderOutForDelivery);
router.patch('/:id/mark-delivered', isSubAdmin, markOrderDelivered);
router.patch('/:id/return-exchange', isAdmin, processReturnExchangeRequest);
router.get('/stats/dashboard', isAdmin, getOrderStats);

export default router;