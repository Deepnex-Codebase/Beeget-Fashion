import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../utils/api';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import { toast } from 'react-hot-toast';

const AccountReturns = () => {
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [createReturnOrder, setCreateReturnOrder] = useState(null);
  const [showCreateReturnModal, setShowCreateReturnModal] = useState(false);
  const [returnItems, setReturnItems] = useState([]);
  const [returnReason, setReturnReason] = useState('');
  const [returnDescription, setReturnDescription] = useState('');
  
  const queryClient = useQueryClient();

  // Fetch user's returns
  const { data: returnsData, isLoading } = useQuery({
    queryKey: ['user-returns'],
    queryFn: async () => {
      try {
        const response = await axios.get('/returns/user');
        return response.data;
      } catch (error) {
        // console.error('Error fetching returns:', error);
        throw error;
      }
    },
    staleTime: 60000 // 1 minute
  });

  // Fetch return details
  const { data: returnDetails, isLoading: returnDetailsLoading } = useQuery({
    queryKey: ['return-details', selectedReturn],
    queryFn: async () => {
      try {
        const response = await axios.get(`/returns/${selectedReturn}`);
        return response.data.data;
      } catch (error) {
        // console.error('Error fetching return details:', error);
        throw error;
      }
    },
    enabled: !!selectedReturn,
    onSuccess: () => {
      setShowReturnModal(true);
    }
  });

  // Fetch user's eligible orders for returns
  const { data: eligibleOrdersData, isLoading: eligibleOrdersLoading } = useQuery({
    queryKey: ['eligible-orders-for-return'],
    queryFn: async () => {
      try {
        // Fetch orders that are delivered and within the return window (e.g., 30 days)
        const response = await axios.get('/orders?status=delivered');
        return response.data;
      } catch (error) {
        // console.error('Error fetching eligible orders:', error);
        throw error;
      }
    },
    staleTime: 60000 // 1 minute
  });

  // Fetch order details for creating a return
  const { data: orderDetails, isLoading: orderDetailsLoading } = useQuery({
    queryKey: ['order-details-for-return', createReturnOrder],
    queryFn: async () => {
      try {
        const response = await axios.get(`/orders/${createReturnOrder}`);
        return response.data.data;
      } catch (error) {
        // console.error('Error fetching order details:', error);
        throw error;
      }
    },
    enabled: !!createReturnOrder,
    onSuccess: (data) => {
      // Initialize return items with all order items
      const initialItems = data.items.map(item => ({
        productId: item.product._id,
        product: item.product,
        quantity: 0,
        maxQuantity: item.quantity,
        price: item.price,
        selected: false
      }));
      setReturnItems(initialItems);
      setShowCreateReturnModal(true);
    }
  });

  // Create return request mutation
  const createReturn = useMutation({
    mutationFn: async (returnData) => {
      const response = await axios.post('/returns', returnData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch returns query
      queryClient.invalidateQueries({ queryKey: ['user-returns'] });
      setShowCreateReturnModal(false);
      setCreateReturnOrder(null);
      setReturnItems([]);
      setReturnReason('');
      setReturnDescription('');
      toast.success('Return request created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create return request: ${error.response?.data?.message || error.message}`);
    }
  });

  // Handle view return details
  const handleViewReturn = (returnId) => {
    setSelectedReturn(returnId);
  };

  // Handle create return request
  const handleCreateReturn = (orderId) => {
    setCreateReturnOrder(orderId);
  };

  // Handle item selection for return
  const handleItemSelection = (index) => {
    setReturnItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems[index].selected = !updatedItems[index].selected;
      if (!updatedItems[index].selected) {
        updatedItems[index].quantity = 0;
      } else if (updatedItems[index].quantity === 0) {
        updatedItems[index].quantity = 1;
      }
      return updatedItems;
    });
  };

  // Handle item quantity change
  const handleQuantityChange = (index, value) => {
    const quantity = parseInt(value, 10);
    if (isNaN(quantity)) return;

    setReturnItems(prevItems => {
      const updatedItems = [...prevItems];
      const maxQty = updatedItems[index].maxQuantity;
      updatedItems[index].quantity = Math.min(Math.max(0, quantity), maxQty);
      return updatedItems;
    });
  };

  // Handle submit return request
  const handleSubmitReturn = () => {
    // Validate return items
    const selectedItems = returnItems.filter(item => item.selected && item.quantity > 0);
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to return');
      return;
    }

    if (!returnReason) {
      toast.error('Please select a reason for your return');
      return;
    }

    // Prepare return data
    const returnData = {
      orderId: createReturnOrder,
      items: selectedItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        reason: returnReason,
        description: returnDescription
      }))
    };

    // Submit return request
    createReturn.mutate(returnData);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get refund status badge class
  const getRefundStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if an order is eligible for return
  const isOrderEligibleForReturn = (order) => {
    if (!order) return false;
    
    // Check if order is delivered
    if (order.orderStatus !== 'delivered') return false;
    
    // Check if order already has a return request
    if (order.hasReturnRequest) return false;
    
    // Check if order is within return window (e.g., 30 days)
    const orderDate = new Date(order.deliveredAt || order.updatedAt);
    const currentDate = new Date();
    const daysDifference = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24));
    
    return daysDifference <= 30; // 30-day return window
  };

  // Filter eligible orders for returns
  const eligibleOrders = useMemo(() => {
    if (!eligibleOrdersData?.data) return [];
    
    // Ensure eligibleOrdersData.data is an array before filtering
    const ordersArray = Array.isArray(eligibleOrdersData.data) 
      ? eligibleOrdersData.data 
      : eligibleOrdersData.data.orders || [];
      
    return ordersArray.filter(order => isOrderEligibleForReturn(order, returnsData?.data));
  }, [eligibleOrdersData, returnsData]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const returns = returnsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">My Returns</h2>
        {eligibleOrders.length > 0 && (
          <div className="dropdown dropdown-end">
            <Button variant="primary" size="sm" onClick={() => document.getElementById('return-dropdown').classList.toggle('dropdown-open')}>
              Request a Return
            </Button>
            <ul id="return-dropdown" className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              {eligibleOrdersLoading ? (
                <li className="p-2">Loading orders...</li>
              ) : eligibleOrders.length > 0 ? (
                eligibleOrders.map(order => (
                  <li key={order._id}>
                    <a onClick={() => handleCreateReturn(order._id)}>
                      Order #{order.orderNumber || order._id.substring(0, 8)}
                    </a>
                  </li>
                ))
              ) : (
                <li className="p-2">No eligible orders</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {returns.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Refund</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {returns.map((returnItem) => (
                  <tr key={returnItem._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {returnItem._id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {returnItem.orderId?.orderNumber || returnItem.orderId?._id.substring(0, 8) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(returnItem.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(returnItem.returnStatus)}`}>
                        {returnItem.returnStatus.charAt(0).toUpperCase() + returnItem.returnStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRefundStatusBadgeClass(returnItem.refundStatus)}`}>
                        {returnItem.refundStatus.charAt(0).toUpperCase() + returnItem.refundStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleViewReturn(returnItem._id)}
                        className="text-java-600 hover:text-java-800 font-medium flex items-center transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-500">You haven't made any return requests yet.</p>
          {eligibleOrders.length > 0 && (
            <p className="mt-2">
              <Button variant="link" onClick={() => document.getElementById('return-dropdown').classList.toggle('dropdown-open')}>
                Request a return
              </Button>
              for one of your recent orders.
            </p>
          )}
        </div>
      )}
      
      {/* Return Details Modal */}
      {showReturnModal && returnDetails && (
        <Modal
          isOpen={showReturnModal}
          onClose={() => setShowReturnModal(false)}
          title={`Return Request #${returnDetails._id.substring(0, 8)}`}
          size="lg"
        >
          <div className="p-4">
            {/* Return Status */}
            <div className="mb-6 border-b pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Return Status</h3>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(returnDetails.returnStatus)}`}>
                    {returnDetails.returnStatus.charAt(0).toUpperCase() + returnDetails.returnStatus.slice(1)}
                  </span>
                </div>
                
                <div className="mt-2 md:mt-0">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Refund Status</h3>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRefundStatusBadgeClass(returnDetails.refundStatus)}`}>
                    {returnDetails.refundStatus.charAt(0).toUpperCase() + returnDetails.refundStatus.slice(1)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Order Info */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Order Information</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm mb-1">
                  <span className="font-medium">Order ID:</span> {returnDetails.orderId?._id.substring(0, 8) || 'N/A'}
                </p>
                <p className="text-sm mb-1">
                  <span className="font-medium">Order Date:</span> {formatDate(returnDetails.orderId?.createdAt) || 'N/A'}
                </p>
                <p className="text-sm mb-1">
                  <span className="font-medium">Return Date:</span> {formatDate(returnDetails.createdAt)}
                </p>
                {returnDetails.refundAmount > 0 && (
                  <p className="text-sm">
                    <span className="font-medium">Refund Amount:</span> {formatCurrency(returnDetails.refundAmount)}
                  </p>
                )}
              </div>
            </div>
            
            {/* Return Items */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Return Items</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                {returnDetails.items.map((item, index) => (
                  <div key={index} className="flex items-start py-2 border-b last:border-b-0">
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
                      {item.productId?.images?.[0] ? (
                        <img 
                          src={item.productId.images[0]} 
                          alt={item.productId.title} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="font-medium">{item.productId?.title || 'Product'}</h4>
                      <div className="flex justify-between mt-1">
                        <div className="text-sm text-gray-500">
                          <p>Quantity: {item.quantity}</p>
                          <p className="mt-1">
                            <span className="font-medium">Reason:</span> {item.reason.replace('_', ' ')}
                          </p>
                          {item.description && (
                            <p className="mt-1">
                              <span className="font-medium">Description:</span> {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Tracking Information */}
            {returnDetails.trackingInfo && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Tracking Information</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  {returnDetails.trackingInfo.carrier && (
                    <p className="text-sm mb-1">
                      <span className="font-medium">Carrier:</span> {returnDetails.trackingInfo.carrier}
                    </p>
                  )}
                  {returnDetails.trackingInfo.trackingNumber && (
                    <p className="text-sm mb-1">
                      <span className="font-medium">Tracking Number:</span> {returnDetails.trackingInfo.trackingNumber}
                    </p>
                  )}
                  {returnDetails.trackingInfo.returnLabel && (
                    <p className="text-sm">
                      <span className="font-medium">Return Label:</span> 
                      <a 
                        href={returnDetails.trackingInfo.returnLabel} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-teal-600 hover:underline ml-1"
                      >
                        Download Return Label
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Admin Notes */}
            {returnDetails.adminNotes && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Notes from Seller</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm">{returnDetails.adminNotes}</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowReturnModal(false)}
                className="text-sm py-1.5 px-4 border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
      
      {/* Create Return Modal */}
      {showCreateReturnModal && orderDetails && (
        <Modal
          isOpen={showCreateReturnModal}
          onClose={() => {
            setShowCreateReturnModal(false);
            setCreateReturnOrder(null);
            setReturnItems([]);
            setReturnReason('');
            setReturnDescription('');
          }}
          title={`Create Return for Order #${orderDetails.orderNumber || orderDetails._id.substring(0, 8)}`}
          size="lg"
        >
          <div className="p-4">
            <div className="mb-6">
              <h3 className="font-medium mb-2">Select Items to Return</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                {returnItems.map((item, index) => (
                  <div key={index} className="flex items-start py-2 border-b last:border-b-0">
                    <div className="flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleItemSelection(index)}
                        className="checkbox checkbox-sm checkbox-primary mt-2"
                      />
                    </div>
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-md overflow-hidden ml-2">
                      {item.product?.images?.[0] ? (
                        <img 
                          src={item.product.images[0]} 
                          alt={item.product.title} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="font-medium">{item.product?.title || 'Product'}</h4>
                      <div className="flex justify-between mt-1">
                        <div className="text-sm text-gray-500">
                          <p>Price: {formatCurrency(item.price)}</p>
                          <p>Max Quantity: {item.maxQuantity}</p>
                        </div>
                        {item.selected && (
                          <div className="flex items-center">
                            <label className="text-sm text-gray-500 mr-2">Quantity to Return:</label>
                            <input
                              type="number"
                              min="1"
                              max={item.maxQuantity}
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                              className="w-16 p-1 border border-gray-300 rounded-md text-center"
                              disabled={!item.selected}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">Return Reason</h3>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              >
                <option value="">Select a reason</option>
                <option value="wrong_item">Wrong Item Received</option>
                <option value="defective">Defective/Damaged Item</option>
                <option value="not_as_described">Item Not As Described</option>
                <option value="size_issue">Size/Fit Issue</option>
                <option value="quality_issue">Quality Issue</option>
                <option value="changed_mind">Changed Mind</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">Additional Details (Optional)</h3>
              <textarea
                value={returnDescription}
                onChange={(e) => setReturnDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows="3"
                placeholder="Please provide any additional details about your return request"
              ></textarea>
            </div>
            
            <div className="flex justify-end mt-6 space-x-2">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowCreateReturnModal(false);
                  setCreateReturnOrder(null);
                  setReturnItems([]);
                  setReturnReason('');
                  setReturnDescription('');
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSubmitReturn}
                disabled={createReturn.isLoading}
              >
                {createReturn.isLoading ? 'Submitting...' : 'Submit Return Request'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AccountReturns;