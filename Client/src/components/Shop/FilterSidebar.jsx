import { XMarkIcon, AdjustmentsHorizontalIcon, FunnelIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import Button from '../Common/Button'

const FilterSidebar = ({ isOpen, onClose, filters, handleFilterChange }) => {
  // State to track which filter sections are expanded
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    sort: true
  })
  
  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }
  // Close sidebar when pressing escape key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEscKey)
    return () => window.removeEventListener('keydown', handleEscKey)
  }, [isOpen, onClose])
  
  // Prevent scrolling when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])
  
  // Reset all filters
  const resetFilters = () => {
    handleFilterChange('category', '')
    handleFilterChange('sort', 'newest')
    handleFilterChange('minPrice', '')
    handleFilterChange('maxPrice', '')
    handleFilterChange('search', '')
    handleFilterChange('page', 1)
  }
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-java-900 bg-opacity-40 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Sidebar panel */}
          <motion.div
            className="fixed top-0 left-0 h-full w-full sm:w-80 bg-white shadow-xl z-[100] flex flex-col border-r border-java-100"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
          >
            {/* Header */}
            <motion.div 
              className="flex items-center justify-between p-4 border-b border-java-100 bg-java-50"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <FunnelIcon className="h-5 w-5 text-java-600" />
                <h2 className="text-xl font-medium text-java-800">FILTERS</h2>
              </motion.div>
              <motion.button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-java-50 transition-colors text-java-600"
                aria-label="Close filters"
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <XMarkIcon className="h-6 w-6" />
              </motion.button>
            </motion.div>
            
            {/* Filters Content */}
            <motion.div 
              className="flex-grow overflow-y-auto py-3 px-4 bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {/* Category Filter */}
              <div className="border-b border-java-100 py-4">
                <button 
                  className="flex items-center justify-between w-full text-left"
                  onClick={() => toggleSection('category')}
                >
                  <h3 className="text-sm font-semibold uppercase text-java-800">Categories</h3>
                  {expandedSections.category ? (
                    <ChevronUpIcon className="h-5 w-5 text-java-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-java-500" />
                  )}
                </button>
                
                {expandedSections.category && (
                  <div className="mt-4 space-y-3 pl-1">
                    <label className="flex items-center hover:bg-java-50 p-2 rounded-full transition-colors">
                      <input
                        type="radio"
                        name="category"
                        value=""
                        checked={filters.category === ''}
                        onChange={() => handleFilterChange('category', '')}
                        className="h-4 w-4 text-java-600 border-java-300 focus:ring-java-500"
                      />
                      <span className="ml-2 text-sm text-gray-800">All Categories</span>
                    </label>
                    <label className="flex items-center hover:bg-java-50 p-2 rounded-full transition-colors">
                      <input
                        type="radio"
                        name="category"
                        value="women"
                        checked={filters.category === 'women'}
                        onChange={() => handleFilterChange('category', 'women')}
                        className="h-4 w-4 text-java-600 border-java-300 focus:ring-java-500"
                      />
                      <span className="ml-2 text-sm text-gray-800">Women</span>
                    </label>
                    <label className="flex items-center hover:bg-java-50 p-2 rounded-full transition-colors">
                      <input
                        type="radio"
                        name="category"
                        value="men"
                        checked={filters.category === 'men'}
                        onChange={() => handleFilterChange('category', 'men')}
                        className="h-4 w-4 text-java-600 border-java-300 focus:ring-java-500"
                      />
                      <span className="ml-2 text-sm text-gray-800">Men</span>
                    </label>
                    <label className="flex items-center hover:bg-java-50 p-2 rounded-full transition-colors">
                      <input
                        type="radio"
                        name="category"
                        value="accessories"
                        checked={filters.category === 'accessories'}
                        onChange={() => handleFilterChange('category', 'accessories')}
                        className="h-4 w-4 text-java-600 border-java-300 focus:ring-java-500"
                      />
                      <span className="ml-2 text-sm text-gray-800">Accessories</span>
                    </label>
                    <label className="flex items-center hover:bg-java-50 p-2 rounded-full transition-colors">
                      <input
                        type="radio"
                        name="category"
                        value="plus-size"
                        checked={filters.category === 'plus-size'}
                        onChange={() => handleFilterChange('category', 'plus-size')}
                        className="h-4 w-4 text-java-600 border-java-300 focus:ring-java-500"
                        disabled={true}
                      />
                      <span className="ml-2 text-sm text-gray-400">Plus Size (Coming Soon)</span>
                    </label>
                    <label className="flex items-center hover:bg-java-50 p-2 rounded-full transition-colors">
                      <input
                        type="radio"
                        name="category"
                        value="best-seller"
                        checked={filters.category === 'best-seller'}
                        onChange={() => handleFilterChange('category', 'best-seller')}
                        className="h-4 w-4 text-java-600 border-java-300 focus:ring-java-500"
                      />
                      <span className="ml-2 text-sm text-gray-800">Best Seller</span>
                    </label>
                  </div>
                )}
              </div>
              
              {/* Price Range Filter */}
              <div className="border-b border-java-100 py-4">
                <button 
                  className="flex items-center justify-between w-full text-left"
                  onClick={() => toggleSection('price')}
                >
                  <h3 className="text-sm font-semibold uppercase text-java-800">Price Range</h3>
                  {expandedSections.price ? (
                    <ChevronUpIcon className="h-5 w-5 text-java-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-java-500" />
                  )}
                </button>
                
                {expandedSections.price && (
                  <div className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="minPrice" className="block text-xs text-java-600 font-medium mb-1">Min (₹)</label>
                        <input
                          type="number"
                          id="minPrice"
                          value={filters.minPrice}
                          onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                          className="w-full px-3 py-2 border border-java-200 rounded-full text-sm focus:ring-java-500 focus:border-java-500 bg-white shadow-sm"
                          min="0"
                          step="1"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label htmlFor="maxPrice" className="block text-xs text-java-600 font-medium mb-1">Max (₹)</label>
                        <input
                          type="number"
                          id="maxPrice"
                          value={filters.maxPrice}
                          onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                          className="w-full px-3 py-2 border border-java-200 rounded-full text-sm focus:ring-java-500 focus:border-java-500 bg-white shadow-sm"
                          min="0"
                          step="1"
                          placeholder="10000"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {[500, 1000, 2000, 5000].map(price => (
                        <button
                          key={price}
                          className={`px-2 py-1.5 text-xs font-medium border ${filters.maxPrice == price ? 'border-java-500 bg-java-50 text-java-700' : 'border-java-200 text-gray-700 hover:border-java-300'} rounded-full transition-colors`}
                          onClick={() => handleFilterChange('maxPrice', price.toString())}
                        >
                          ₹{price}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Sort Filter */}
              <div className="border-b border-java-100 py-4">
                <button 
                  className="flex items-center justify-between w-full text-left"
                  onClick={() => toggleSection('sort')}
                >
                  <h3 className="text-sm font-semibold uppercase text-java-800">Sort By</h3>
                  {expandedSections.sort ? (
                    <ChevronUpIcon className="h-5 w-5 text-java-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-java-500" />
                  )}
                </button>
                
                {expandedSections.sort && (
                  <div className="mt-4 space-y-2">
                    {[
                      { value: 'newest', label: 'Newest First' },
                      { value: 'price-asc', label: 'Price: Low to High' },
                      { value: 'price-desc', label: 'Price: High to Low' },
                      { value: 'name-asc', label: 'Name: A to Z' },
                      { value: 'name-desc', label: 'Name: Z to A' }
                    ].map(option => (
                      <label key={option.value} className="flex items-center hover:bg-java-50 p-2 rounded-full transition-colors">
                        <input
                          type="radio"
                          name="sort"
                          value={option.value}
                          checked={filters.sort === option.value}
                          onChange={() => handleFilterChange('sort', option.value)}
                          className="h-4 w-4 text-java-600 border-java-300 focus:ring-java-500"
                        />
                        <span className="ml-2 text-sm text-gray-800">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Reset Filters Button */}
              <div className="py-4 sticky bottom-0 bg-white border-t border-java-100 mt-4 shadow-sm">
                <Button
                  className="bg-java-600 hover:bg-java-700 text-white font-medium transition-colors shadow-sm"
                  fullWidth
                  onClick={resetFilters}
                >
                  CLEAR ALL
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default FilterSidebar