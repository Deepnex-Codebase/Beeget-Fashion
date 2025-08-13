import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import AdminSearchBar from './AdminSearchBar';

const AdminTabsNew = ({ tabs, activeTab, setActiveTab, renderTabContent }) => {
  const [showAllTabs, setShowAllTabs] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [mobileView, setMobileView] = useState(window.innerWidth < 768);
  const [searchTerm, setSearchTerm] = useState('');

  // Group tabs by category - removed category headers as requested
  const tabCategories = {
    'Main': ['overview', 'products', 'categories', 'collections', 'promotions', 'all-orders', 'ready-to-ship', 'dispatched', 'cancelled', 'returns', 'customers', 'subadmins', 'contacts', 'notifications', 'reviews', 'site-content']
  };
  
  // Add subadmins to the sidebar navigation categories
  const sidebarCategories = {
    'Dashboard': ['overview'],
    'Catalog': ['products', 'categories', 'collections', 'promotions'],
    'Orders': ['all-orders', 'ready-to-ship', 'dispatched', 'cancelled', 'returns'],
    'Users': ['customers', 'subadmins', 'reviews'],
    'Content': ['contacts', 'notifications'],
    'Site Content': ['site-content']
  };

  // Find which category the active tab belongs to
  const getActiveCategory = () => {
    for (const [category, categoryTabs] of Object.entries(tabCategories)) {
      if (categoryTabs.includes(activeTab)) {
        return category;
      }
    }
    return null;
  };

  // Set expanded category based on active tab
  useEffect(() => {
    setExpandedCategory(getActiveCategory());
  }, [activeTab]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get tab label from id
  const getTabLabel = (tabId) => {
    const tab = tabs.find(tab => tab.id === tabId);
    return tab ? tab.label : tabId.charAt(0).toUpperCase() + tabId.slice(1).replace(/-/g, ' ');
  };

  // Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Tab navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex flex-wrap">
          {/* Direct tabs without category headers */}
          <div className="flex-1 flex flex-wrap">
            <div className="relative">
              <button 
                className={`
                  px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap flex items-center
                  border-java-500 text-java-600
                `}
                onClick={() => toggleCategory('Main')}
              >
                Dashboard
                {expandedCategory === 'Main' ? 
                  <ChevronUpIcon className="h-4 w-4 ml-1" /> : 
                  <ChevronDownIcon className="h-4 w-4 ml-1" />}
              </button>
            </div>
          </div>
          
          {/* Toggle button for all tabs */}
          <button 
            className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300 flex items-center"
            onClick={() => setShowAllTabs(!showAllTabs)}
          >
            {showAllTabs ? 'Hide All' : 'Show All'}
            {showAllTabs ? 
              <ChevronUpIcon className="h-4 w-4 ml-1" /> : 
              <ChevronDownIcon className="h-4 w-4 ml-1" />}
          </button>
        </div>
        
        {/* All tabs view (shown when toggled) */}
        <AnimatePresence>
          {showAllTabs && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-1 p-3 bg-gray-50 border-t border-gray-200">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    className={`
                      px-3 py-1.5 text-xs rounded-md
                      ${activeTab === tab.id 
                        ? 'bg-java-100 text-java-700 font-medium' 
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}
                    `}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setShowAllTabs(false);
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Sub-tabs for current category */}
        <AnimatePresence>
          {expandedCategory && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap px-4 py-2 border-t border-gray-100 bg-gray-50">
                {tabCategories[expandedCategory].map(tabId => (
                  <button
                    key={tabId}
                    className={`
                      mr-4 mb-2 px-3 py-1.5 text-sm whitespace-nowrap rounded-md
                      ${activeTab === tabId 
                        ? 'bg-java-100 text-java-600 font-medium' 
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}
                    `}
                    onClick={() => setActiveTab(tabId)}
                  >
                    {getTabLabel(tabId)}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Tab content */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 min-h-[calc(100vh-220px)]">
          {/* Search bar */}
          <div className="mb-4">
            <AdminSearchBar 
              onSearch={setSearchTerm} 
              placeholder={`Search in ${getTabLabel(activeTab)}...`}
            />
          </div>
          
          {/* Tab content */}
          <div className="relative">
            {searchTerm && (
              <div className="absolute top-0 left-0 right-0 bg-java-50 p-3 rounded-md mb-4 text-sm text-java-700 flex items-center">
                <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                <span>Search results: "{searchTerm}"</span>
              </div>
            )}
            <div className={searchTerm ? 'pt-12' : ''}>
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

AdminTabsNew.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
  renderTabContent: PropTypes.func.isRequired
};

export default AdminTabsNew;