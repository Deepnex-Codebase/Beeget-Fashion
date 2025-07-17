import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../utils/api';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Modal from '../Common/Modal';
import { toast } from 'react-hot-toast';

const ReturnManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [trackingInfo, setTrackingInfo] = useState({
    carrier: '',
    trackingNumber: '',
    returnLabel: ''
  });
  
  const queryClient = useQueryClient();

  // Fetch returns with React Query
  const { data: returnsData, isLoading } = useQuery({
    queryKey: ['returns', page, limit, searchTerm, statusFilter, dateRange],
    queryFn: async () => {
      try {
        let url = `/returns?page=${page}&limit=${limit}`;
        
        if (searchTerm) {
          url += `&search=${searchTerm}`;
        }
        
        if (statusFilter) {
          url += `&status=${statusFilter}`;
        }
        
        if (dateRange.startDate) {
          url += `&startDate=${dateRange.startDate}`;
        }
        
        if (dateRange.endDate) {
          url += `&endDate=${dateRange.endDate}`;
        }
        
        const response = await axios.get(url);
        return response.data;
      } catch (error) {
        console.error('Error fetching returns:', error);
        throw error;
      }
    },
    staleTime: 60000 // 1 minute
  });

  // Fetch return details
  const { data: returnDetails, isLoading: returnDetailsLoading, refetch: refetchReturnDetails } = useQuery({
    queryKey: ['return-details', selectedReturn],
    queryFn: async () => {
      try {
        const response = await axios.get(`/returns/${selectedReturn}`);
        return response.data.data;
      } catch (error) {
        console.error('Error fetching return details:', error);
        throw error;
      }
    },
    enabled: !!selectedReturn,
    onSuccess: (data) => {
      setAdminNotes(data.adminNotes || '');
      setTrackingInfo({
        carrier: data.trackingInfo?.carrier || '',
        trackingNumber: data.trackingInfo?.trackingNumber || '',
        returnLabel: data.trackingInfo?.returnLabel || ''
      });
      setShowReturnModal(true);
    }
  });

  // Update return status mutation
  const updateReturnStatus = useMutation({
    mutationFn: async ({ id, status, notes, tracking }) => {
      const payload = { returnStatus: status };
      
      if (notes) {
        payload.adminNotes = notes;
      }
      
      if (tracking && (tracking.carrier || tracking.trackingNumber || tracking.returnLabel)) {
        payload.trackingInfo = {};
        if (tracking.carrier) payload.trackingInfo.carrier = tracking.carrier;
        if (tracking.trackingNumber) payload.trackingInfo.trackingNumber = tracking.trackingNumber;
        if (tracking.returnLabel) payload.trackingInfo.returnLabel = tracking.returnLabel;
      }
      
      const response = await axios.patch(`/returns/${id}/status`, payload);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch returns query
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      if (selectedReturn) {
        refetchReturnDetails();
      }
      toast.success('Return status updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update return status: ${error.response?.data?.message || error.message}`);
    }
  });

  // Update refund status mutation
  const updateRefundStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await axios.patch(`/returns/${id}/status`, { refundStatus: status });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch returns query
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      if (selectedReturn) {
        refetchReturnDetails();
      }
      toast.success('Refund status updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update refund status: ${error.response?.data?.message || error.message}`);
    }
  });

  // Handle view return details
  const handleViewReturn = (returnId) => {
    setSelectedReturn(returnId);
  };

  // Handle status change
  const handleStatusChange = (status) => {
    if (window.confirm(`Are you sure you want to mark this return as ${status}?`)) {
      updateReturnStatus.mutate({
        id: selectedReturn,
        status,
        notes: adminNotes,
        tracking: trackingInfo
      });
    }
  };

  // Handle refund status change
  const handleRefundStatusChange = (status) => {
    if (window.confirm(`Are you sure you want to mark this refund as ${status}?`)) {
      updateRefundStatus.mutate({
        id: selectedReturn,
        status
      });
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };

  // Handle date range change
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setDateRange({ startDate: '', endDate: '' });
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
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-java-100 text-java-800';
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const returns = returnsData?.data || [];
  const totalPages = returnsData?.totalPages || 1;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Return Management</h1>
      
      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="flex-1">
            <form onSubmit={handleSearch} className="flex">
              <Input
                type="text"
                placeholder="Search by order ID or customer email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" className="ml-2">Search</Button>
            </form>
          </div>
          
          {/* Status Filter */}
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {/* Date Range */}
          <div className="flex flex-col md:flex-row gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <Input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <Input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
              />
            </div>
          </div>
          
          {/* Clear Filters */}
          <div>
            <Button variant="outline" onClick={handleClearFilters}>Clear Filters</Button>
          </div>
        </div>
      </div>
      
      {/* Returns Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Refund</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {returns.length > 0 ? (
                returns.map((returnItem) => (
                  <tr key={returnItem._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {returnItem._id ? returnItem._id.substring(0, 8) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {returnItem.orderId?.orderNumber || (returnItem.orderId?._id ? returnItem.orderId._id.substring(0, 8) : 'N/A') || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {returnItem.userId?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(returnItem.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(returnItem.returnStatus)}`}>
                        {returnItem.returnStatus ? returnItem.returnStatus.charAt(0).toUpperCase() + returnItem.returnStatus.slice(1) : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRefundStatusBadgeClass(returnItem.refundStatus)}`}>
                        {returnItem.refundStatus ? returnItem.refundStatus.charAt(0).toUpperCase() + returnItem.refundStatus.slice(1) : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(returnItem.refundAmount)}
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
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                    No return requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div className="flex-1 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="mr-2"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Return Details Modal */}
      {showReturnModal && returnDetails && (
        <Modal
          isOpen={showReturnModal}
          onClose={() => setShowReturnModal(false)}
          title={`Return Request #${returnDetails._id ? returnDetails._id.substring(0, 8) : 'N/A'}`}
          size="lg"
        >
          <div className="p-4">
            {/* Return Status */}
            <div className="mb-6 border-b pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Return Status</h3>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(returnDetails.returnStatus)}`}>
                    {returnDetails.returnStatus ? returnDetails.returnStatus.charAt(0).toUpperCase() + returnDetails.returnStatus.slice(1) : 'Unknown'}
                  </span>
                </div>
                
                <div className="mt-2 md:mt-0">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Refund Status</h3>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRefundStatusBadgeClass(returnDetails.refundStatus)}`}>
                    {returnDetails.refundStatus ? returnDetails.refundStatus.charAt(0).toUpperCase() + returnDetails.refundStatus.slice(1) : 'Unknown'}
                  </span>
                </div>
              </div>
              
              {/* Status Actions */}
              <div className="flex flex-wrap gap-2 mt-4">
                {returnDetails.returnStatus === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange('approved')}
                      className="bg-java-500 hover:bg-java-600"
                    >
                      Approve Return
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleStatusChange('rejected')}
                    >
                      Reject Return
                    </Button>
                  </>
                )}
                
                {returnDetails.returnStatus === 'approved' && returnDetails.refundStatus === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => handleRefundStatusChange('processed')}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    Process Refund
                  </Button>
                )}
                
                {returnDetails.returnStatus === 'approved' && returnDetails.refundStatus === 'processed' && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange('completed')}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    Mark as Completed
                  </Button>
                )}
              </div>
            </div>
            
            {/* Order and Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium mb-2">Order Information</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm mb-1">
                    <span className="font-medium">Order ID:</span> {returnDetails.orderId?._id ? returnDetails.orderId._id.substring(0, 8) : 'N/A'}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Order Date:</span> {formatDate(returnDetails.orderId?.createdAt) || 'N/A'}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Order Total:</span> {formatCurrency(returnDetails.orderId?.totalAmount) || 'N/A'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Return Date:</span> {formatDate(returnDetails.createdAt)}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Customer Information</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm mb-1">
                    <span className="font-medium">Name:</span> {returnDetails.userId ? `${returnDetails.userId.firstName || ''} ${returnDetails.userId.lastName || ''}`.trim() || 'N/A' : 'N/A'}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Email:</span> {returnDetails.userId?.email || 'N/A'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Refund Amount:</span> {formatCurrency(returnDetails.refundAmount)}
                  </p>
                </div>
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
                            <span className="font-medium">Reason:</span> {item.reason ? item.reason.replace('_', ' ') : 'N/A'}
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
            <div className="mb-6">
              <h3 className="font-medium mb-2">Tracking Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
                  <Input
                    type="text"
                    value={trackingInfo.carrier}
                    onChange={(e) => setTrackingInfo({...trackingInfo, carrier: e.target.value})}
                    placeholder="e.g. UPS, FedEx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                  <Input
                    type="text"
                    value={trackingInfo.trackingNumber}
                    onChange={(e) => setTrackingInfo({...trackingInfo, trackingNumber: e.target.value})}
                    placeholder="Enter tracking number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return Label</label>
                  <Input
                    type="text"
                    value={trackingInfo.returnLabel}
                    onChange={(e) => setTrackingInfo({...trackingInfo, returnLabel: e.target.value})}
                    placeholder="URL to return label"
                  />
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => updateReturnStatus.mutate({
                  id: selectedReturn,
                  status: returnDetails.returnStatus,
                  tracking: trackingInfo
                })}
                disabled={updateReturnStatus.isLoading}
              >
                Update Tracking Info
              </Button>
            </div>
            
            {/* Admin Notes */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Admin Notes</h3>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows="3"
                placeholder="Add notes about this return"
              ></textarea>
              <div className="mt-2">
                <Button
                  size="sm"
                  onClick={() => updateReturnStatus.mutate({
                    id: selectedReturn,
                    status: returnDetails.returnStatus,
                    notes: adminNotes
                  })}
                  disabled={updateReturnStatus.isLoading}
                >
                  Save Notes
                </Button>
              </div>
            </div>
            
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
    </div>
  );
};

export default ReturnManagement;