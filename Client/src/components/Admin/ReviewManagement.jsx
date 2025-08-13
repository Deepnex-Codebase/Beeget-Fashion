import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../utils/api';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { FaStar, FaPlus } from 'react-icons/fa';

const ReviewManagement = () => {
  const queryClient = useQueryClient();
  
  // State for filters and pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [filters, setFilters] = useState({
    productId: '',
    userId: '',
    rating: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({
    productId: '',
    userId: '',
    rating: 5,
    review: '',
    useFakeUser: false,
    fakeUserName: '',
    fakeUserEmail: ''
  });
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Fetch reviews with filters and pagination
  const { data: reviewsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-reviews', page, limit, sort, order, filters],
    queryFn: async () => {
      try {
        // Build query parameters
        const queryParams = new URLSearchParams();
        queryParams.append('page', page);
        queryParams.append('limit', limit);
        queryParams.append('sort', sort);
        queryParams.append('order', order);
        
        if (filters.productId) queryParams.append('productId', filters.productId);
        if (filters.userId) queryParams.append('userId', filters.userId);
        if (filters.rating) queryParams.append('rating', filters.rating);
        
        const response = await axios.get(`/reviews/admin/all?${queryParams.toString()}`);
        return response.data?.data || { reviews: [], pagination: { total: 0 } };
      } catch (error) {
        console.error('Error fetching reviews:', error);
        toast.error('Failed to fetch reviews');
        return { reviews: [], pagination: { total: 0 } };
      }
    },
    staleTime: 2 * 60 * 1000 // 2 minutes
  });
  
  // Fetch products for dropdown
  const { data: productsData } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      try {
        const response = await axios.get('/products?limit=100');
        return response.data?.data?.products || [];
      } catch (error) {
        console.error('Error fetching products:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Fetch users for dropdown
  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        const response = await axios.get('/users');
        return response.data?.data?.users || [];
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Set products and users when data is loaded
  useEffect(() => {
    if (productsData) {
      setProducts(productsData);
    }
    if (usersData) {
      setUsers(usersData);
    }
  }, [productsData, usersData]);

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      // If using fake user, we need to create a temporary user first
      if (reviewData.useFakeUser && reviewData.fakeUserName && reviewData.fakeUserEmail) {
        try {
          // Create a temporary user
          const userResponse = await axios.post('/users/temp', {
            name: reviewData.fakeUserName,
            email: reviewData.fakeUserEmail
          });
          
          // Use the created user's ID for the review
          const tempUserId = userResponse.data.data.userId;
          
          // Create review with the temporary user ID
          const response = await axios.post('/reviews/admin/create', {
            productId: reviewData.productId,
            userId: tempUserId,
            rating: reviewData.rating,
            review: reviewData.review
          });
          
          return response.data;
        } catch (error) {
          console.error('Error creating temp user or review:', error);
          throw error;
        }
      } else {
        // Regular review creation with existing user
        const response = await axios.post('/reviews/admin/create', {
          productId: reviewData.productId,
          userId: reviewData.userId,
          rating: reviewData.rating,
          review: reviewData.review
        });
        return response.data;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch reviews query
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Review created successfully');
      setShowAddReviewModal(false);
      setNewReview({
        productId: '',
        userId: '',
        rating: 5,
        review: '',
        useFakeUser: false,
        fakeUserName: '',
        fakeUserEmail: ''
      });
    },
    onError: (error) => {
      console.error('Error creating review:', error);
      toast.error(error.response?.data?.message || 'Failed to create review');
    }
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId) => {
      const response = await axios.delete(`/reviews/${reviewId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch reviews query
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Review deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting review:', error);
      toast.error(error.response?.data?.message || 'Failed to delete review');
    }
  });
  
  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(1); // Reset to first page when filters change
  };
  
  // Handle sort change
  const handleSortChange = (e) => {
    const { value } = e.target;
    const [newSort, newOrder] = value.split('-');
    setSort(newSort);
    setOrder(newOrder);
    setPage(1); // Reset to first page when sort changes
  };
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search logic here
    // This could filter reviews client-side or make a new API call
    // For now, we'll just log the search term
    console.log('Searching for:', searchTerm);
  };
  
  // Handle star rating click for new review
  const handleStarClick = (rating) => {
    setNewReview(prev => ({
      ...prev,
      rating
    }));
  };
  
  // Handle review creation
  const handleCreateReview = (e) => {
    e.preventDefault();
    
    // Validate product and review text
    if (!newReview.productId || !newReview.rating || !newReview.review) {
      toast.error('Please fill all required fields');
      return;
    }
    
    // Validate user selection or fake user info
    if (!newReview.useFakeUser && !newReview.userId) {
      toast.error('Please select a user');
      return;
    }
    
    if (newReview.useFakeUser && (!newReview.fakeUserName || !newReview.fakeUserEmail)) {
      toast.error('Please provide fake user name and email');
      return;
    }
    
    // If all validations pass, create the review
    createReviewMutation.mutate(newReview);
  };

  // Handle input change for new review
  const handleNewReviewChange = (e) => {
    const { name, value } = e.target;
    setNewReview(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle review deletion
  const handleDeleteReview = (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      deleteReviewMutation.mutate(reviewId);
    }
  };
  
  // Handle review selection for viewing details
  const handleViewReview = (review) => {
    setSelectedReview(review);
    setShowReviewModal(true);
  };
  
  // Format date
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };
  
  // Get star rating display
  const getStarRating = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };
  
  // Get rating color class
  const getRatingColorClass = (rating) => {
    if (rating >= 4) return 'text-green-500';
    if (rating >= 3) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Review Management</h2>
        <button
          onClick={() => setShowAddReviewModal(true)}
          className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <FaPlus className="mr-2" /> Add Review
        </button>
        <div className="flex items-center space-x-2">
          <select 
            className="border border-gray-300 rounded-md text-sm py-1 px-2"
            value={`${sort}-${order}`}
            onChange={handleSortChange}
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="rating-desc">Highest Rating</option>
            <option value="rating-asc">Lowest Rating</option>
          </select>
          <select
            className="border border-gray-300 rounded-md text-sm py-1 px-2"
            name="rating"
            value={filters.rating}
            onChange={handleFilterChange}
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>
      
      {/* Search bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex">
          <input
            type="text"
            placeholder="Search by product or user..."
            className="border border-gray-300 rounded-l-md py-2 px-4 w-full focus:outline-none focus:ring-1 focus:ring-java-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            type="submit"
            className="bg-java-600 text-white py-2 px-4 rounded-r-md hover:bg-java-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>
      
      {/* Reviews table */}
      {isLoading ? (
        <div className="animate-pulse">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="border-b border-gray-200 py-3">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : reviewsData?.reviews?.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviewsData.reviews.map((review) => (
                <tr key={review._id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {review.product?.images?.[0] ? (
                        <img 
                          src={review.product.images[0]} 
                          alt={review.product.title} 
                          className="h-10 w-10 rounded-md object-cover mr-3"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-gray-200 mr-3 flex items-center justify-center text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {review.product?.title || 'Unknown Product'}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {review.user?.profileImage ? (
                        <img 
                          src={review.user.profileImage} 
                          alt={review.user.name} 
                          className="h-8 w-8 rounded-full object-cover mr-2"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-java-100 text-java-600 flex items-center justify-center mr-2">
                          {review.user?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{review.user?.name || 'Unknown User'}</div>
                        <div className="text-xs text-gray-500">{review.user?.email || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className={`text-sm ${getRatingColorClass(review.rating)}`}>
                      {getStarRating(review.rating)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900 truncate max-w-xs">
                      {review.review.length > 50 ? `${review.review.substring(0, 50)}...` : review.review}
                    </div>
                    {review.images && review.images.length > 0 && (
                      <div className="flex mt-1">
                        {review.images.slice(0, 3).map((image, index) => (
                          <img 
                            key={index} 
                            src={image} 
                            alt={`Review image ${index + 1}`} 
                            className="h-6 w-6 rounded-md object-cover mr-1"
                          />
                        ))}
                        {review.images.length > 3 && (
                          <div className="h-6 w-6 rounded-md bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                            +{review.images.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatDate(review.createdAt)}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleViewReview(review)}
                      className="text-java-600 hover:text-java-900 mr-3"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleDeleteReview(review._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="mt-2 text-gray-500">No reviews found</p>
        </div>
      )}
      
      {/* Pagination */}
      {reviewsData?.pagination && reviewsData.pagination.total > 0 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-500">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, reviewsData.pagination.total)} of {reviewsData.pagination.total} reviews
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className={`px-3 py-1 rounded-md ${page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Previous
            </button>
            {[...Array(Math.min(5, reviewsData.pagination.pages))].map((_, index) => {
              const pageNumber = index + 1;
              return (
                <button
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  className={`px-3 py-1 rounded-md ${page === pageNumber ? 'bg-java-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  {pageNumber}
                </button>
              );
            })}
            {reviewsData.pagination.pages > 5 && (
              <span className="px-3 py-1">...</span>
            )}
            {reviewsData.pagination.pages > 5 && (
              <button
                onClick={() => setPage(reviewsData.pagination.pages)}
                className={`px-3 py-1 rounded-md ${page === reviewsData.pagination.pages ? 'bg-java-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                {reviewsData.pagination.pages}
              </button>
            )}
            <button
              onClick={() => setPage(prev => Math.min(prev + 1, reviewsData.pagination.pages))}
              disabled={page === reviewsData.pagination.pages}
              className={`px-3 py-1 rounded-md ${page === reviewsData.pagination.pages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {/* Add Review Modal */}
      {showAddReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add New Review</h3>
              <button
                onClick={() => setShowAddReviewModal(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateReview} className="space-y-4">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Product *</label>
                <select
                  name="productId"
                  value={newReview.productId}
                  onChange={handleNewReviewChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select a product</option>
                  {products.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.title}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* User Selection Toggle */}
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  id="useFakeUser"
                  name="useFakeUser"
                  checked={newReview.useFakeUser}
                  onChange={(e) => {
                    setNewReview(prev => ({
                      ...prev,
                      useFakeUser: e.target.checked,
                      userId: e.target.checked ? '' : prev.userId
                    }));
                  }}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="useFakeUser" className="text-sm font-medium text-gray-700">
                  Create review with a fake user
                </label>
              </div>
              
              {/* Existing User Selection (when not using fake user) */}
              {!newReview.useFakeUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select User *</label>
                  <select
                    name="userId"
                    value={newReview.userId}
                    onChange={handleNewReviewChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    required={!newReview.useFakeUser}
                  >
                    <option value="">Select a user</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Fake User Fields (when using fake user) */}
              {newReview.useFakeUser && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fake User Name *</label>
                    <input
                      type="text"
                      name="fakeUserName"
                      value={newReview.fakeUserName}
                      onChange={handleNewReviewChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter fake user name"
                      required={newReview.useFakeUser}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fake User Email *</label>
                    <input
                      type="email"
                      name="fakeUserEmail"
                      value={newReview.fakeUserEmail}
                      onChange={handleNewReviewChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter fake user email"
                      required={newReview.useFakeUser}
                    />
                  </div>
                </div>
              )}
              
              {/* Rating Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating *</label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarClick(star)}
                      className="focus:outline-none"
                    >
                      <FaStar 
                        className={`text-2xl ${star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Review Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Text *</label>
                <textarea
                  name="review"
                  value={newReview.review}
                  onChange={handleNewReviewChange}
                  rows="4"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Write your review here..."
                  required
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddReviewModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={createReviewMutation.isLoading}
                >
                  {createReviewMutation.isLoading ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      
      {/* Review Detail Modal */}
      {showReviewModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Review Details</h3>
                <button 
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  {selectedReview.product?.images?.[0] ? (
                    <img 
                      src={selectedReview.product.images[0]} 
                      alt={selectedReview.product.title} 
                      className="h-16 w-16 rounded-md object-cover mr-3"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-md bg-gray-200 mr-3 flex items-center justify-center text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <h4 className="text-md font-medium text-gray-900">{selectedReview.product?.title || 'Unknown Product'}</h4>
                    {selectedReview.product?.price && (
                      <p className="text-sm text-gray-500">₹{selectedReview.product.price.toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  {selectedReview.user?.profileImage ? (
                    <img 
                      src={selectedReview.user.profileImage} 
                      alt={selectedReview.user.name} 
                      className="h-10 w-10 rounded-full object-cover mr-2"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-java-100 text-java-600 flex items-center justify-center mr-2">
                      {selectedReview.user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <h4 className="text-md font-medium text-gray-900">{selectedReview.user?.name || 'Unknown User'}</h4>
                    <p className="text-sm text-gray-500">{selectedReview.user?.email || ''}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <div className={`text-lg ${getRatingColorClass(selectedReview.rating)} mr-2`}>
                    {getStarRating(selectedReview.rating)}
                  </div>
                  <span className="text-sm text-gray-500">
                    Posted on {formatDate(selectedReview.createdAt)}
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-line">{selectedReview.review}</p>
              </div>
              
              {selectedReview.images && selectedReview.images.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Review Images</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedReview.images.map((image, index) => (
                      <img 
                        key={index} 
                        src={image} 
                        alt={`Review image ${index + 1}`} 
                        className="h-24 w-full rounded-md object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <button 
                  onClick={() => handleDeleteReview(selectedReview._id)}
                  className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors mr-2"
                >
                  Delete Review
                </button>
                <button 
                  onClick={() => setShowReviewModal(false)}
                  className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ReviewManagement;