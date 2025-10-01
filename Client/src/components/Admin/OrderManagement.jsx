import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../utils/api';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Modal from '../Common/Modal';
import { toast } from 'react-hot-toast';

const OrderManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  
  const queryClient = useQueryClient();
  
  // Fetch orders with React Query
  const { data: ordersData, isLoading, isError, error } = useQuery({
    queryKey: ['admin-orders', page, limit, searchTerm, dateRange, statusFilter, paymentFilter],
    queryFn: async () => {
      try {
        let url = `/orders/admin/all?page=${page}&limit=${limit}`;
        
        if (searchTerm) url += `&search=${searchTerm}`;
        if (dateRange.startDate) url += `&startDate=${dateRange.startDate}`;
        if (dateRange.endDate) url += `&endDate=${dateRange.endDate}`;
        if (statusFilter) url += `&status=${statusFilter}`;
        if (paymentFilter) url += `&paymentMethod=${paymentFilter}`;
        
        const response = await axios.get(url);
        return response.data;
      } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }
    },
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000 // 2 minutes
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

  // Update order status mutation
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }) => {
      const response = await axios.patch(`/orders/${orderId}/status`, {
        orderStatus: status
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch orders queries
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      if (selectedOrder) {
        refetchOrderDetails();
      }
      toast.success('Order status updated successfully');
    },
    onError: () => {
      toast.error('Failed to update order status');
    }
  });
  
  // Handle view order details
  const handleViewOrder = (orderId) => {
    setSelectedOrder(orderId);
  };
  
  // Handle status change
  const handleStatusChange = (orderId, newStatus) => {
    updateOrderStatus.mutate({ orderId, status: newStatus });
  };
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };
  
  // Handle date filter change
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle checkbox selection
  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };
  
  // Handle select all orders
  const handleSelectAll = () => {
    if (ordersData?.data) {
      if (selectedOrders.length === ordersData.data.length) {
        setSelectedOrders([]);
      } else {
        setSelectedOrders(ordersData.data.map(order => order._id));
      }
    }
  };
  
  // Handle print shipping labels
  const handlePrintShippingLabels = () => {
    if (selectedOrders.length === 0) {
      toast.error('Please select at least one order');
      return;
    }
    
    // In a real application, this would call an API to generate shipping labels
    toast.success(`Printing shipping labels for ${selectedOrders.length} orders`);
    
    // Mock implementation - in a real app, this would open a new window with the labels
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Shipping Labels</title>');
    printWindow.document.write('<style>body { font-family: Arial; } .label { border: 1px solid #000; margin: 10px; padding: 15px; page-break-after: always; } </style>');
    printWindow.document.write('</head><body>');
    
    selectedOrders.forEach(orderId => {
      const order = ordersData.data.find(o => o._id === orderId);
      if (order) {
        printWindow.document.write(`<div class="label">`);
        printWindow.document.write(`<h2>Shipping Label</h2>`);
        printWindow.document.write(`<p><strong>Order ID:</strong> ${order.orderNumber || order._id}</p>`);
        printWindow.document.write(`<p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>`);
        printWindow.document.write(`<p><strong>Customer:</strong> ${order.shippingAddress?.name || 'N/A'}</p>`);
        printWindow.document.write(`<p><strong>Address:</strong><br>${order.shippingAddress?.street || 'N/A'}<br>${order.shippingAddress?.city || 'N/A'}, ${order.shippingAddress?.state || 'N/A'} ${order.shippingAddress?.zipCode || 'N/A'}<br>${order.shippingAddress?.country || 'N/A'}</p>`);
        printWindow.document.write(`</div>`);
      }
    });
    
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'stock_issue':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  };
  
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
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h3 className="text-xl font-semibold">Orders Management</h3>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <form onSubmit={handleSearch} className="flex flex-grow">
            <Input
              type="text"
              placeholder="Search by order ID or customer"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mr-2 w-full"
            />
            <Button type="submit" variant="primary" size="sm">
              Search
            </Button>
          </form>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="stock_issue">Stock Issue</option>
            </select>
            
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-sm"
            >
              <option value="">All Payments</option>
              <option value="COD">COD</option>
              <option value="Cashfree">Cashfree</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Date range filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">From:</label>
          <Input
            type="date"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateChange}
            className="w-full sm:w-auto"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">To:</label>
          <Input
            type="date"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateChange}
            className="w-full sm:w-auto"
          />
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            setDateRange({ startDate: '', endDate: '' });
            setStatusFilter('');
            setPaymentFilter('');
            setSearchTerm('');
          }}
        >
          Clear Filters
        </Button>
        
        {selectedOrders.length > 0 && (
          <Button
            variant="primary"
            size="sm"
            className="ml-auto"
            onClick={handlePrintShippingLabels}
          >
            Print Shipping Labels ({selectedOrders.length})
          </Button>
        )}
      </div>
      
      {/* Orders table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : isError ? (
        <div className="text-center py-8">
          <p className="text-red-500">Error: {error.message}</p>
        </div>
      ) : ordersData?.data?.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length > 0 && selectedOrders.length === ordersData.data.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ordersData.data.map((order) => (
                  <tr key={order._id}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order._id)}
                        onChange={() => handleSelectOrder(order._id)}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      {order.orderNumber || (order._id ? order._id.substring(0, 8) : 'N/A')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {order.shippingAddress?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                        {order.paymentMethod === 'COD' ? 'COD' : 'Cashfree'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.orderStatus)}`}>
                        {order.orderStatus ? order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1) : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        className="mr-2"
                        onClick={() => handleViewOrder(order._id)}
                      >
                        View
                      </Button>
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => {
                          setSelectedOrders([order._id]);
                          handlePrintShippingLabels();
                        }}
                      >
                        Print Label
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {ordersData.pagination && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, ordersData.pagination.total)} of {ordersData.pagination.total} orders
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= ordersData.pagination.pages}
                  onClick={() => setPage(prev => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No orders found</p>
        </div>
      )}
      
      {/* Order details modal */}
      {showOrderModal && orderDetails && (
        <Modal
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          title={`Order Details: ${orderDetails.orderNumber || orderDetails._id}`}
          size="lg"
        >
          {orderDetailsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Order status */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Order Status</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(orderDetails.orderStatus)}`}>
                    {orderDetails.orderStatus ? orderDetails.orderStatus.charAt(0).toUpperCase() + orderDetails.orderStatus.slice(1) : 'Unknown'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-sm"
                    value={orderDetails.orderStatus}
                    onChange={(e) => handleStatusChange(orderDetails._id, e.target.value)}
                  >
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>  
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="stock_issue">Stock Issue</option>
                  </select>
                  
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedOrders([orderDetails._id]);
                      handlePrintShippingLabels();
                    }}
                  >
                    Print Label
                  </Button>
                </div>
              </div>
              
              {/* Order info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer & Shipping */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Customer Information</h4>
                    <p className="text-sm">{orderDetails.shippingAddress?.name || 'N/A'}</p>
                    <p className="text-sm">{orderDetails.shippingAddress?.email || 'N/A'}</p>
                    <p className="text-sm">{orderDetails.shippingAddress?.phone || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Shipping Address</h4>
                    <p className="text-sm">{orderDetails.shippingAddress?.street || 'N/A'}</p>
                    <p className="text-sm">
                      {orderDetails.shippingAddress?.city || 'N/A'}, 
                      {orderDetails.shippingAddress?.state || 'N/A'} 
                      {orderDetails.shippingAddress?.zipCode || 'N/A'}
                    </p>
                    <p className="text-sm">{orderDetails.shippingAddress?.country || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Payment Information</h4>
                    <p className="text-sm">Method: {orderDetails.paymentMethod || 'N/A'}</p>
                    <p className="text-sm">Status: 
                      <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusBadgeClass(orderDetails.paymentStatus)}`}>
                        {orderDetails.paymentStatus ? orderDetails.paymentStatus.charAt(0).toUpperCase() + orderDetails.paymentStatus.slice(1) : 'Unknown'}
                      </span>
                    </p>
                  </div>
                </div>
                
                {/* Order Items */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Order Items</h4>
                  <div className="border rounded-md divide-y divide-gray-200">
                    {(orderDetails.order_items || orderDetails.items)?.map((item, index) => (
                      <div key={index} className="p-3 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">{item.product?.title || 'Product'}</p>
                          <p className="text-xs text-gray-500">
                            Qty: {item.quantity} × {formatCurrency(item.priceAtPurchase)}
                          </p>
                        </div>
                        <p className="text-sm font-medium">
                          {formatCurrency(item.quantity * item.priceAtPurchase)}
                        </p>
                      </div>
                    ))}
                    
                    {/* Order Summary */}
                    <div className="p-3 space-y-1 bg-gray-50">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>{formatCurrency(orderDetails.subtotal || 0)}</span>
                      </div>
                      {orderDetails.discountAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Discount</span>
                          <span>-{formatCurrency(orderDetails.discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span>Shipping</span>
                        <span>{formatCurrency(orderDetails.shippingCost || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax</span>
                        <span>{formatCurrency(orderDetails.taxAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-200">
                        <span>Total</span>
                        <span>{formatCurrency(parseFloat(orderDetails.subtotal - (orderDetails.discountAmount || 0) + (orderDetails.taxAmount || 0)))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tracking Information */}
              {orderDetails.tracking && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Tracking Information</h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm"><strong>Carrier:</strong> {orderDetails.tracking.carrier || 'Shiprocket'}</p>
                    <p className="text-sm"><strong>Tracking Number:</strong> {orderDetails.tracking.trackingNumber || 'N/A'}</p>
                    <p className="text-sm"><strong>Tracking URL:</strong> 
                      {orderDetails.tracking.trackingUrl ? (
                        <a href={orderDetails.tracking.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                          View Tracking
                        </a>
                      ) : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default OrderManagement;