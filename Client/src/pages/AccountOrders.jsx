import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../utils/api';
import Button from '../components/Common/Button';
import { toast } from 'react-hot-toast';
import Modal from '../components/Common/Modal';
import useCart from '../hooks/useCart';

// Add Cashfree script to document
const loadCashfreeScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const AccountOrders = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [paidOrders, setPaidOrders] = useState([]);
  const [cashfreeLoaded, setCashfreeLoaded] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState('');
  const { addToCart, cart } = useCart();
  
  // Load paid orders from localStorage on component mount
  useEffect(() => {
    const storedPaidOrders = localStorage.getItem('paidOrders');
    if (storedPaidOrders) {
      try {
        setPaidOrders(JSON.parse(storedPaidOrders));
      } catch (error) {
        console.error('Error parsing stored paid orders:', error);
        localStorage.removeItem('paidOrders');
      }
    }
  }, []);
  
  // Check if cart has items from a specific order
  const isOrderInCart = (orderId) => {
    // If the order ID is in paidOrders list, it means it was already added to cart
    return paidOrders.includes(orderId);
  };

  // Fetch orders with React Query
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      try {
        const response = await axios.get('/orders');
        return response.data.data.orders; // Return the orders array directly
      } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Fetch single order details
  const { data: orderDetails, isLoading: orderDetailsLoading, refetch: refetchOrderDetails } = useQuery({
    queryKey: ['order-details', selectedOrder],
    queryFn: async () => {
      try {
        const response = await axios.get(`/orders/${selectedOrder}`);
        return response.data.data;
      } catch (error) {
        console.error('Error fetching order details:', error);
        throw error;
      }
    },
    enabled: !!selectedOrder,
    onSuccess: () => {
      setShowOrderModal(true);
    },
    onError: () => {
      toast.error('Failed to fetch order details');
    }
  });

  // Cancel order mutation
  const queryClient = useQueryClient();
  const cancelOrder = useMutation({
    mutationFn: async (orderId) => {
      const response = await axios.post(`/orders/${orderId}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch orders query
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (selectedOrder) {
        refetchOrderDetails();
      }
      toast.success('Order cancelled successfully');
    },
    onError: () => {
      toast.error('Failed to cancel order');
    }
  });
  
  // Delete order mutation
  const deleteOrder = useMutation({
    mutationFn: async (orderId) => {
      const response = await axios.delete(`/orders/${orderId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch orders query
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelectedOrder(null);
      setShowOrderModal(false);
      toast.success('Order deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete order');
    }
  });

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    // Convert to lowercase for case-insensitive comparison
    const statusLower = status.toLowerCase();
    
    switch (statusLower) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
      case 'dispatched':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  // Get payment status badge class
  const getPaymentStatusBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount)
  }

  // Handle view order details
  const handleViewOrder = (orderId) => {
    setSelectedOrder(orderId);
  };

  // Handle cancel order
  const handleCancelOrder = (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelOrder.mutate(orderId);
    }
  };
  
  // Handle delete order
  const handleDeleteOrder = (orderId) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      deleteOrder.mutate(orderId);
    }
  };

  // Check if order can be cancelled (orders with PAID payment status can be cancelled)
  const canCancelOrder = (order) => {
    const paymentStatus = (order.payment?.status || order.paymentStatus || '').toUpperCase();
    const orderStatus = (order.statusHistory && order.statusHistory.length > 0 
      ? order.statusHistory[order.statusHistory.length - 1].status 
      : order.orderStatus || '').toUpperCase();
    
    // Cannot cancel if order is already cancelled
    if (orderStatus === 'CANCELLED') {
      return false;
    }
    
    return paymentStatus === 'PAID';
  };
  
  // Check if order can be paid (orders with PENDING payment status can be paid)
  const canPayOrder = (order) => {
    const paymentStatus = (order.payment?.status || order.paymentStatus || '').toUpperCase();
    const paymentMethod = (order.payment?.method || '').toUpperCase();
    const orderStatus = (order.statusHistory && order.statusHistory.length > 0 
      ? order.statusHistory[order.statusHistory.length - 1].status 
      : order.orderStatus || '').toUpperCase();
    
    // Only show Pay Now for COD orders with PENDING payment status
    // and not already in cart and not cancelled
    return paymentStatus === 'PENDING' && 
           paymentMethod === 'COD' && 
           !isOrderInCart(order._id) &&
           orderStatus !== 'CANCELLED';
  };
  
  // Load Cashfree SDK when component mounts
  useEffect(() => {
    const loadCashfreeSDK = async () => {
      const loaded = await loadCashfreeScript();
      if (loaded) {
        setCashfreeLoaded(true);
        console.log('Cashfree SDK loaded successfully');
      } else {
        console.error('Failed to load Cashfree SDK');
      }
    };
    
    loadCashfreeSDK();
  }, []);

  // Initialize Cashfree payment
  const initializeCashfreePayment = (orderToken, orderId) => {
    if (!cashfreeLoaded) {
      toast.error('Payment gateway is not loaded. Please try again.');
      return;
    }
    
    // Store orderId in localStorage for payment callback
    localStorage.setItem('pendingOrderId', orderId);
    console.log('Stored pending order ID in localStorage:', orderId);
    
    const cashfree = window.Cashfree({
      mode: 'sandbox', // Change to 'production' for live environment
    });
    
    // Set the callback URLs for success and failure
    const baseUrl = window.location.origin;
    const successUrl = `${baseUrl}/payment/success.html?orderId=${orderId}`;
    const failureUrl = `${baseUrl}/payment/failure.html?orderId=${orderId}`;
    
    const checkoutOptions = {
      paymentSessionId: orderToken,
      redirectTarget: '_blank', // Changed from '_self' to '_blank' to ensure proper redirection
      orderToken: orderToken,
      orderId: orderId,
      components: [
        "order-details",
        "card",
        "upi",
        "app",
        "netbanking",
        "paylater"
      ],
      onSuccess: (data) => {
        console.log('Payment success:', data);
        // Redirect to success page with orderId
        window.location.href = successUrl;
      },
      onFailure: (data) => {
        console.log('Payment failed:', data);
        // Redirect to failure page with orderId and error
        window.location.href = `${failureUrl}&error=${encodeURIComponent(data.message || 'Payment failed')}`;
      },
      onError: (error) => {
        console.error('Payment error:', error);
        // Redirect to failure page with orderId and error
        window.location.href = `${failureUrl}&error=${encodeURIComponent(error.message || 'Payment error')}`;
      }
    };
    
    cashfree.checkout(checkoutOptions)
      .then(function(data) {
        console.log('Payment initiated:', data);
        // Don't set order as placed or clear cart yet - wait for payment confirmation
        // The backend will handle the payment success via webhook/callback
      })
      .catch(function(error) {
        console.error('Payment failed:', error);
        toast.error('Payment failed. Please try again.');
        setProcessingPayment(false);
      });
  };

  // Handle pay order - initiates CashFree payment for COD orders
  const handlePayOrder = async (order) => {
    try {
      setProcessingPayment(true);
      setPaymentOrderId(order._id);
      
      // Create payment payload
      const paymentPayload = {
        paymentMethod: 'CASHFREE'
      };
      
      // Call API to create payment token
      const response = await axios.post(`/orders/${order._id}/pay`, paymentPayload);
      
      if (response.data.success) {
        // Initialize Cashfree payment with token
        const paymentToken = response.data.data.paymentToken || response.data.data.token;
        const orderId = response.data.data.orderId || order._id;
        
        // Add order ID to paidOrders list in state and localStorage to prevent multiple payments
        const updatedPaidOrders = [...paidOrders, order._id];
        setPaidOrders(updatedPaidOrders);
        localStorage.setItem('paidOrders', JSON.stringify(updatedPaidOrders));
        
        // Initialize Cashfree payment
        initializeCashfreePayment(paymentToken, orderId);
      } else {
        throw new Error(response.data.message || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment. Please try again.');
      setProcessingPayment(false);
    }
  };
  
  // Effect to check if cart is empty and remove order from paidOrders if so
  useEffect(() => {
    if (cart.length === 0 && paidOrders.length > 0) {
      // If cart is empty, enable Pay Now buttons again by clearing paidOrders
      setPaidOrders([]);
      localStorage.removeItem('paidOrders');
    }
  }, [cart, paidOrders]);
  
  // Check if order can be deleted (orders with PENDING payment status can be deleted)
  const canDeleteOrder = (order) => {
    const paymentStatus = (order.payment?.status || order.paymentStatus || '').toUpperCase();
    return paymentStatus === 'PENDING';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Error loading orders</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg p-8">
        <div className="mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold mb-4">No Orders Yet</h2>
        <p className="text-gray-600 mb-6">You haven't placed any orders yet.</p>
        <Button href="/shop">Start Shopping</Button>
      </div>
    );
  }

  // Payment processing screen
  if (processingPayment) {
    return (
      <div className="container-custom py-8">
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold mb-4">Payment Processing</h1>
          <p className="text-gray-600 mb-2">Please complete your payment in the payment window.</p>
          <p className="text-gray-600 mb-6">Do not close this window until your payment is complete.</p>
          <p className="text-gray-600 mb-8">Your order will be confirmed once the payment is successful.</p>
          <Button 
            variant="outline" 
            onClick={() => {
              setProcessingPayment(false);
              setPaymentOrderId('');
            }}
          >
            Cancel Payment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {selectedOrder && !showOrderModal ? (
        // Selected order details view
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Order #{(orders.find(o => o._id === selectedOrder)?.order_id || selectedOrder).substring(0, 8)}</h2>
            <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>Back to Orders</Button>
          </div>
          
          {/* Order Details Page */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Order Date</h3>
                  <p className="font-medium">{formatDate(orders.find(o => o._id === selectedOrder)?.createdAt)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Total Amount</h3>
                  <p className="font-medium">{formatCurrency(orders.find(o => o._id === selectedOrder)?.total || orders.find(o => o._id === selectedOrder)?.totalAmount)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Order Status</h3>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
                    orders.find(o => o._id === selectedOrder)?.statusHistory && orders.find(o => o._id === selectedOrder)?.statusHistory.length > 0 
                      ? orders.find(o => o._id === selectedOrder)?.statusHistory[orders.find(o => o._id === selectedOrder)?.statusHistory.length - 1].status 
                      : orders.find(o => o._id === selectedOrder)?.orderStatus
                  )}`}>
                    {(orders.find(o => o._id === selectedOrder)?.statusHistory && orders.find(o => o._id === selectedOrder)?.statusHistory.length > 0 
                      ? orders.find(o => o._id === selectedOrder)?.statusHistory[orders.find(o => o._id === selectedOrder)?.statusHistory.length - 1].status 
                      : orders.find(o => o._id === selectedOrder)?.orderStatus)?.charAt(0).toUpperCase() + 
                      (orders.find(o => o._id === selectedOrder)?.statusHistory && orders.find(o => o._id === selectedOrder)?.statusHistory.length > 0 
                        ? orders.find(o => o._id === selectedOrder)?.statusHistory[orders.find(o => o._id === selectedOrder)?.statusHistory.length - 1].status 
                        : orders.find(o => o._id === selectedOrder)?.orderStatus)?.slice(1).toLowerCase() || 'N/A'}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Status</h3>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusBadgeClass(
                    orders.find(o => o._id === selectedOrder)?.payment?.status || orders.find(o => o._id === selectedOrder)?.paymentStatus
                  )}`}>
                    {(orders.find(o => o._id === selectedOrder)?.payment?.status || orders.find(o => o._id === selectedOrder)?.paymentStatus)?.charAt(0).toUpperCase() + 
                     (orders.find(o => o._id === selectedOrder)?.payment?.status || orders.find(o => o._id === selectedOrder)?.paymentStatus)?.slice(1).toLowerCase() || 'N/A'}
                  </span>
                </div>
              </div>
              
              {/* Payment Method */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Method</h3>
                    <p className="font-medium">{orders.find(o => o._id === selectedOrder)?.payment?.method || 'N/A'}</p>
                  </div>
                  {orders.find(o => o._id === selectedOrder)?.payment?.transactionId && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Transaction ID</h3>
                      <p className="font-medium text-xs truncate">{orders.find(o => o._id === selectedOrder)?.payment.transactionId}</p>
                    </div>
                  )}
                  {orders.find(o => o._id === selectedOrder)?.coupon?.code && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Coupon Applied</h3>
                      <p className="font-medium">{orders.find(o => o._id === selectedOrder)?.coupon.code}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tracking Information */}
            {(orders.find(o => o._id === selectedOrder)?.shipping?.trackingId || orders.find(o => o._id === selectedOrder)?.shipping?.courier) && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium mb-2">Shipping Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  {orders.find(o => o._id === selectedOrder)?.shipping?.courier && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Courier</h4>
                      <p>{orders.find(o => o._id === selectedOrder)?.shipping.courier}</p>
                    </div>
                  )}
                  {orders.find(o => o._id === selectedOrder)?.shipping?.trackingId && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Tracking Number</h4>
                      <div className="flex items-center">
                        <p className="mr-2">{orders.find(o => o._id === selectedOrder)?.shipping.trackingId}</p>
                        <a 
                          href={`https://shiprocket.co/tracking/${orders.find(o => o._id === selectedOrder)?.shipping.trackingId}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          Track
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Status Timeline */}
            {orders.find(o => o._id === selectedOrder)?.statusHistory && orders.find(o => o._id === selectedOrder)?.statusHistory.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-4">Order Timeline</h3>
                <div className="relative pl-8 border-l-2 border-gray-200 space-y-6">
                  {orders.find(o => o._id === selectedOrder)?.statusHistory.map((status, index) => (
                    <div key={index} className="relative">
                      <div className="absolute -left-10 mt-1.5 h-4 w-4 rounded-full bg-teal-500"></div>
                      <div>
                        <p className="font-medium">{status.status.charAt(0).toUpperCase() + status.status.slice(1).toLowerCase()}</p>
                        <p className="text-sm text-gray-500">{formatDate(status.timestamp)} {new Date(status.timestamp).toLocaleTimeString()}</p>
                        {status.note && <p className="text-sm italic mt-1">{status.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Items */}
            <h3 className="font-medium mb-4">Order Items</h3>
            <div className="border rounded-lg overflow-hidden mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.find(o => o._id === selectedOrder)?.items.map((item) => (
                    <tr key={item._id || item.variantSku}>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-md overflow-hidden">
                            <img 
                              src={item.productId?.images?.[0]} 
                              alt={item.productId?.title} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <div className="ml-4">
                            <h4 className="font-medium">{item.productId?.title}</h4>
                            <p className="text-sm text-gray-500">SKU: {item.variantSku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">{item.qty || item.quantity}</td>
                      <td className="px-4 py-4 text-center">{formatCurrency(item.price || item.priceAtPurchase)}</td>
                      <td className="px-4 py-4 text-right">{formatCurrency((item.price || item.priceAtPurchase) * (item.qty || item.quantity))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right text-sm font-medium">Subtotal:</td>
                    <td className="px-4 py-3 text-right text-sm">{formatCurrency(orders.find(o => o._id === selectedOrder)?.subtotal || (orders.find(o => o._id === selectedOrder)?.total - (orders.find(o => o._id === selectedOrder)?.totalGST || 0)))}</td>
                  </tr>
                  {(orders.find(o => o._id === selectedOrder)?.totalGST > 0 || orders.find(o => o._id === selectedOrder)?.items.some(item => item.gstAmount > 0)) && (
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-right text-sm font-medium">GST:</td>
                      <td className="px-4 py-3 text-right text-sm">{formatCurrency(orders.find(o => o._id === selectedOrder)?.totalGST || orders.find(o => o._id === selectedOrder)?.items.reduce((sum, item) => sum + (item.gstAmount || 0), 0))}</td>
                    </tr>
                  )}
                  {orders.find(o => o._id === selectedOrder)?.discount > 0 && (
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-right text-sm font-medium">Discount:</td>
                      <td className="px-4 py-3 text-right text-sm text-red-600">-{formatCurrency(orders.find(o => o._id === selectedOrder)?.discount)}</td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-gray-300">
                    <td colSpan="3" className="px-4 py-3 text-right font-medium">Total:</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(orders.find(o => o._id === selectedOrder)?.total || orders.find(o => o._id === selectedOrder)?.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Shipping Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium mb-4">Shipping Address</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{orders.find(o => o._id === selectedOrder)?.shipping?.address?.name || orders.find(o => o._id === selectedOrder)?.shippingAddress?.name || 'Shipping Address'}</p>
                  <p>{orders.find(o => o._id === selectedOrder)?.shipping?.address?.street || orders.find(o => o._id === selectedOrder)?.shippingAddress?.line1}</p>
                  <p>
                    {orders.find(o => o._id === selectedOrder)?.shipping?.address?.city || orders.find(o => o._id === selectedOrder)?.shippingAddress?.city}, 
                    {orders.find(o => o._id === selectedOrder)?.shipping?.address?.state || orders.find(o => o._id === selectedOrder)?.shippingAddress?.state} 
                    {orders.find(o => o._id === selectedOrder)?.shipping?.address?.pincode || orders.find(o => o._id === selectedOrder)?.shippingAddress?.zip}
                  </p>
                  <p>{orders.find(o => o._id === selectedOrder)?.shipping?.address?.country || orders.find(o => o._id === selectedOrder)?.shippingAddress?.country || 'India'}</p>
                  <p className="mt-2">{orders.find(o => o._id === selectedOrder)?.shipping?.address?.phone || orders.find(o => o._id === selectedOrder)?.shippingAddress?.phone}</p>
                </div>
              </div>
              
              {/* Only show if billing address is different from shipping */}
              {orders.find(o => o._id === selectedOrder)?.billing?.address && JSON.stringify(orders.find(o => o._id === selectedOrder)?.billing.address) !== JSON.stringify(orders.find(o => o._id === selectedOrder)?.shipping?.address) && (
                <div>
                  <h3 className="font-medium mb-4">Billing Address</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">{orders.find(o => o._id === selectedOrder)?.billing.address.name}</p>
                    <p>{orders.find(o => o._id === selectedOrder)?.billing.address.street}</p>
                    <p>
                      {orders.find(o => o._id === selectedOrder)?.billing.address.city}, 
                      {orders.find(o => o._id === selectedOrder)?.billing.address.state} 
                      {orders.find(o => o._id === selectedOrder)?.billing.address.pincode}
                    </p>
                    <p>{orders.find(o => o._id === selectedOrder)?.billing.address.country || 'India'}</p>
                    <p className="mt-2">{orders.find(o => o._id === selectedOrder)?.billing.address.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-between items-center gap-4">
              {canCancelOrder(orders.find(o => o._id === selectedOrder)) && (
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={() => handleCancelOrder(selectedOrder)}
                >
                  Cancel Order
                </Button>
              )}
              
              {/* Download Invoice Button - This would need a backend endpoint to generate invoices */}
              {/* {(orders.find(o => o._id === selectedOrder)?.statusHistory && 
                orders.find(o => o._id === selectedOrder)?.statusHistory.some(status => 
                  ['CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(status.status.toUpperCase())
                )) && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toast.success('Invoice download feature will be available soon!')}
                >
                  Download Invoice
                </Button>
              )} */}
            </div>
          </div>
        </div>
      ) : (
        // Orders list view
        <div>
          <h2 className="text-xl font-semibold mb-6">My Orders</h2>
          
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">#{(order.order_id || order._id).substring(0, 8)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div>{formatDate(order.createdAt)}</div>
                      <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.statusHistory && order.statusHistory.length > 0 ? order.statusHistory[order.statusHistory.length - 1].status : 'unknown')}`}>
                        {order.statusHistory && order.statusHistory.length > 0 
                          ? order.statusHistory[order.statusHistory.length - 1].status.charAt(0).toUpperCase() + 
                            order.statusHistory[order.statusHistory.length - 1].status.slice(1).toLowerCase()
                          : 'Unknown'}
                      </span>
                      {order.shipping?.trackingId && (
                        <div className="mt-1">
                          <a 
                            href={`https://shiprocket.co/tracking/${order.shipping.trackingId}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Track Order
                          </a>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadgeClass(order.payment?.status || order.paymentStatus)}`}>
                        {(order.payment?.status || order.paymentStatus)?.charAt(0).toUpperCase() + 
                         (order.payment?.status || order.paymentStatus)?.slice(1).toLowerCase()}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">{order.payment?.method || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      {formatCurrency(order.total)}
                      {order.items && (
                        <div className="text-xs text-gray-500 mt-1">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex flex-col space-y-2 items-end">
                        <Button 
                          variant="outline" 
                          size="xs" 
                          onClick={() => handleViewOrder(order._id)}
                          className="inline-flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </Button>
                        
                        {canCancelOrder(order) && (
                          <Button 
                            variant="danger" 
                            size="xs" 
                            onClick={() => handleCancelOrder(order._id)}
                            className="inline-flex items-center"
                          >
                            Cancel Order
                          </Button>
                        )}
                        
                        {canPayOrder(order) && (
                          <Button 
                            variant="primary" 
                            size="xs" 
                            onClick={() => handlePayOrder(order)}
                            className="inline-flex items-center"
                          >
                            Pay Now
                          </Button>
                        )}
                        
                        {canDeleteOrder(order) && (
                          <Button 
                            variant="danger" 
                            size="xs" 
                            onClick={() => handleDeleteOrder(order._id)}
                            className="inline-flex items-center"
                          >
                            Delete Order
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && orderDetails && (
        <Modal
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          title={`Order Details #${(orderDetails.order_id || orderDetails._id).substring(0, 8)}`}
          size="lg"
        >
          <div className="p-4">
            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Order Date</h3>
                  <p className="font-medium">{formatDate(orderDetails.createdAt)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Total Amount</h3>
                  <p className="font-medium">{formatCurrency(orderDetails.total || orderDetails.totalAmount)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Order Status</h3>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
                    orderDetails.statusHistory && orderDetails.statusHistory.length > 0 
                      ? orderDetails.statusHistory[orderDetails.statusHistory.length - 1].status 
                      : orderDetails.orderStatus
                  )}`}>
                    {(orderDetails.statusHistory && orderDetails.statusHistory.length > 0 
                      ? orderDetails.statusHistory[orderDetails.statusHistory.length - 1].status 
                      : orderDetails.orderStatus)?.charAt(0).toUpperCase() + 
                      (orderDetails.statusHistory && orderDetails.statusHistory.length > 0 
                        ? orderDetails.statusHistory[orderDetails.statusHistory.length - 1].status 
                        : orderDetails.orderStatus)?.slice(1).toLowerCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Status</h3>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusBadgeClass(
                    orderDetails.payment?.status || orderDetails.paymentStatus
                  )}`}>
                    {(orderDetails.payment?.status || orderDetails.paymentStatus)?.charAt(0).toUpperCase() + 
                     (orderDetails.payment?.status || orderDetails.paymentStatus)?.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>
              
              {/* Payment Method */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Method</h3>
                    <p className="font-medium">{orderDetails.payment?.method || 'N/A'}</p>
                  </div>
                  {orderDetails.payment?.transactionId && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Transaction ID</h3>
                      <p className="font-medium text-xs truncate">{orderDetails.payment.transactionId}</p>
                    </div>
                  )}
                  {orderDetails.coupon?.code && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Coupon Applied</h3>
                      <p className="font-medium">{orderDetails.coupon.code}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tracking Information */}
            {(orderDetails.shipping?.trackingId || orderDetails.shipping?.courier) && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium mb-2">Shipping Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  {orderDetails.shipping?.courier && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Courier</h4>
                      <p>{orderDetails.shipping.courier}</p>
                    </div>
                  )}
                  {orderDetails.shipping?.trackingId && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Tracking Number</h4>
                      <div className="flex items-center">
                        <p className="mr-2">{orderDetails.shipping.trackingId}</p>
                        <a 
                          href={`https://shiprocket.co/tracking/${orderDetails.shipping.trackingId}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          Track
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Status Timeline */}
            {orderDetails.statusHistory && orderDetails.statusHistory.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-4">Order Timeline</h3>
                <div className="relative pl-8 border-l-2 border-gray-200 space-y-6">
                  {orderDetails.statusHistory.map((status, index) => (
                    <div key={index} className="relative">
                      <div className="absolute -left-10 mt-1.5 h-4 w-4 rounded-full bg-teal-500"></div>
                      <div>
                        <p className="font-medium">{status.status.charAt(0).toUpperCase() + status.status.slice(1).toLowerCase()}</p>
                        <p className="text-sm text-gray-500">{formatDate(status.timestamp)} {new Date(status.timestamp).toLocaleTimeString()}</p>
                        {status.note && <p className="text-sm italic mt-1">{status.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Items */}
            <h3 className="font-medium mb-4">Order Items</h3>
            <div className="border rounded-lg overflow-hidden mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderDetails.items.map((item) => (
                    <tr key={item._id || item.variantSku}>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-md overflow-hidden">
                            <img 
                              src={item.productId?.images?.[0]} 
                              alt={item.productId?.title} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <div className="ml-4">
                            <h4 className="font-medium">{item.productId?.title}</h4>
                            <p className="text-sm text-gray-500">SKU: {item.variantSku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">{item.qty || item.quantity}</td>
                      <td className="px-4 py-4 text-center">{formatCurrency(item.price || item.priceAtPurchase)}</td>
                      <td className="px-4 py-4 text-right">{formatCurrency((item.price || item.priceAtPurchase) * (item.qty || item.quantity))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right text-sm font-medium">Subtotal:</td>
                    <td className="px-4 py-3 text-right text-sm">{formatCurrency(orderDetails.subtotal || (orderDetails.total - (orderDetails.totalGST || 0)))}</td>
                  </tr>
                  {(orderDetails.totalGST > 0 || orderDetails.items.some(item => item.gstAmount > 0)) && (
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-right text-sm font-medium">GST:</td>
                      <td className="px-4 py-3 text-right text-sm">{formatCurrency(orderDetails.totalGST || orderDetails.items.reduce((sum, item) => sum + (item.gstAmount || 0), 0))}</td>
                    </tr>
                  )}
                  {orderDetails.discount > 0 && (
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-right text-sm font-medium">Discount:</td>
                      <td className="px-4 py-3 text-right text-sm text-red-600">-{formatCurrency(orderDetails.discount)}</td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-gray-300">
                    <td colSpan="3" className="px-4 py-3 text-right font-medium">Total:</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(orderDetails.total || orderDetails.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Shipping Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium mb-4">Shipping Address</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{orderDetails.shipping?.address?.name || orderDetails.shippingAddress?.name || 'Shipping Address'}</p>
                  <p>{orderDetails.shipping?.address?.street || orderDetails.shippingAddress?.line1}</p>
                  <p>
                    {orderDetails.shipping?.address?.city || orderDetails.shippingAddress?.city}, 
                    {orderDetails.shipping?.address?.state || orderDetails.shippingAddress?.state} 
                    {orderDetails.shipping?.address?.pincode || orderDetails.shippingAddress?.zip}
                  </p>
                  <p>{orderDetails.shipping?.address?.country || orderDetails.shippingAddress?.country || 'India'}</p>
                  <p className="mt-2">{orderDetails.shipping?.address?.phone || orderDetails.shippingAddress?.phone}</p>
                </div>
              </div>
              
              {/* Only show if billing address is different from shipping */}
              {orderDetails.billing?.address && JSON.stringify(orderDetails.billing.address) !== JSON.stringify(orderDetails.shipping?.address) && (
                <div>
                  <h3 className="font-medium mb-4">Billing Address</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">{orderDetails.billing.address.name}</p>
                    <p>{orderDetails.billing.address.street}</p>
                    <p>
                      {orderDetails.billing.address.city}, 
                      {orderDetails.billing.address.state} 
                      {orderDetails.billing.address.pincode}
                    </p>
                    <p>{orderDetails.billing.address.country || 'India'}</p>
                    <p className="mt-2">{orderDetails.billing.address.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-between items-center gap-4">
              {canCancelOrder(orderDetails) && (
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={() => {
                    handleCancelOrder(orderDetails._id);
                    setShowOrderModal(false);
                  }}
                >
                  Cancel Order
                </Button>
              )}
              
              {canPayOrder(orderDetails) && (
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => {
                    handlePayOrder(orderDetails);
                    setShowOrderModal(false);
                  }}
                >
                  Pay Now
                </Button>
              )}
              
              {canDeleteOrder(orderDetails) && (
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={() => {
                    handleDeleteOrder(orderDetails._id);
                    setShowOrderModal(false);
                  }}
                >
                  Delete Order
                </Button>
              )}
              
              {/* Download Invoice Button - This would need a backend endpoint to generate invoices */}
              {(orderDetails.statusHistory && 
                orderDetails.statusHistory.some(status => 
                  ['CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(status.status.toUpperCase())
                )) && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toast.success('Invoice download feature will be available soon!')}
                >
                  Download Invoice
                </Button>
              )}
              
              <Button variant="secondary" onClick={() => setShowOrderModal(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AccountOrders;
