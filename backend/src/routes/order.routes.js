import express from 'express';
import { verifyToken, isAdmin, isSubAdmin, isOwnerOrAdmin } from '../middlewares/auth.middleware.js';
import { hasDepartmentPermission } from '../middlewares/role.middleware.js';
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
  createPaymentForOrder,
  getOrdersByGuestSession
} from '../controllers/order.controller.js';

const router = express.Router();

// Public routes - for payment callbacks, webhooks, and guest checkout
// These must be defined BEFORE the verifyToken middleware
router.post('/payment/callback', handlePaymentCallback);
router.post('/payment/webhook', handlePaymentWebhook);
router.post('/guest', createOrder); // Guest checkout route
router.get('/guest/:guestSessionId', getOrdersByGuestSession); // Get orders by guest session ID

// Apply authentication middleware to all routes below this point
router.use(verifyToken);

// User routes - require authentication
router.post('/', createOrder);

// Log middleware for debugging
const logMiddleware = (req, res, next) => {
  console.log('DEBUG - Request user in order routes:', JSON.stringify({
    id: req.user?.id,
    roles: req.user?.roles,
    department: req.user?.department,
    permissions: req.user?.permissions
  }, null, 2));
  next();
};

// Orders list route with debugging
router.get('/', logMiddleware, hasDepartmentPermission('orders', 'manage_orders'), getOrders);

router.get('/:id', isOwnerOrAdmin, getOrderById);
router.post('/:id/cancel', isOwnerOrAdmin, cancelOrder);
router.delete('/:id', isOwnerOrAdmin, deleteOrder);
router.post('/:id/return', isOwnerOrAdmin, requestReturn);
router.post('/:id/exchange', isOwnerOrAdmin, requestExchange);
router.post('/:id/pay', isOwnerOrAdmin, createPaymentForOrder);

// Admin/SubAdmin only routes
// Add logging middleware to all admin routes
router.patch('/:id/status', logMiddleware, hasDepartmentPermission('orders', 'manage_orders'), updateOrderStatus);
router.patch('/:id/mark-shipped', logMiddleware, hasDepartmentPermission('orders', 'manage_orders'), markOrderShipped);
router.patch('/:id/mark-out-for-delivery', logMiddleware, hasDepartmentPermission('orders', 'manage_orders'), markOrderOutForDelivery);
router.patch('/:id/mark-delivered', logMiddleware, hasDepartmentPermission('orders', 'manage_orders'), markOrderDelivered);

// These routes should also be accessible to subadmins with proper permissions
router.patch('/:id/return-exchange', logMiddleware, hasDepartmentPermission('orders', 'manage_orders'), processReturnExchangeRequest);
router.get('/stats/dashboard', logMiddleware, hasDepartmentPermission('orders', 'manage_orders'), getOrderStats);

export default router;