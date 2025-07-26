import { createContext, useState, useEffect } from 'react';
import axios from '../utils/api';
import { toast } from 'react-hot-toast';

// Create context
export const SiteContentContext = createContext();

export const SiteContentProvider = ({ children }) => {
  // State for each content entity
  const [homePageData, setHomePageData] = useState(null);
  const [aboutPageData, setAboutPageData] = useState(null);
  const [contactPageData, setContactPageData] = useState(null);
  const [footerData, setFooterData] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState({
    home: true,
    about: true,
    contact: true,
    footer: true,
    enquiries: true
  });
  const [error, setError] = useState({
    home: null,
    about: null,
    contact: null,
    footer: null,
    enquiries: null
  });
  
  // Track if initial data has been loaded
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Fetch Home Page data
  const fetchHomePageData = async () => {
    try {
      setLoading(prev => ({ ...prev, home: true }));
      setError(prev => ({ ...prev, home: null }));
      const response = await axios.get('/site-content/home');
      console.log('Home page data fetched:', response.data);
      setHomePageData(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching home page data:', err);
      setError(prev => ({ ...prev, home: 'Failed to load home page data' }));
      toast.error('Failed to load home page data');
      return null;
    } finally {
      setLoading(prev => ({ ...prev, home: false }));
    }
  };

  // Update Home Page data
  const updateHomePageData = async (data) => {
    try {
      console.log('SiteContentContext: Updating home page with data:', data);
      setLoading(prev => ({ ...prev, home: true }));
      setError(prev => ({ ...prev, home: null }));
      const response = await axios.put('/site-content/home', data);
      console.log('SiteContentContext: Home page update response:', response.data);
      setHomePageData(response.data);
      toast.success('Home page updated successfully');
      return response.data;
    } catch (err) {
      console.error('Error updating home page data:', err);
      console.log('SiteContentContext: Error details:', err.response?.data);
      setError(prev => ({ ...prev, home: 'Failed to update home page data' }));
      toast.error(err.response?.data?.error || 'Failed to update home page data');
      throw err;
    } finally {
      setLoading(prev => ({ ...prev, home: false }));
    }
  };

  // Autosave Home Page data
  const autosaveHomePageData = async (data) => {
    try {
      console.log('SiteContentContext: Autosaving home page with data:', data);
      const response = await axios.post('/site-content/home/autosave', data);
      console.log('SiteContentContext: Home page autosave response:', response.data);
      return response.data;
    } catch (err) {
      console.error('Error autosaving home page data:', err);
      console.log('SiteContentContext: Autosave error details:', err.response?.data);
      // Don't show toast for autosave errors to avoid disrupting user experience
      return null;
    }
  };

  // Fetch About Page data
  const fetchAboutPageData = async () => {
    try {
      setLoading(prev => ({ ...prev, about: true }));
      setError(prev => ({ ...prev, about: null }));
      const response = await axios.get('/site-content/about');
      console.log('About page data fetched:', response.data);
      setAboutPageData(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching about page data:', err);
      setError(prev => ({ ...prev, about: 'Failed to load about page data' }));
      toast.error('Failed to load about page data');
      return null;
    } finally {
      setLoading(prev => ({ ...prev, about: false }));
    }
  };

  // Update About Page data
  const updateAboutPageData = async (data) => {
    try {
      setLoading(prev => ({ ...prev, about: true }));
      setError(prev => ({ ...prev, about: null }));
      const response = await axios.put('/site-content/about', data);
      setAboutPageData(response.data);
      toast.success('About page updated successfully');
      return response.data;
    } catch (err) {
      console.error('Error updating about page data:', err);
      setError(prev => ({ ...prev, about: 'Failed to update about page data' }));
      toast.error(err.response?.data?.error || 'Failed to update about page data');
      throw err;
    } finally {
      setLoading(prev => ({ ...prev, about: false }));
    }
  };

  // Autosave About Page data
  const autosaveAboutPageData = async (data) => {
    try {
      const response = await axios.post('/site-content/about/autosave', data);
      return response.data;
    } catch (err) {
      console.error('Error autosaving about page data:', err);
      // Don't show toast for autosave errors
      return null;
    }
  };

  // Fetch Contact Page data
  const fetchContactPageData = async () => {
    try {
      setLoading(prev => ({ ...prev, contact: true }));
      setError(prev => ({ ...prev, contact: null }));
      const response = await axios.get('/site-content/contact');
      console.log('Contact page data fetched:', response.data);
      setContactPageData(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching contact page data:', err);
      setError(prev => ({ ...prev, contact: 'Failed to load contact page data' }));
      toast.error('Failed to load contact page data');
      return null;
    } finally {
      setLoading(prev => ({ ...prev, contact: false }));
    }
  };

  // Update Contact Page data
  const updateContactPageData = async (data) => {
    try {
      setLoading(prev => ({ ...prev, contact: true }));
      setError(prev => ({ ...prev, contact: null }));
      const response = await axios.put('/site-content/contact', data);
      setContactPageData(response.data);
      toast.success('Contact page updated successfully');
      return response.data;
    } catch (err) {
      console.error('Error updating contact page data:', err);
      setError(prev => ({ ...prev, contact: 'Failed to update contact page data' }));
      toast.error(err.response?.data?.error || 'Failed to update contact page data');
      throw err;
    } finally {
      setLoading(prev => ({ ...prev, contact: false }));
    }
  };

  // Autosave Contact Page data
  const autosaveContactPageData = async (data) => {
    try {
      const response = await axios.post('/site-content/contact/autosave', data);
      return response.data;
    } catch (err) {
      console.error('Error autosaving contact page data:', err);
      // Don't show toast for autosave errors
      return null;
    }
  };

  // Fetch Footer data
  const fetchFooterData = async () => {
    try {
      setLoading(prev => ({ ...prev, footer: true }));
      setError(prev => ({ ...prev, footer: null }));
      const response = await axios.get('/site-content/footer');
      console.log('Footer data fetched:', response.data);
      setFooterData(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching footer data:', err);
      setError(prev => ({ ...prev, footer: 'Failed to load footer data' }));
      toast.error('Failed to load footer data');
      return null;
    } finally {
      setLoading(prev => ({ ...prev, footer: false }));
    }
  };

  // Update Footer data
  const updateFooterData = async (data) => {
    try {
      setLoading(prev => ({ ...prev, footer: true }));
      setError(prev => ({ ...prev, footer: null }));
      const response = await axios.put('/site-content/footer', data);
      setFooterData(response.data);
      toast.success('Footer updated successfully');
      return response.data;
    } catch (err) {
      console.error('Error updating footer data:', err);
      setError(prev => ({ ...prev, footer: 'Failed to update footer data' }));
      toast.error(err.response?.data?.error || 'Failed to update footer data');
      throw err;
    } finally {
      setLoading(prev => ({ ...prev, footer: false }));
    }
  };

  // Autosave Footer data
  const autosaveFooterData = async (data) => {
    try {
      const response = await axios.post('/site-content/footer/autosave', data);
      return response.data;
    } catch (err) {
      console.error('Error autosaving footer data:', err);
      // Don't show toast for autosave errors
      return null;
    }
  };

  // Submit Enquiry
  const submitEnquiry = async (data) => {
    try {
      const response = await axios.post('/site-content/enquiries', data);
      toast.success('Your message has been sent successfully!');
      return response.data;
    } catch (err) {
      console.error('Error submitting enquiry:', err);
      toast.error(err.response?.data?.error || 'Failed to submit your message. Please try again.');
      throw err;
    }
  };

  // Fetch Enquiries (admin only)
  const fetchEnquiries = async (page = 1, limit = 10, filters = {}) => {
    try {
      setLoading(prev => ({ ...prev, enquiries: true }));
      setError(prev => ({ ...prev, enquiries: null }));
      
      const params = { page, limit, ...filters };
      const response = await axios.get('/site-content/enquiries', { params });
      setEnquiries(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching enquiries:', err);
      setError(prev => ({ ...prev, enquiries: 'Failed to load enquiries' }));
      toast.error('Failed to load enquiries');
      throw err;
    } finally {
      setLoading(prev => ({ ...prev, enquiries: false }));
    }
  };

  // Update Enquiry Status (admin only)
  const updateEnquiryStatus = async (id, status) => {
    try {
      const response = await axios.put(`/site-content/enquiries/${id}/status`, { status });
      toast.success('Enquiry status updated successfully');
      return response.data;
    } catch (err) {
      console.error('Error updating enquiry status:', err);
      toast.error(err.response?.data?.error || 'Failed to update enquiry status');
      throw err;
    }
  };

  // Load all content data on initial render
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        await Promise.all([
          fetchHomePageData(),
          fetchAboutPageData(),
          fetchContactPageData(),
          fetchFooterData()
        ]);
        setInitialDataLoaded(true);
        console.log('All initial content data loaded successfully');
      } catch (error) {
        console.error('Error loading initial content data:', error);
        // Still set initialDataLoaded to true to prevent infinite loading state
        setInitialDataLoaded(true);
      }
    };
    
    fetchAllData();
  }, []);

  return (
    <SiteContentContext.Provider
      value={{
        // Global state
        initialDataLoaded,
        
        // Home Page
        homePageData,
        loadingHomePage: loading.home,
        homePageError: error.home,
        fetchHomePageData,
        updateHomePageData,
        autosaveHomePageData,
        
        // About Page
        aboutPageData,
        loadingAboutPage: loading.about,
        aboutPageError: error.about,
        fetchAboutPageData,
        updateAboutPageData,
        autosaveAboutPageData,
        
        // Contact Page
        contactPageData,
        loadingContactPage: loading.contact,
        contactPageError: error.contact,
        fetchContactPageData,
        updateContactPageData,
        autosaveContactPageData,
        
        // Footer
        footerData,
        loadingFooter: loading.footer,
        footerError: error.footer,
        fetchFooterData,
        updateFooterData,
        autosaveFooterData,
        
        // Enquiries
        enquiries,
        loadingEnquiries: loading.enquiries,
        enquiriesError: error.enquiries,
        submitEnquiry,
        fetchEnquiries,
        updateEnquiryStatus
      }}
    >
      {children}
    </SiteContentContext.Provider>
  );
};