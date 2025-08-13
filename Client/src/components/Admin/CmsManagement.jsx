import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../utils/api';
import { toast } from 'react-hot-toast';
import Button from '../Common/Button';
import Modal from '../Common/Modal';

const CmsManagement = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    metaDescription: '',
    status: 'draft',
    isHomePage: false,
    contentBlocks: [{
      type: 'text',
      data: '',
      order: 0
    }]
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const queryClient = useQueryClient();

  // Fetch CMS pages
  const { data: pagesData, isLoading } = useQuery({
    queryKey: ['admin-cms-pages', currentPage, searchTerm, statusFilter],
    queryFn: async () => {
      const params = {
        page: currentPage,
        limit: 10
      };
      
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      
      const response = await axios.get('/cms', { params });
      return response.data;
    },
    keepPreviousData: true
  });

  // Create CMS page mutation
  const createPage = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post('/cms', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cms-pages'] });
      setShowCreateModal(false);
      resetForm();
      toast.success('CMS page created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create CMS page');
    }
  });

  // Update CMS page mutation
  const updatePage = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await axios.put(`/cms/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cms-pages'] });
      setShowEditModal(false);
      toast.success('CMS page updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update CMS page');
    }
  });

  // Delete CMS page mutation
  const deletePage = useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`/cms/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cms-pages'] });
      toast.success('CMS page deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete CMS page');
    }
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleContentBlockChange = (index, field, value) => {
    const updatedBlocks = [...formData.contentBlocks];
    
    // Special handling for adding paragraphs to ensure proper formatting
    if (field === 'data' && updatedBlocks[index].type === 'text') {
      // Ensure proper paragraph formatting for text blocks
      updatedBlocks[index] = {
        ...updatedBlocks[index],
        [field]: value
      };
    } else if (field === 'data' && updatedBlocks[index].type === 'html') {
      // Ensure proper HTML formatting for html blocks
      updatedBlocks[index] = {
        ...updatedBlocks[index],
        [field]: value
      };
    } else {
      // Default handling for other fields
      updatedBlocks[index] = {
        ...updatedBlocks[index],
        [field]: value
      };
    }
    
    setFormData(prev => ({
      ...prev,
      contentBlocks: updatedBlocks
    }));
  };

  const addContentBlock = () => {
    setFormData(prev => ({
      ...prev,
      contentBlocks: [
        ...prev.contentBlocks,
        {
          type: 'text',
          data: '',
          order: prev.contentBlocks.length
        }
      ]
    }));
  };

  const removeContentBlock = (index) => {
    const updatedBlocks = formData.contentBlocks.filter((_, i) => i !== index);
    // Update order values
    updatedBlocks.forEach((block, i) => {
      block.order = i;
    });
    
    setFormData(prev => ({
      ...prev,
      contentBlocks: updatedBlocks
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createPage.mutate(formData);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    updatePage.mutate({
      id: selectedPage._id,
      data: formData
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      metaDescription: '',
      status: 'draft',
      isHomePage: false,
      contentBlocks: [{
        type: 'text',
        data: '',
        order: 0
      }]
    });
  };

  const handleViewPage = (page) => {
    setSelectedPage(page);
    setShowViewModal(true); // Immediately open modal
  };

  const handleEditPage = (page) => {
    setSelectedPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      metaDescription: page.metaDescription || '',
      status: page.status,
      isHomePage: page.isHomePage,
      contentBlocks: page.contentBlocks.length > 0 ? page.contentBlocks : [{
        type: 'text',
        data: '',
        order: 0
      }]
    });
    setShowEditModal(true); // Immediately open modal
  };

  const handleDeletePage = (id) => {
    if (window.confirm('Are you sure you want to delete this page?')) {
      deletePage.mutate(id);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderContentBlockInput = (block, index) => {
    switch (block.type) {
      case 'text':
        return (
          <div>
            <textarea
              id={`text-block-${index}`}
              value={block.data}
              onChange={(e) => handleContentBlockChange(index, 'data', e.target.value)}
              rows="6"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              placeholder="Enter text content"
            ></textarea>
            <div className="mt-2 flex justify-between items-center">
              <p className="text-xs text-gray-500">Place cursor where you want to add a paragraph break</p>
              <button
                type="button"
                onClick={() => {
                  // Get the textarea element
                  const textarea = document.getElementById(`text-block-${index}`);
                  const cursorPos = textarea.selectionStart;
                  
                  // Insert paragraph break at cursor position
                  const textBefore = block.data.substring(0, cursorPos);
                  const textAfter = block.data.substring(cursorPos);
                  const newData = textBefore + '\n\n' + textAfter;
                  
                  handleContentBlockChange(index, 'data', newData);
                  
                  // Set focus back to textarea and position cursor after the inserted paragraph
                  setTimeout(() => {
                    textarea.focus();
                    textarea.setSelectionRange(cursorPos + 2, cursorPos + 2);
                  }, 0);
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                Add Paragraph
              </button>
            </div>
          </div>
        );
      case 'html':
        return (
          <div>
            <textarea
              id={`html-block-${index}`}
              value={block.data}
              onChange={(e) => handleContentBlockChange(index, 'data', e.target.value)}
              rows="6"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 font-mono text-sm"
              placeholder="Enter HTML content"
            ></textarea>
            <div className="mt-2 flex justify-between items-center">
              <p className="text-xs text-gray-500">Place cursor where you want to add content</p>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    // Get the textarea element
                    const textarea = document.getElementById(`html-block-${index}`);
                    const cursorPos = textarea.selectionStart;
                    
                    // Insert line break at cursor position
                    const textBefore = block.data.substring(0, cursorPos);
                    const textAfter = block.data.substring(cursorPos);
                    const newData = textBefore + '\n\n' + textAfter;
                    
                    handleContentBlockChange(index, 'data', newData);
                    
                    // Set focus back to textarea and position cursor after the inserted line break
                    setTimeout(() => {
                      textarea.focus();
                      textarea.setSelectionRange(cursorPos + 2, cursorPos + 2);
                    }, 0);
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Add Line Break
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Get the textarea element
                    const textarea = document.getElementById(`html-block-${index}`);
                    const cursorPos = textarea.selectionStart;
                    
                    // Insert paragraph tags at cursor position
                    const textBefore = block.data.substring(0, cursorPos);
                    const textAfter = block.data.substring(cursorPos);
                    const newData = textBefore + '\n<p>\n\t\n</p>' + textAfter;
                    
                    handleContentBlockChange(index, 'data', newData);
                    
                    // Set focus back to textarea and position cursor inside the paragraph tags
                    setTimeout(() => {
                      textarea.focus();
                      textarea.setSelectionRange(cursorPos + 6, cursorPos + 6);
                    }, 0);
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Add Paragraph
                </button>
              </div>
            </div>
          </div>
        );
      case 'image':
        return (
          <input
            type="url"
            value={block.data}
            onChange={(e) => handleContentBlockChange(index, 'data', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            placeholder="Enter image URL"
          />
        );
      case 'video':
        return (
          <input
            type="url"
            value={block.data}
            onChange={(e) => handleContentBlockChange(index, 'data', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            placeholder="Enter video URL"
          />
        );
      default:
        return (
          <input
            type="text"
            value={block.data}
            onChange={(e) => handleContentBlockChange(index, 'data', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            placeholder="Enter content"
          />
        );
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">CMS Page Management</h2>
        <Button onClick={() => setShowCreateModal(true)}>Create New Page</Button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search pages..."
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
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* CMS Pages Table */}
      <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Homepage</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading pages...
                </td>
              </tr>
            ) : pagesData?.data?.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                  No pages found
                </td>
              </tr>
            ) : (
              pagesData?.data?.map((page) => (
                <tr key={page._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {page.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {page.slug}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(page.status)}`}>
                      {page.status ? page.status.charAt(0).toUpperCase() + page.status.slice(1) : 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {page.isHomePage ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Yes
                      </span>
                    ) : 'No'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(page.updatedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewPage(page)}
                      className="text-teal-600 hover:text-teal-900 mr-4"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEditPage(page)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePage(page._id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={page.isHomePage}
                      title={page.isHomePage ? "Cannot delete homepage" : ""}
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
      {pagesData?.pagination && pagesData.pagination.pages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Previous
            </button>
            
            {[...Array(pagesData.pagination.pages)].map((_, index) => (
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
              disabled={currentPage === pagesData.pagination.pages}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === pagesData.pagination.pages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Create CMS Page Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New CMS Page"
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
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              required
              placeholder="page-url-slug"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-1">Meta Description (Optional)</label>
            <textarea
              id="metaDescription"
              name="metaDescription"
              value={formData.metaDescription}
              onChange={handleInputChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              placeholder="Brief description for SEO (max 160 characters)"
              maxLength="160"
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              required
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isHomePage"
                name="isHomePage"
                checked={formData.isHomePage}
                onChange={handleInputChange}
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
              />
              <label htmlFor="isHomePage" className="ml-2 block text-sm text-gray-700">Set as Homepage</label>
            </div>
            <p className="mt-1 text-xs text-gray-500">Note: Setting this as homepage will unset any existing homepage.</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Blocks</label>
            {formData.contentBlocks.map((block, index) => (
              <div key={index} className="mb-4 p-4 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <span className="text-sm font-medium">Block {index + 1}</span>
                    <select
                      value={block.type}
                      onChange={(e) => handleContentBlockChange(index, 'type', e.target.value)}
                      className="ml-4 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="text">Text</option>
                      <option value="html">HTML</option>
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                  {formData.contentBlocks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContentBlock(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {renderContentBlockInput(block, index)}
              </div>
            ))}
            <button
              type="button"
              onClick={addContentBlock}
              className="mt-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Add Content Block
            </button>
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
              isLoading={createPage.isLoading}
              disabled={createPage.isLoading}
            >
              {createPage.isLoading ? 'Creating...' : 'Create Page'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit CMS Page Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit CMS Page: ${selectedPage?.title}`}
      >
        <form onSubmit={handleUpdate} className="p-6">
          <div className="mb-4">
            <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              id="edit-title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="edit-slug" className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              id="edit-slug"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              required
              placeholder="page-url-slug"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="edit-metaDescription" className="block text-sm font-medium text-gray-700 mb-1">Meta Description (Optional)</label>
            <textarea
              id="edit-metaDescription"
              name="metaDescription"
              value={formData.metaDescription}
              onChange={handleInputChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              placeholder="Brief description for SEO (max 160 characters)"
              maxLength="160"
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="edit-status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              required
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="edit-isHomePage"
                name="isHomePage"
                checked={formData.isHomePage}
                onChange={handleInputChange}
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
              />
              <label htmlFor="edit-isHomePage" className="ml-2 block text-sm text-gray-700">Set as Homepage</label>
            </div>
            <p className="mt-1 text-xs text-gray-500">Note: Setting this as homepage will unset any existing homepage.</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Blocks</label>
            {formData.contentBlocks.map((block, index) => (
              <div key={index} className="mb-4 p-4 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <span className="text-sm font-medium">Block {index + 1}</span>
                    <select
                      value={block.type}
                      onChange={(e) => handleContentBlockChange(index, 'type', e.target.value)}
                      className="ml-4 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="text">Text</option>
                      <option value="html">HTML</option>
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                  {formData.contentBlocks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContentBlock(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {renderContentBlockInput(block, index)}
              </div>
            ))}
            <button
              type="button"
              onClick={addContentBlock}
              className="mt-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Add Content Block
            </button>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button 
              variant="secondary" 
              onClick={() => setShowEditModal(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              isLoading={updatePage.isLoading}
              disabled={updatePage.isLoading}
            >
              {updatePage.isLoading ? 'Updating...' : 'Update Page'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View CMS Page Modal */}
      {selectedPage && (
        <Modal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          title={`CMS Page: ${selectedPage.title}`}
        >
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">{selectedPage.title}</h3>
              <div className="mt-2 flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedPage.status)}`}>
                  {selectedPage.status ? selectedPage.status.charAt(0).toUpperCase() + selectedPage.status.slice(1) : 'Unknown'}
                </span>
                {selectedPage.isHomePage && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Homepage
                  </span>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Slug:</p>
              <p className="text-sm text-gray-900">{selectedPage.slug}</p>
            </div>
            
            {selectedPage.metaDescription && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Meta Description:</p>
                <p className="text-sm text-gray-900">{selectedPage.metaDescription}</p>
              </div>
            )}
            
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Content Blocks:</p>
              {selectedPage.contentBlocks.length > 0 ? (
                <div className="mt-2 space-y-4">
                  {selectedPage.contentBlocks.map((block, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-md">
                      <div className="text-xs font-medium text-gray-500 mb-2">
                        Block {index + 1} - {block.type ? block.type.charAt(0).toUpperCase() + block.type.slice(1) : 'Unknown'}
                      </div>
                      {block.type === 'image' ? (
                        <img src={block.data} alt="Content" className="max-w-full h-auto rounded" />
                      ) : block.type === 'video' ? (
                        <div className="aspect-w-16 aspect-h-9">
                          <iframe 
                            src={block.data} 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                            className="w-full h-full rounded"
                          ></iframe>
                        </div>
                      ) : block.type === 'html' ? (
                        <div className="text-sm font-mono bg-gray-50 p-2 rounded overflow-x-auto">
                          {block.data}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-900 whitespace-pre-line">{block.data}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No content blocks</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Created By:</p>
                <p className="text-sm text-gray-900">{selectedPage.author?.name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Last Updated:</p>
                <p className="text-sm text-gray-900">{formatDate(selectedPage.updatedAt)}</p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setShowViewModal(false);
                handleEditPage(selectedPage);
              }}>
                Edit Page
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CmsManagement;