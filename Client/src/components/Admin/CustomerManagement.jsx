import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../utils/api';
import Button from '../Common/Button';
import Input from '../Common/Input';
import { toast } from 'react-hot-toast';

const CustomerManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user'
  });
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showConfirmBan, setShowConfirmBan] = useState(false);
  const [userToBan, setUserToBan] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [showConfirmUnban, setShowConfirmUnban] = useState(false);
  const [userToUnban, setUserToUnban] = useState(null);
  
  // New state for filters
  const [filters, setFilters] = useState({
    verification: '',
    role: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Fetch users with React Query
  const { data: usersData, isLoading, isError, error } = useQuery({
    queryKey: ['users', page, limit, searchTerm, filters],
    queryFn: async () => {
      try {
        let queryParams = `page=${page}&limit=${limit}`;
        
        if (searchTerm) {
          queryParams += `&search=${searchTerm}`;
        }
        
        if (filters.verification) {
          queryParams += `&verification=${filters.verification}`;
        }
        
        if (filters.role) {
          queryParams += `&role=${filters.role}`;
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
        // console.error('Error fetching users:', error);
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
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully');
      setEditingUser(null);
    },
    onError: (error) => {
      // console.error('Error updating user:', error);
      toast.error(error.response?.data?.message || 'Failed to update user');
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
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
      setShowConfirmDelete(false);
      setUserToDelete(null);
    },
    onError: (error) => {
      // console.error('Error deleting user:', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
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
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User banned successfully');
      setShowConfirmBan(false);
      setUserToBan(null);
      setBanReason('');
    },
    onError: (error) => {
      // console.error('Error banning user:', error);
      toast.error(error.response?.data?.message || 'Failed to ban user');
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
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User unbanned successfully');
      setShowConfirmUnban(false);
      setUserToUnban(null);
    },
    onError: (error) => {
      // console.error('Error unbanning user:', error);
      toast.error(error.response?.data?.message || 'Failed to unban user');
    }
  });
  
  // Handle edit button click
  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role || user.roles[0] // Fallback to first role if role is not available
    });
  };
  
  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      role: 'user'
    });
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
      role: '',
      startDate: '',
      endDate: ''
    });
    setPage(1);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Customers Management</h3>
        
        <div className="flex space-x-2">
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
          <h4 className="text-lg font-medium mb-4">Filter Users</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">All</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
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
          <h4 className="text-lg font-medium mb-4">Edit User</h4>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
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
      
      {/* Delete confirmation modal */}
      {showConfirmDelete && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h4 className="text-lg font-medium mb-4">Confirm Delete</h4>
            <p className="mb-6">Are you sure you want to delete the user <span className="font-semibold">{userToDelete.name}</span>? This action cannot be undone.</p>
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
            <h4 className="text-lg font-medium mb-4">Ban User</h4>
            <p className="mb-4">Are you sure you want to ban <span className="font-semibold">{userToBan.name}</span>? They will not be able to log in.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for ban (optional)</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                rows="3"
                placeholder="Enter reason for banning this user"
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
                Ban User
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Unban confirmation modal */}
      {showConfirmUnban && userToUnban && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h4 className="text-lg font-medium mb-4">Unban User</h4>
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
                Unban User
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersData.data.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{user.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{user.email}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' || user.roles?.includes('admin') ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                        {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : user.roles?.[0]?.charAt(0).toUpperCase() + user.roles?.[0]?.slice(1) || 'User'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {user.isBanned ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800" title={user.banReason || 'No reason provided'}>
                          Banned
                        </span>
                      ) : !user.isVerified ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Unverified
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
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
                          disabled={user.role === 'admin' || user.roles?.includes('admin')}
                        >
                          Unban
                        </Button>
                      ) : (
                        <Button
                          variant="warning"
                          size="xs"
                          className="mr-2"
                          onClick={() => handleBanClick(user)}
                          disabled={user.role === 'admin' || user.roles?.includes('admin')}
                        >
                          Ban
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => handleDeleteClick(user)}
                        disabled={user.role === 'admin' || user.roles?.includes('admin')}
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
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, usersData.pagination.total)} of {usersData.pagination.total} users
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
          <p className="text-gray-500">No users found</p>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;