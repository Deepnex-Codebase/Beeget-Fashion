import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../utils/api';
import Button from '../Common/Button';
import Input from '../Common/Input';
import { toast } from 'react-hot-toast';

const SubAdminManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [editingUser, setEditingUser] = useState(null);
  // Define departments and their permissions
  const departmentPermissions = {
    'Catalog': ['Products', 'Categories', 'Collections', 'Promotions'],
    'Orders': ['All Orders', 'Ready to Ship', 'Dispatched', 'Return', 'Cancel'],
    'User Communication': ['Messages', 'Email Campaigns', 'Reviews'],
    'Content': ['CMS Pages']
  };
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'subadmin',
    department: '',
    permissions: []
  });
  
  // State to track selected permissions for checkboxes
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showConfirmBan, setShowConfirmBan] = useState(false);
  const [userToBan, setUserToBan] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [showConfirmUnban, setShowConfirmUnban] = useState(false);
  const [userToUnban, setUserToUnban] = useState(null);
  const [showAddSubAdminModal, setShowAddSubAdminModal] = useState(false);
  const [newSubAdminData, setNewSubAdminData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    permissions: []
  });
  
  // State to track selected permissions for the add form
  const [newSubAdminPermissions, setNewSubAdminPermissions] = useState({});
  
  // New state for filters
  const [filters, setFilters] = useState({
    verification: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Fetch subadmin users with React Query
  const { data: usersData, isLoading, isError, error } = useQuery({
    queryKey: ['subadmins', page, limit, searchTerm, filters],
    queryFn: async () => {
      try {
        // Always filter by role=subadmin to only show subadmin users
        let queryParams = `page=${page}&limit=${limit}&role=subadmin`;
        
        if (searchTerm) {
          queryParams += `&search=${searchTerm}`;
        }
        
        if (filters.verification) {
          queryParams += `&verification=${filters.verification}`;
        }
        
        if (filters.startDate) {
          queryParams += `&startDate=${filters.startDate}`;
        }
        
        if (filters.endDate) {
          queryParams += `&endDate=${filters.endDate}`;
        }
        
        const response = await axios.get(`/users?${queryParams}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching subadmin users:', error);
        throw error;
      }
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  // Mutation for updating user
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }) => {
      const response = await axios.put(`/users/${userId}`, userData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch users query
      queryClient.invalidateQueries({ queryKey: ['subadmins'] });
      toast.success('SubAdmin updated successfully');
      setEditingUser(null);
    },
    onError: (error) => {
      console.error('Error updating subadmin:', error);
      toast.error(error.response?.data?.message || 'Failed to update subadmin');
    }
  });
  
  // Mutation for deleting user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await axios.delete(`/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch users query
      queryClient.invalidateQueries({ queryKey: ['subadmins'] });
      toast.success('SubAdmin deleted successfully');
      setShowConfirmDelete(false);
      setUserToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting subadmin:', error);
      toast.error(error.response?.data?.message || 'Failed to delete subadmin');
    }
  });

  // Mutation for banning user
  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason }) => {
      const response = await axios.put(`/users/${userId}/ban`, { reason });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch users query
      queryClient.invalidateQueries({ queryKey: ['subadmins'] });
      toast.success('SubAdmin banned successfully');
      setShowConfirmBan(false);
      setUserToBan(null);
      setBanReason('');
    },
    onError: (error) => {
      console.error('Error banning subadmin:', error);
      toast.error(error.response?.data?.message || 'Failed to ban subadmin');
    }
  });

  // Mutation for unbanning user
  const unbanUserMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await axios.put(`/users/${userId}/unban`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch users query
      queryClient.invalidateQueries({ queryKey: ['subadmins'] });
      toast.success('SubAdmin unbanned successfully');
      setShowConfirmUnban(false);
      setUserToUnban(null);
    },
    onError: (error) => {
      console.error('Error unbanning subadmin:', error);
      toast.error(error.response?.data?.message || 'Failed to unban subadmin');
    }
  });
  
  // Mutation for creating a new subadmin
  const createSubAdminMutation = useMutation({
    mutationFn: async (userData) => {
      const response = await axios.post('/users/register-subadmin', userData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch users query
      queryClient.invalidateQueries({ queryKey: ['subadmins'] });
      toast.success('SubAdmin created successfully');
      setShowAddSubAdminModal(false);
      setNewSubAdminData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        department: '',
        permissions: []
      });
      // Reset selected permissions
      setNewSubAdminPermissions({});
    },
    onError: (error) => {
      console.error('Error creating subadmin:', error);
      toast.error(error.response?.data?.message || 'Failed to create subadmin');
    }
  });
  
  // Handle edit button click
  const handleEdit = (user) => {
    setEditingUser(user);
    
    // Set form data
    setFormData({
      name: user.name,
      email: user.email,
      role: 'subadmin', // Always subadmin for this component
      department: user.department || '',
      permissions: user.permissions || []
    });
    
    // Initialize selected permissions based on user's existing permissions
    const permissionsObj = {};
    if (user.department && departmentPermissions[user.department]) {
      departmentPermissions[user.department].forEach(perm => {
        permissionsObj[perm] = (user.permissions || []).includes(perm);
      });
    }
    setSelectedPermissions(permissionsObj);
  };
  
  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for department change
    if (name === 'department') {
      // Reset permissions when department changes
      setFormData(prev => ({
        ...prev,
        [name]: value,
        permissions: [] // Reset permissions
      }));
      
      // Initialize permissions checkboxes for the new department
      const newPermissions = {};
      if (departmentPermissions[value]) {
        departmentPermissions[value].forEach(perm => {
          newPermissions[perm] = false;
        });
      }
      setSelectedPermissions(newPermissions);
    } else {
      // Normal handling for other fields
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle permission checkbox change
  const handlePermissionChange = (permission) => {
    // Update selected permissions
    const updatedPermissions = {
      ...selectedPermissions,
      [permission]: !selectedPermissions[permission]
    };
    setSelectedPermissions(updatedPermissions);
    
    // Update formData permissions array based on selected checkboxes
    const newPermissions = Object.keys(updatedPermissions).filter(
      key => updatedPermissions[key]
    );
    
    setFormData(prev => ({
      ...prev,
      permissions: newPermissions
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!editingUser) return;
    
    updateUserMutation.mutate({
      userId: editingUser._id,
      userData: formData
    });
  };
  
  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'subadmin',
      department: '',
      permissions: []
    });
    // Reset selected permissions
    setSelectedPermissions({});
  };
  
  // Handle delete button click
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowConfirmDelete(true);
  };
  
  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    deleteUserMutation.mutate(userToDelete._id);
  };

  // Handle ban button click
  const handleBanClick = (user) => {
    setUserToBan(user);
    setShowConfirmBan(true);
  };

  // Handle confirm ban
  const handleConfirmBan = () => {
    if (!userToBan) return;
    banUserMutation.mutate({
      userId: userToBan._id,
      reason: banReason
    });
  };

  // Handle unban button click
  const handleUnbanClick = (user) => {
    setUserToUnban(user);
    setShowConfirmUnban(true);
  };

  // Handle confirm unban
  const handleConfirmUnban = () => {
    if (!userToUnban) return;
    unbanUserMutation.mutate(userToUnban._id);
  };
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };
  
  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Apply filters
  const applyFilters = () => {
    setPage(1); // Reset to first page when applying filters
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      verification: '',
      startDate: '',
      endDate: ''
    });
    setPage(1);
  };
  
  // Handle new subadmin input change
  const handleNewSubAdminChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for department change
    if (name === 'department') {
      // Reset permissions when department changes
      setNewSubAdminData(prev => ({
        ...prev,
        [name]: value,
        permissions: [] // Reset permissions
      }));
      
      // Initialize permissions checkboxes for the new department
      const newPermissions = {};
      if (departmentPermissions[value]) {
        departmentPermissions[value].forEach(perm => {
          newPermissions[perm] = false;
        });
      }
      setNewSubAdminPermissions(newPermissions);
    } else {
      // Normal handling for other fields
      setNewSubAdminData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle new subadmin permission checkbox change
  const handleNewSubAdminPermissionChange = (permission) => {
    // Update selected permissions
    const updatedPermissions = {
      ...newSubAdminPermissions,
      [permission]: !newSubAdminPermissions[permission]
    };
    setNewSubAdminPermissions(updatedPermissions);
    
    // Update newSubAdminData permissions array based on selected checkboxes
    const newPermissions = Object.keys(updatedPermissions).filter(
      key => updatedPermissions[key]
    );
    
    setNewSubAdminData(prev => ({
      ...prev,
      permissions: newPermissions
    }));
  };
  
  // Handle add new subadmin
  const handleAddSubAdmin = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!newSubAdminData.name || !newSubAdminData.email || !newSubAdminData.password || !newSubAdminData.department) {
      toast.error('Please fill all required fields');
      return;
    }
    
    if (newSubAdminData.password !== newSubAdminData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newSubAdminData.permissions.length === 0) {
      toast.error('Please select at least one permission');
      return;
    }
    
    // Create new subadmin
    createSubAdminMutation.mutate({
      name: newSubAdminData.name,
      email: newSubAdminData.email,
      password: newSubAdminData.password,
      role: 'subadmin',
      department: newSubAdminData.department,
      permissions: newSubAdminData.permissions
    });
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">SubAdmin Management</h3>
        
        <div className="flex space-x-2">
          <Button 
            type="button" 
            variant="primary" 
            size="sm"
            onClick={() => setShowAddSubAdminModal(true)}
          >
            Add SubAdmin
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          
          {/* Search form */}
          <form onSubmit={handleSearch} className="flex">
            <Input
              type="text"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mr-2"
            />
            <Button type="submit" variant="primary" size="sm">
              Search
            </Button>
          </form>
        </div>
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-lg font-medium mb-4">Filter SubAdmins</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification Status</label>
              <select
                name="verification"
                value={filters.verification}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">All</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <Input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <Input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={applyFilters}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}
      
      {/* Edit user form */}
      {editingUser && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h4 className="text-lg font-medium mb-4">Edit SubAdmin</h4>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">Select Department</option>
                  {Object.keys(departmentPermissions).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
                <div className="border border-gray-300 rounded-md p-2 max-h-40 overflow-y-auto">
                  {formData.department && departmentPermissions[formData.department] ? (
                    <div className="flex flex-wrap gap-2">
                      {departmentPermissions[formData.department].map(permission => (
                        <div key={permission} className="flex items-center mb-2 mr-4">
                          <input
                            type="checkbox"
                            id={`edit-permission-${permission}`}
                            checked={selectedPermissions[permission] || false}
                            onChange={() => handlePermissionChange(permission)}
                            className="mr-2"
                          />
                          <label htmlFor={`edit-permission-${permission}`} className="text-sm">
                            {permission}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Select a department to view permissions</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={updateUserMutation.isLoading}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}
      
      {/* Add SubAdmin Modal */}
      {showAddSubAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h4 className="text-lg font-medium mb-4">Add New SubAdmin</h4>
            <form onSubmit={handleAddSubAdmin}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <Input
                    type="text"
                    name="name"
                    value={newSubAdminData.name}
                    onChange={handleNewSubAdminChange}
                    required
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input
                    type="email"
                    name="email"
                    value={newSubAdminData.email}
                    onChange={handleNewSubAdminChange}
                    required
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <Input
                    type="password"
                    name="password"
                    value={newSubAdminData.password}
                    onChange={handleNewSubAdminChange}
                    required
                    placeholder="Create password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <Input
                    type="password"
                    name="confirmPassword"
                    value={newSubAdminData.confirmPassword}
                    onChange={handleNewSubAdminChange}
                    required
                    placeholder="Confirm password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    name="department"
                    value={newSubAdminData.department}
                    onChange={handleNewSubAdminChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">Select Department</option>
                    {Object.keys(departmentPermissions).map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
                  <div className="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
                    {newSubAdminData.department && departmentPermissions[newSubAdminData.department] ? (
                      <div className="flex flex-wrap gap-2">
                        {departmentPermissions[newSubAdminData.department].map(permission => (
                          <div key={permission} className="flex items-center mb-2 mr-4">
                            <input
                              type="checkbox"
                              id={`new-permission-${permission}`}
                              checked={newSubAdminPermissions[permission] || false}
                              onChange={() => handleNewSubAdminPermissionChange(permission)}
                              className="mr-2"
                            />
                            <label htmlFor={`new-permission-${permission}`} className="text-sm">
                              {permission}
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Select a department to view permissions</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddSubAdminModal(false);
                    setNewSubAdminData({
                      name: '',
                      email: '',
                      password: '',
                      confirmPassword: '',
                      department: '',
                      permissions: []
                    });
                    setNewSubAdminPermissions({});
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={createSubAdminMutation.isLoading}
                >
                  Create SubAdmin
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete confirmation modal */}
      {showConfirmDelete && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h4 className="text-lg font-medium mb-4">Confirm Delete</h4>
            <p className="mb-6">Are you sure you want to delete the SubAdmin <span className="font-semibold">{userToDelete.name}</span>? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmDelete(false);
                  setUserToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                isLoading={deleteUserMutation.isLoading}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Ban confirmation modal */}
      {showConfirmBan && userToBan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h4 className="text-lg font-medium mb-4">Ban SubAdmin</h4>
            <p className="mb-4">Are you sure you want to ban <span className="font-semibold">{userToBan.name}</span>? They will not be able to log in.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for ban (optional)</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                rows="3"
                placeholder="Enter reason for banning this SubAdmin"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmBan(false);
                  setUserToBan(null);
                  setBanReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmBan}
                isLoading={banUserMutation.isLoading}
              >
                Ban SubAdmin
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Unban confirmation modal */}
      {showConfirmUnban && userToUnban && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h4 className="text-lg font-medium mb-4">Unban SubAdmin</h4>
            <p className="mb-6">Are you sure you want to unban <span className="font-semibold">{userToUnban.name}</span>? They will be able to log in again.</p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmUnban(false);
                  setUserToUnban(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmUnban}
                isLoading={unbanUserMutation.isLoading}
              >
                Unban SubAdmin
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Users table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : isError ? (
        <div className="text-center py-8">
          <p className="text-red-500">Error: {error.message}</p>
        </div>
      ) : usersData?.data?.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersData.data.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{user.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{user.email}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{user.department || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {user.permissions && user.permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.permissions.map((permission, index) => (
                            <span key={index} className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {permission}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        className="mr-2"
                        onClick={() => handleEdit(user)}
                      >
                        Edit
                      </Button>
                      {user.isBanned ? (
                        <Button
                          variant="success"
                          size="xs"
                          className="mr-2"
                          onClick={() => handleUnbanClick(user)}
                        >
                          Unban
                        </Button>
                      ) : (
                        <Button
                          variant="warning"
                          size="xs"
                          className="mr-2"
                          onClick={() => handleBanClick(user)}
                        >
                          Ban
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => handleDeleteClick(user)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {usersData.pagination && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, usersData.pagination.total)} of {usersData.pagination.total} subadmins
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
                  disabled={page >= usersData.pagination.pages}
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
          <p className="text-gray-500">No subadmins found</p>
        </div>
      )}
    </div>
  );
};

export default SubAdminManagement;