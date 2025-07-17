import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../utils/api';
import { toast } from 'react-hot-toast';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import { useEffect } from 'react'

const NotificationManagement = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'update',
    link: '',
    image: '',
    promotionId: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['admin-notifications', currentPage, searchTerm, filterType],
    queryFn: async () => {
      const params = {
        page: currentPage,
        limit: 10
      };
      
      if (searchTerm) params.search = searchTerm;
      if (filterType) params.type = filterType;
      
      const response = await axios.get('/notifications', { params });
      return response.data;
    },
    keepPreviousData: true
  });

  // Fetch promotions when type is 'promotion'
  const { data: promotionsData } = useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const response = await axios.get('/promotions', { params: { active: true } });
      return response.data;
    },
    enabled: formData.type === 'promotion'
  });

  // Create notification mutation
  const createNotification = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post('/notifications', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      setShowCreateModal(false);
      resetForm();
      toast.success('Notification created and sent to all users successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create notification');
    }
  });

  // Delete notification mutation
  const deleteNotification = useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`/notifications/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      toast.success('Notification deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete notification');
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createNotification.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'update',
      link: '',
      image: '',
      promotionId: ''
    });
  };

  const handleViewNotification = (notification) => {
    setSelectedNotification(notification);
    setShowViewModal(true); // Immediately open modal
  };

  const handleDeleteNotification = (id) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      deleteNotification.mutate(id);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };

  const getTypeLabel = (type) => {
    const types = {
      'update': 'System Update',
      'sale': 'Sale',
      'new_product': 'New Product',
      'promotion': 'Promotion',
      'other': 'Other'
    };
    return types[type] || type;
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'sale':
        return 'bg-green-100 text-green-800';
      case 'new_product':
        return 'bg-purple-100 text-purple-800';
      case 'promotion':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Effect to reset promotionId when type changes
  useEffect(() => {
    if (formData.type !== 'promotion') {
      setFormData(prev => ({ ...prev, promotionId: '' }));
    }
  }, [formData.type]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Notification Management</h2>
        <Button onClick={() => setShowCreateModal(true)}>Create Notification</Button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search notifications..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>

        <select
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Types</option>
          <option value="update">System Update</option>
          <option value="sale">Sale</option>
          <option value="new_product">New Product</option>
          <option value="promotion">Promotion</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Notifications Table */}
      <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading notifications...
                </td>
              </tr>
            ) : notificationsData?.data?.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                  No notifications found
                </td>
              </tr>
            ) : (
              notificationsData?.data?.map((notification) => (
                <tr key={notification._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {notification.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeClass(notification.type)}`}>
                      {getTypeLabel(notification.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(notification.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {notification.createdBy?.name || 'System'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewNotification(notification)}
                      className="text-teal-600 hover:text-teal-900 mr-4"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteNotification(notification._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {notificationsData?.pagination && notificationsData.pagination.pages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Previous
            </button>
            
            {[...Array(notificationsData.pagination.pages)].map((_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${currentPage === index + 1 ? 'text-teal-600 bg-teal-50' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {index + 1}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === notificationsData.pagination.pages}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === notificationsData.pagination.pages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Create Notification Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Notification"
      >
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              required
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              required
            >
              <option value="update">System Update</option>
              <option value="sale">Sale</option>
              <option value="new_product">New Product</option>
              <option value="promotion">Promotion</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          {/* Show promotion selection when type is promotion */}
          {formData.type === 'promotion' && (
            <div className="mb-4">
              <label htmlFor="promotionId" className="block text-sm font-medium text-gray-700 mb-1">Select Promotion</label>
              <select
                id="promotionId"
                name="promotionId"
                value={formData.promotionId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                required={formData.type === 'promotion'}
              >
                <option value="">Select a promotion</option>
                {promotionsData?.data?.map((promotion) => (
                  <option key={promotion._id} value={promotion._id}>
                    {promotion.name} ({promotion.discountType === 'percentage' ? `${promotion.discountValue}%` : `₹${promotion.discountValue}`})
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">Link (Optional)</label>
            <input
              type="url"
              id="link"
              name="link"
              value={formData.link}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              placeholder="https://example.com/page"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
            <input
              type="url"
              id="image"
              name="image"
              value={formData.image}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button 
              variant="secondary" 
              onClick={() => setShowCreateModal(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              isLoading={createNotification.isLoading}
              disabled={createNotification.isLoading}
            >
              {createNotification.isLoading ? 'Sending...' : 'Send Notification'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Notification Modal */}
      {selectedNotification && (
        <Modal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          title="Notification Details"
        >
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">{selectedNotification.title}</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeClass(selectedNotification.type)} mt-2`}>
                {getTypeLabel(selectedNotification.type)}
              </span>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Message:</p>
              <p className="text-sm text-gray-900 whitespace-pre-line">{selectedNotification.message}</p>
            </div>
            
            {selectedNotification.promotionId && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Promotion:</p>
                <p className="text-sm text-gray-900">{selectedNotification.promotionName || selectedNotification.promotionId}</p>
              </div>
            )}
            
            {selectedNotification.link && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Link:</p>
                <a 
                  href={selectedNotification.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-teal-600 hover:text-teal-800"
                >
                  {selectedNotification.link}
                </a>
              </div>
            )}
            
            {selectedNotification.image && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Image:</p>
                <img 
                  src={selectedNotification.image} 
                  alt="Notification image" 
                  className="mt-2 max-w-full h-auto rounded-md"
                  style={{ maxHeight: '200px' }}
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Created By:</p>
                <p className="text-sm text-gray-900">{selectedNotification.createdBy?.name || 'System'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Created At:</p>
                <p className="text-sm text-gray-900">{formatDate(selectedNotification.createdAt)}</p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button variant="secondary" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default NotificationManagement;