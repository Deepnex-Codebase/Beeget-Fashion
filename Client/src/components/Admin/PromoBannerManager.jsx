import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const PromoBannerManager = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBanner, setCurrentBanner] = useState({
    text: '',
    link: '',
    backgroundColor: '#4299e1',
    textColor: '#ffffff',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true
  });

  // Fetch all banners
  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await api.get('/promo-banners');
      setBanners(response.data.data);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Failed to load promotional banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentBanner({
      ...currentBanner,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Open modal for creating a new banner
  const openCreateModal = () => {
    setCurrentBanner({
      text: '',
      link: '',
      backgroundColor: '#4299e1',
      textColor: '#ffffff',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      isActive: true
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  // Open modal for editing an existing banner
  const openEditModal = (banner) => {
    setCurrentBanner({
      ...banner,
      startDate: banner.startDate ? new Date(banner.startDate).toISOString().split('T')[0] : '',
      endDate: banner.endDate ? new Date(banner.endDate).toISOString().split('T')[0] : ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Close the modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Create a new banner
  const createBanner = async () => {
    try {
      await api.post('/promo-banners', currentBanner);
      toast.success('Promotional banner created successfully');
      fetchBanners();
      closeModal();
    } catch (error) {
      console.error('Error creating banner:', error);
      toast.error('Failed to create promotional banner');
    }
  };

  // Update an existing banner
  const updateBanner = async () => {
    try {
      await api.patch(`/promo-banners/${currentBanner._id}`, currentBanner);
      toast.success('Promotional banner updated successfully');
      fetchBanners();
      closeModal();
    } catch (error) {
      console.error('Error updating banner:', error);
      toast.error('Failed to update promotional banner');
    }
  };

  // Delete a banner
  const deleteBanner = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promotional banner?')) return;
    
    try {
      await api.delete(`/promo-banners/${id}`);
      toast.success('Promotional banner deleted successfully');
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete promotional banner');
    }
  };

  // Activate a banner
  const activateBanner = async (id) => {
    try {
      await api.patch(`/promo-banners/${id}/activate`);
      toast.success('Promotional banner activated successfully');
      fetchBanners();
    } catch (error) {
      console.error('Error activating banner:', error);
      toast.error('Failed to activate promotional banner');
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      updateBanner();
    } else {
      createBanner();
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No end date';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Promotional Banners</h2>
        <button
          onClick={openCreateModal}
          className="flex items-center px-4 py-2 bg-java-600 text-white rounded-md hover:bg-java-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Banner
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-10 h-10 border-4 border-java-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Text</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colors</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {banners && banners.length > 0 ? (
                banners.map((banner) => (
                  <tr key={banner._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{banner.text}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {banner.link ? (
                          <a href={banner.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {banner.link.length > 30 ? banner.link.substring(0, 30) + '...' : banner.link}
                          </a>
                        ) : (
                          'No link'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: banner.backgroundColor }}></div>
                        <div className="w-6 h-6 rounded-full border border-gray-300" style={{ backgroundColor: banner.textColor }}></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDate(banner.startDate)} - {formatDate(banner.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${banner.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {!banner.isActive && (
                          <button
                            onClick={() => activateBanner(banner._id)}
                            className="text-green-600 hover:text-green-900"
                            title="Activate"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(banner)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteBanner(banner._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No promotional banners found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for creating/editing banners */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-semibold mb-4">
              {isEditing ? 'Edit Promotional Banner' : 'Create Promotional Banner'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Banner Text*
                  </label>
                  <input
                    type="text"
                    name="text"
                    value={currentBanner.text}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link (Optional)
                  </label>
                  <input
                    type="url"
                    name="link"
                    value={currentBanner.link}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="https://example.com"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Background Color
                    </label>
                    <input
                      type="color"
                      name="backgroundColor"
                      value={currentBanner.backgroundColor}
                      onChange={handleInputChange}
                      className="w-full p-1 border border-gray-300 rounded-md h-10"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Text Color
                    </label>
                    <input
                      type="color"
                      name="textColor"
                      value={currentBanner.textColor}
                      onChange={handleInputChange}
                      className="w-full p-1 border border-gray-300 rounded-md h-10"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date*
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={currentBanner.startDate}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={currentBanner.endDate}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={currentBanner.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-java-600 focus:ring-java-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active (will deactivate other banners)
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-java-600 text-white rounded-md text-sm font-medium hover:bg-java-700"
                >
                  {isEditing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoBannerManager;