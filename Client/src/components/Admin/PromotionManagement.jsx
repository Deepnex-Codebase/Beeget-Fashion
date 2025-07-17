import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../utils/api';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import Input from '../Common/Input';
import { toast } from 'react-hot-toast';

const PromotionManagement = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [currentPromotion, setCurrentPromotion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    startDate: '',
    endDate: '',
    active: true,
    promotionType: 'general',
    couponPrefix: 'BG',
    couponLength: 8,
    couponExpireDays: 30,
    minOrderAmount: 0,
    maxUsageCount: 1,
    image: ''
  });
  
  const [couponFormData, setCouponFormData] = useState({
    promotionId: '',
    userIds: []
  });
  
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [generatedCoupons, setGeneratedCoupons] = useState([]);
  const [showGeneratedCoupons, setShowGeneratedCoupons] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Fetch promotions
  const { data: promotionsData, isLoading: promotionsLoading } = useQuery({
    queryKey: ['promotions', searchTerm],
    queryFn: async () => {
      const response = await axios.get(`/promotions?search=${searchTerm}`);
      return response.data;
    },
    staleTime: 60000, // 1 minute
  });
  
  // Fetch users for coupon generation
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', userSearchTerm],
    queryFn: async () => {
      const response = await axios.get(`/users?search=${userSearchTerm}&limit=100`);
      return response.data;
    },
    enabled: showCouponModal,
    staleTime: 60000, // 1 minute
  });
  
  // Create promotion mutation
  const createPromotion = useMutation({
    mutationFn: async (data) => {
      // Format dates properly
      const formattedData = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined
      };
      const response = await axios.post('/promotions', formattedData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      setShowAddModal(false);
      resetForm();
      toast.success('Promotion created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create promotion');
    }
  });
  
  // Update promotion mutation
  const updatePromotion = useMutation({
    mutationFn: async ({ id, data }) => {
      // Format dates properly
      const formattedData = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined
      };
      const response = await axios.put(`/promotions/${id}`, formattedData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      setShowEditModal(false);
      resetForm();
      toast.success('Promotion updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update promotion');
    }
  });
  
  // Delete promotion mutation
  const deletePromotion = useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`/promotions/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      setShowDeleteModal(false);
      setCurrentPromotion(null);
      toast.success('Promotion deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete promotion');
    }
  });
  
  // Generate coupons mutation
  const generateCoupons = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post('/promotions/generate-coupons', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      
      // Store generated coupons with user information
      const couponsWithUsers = data.data.coupons.map(coupon => {
        const user = selectedUsers.find(user => user._id === coupon.userId);
        return {
          ...coupon,
          userName: user ? user.name : 'Unknown',
          userEmail: user ? user.email : 'Unknown'
        };
      });
      
      setGeneratedCoupons(couponsWithUsers);
      setShowGeneratedCoupons(true);
      toast.success(`Generated ${data.data.coupons.length} coupons successfully. Emails have been sent to the selected users.`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to generate coupons');
    }
  });
  
  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      startDate: '',
      endDate: '',
      active: true,
      promotionType: 'general',
      couponPrefix: 'BG',
      couponLength: 8,
      couponExpireDays: 30,
      minOrderAmount: 0,
      maxUsageCount: 1,
      image: ''
    });
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle edit button click - immediately open modal
  const handleEditClick = (promotion) => {
    setCurrentPromotion(promotion);
    setFormData({
      name: promotion.name,
      description: promotion.description || '',
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      startDate: new Date(promotion.startDate).toISOString().split('T')[0],
      endDate: new Date(promotion.endDate).toISOString().split('T')[0],
      active: promotion.active,
      promotionType: promotion.promotionType || 'general',
      couponPrefix: promotion.couponPrefix || 'BG',
      couponLength: promotion.couponLength || 8,
      couponExpireDays: promotion.couponExpireDays || 30,
      minOrderAmount: promotion.minOrderAmount || 0,
      maxUsageCount: promotion.maxUsageCount || 1,
      image: promotion.image || ''
    });
    setShowEditModal(true);
  };
  
  // Handle delete button click - immediately open modal
  const handleDeleteClick = (promotion) => {
    setCurrentPromotion(promotion);
    setShowDeleteModal(true);
  };
  
  // Handle coupon generation button click - immediately open modal
  const handleCouponClick = (promotion) => {
    setCurrentPromotion(promotion);
    setCouponFormData({
      promotionId: promotion._id,
      userIds: []
    });
    setShowCouponModal(true);
    setShowGeneratedCoupons(false);
    setGeneratedCoupons([]);
  };
  
  // Handle user selection for coupons
  const handleUserSelect = (user) => {
    const isSelected = selectedUsers.some(u => u._id === user._id);
    
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
      setCouponFormData({
        ...couponFormData,
        userIds: couponFormData.userIds.filter(id => id !== user._id)
      });
    } else {
      setSelectedUsers([...selectedUsers, user]);
      setCouponFormData({
        ...couponFormData,
        userIds: [...couponFormData.userIds, user._id]
      });
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get promotions from API response
  const promotions = promotionsData?.data || [];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Promotions Management</h3>
        <Button onClick={() => setShowAddModal(true)}>Add New Promotion</Button>
      </div>
      
      {/* Search and filter */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search promotions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      {/* Promotions list */}
      {promotionsLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : promotions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {promotions.map((promotion) => (
                <tr key={promotion._id}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {promotion.image && (
                        <img 
                          src={promotion.image} 
                          alt={promotion.name} 
                          className="h-10 w-10 rounded-full mr-3 object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">{promotion.name}</div>
                        <div className="text-sm text-gray-500">{promotion.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className="capitalize">{promotion.promotionType || 'general'}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {promotion.discountType === 'percentage' ? (
                      <span>{promotion.discountValue}% off</span>
                    ) : (
                      <span>₹{promotion.discountValue} off</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div>{formatDate(promotion.startDate)}</div>
                    <div className="text-gray-500">to {formatDate(promotion.endDate)}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${promotion.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {promotion.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                    <Button variant="outline" size="xs" className="mr-2" onClick={() => handleEditClick(promotion)}>Edit</Button>
                    <Button variant="outline" size="xs" className="mr-2" onClick={() => handleDeleteClick(promotion)}>Delete</Button>
                    {promotion.promotionType === 'coupon' && (
                      <Button variant="outline" size="xs" onClick={() => handleCouponClick(promotion)}>Generate Coupons</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No promotions found</p>
        </div>
      )}
      
      {/* Add Promotion Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Promotion"
      >
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter promotion name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Type</label>
              <select
                name="promotionType"
                value={formData.promotionType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="general">General</option>
                <option value="coupon">Coupon</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <select
                name="discountType"
                value={formData.discountType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
              <Input
                type="number"
                name="discountValue"
                value={formData.discountValue}
                onChange={handleInputChange}
                placeholder={formData.discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <Input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <Input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Amount</label>
              <Input
                type="number"
                name="minOrderAmount"
                value={formData.minOrderAmount}
                onChange={handleInputChange}
                placeholder="Enter minimum order amount"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Usage Count</label>
              <Input
                type="number"
                name="maxUsageCount"
                value={formData.maxUsageCount}
                onChange={handleInputChange}
                placeholder="Enter max usage count"
              />
            </div>
            
            {formData.promotionType === 'coupon' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Prefix</label>
                  <Input
                    type="text"
                    name="couponPrefix"
                    value={formData.couponPrefix}
                    onChange={handleInputChange}
                    placeholder="Enter coupon prefix"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Length</label>
                  <Input
                    type="number"
                    name="couponLength"
                    value={formData.couponLength}
                    onChange={handleInputChange}
                    placeholder="Enter coupon length"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Expiry (days)</label>
                  <Input
                    type="number"
                    name="couponExpireDays"
                    value={formData.couponExpireDays}
                    onChange={handleInputChange}
                    placeholder="Enter days until expiry"
                  />
                </div>
              </>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter promotion description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              rows="3"
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <Input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleInputChange}
              placeholder="Enter image URL"
            />
          </div>
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleInputChange}
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button 
              onClick={() => createPromotion.mutate(formData)}
              disabled={createPromotion.isLoading}
            >
              {createPromotion.isLoading ? 'Creating...' : 'Create Promotion'}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Edit Promotion Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Promotion"
      >
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter promotion name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Type</label>
              <select
                name="promotionType"
                value={formData.promotionType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                disabled={true} // Cannot change promotion type after creation
              >
                <option value="general">General</option>
                <option value="coupon">Coupon</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <select
                name="discountType"
                value={formData.discountType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
              <Input
                type="number"
                name="discountValue"
                value={formData.discountValue}
                onChange={handleInputChange}
                placeholder={formData.discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <Input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <Input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Amount</label>
              <Input
                type="number"
                name="minOrderAmount"
                value={formData.minOrderAmount}
                onChange={handleInputChange}
                placeholder="Enter minimum order amount"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Usage Count</label>
              <Input
                type="number"
                name="maxUsageCount"
                value={formData.maxUsageCount}
                onChange={handleInputChange}
                placeholder="Enter max usage count"
              />
            </div>
            
            {formData.promotionType === 'coupon' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Prefix</label>
                  <Input
                    type="text"
                    name="couponPrefix"
                    value={formData.couponPrefix}
                    onChange={handleInputChange}
                    placeholder="Enter coupon prefix"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Length</label>
                  <Input
                    type="number"
                    name="couponLength"
                    value={formData.couponLength}
                    onChange={handleInputChange}
                    placeholder="Enter coupon length"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Expiry (days)</label>
                  <Input
                    type="number"
                    name="couponExpireDays"
                    value={formData.couponExpireDays}
                    onChange={handleInputChange}
                    placeholder="Enter days until expiry"
                  />
                </div>
              </>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter promotion description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              rows="3"
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <Input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleInputChange}
              placeholder="Enter image URL"
            />
          </div>
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleInputChange}
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button 
              onClick={() => updatePromotion.mutate({ id: currentPromotion._id, data: formData })}
              disabled={updatePromotion.isLoading}
            >
              {updatePromotion.isLoading ? 'Updating...' : 'Update Promotion'}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Promotion"
      >
        <div className="p-4">
          <p className="mb-4">Are you sure you want to delete the promotion "{currentPromotion?.name}"?</p>
          
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button 
              variant="danger"
              onClick={() => deletePromotion.mutate(currentPromotion._id)}
              disabled={deletePromotion.isLoading}
            >
              {deletePromotion.isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Generate Coupons Modal */}
      <Modal
        isOpen={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        title="Generate Coupon Codes"
      >
        <div className="p-4">
          {!showGeneratedCoupons ? (
            <>
              <p className="mb-4">Generate coupon codes for "{currentPromotion?.name}"</p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Users</label>
                <Input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  placeholder="Search by name or email"
                />
              </div>
              
              <div className="mb-4 max-h-60 overflow-y-auto border rounded-md">
                {usersLoading ? (
                  <div className="flex justify-center items-center py-4">
                    <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : usersData?.data?.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {usersData.data.map(user => (
                      <li key={user._id} className="p-3 hover:bg-gray-50">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedUsers.some(u => u._id === user._id)}
                            onChange={() => handleUserSelect(user)}
                            className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                          />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-700">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center py-4 text-gray-500">No users found</p>
                )}
              </div>
              
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Selected Users: {selectedUsers.length}</p>
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedUsers.map(user => (
                      <span 
                        key={user._id} 
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800"
                      >
                        {user.name}
                        <button 
                          type="button"
                          className="ml-1 text-teal-500 hover:text-teal-700"
                          onClick={() => handleUserSelect(user)}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={() => setShowCouponModal(false)}>Cancel</Button>
                <Button 
                  onClick={() => {
                    generateCoupons.mutate(couponFormData);
                    setShowCouponModal(false); // Close modal immediately on button click
                  }}
                  disabled={generateCoupons.isLoading || selectedUsers.length === 0}
                >
                  {generateCoupons.isLoading ? 'Generating...' : 'Generate Coupons'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Coupons Generated Successfully!</h3>
                <p className="text-sm text-gray-600 mb-4">Emails have been sent to the following users with their coupon details:</p>
                
                <div className="max-h-96 overflow-y-auto border rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coupon Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {generatedCoupons.map((coupon, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{coupon.userName}</p>
                              <p className="text-sm text-gray-500">{coupon.userEmail}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 text-sm font-medium bg-teal-100 text-teal-800 rounded">{coupon.code}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {coupon.discountType === 'percent' ? `${coupon.value}%` : `₹${coupon.value}`}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {new Date(coupon.validUntil).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={() => setShowCouponModal(false)}>Close</Button>
                <Button onClick={() => setShowGeneratedCoupons(false)}>Generate More Coupons</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PromotionManagement;