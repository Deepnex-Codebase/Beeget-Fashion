import { useState } from 'react';
import PropTypes from 'prop-types';

const AdminTabs = ({ tabs, activeTab, setActiveTab, renderTabContent }) => {
  const [showAllTabs, setShowAllTabs] = useState(false);

  // Group tabs by category
  const tabCategories = {
    'Dashboard': ['overview'],
    'Products': ['products', 'categories', 'collections', 'promotions'],
    'Orders': ['all-orders', 'ready-to-ship', 'dispatched', 'cancelled', 'returns'],
    'Customers': ['customers'],
    'Communication': ['contacts', 'notifications'],
    'Content': ['cms']
  };

  // Get tab label from id
  const getTabLabel = (tabId) => {
    const tab = tabs.find(tab => tab.id === tabId);
    return tab ? tab.label : tabId.charAt(0).toUpperCase() + tabId.slice(1).replace(/-/g, ' ');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab navigation */}
      <div className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="flex">
          {/* Main tabs */}
          <div className="flex-1 flex">
            {Object.entries(tabCategories).map(([category, categoryTabs], categoryIndex) => (
              <div key={category} className="relative group">
                <button 
                  className={`
                    px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap
                    ${categoryTabs.includes(activeTab) 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                  onClick={() => setActiveTab(categoryTabs[0])}
                >
                  {category}
                </button>
                
                {/* Dropdown for category tabs */}
                <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 hidden group-hover:block">
                  {categoryTabs.map(tabId => (
                    <button
                      key={tabId}
                      className={`
                        w-full text-left px-4 py-2 text-sm
                        ${activeTab === tabId ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}
                      `}
                      onClick={() => setActiveTab(tabId)}
                    >
                      {getTabLabel(tabId)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Toggle button for all tabs */}
          <button 
            className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300"
            onClick={() => setShowAllTabs(!showAllTabs)}
          >
            {showAllTabs ? 'Hide Tabs' : 'Show All'}
          </button>
        </div>
        
        {/* All tabs view (shown when toggled) */}
        {showAllTabs && (
          <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-t border-gray-200">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`
                  px-3 py-1.5 text-xs rounded-md
                  ${activeTab === tab.id 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}
                `}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
        
        {/* Sub-tabs for current category */}
        <div className="flex overflow-x-auto px-4 py-2 border-t border-gray-100">
          {Object.entries(tabCategories).map(([category, categoryTabs]) => {
            if (categoryTabs.includes(activeTab)) {
              return categoryTabs.map(tabId => (
                <button
                  key={tabId}
                  className={`
                    mr-4 px-2 py-1 text-sm whitespace-nowrap
                    ${activeTab === tabId 
                      ? 'text-blue-600 font-medium border-b-2 border-blue-500' 
                      : 'text-gray-500 hover:text-gray-700'}
                  `}
                  onClick={() => setActiveTab(tabId)}
                >
                  {getTabLabel(tabId)}
                </button>
              ));
            }
            return null;
          })}
        </div>
      </div>
      
      {/* Tab content */}
      <div className="flex-1 overflow-auto p-4">
        {renderTabContent()}
      </div>
    </div>
  );
};

AdminTabs.propTypes = {
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

export default AdminTabs;