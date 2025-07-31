import { useState, useEffect, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../utils/api';
import { toast } from 'react-hot-toast';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import { format } from 'date-fns';
import { SiteContentContext } from '../../contexts/SiteContentContext';

const ContactManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentContact, setCurrentContact] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  const queryClient = useQueryClient();
  
  // Get functions from SiteContentContext
  const { fetchEnquiries, updateEnquiryStatus } = useContext(SiteContentContext);
  
  // Fetch contacts with pagination, search, and filtering
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-contacts', currentPage, searchTerm, statusFilter],
    queryFn: async () => {
      const params = {
        page: currentPage,
        limit: 10
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      return await fetchEnquiries(currentPage, 10, params);
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId) => {
      await axios.delete(`/site-content/enquiries/${contactId}`);
    },
    onSuccess: () => {
      toast.success('Contact message deleted successfully');
      setShowDeleteModal(false);
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete contact message');
    }
  });
  
  // State to track if email is being sent
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // Update contact status mutation
  const updateContactMutation = useMutation({
    mutationFn: async ({ contactId, data }) => {
      // Use the updateEnquiryStatus function from context
      // Pass the status and responseMessage to the function
      setIsSendingEmail(true); // Set email sending state to true before API call
      return await updateEnquiryStatus(contactId, data.status, data.responseMessage);
    },
    onSuccess: () => {
      // Modal will be closed and success message will be shown by the context function
      setShowViewModal(false);
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update contact message');
    },
    onSettled: () => {
      // Set email sending state to false when done (success or error)
      setIsSendingEmail(false);
    }
  });
  
  // Handle delete click
  const handleDeleteClick = (contact) => {
    setContactToDelete(contact);
    setShowDeleteModal(true);
  };
  
  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (contactToDelete) {
      deleteContactMutation.mutate(contactToDelete._id);
    }
  };
  
  // Handle view click
  const handleViewClick = (contact) => {
    setCurrentContact(contact);
    setSelectedStatus(contact.status);
    setResponseMessage(contact.responseMessage || '');
    setShowViewModal(true);
  };
  
  // Handle response submit
  const handleResponseSubmit = () => {
    if (currentContact) {
      // Pass contactId, status, and responseMessage to the mutation
      // The mutation will handle setting isSendingEmail state
      updateContactMutation.mutate({
        contactId: currentContact._id,
        data: {
          status: selectedStatus,
          responseMessage: responseMessage
        }
      });
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page on filter change
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-heading font-semibold mb-6">Contact Messages</h2>
      
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, email or subject..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal focus:border-teal"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-teal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>
        
        <div className="w-full md:w-48">
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal focus:border-teal"
            value={statusFilter}
            onChange={handleStatusFilterChange}
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="spam">Spam</option>
          </select>
        </div>
      </div>
      
      {/* Loading and Error States */}
      {isLoading && <div className="text-center py-4">Loading...</div>}
      {error && <div className="text-center text-red-500 py-4">Error: {error.message}</div>}
      
      {/* Contact Messages Table */}
      {!isLoading && !error && data && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.enquiries && data.enquiries.map((contact) => (
                  <tr key={contact._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{contact.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{contact.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap truncate max-w-[200px]">{contact.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(contact.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={
                        `px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${contact.status === 'new' ? 'bg-blue-100 text-blue-800' : ''}
                        ${contact.status === 'read' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${contact.status === 'replied' ? 'bg-green-100 text-green-800' : ''}
                        ${contact.status === 'spam' ? 'bg-red-100 text-red-800' : ''}`
                      }>
                        {contact.status ? contact.status.charAt(0).toUpperCase() + contact.status.slice(1) : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewClick(contact)}
                        className="text-teal hover:text-teal-dark mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteClick(contact)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, data.totalItems)} of {data.totalItems} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, data.totalPages))}
                  disabled={currentPage === data.totalPages}
                  className={`px-3 py-1 rounded ${currentPage === data.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
          
          {(!data.enquiries || data.enquiries.length === 0) && (
            <div className="text-center py-4 text-gray-500">No contact messages found</div>
          )}
        </>
      )}
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Delete"
      >
        <div className="p-6">
          <p className="mb-6">Are you sure you want to delete this contact message? This action cannot be undone.</p>
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              loading={deleteContactMutation.isLoading}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* View/Reply Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Contact Message Details"
        size="lg"
      >
        {currentContact && (
          <div className="p-6 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Name</h3>
                <p className="mt-1">{currentContact.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="mt-1">{currentContact.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date</h3>
                <p className="mt-1">{formatDate(currentContact.createdAt)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <select
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal focus:border-teal"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                  <option value="spam">Spam</option>
                </select>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500">Subject</h3>
              <p className="mt-1">{currentContact.subject}</p>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500">Message</h3>
              <div className="mt-1 p-4 bg-gray-50 rounded-md">{currentContact.message}</div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500">Response</h3>
              <textarea
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal focus:border-teal"
                rows={6}
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="Enter your response here..."
              />
              {currentContact.responseMessage && (
                <div className="mt-3">
                  <h4 className="text-xs font-medium text-gray-500">Previous Response:</h4>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">{currentContact.responseMessage}</div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowViewModal(false)}
                disabled={isSendingEmail}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResponseSubmit}
                loading={updateContactMutation.isLoading || isSendingEmail}
              >
                {isSendingEmail ? 'Sending Email...' : 'Save Response'}
              </Button>
            </div>
            
            {/* Email sending overlay */}
            {isSendingEmail && (
              <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal border-t-transparent mb-2"></div>
                  <p className="text-teal font-medium">Sending email, please wait...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ContactManagement;