import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../utils/api';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import Input from '../Common/Input';
import { toast } from 'react-hot-toast';

const CategoryManagement = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true,
    order: 0,
    parent: ''
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);
  
  // State for category statistics
  const [categoryStats, setCategoryStats] = useState({
    total: 0,
    active: 0,
    subcategories: 0
  });
  
  const queryClient = useQueryClient();
  
  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const response = await axios.get('/categories');
      const data = response.data;
      
      // Calculate category statistics
      if (data?.data?.categories && Array.isArray(data.data.categories)) {
        const total = data.data.categories.length;
        const active = data.data.categories.filter(cat => cat.active !== false).length;
        const subcategories = data.data.categories.reduce((total, category) => {
          return total + (category.children?.length || 0);
        }, 0);
        
        setCategoryStats({
          total,
          active,
          subcategories
        });
      }
      
      return data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
  
  
  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData) => {
      const formData = new FormData();
      
      // Add all category data to FormData
      Object.keys(categoryData).forEach(key => {
        if (key !== 'image' && categoryData[key] !== undefined && categoryData[key] !== null) {
          formData.append(key, categoryData[key]);
        }
      });
      
      // Add image file if exists
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      const response = await axios.post('/categories', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setShowAddModal(false);
      resetForm();
      toast.success('Category created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create category');
    }
  }
  );
  
  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const formData = new FormData();
      
      // Add all category data to FormData
      Object.keys(data).forEach(key => {
        if (key !== 'image' && data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      });
      
      // Add image file if exists
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      // Add removeImage flag if needed
      if (currentCategory?.image && !imageFile && !imagePreview) {
        formData.append('removeImage', 'true');
      }
      
      const response = await axios.put(`/categories/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setShowEditModal(false);
      setCurrentCategory(null);
      resetForm();
      toast.success('Category updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update category');
    }
  }
  );
  
  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`/categories/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setShowDeleteModal(false);
      setCurrentCategory(null);
      toast.success('Category deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  }
  );
  
  // Update category status mutation
  const updateCategoryStatusMutation = useMutation({
    mutationFn: async ({ id, active }) => {
      const response = await axios.patch(`/categories/${id}/status`, { active });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Category status updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update category status');
    }
  });
  
  // Handle status toggle
  const handleStatusToggle = (category) => {
    updateCategoryStatusMutation.mutate({
      id: category._id,
      active: !category.active
    });
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      if (files && files[0]) {
        const file = files[0];
        setImageFile(file);
        
        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };
  
  // Reset form data
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      active: true,
      order: 0,
      parent: ''
    });
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Open edit modal with category data - immediately open modal
  const handleEditClick = (category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      active: category.active !== false, // Default to true if not specified
      order: category.order || 0,
      parent: category.parent || ''
    });
    setImagePreview(category.image || '');
    setImageFile(null);
    setShowEditModal(true);
  };
  
  // Open delete confirmation modal - immediately open modal
  const handleDeleteClick = (category) => {
    setCurrentCategory(category);
    setShowDeleteModal(true);
  };
  
  // Handle form submission for creating/updating category
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.name) {
      toast.error('Category name is required');
      return;
    }
    
    // Prepare data for API
    const categoryData = {
      ...formData,
      order: Number(formData.order),
      parent: formData.parent || null
    };
    
    if (currentCategory) {
      // Update existing category
      updateCategoryMutation.mutate({ id: currentCategory._id, data: categoryData });
    } else {
      // Create new category
      createCategoryMutation.mutate(categoryData);
    }
  };
  
  // Render the list of categories
  const renderCategoryList = () => {
    if (categoriesLoading) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="flex justify-center mb-4">
            <svg className="animate-spin h-8 w-8 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Loading categories...</p>
        </div>
      );
    }
    
    if (categoriesError) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="flex justify-center mb-4 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Categories</h3>
          <p className="text-red-500">Error loading categories. Please try again.</p>
        </div>
      );
    }
    
    // Check if categories data exists and has the expected structure
    const categories = categoriesData?.data?.categories;
    
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-dashed border-gray-300">
          <div className="flex justify-center mb-4 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Found</h3>
          <p className="text-gray-600 mb-6">Create your first category to organize your products</p>
          <Button 
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-5"
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create First Category
            </div>
          </Button>
        </div>
      );
    }
    
    // Flatten category tree for display
    const flatCategories = [];
    categories.forEach(category => {
      flatCategories.push(category);
      if (category.children && Array.isArray(category.children)) {
        category.children.forEach(child => {
          flatCategories.push({
            ...child,
            isChild: true,
            parentName: category.name
          });
        });
      }
    });
    
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {flatCategories.map((category) => (
                <tr key={category._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm">
                    <div className="flex items-center">
                      {category.image && (
                        <div className="h-12 w-12 flex-shrink-0 mr-3">
                          <img 
                            className="h-12 w-12 rounded-md object-cover border border-gray-200 shadow-sm" 
                            src={category.image} 
                            alt={category.name} 
                            onError={(e) => {
                              // Handle image loading error by using a relative URL
                              try {
                                const url = new URL(category.image);
                                e.target.src = url.pathname;
                              } catch (error) {
                                // If category.image is not a valid URL, keep it as is
                                console.error('Invalid image URL:', error);
                              }
                            }} 
                          />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {category.isChild && <span className="text-gray-400 mr-1">↳</span>}
                          {category.name}
                        </div>
                        {category.isChild && (
                          <div className="text-gray-500 text-xs">Parent: {category.parentName}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {category.description ? (
                      <div className="truncate max-w-xs">{category.description}</div>
                    ) : (
                      <span className="text-gray-400 italic">No description</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${category.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {category.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {category.order || 0}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                    <Button variant="outline" size="xs" className="mr-2" onClick={() => handleEditClick(category)}>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </div>
                    </Button>
                    <Button variant="danger" size="xs" onClick={() => handleDeleteClick(category)}>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </div>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Render category form (for add/edit modals)
  const renderCategoryForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Basic Information
        </h4>
        <p className="text-xs text-blue-600">Fields marked with * are required</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter category name"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
          <select
            name="parent"
            value={formData.parent}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">None (Top Level)</option>
            {categoriesData?.data?.categories && Array.isArray(categoriesData.data.categories) ? 
              categoriesData.data.categories.map(category => (
                // Don't allow setting itself as parent
                currentCategory?._id !== category._id && (
                  <option key={category._id} value={category._id}>{category.name}</option>
                )
              )) : null}
          </select>
          <p className="text-xs text-gray-500 mt-1">Select a parent category if this is a subcategory</p>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows="3"
          placeholder="Enter category description (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
        ></textarea>
        <p className="text-xs text-gray-500 mt-1">Provide a brief description of this category</p>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Category Image</label>
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
          <div className="flex-1 mb-4 md:mb-0">
            <div className="relative">
              <input
                type="file"
                name="image"
                onChange={handleInputChange}
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                ref={fileInputRef}
                id="category-image"
              />
              <label 
                htmlFor="category-image"
                className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-50 text-white rounded-md"
              >
                <span className="bg-white text-gray-800 px-3 py-1 rounded-full text-sm font-medium">Browse Files</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">Supported formats: JPG, PNG, GIF, WEBP. Max size: 5MB</p>
          </div>
          
          <div className="flex-shrink-0 flex items-center justify-center">
            {imagePreview ? (
              <div className="relative group">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="h-24 w-24 object-cover rounded-md border border-gray-300 shadow-sm" 
                  onError={(e) => {
                    // Handle image loading error by using a relative URL
                    try {
                      const url = new URL(imagePreview);
                      e.target.src = url.pathname;
                    } catch (error) {
                      // If imagePreview is not a valid URL, keep it as is
                      console.error('Invalid image URL:', error);
                    }
                  }}
                />
                <button 
                  type="button" 
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 transition-colors"
                  onClick={() => {
                    setImagePreview('');
                    setImageFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="h-24 w-24 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
          <Input
            type="number"
            name="order"
            value={formData.order}
            onChange={handleInputChange}
            min="0"
            placeholder="0"
          />
          <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
        </div>
        
        <div className="flex items-center h-full pt-6">
          <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <input 
              type="checkbox" 
              id="active" 
              name="active"
              checked={formData.active}
              onChange={handleInputChange}
              className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer focus:outline-none transition-transform duration-200 ease-in-out checked:right-0 checked:border-teal-500"
            />
            <label 
              htmlFor="active" 
              className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${formData.active ? 'bg-teal-500' : 'bg-gray-300'}`}
            ></label>
          </div>
          <label htmlFor="active" className="text-sm font-medium text-gray-700">
            {formData.active ? 'Active' : 'Inactive'}
          </label>
          <p className="text-xs text-gray-500 ml-2">{formData.active ? 'Category will be visible to customers' : 'Category will be hidden from customers'}</p>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            resetForm();
            setShowAddModal(false);
            setShowEditModal(false);
          }}
          className="px-5"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={createCategoryMutation.isLoading || updateCategoryMutation.isLoading}
          className="px-5"
        >
          <div className="flex items-center">
            {createCategoryMutation.isLoading || updateCategoryMutation.isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {currentCategory ? 'Update Category' : 'Add Category'}
              </>
            )}
          </div>
        </Button>
      </div>
    </form>
  );
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Category Management</h1>
        <p className="text-gray-600">Create and manage product categories for your store</p>
      </div>
      
      {/* Category Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Categories</p>
              <h3 className="text-2xl font-bold text-gray-800">{categoryStats.total}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Active Categories</p>
              <h3 className="text-2xl font-bold text-gray-800">{categoryStats.active}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Subcategories</p>
              <h3 className="text-2xl font-bold text-gray-800">{categoryStats.subcategories}</h3>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Category List</h2>
        <Button 
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          size="lg"
          className="px-5 py-2.5"
        >
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Category
          </div>
        </Button>
      </div>
      
      {renderCategoryList()}
      
      {/* Add Category Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          resetForm();
          setShowAddModal(false);
        }}
        title="Add New Category"
      >
        {renderCategoryForm()}
      </Modal>
      
      {/* Edit Category Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          resetForm();
          setShowEditModal(false);
        }}
        title="Edit Category"
      >
        {renderCategoryForm()}
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setCurrentCategory(null);
          setShowDeleteModal(false);
        }}
        title="Confirm Delete"
      >
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Category</h3>
          <p className="text-gray-600 mb-6">Are you sure you want to delete this category? This action cannot be undone.</p>
          <div className="flex justify-center space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentCategory(null);
                setShowDeleteModal(false);
              }}
              className="px-5"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteCategoryMutation.mutate(currentCategory._id)}
              disabled={deleteCategoryMutation.isLoading}
              className="px-5"
            >
              <div className="flex items-center">
                {deleteCategoryMutation.isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>Delete</>  
                )}
              </div>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CategoryManagement;