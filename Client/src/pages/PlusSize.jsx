import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from '../utils/api'
import { toast } from 'react-hot-toast'
import { FiChevronRight, FiFilter } from 'react-icons/fi'
import ProductCard from '../components/Shop/ProductCard'
import Pagination from '../components/Common/Pagination'

const PlusSize = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  })
  
  // Filter states
  const [sortBy, setSortBy] = useState('newest')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        
        // Build query parameters
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          sort: sortBy
        }
        
        // Add price range if set
        if (priceRange.min) params.minPrice = priceRange.min
        if (priceRange.max) params.maxPrice = priceRange.max
        
        // Add category parameter for women's clothing (most plus size items are in women's category)
        params.category = 'women'
        
        const response = await axios.get('/products', { params })
        
        // Check if response and response.data exist
        if (!response || !response.data) {
          throw new Error('Invalid API response structure')
        }
        
        // Check if response.data.data exists and contains products array
        if (!response.data.data || !response.data.data.products || !Array.isArray(response.data.data.products)) {
          console.error('Products data is missing or not an array:', response.data)
          setProducts([])
          setPagination({
            page: 1,
            limit: pagination.limit,
            total: 0,
            pages: 0
          })
          setLoading(false)
          return
        }
        
        // Log the products data structure for debugging
        console.log('Products data structure:', response.data.data.products.length, 'products found')
        
        // Filter products to only include plus size items (XL, XXL, etc.)
        const plusSizeProducts = response.data.data.products.filter(product => {
          // Check if product has variants
          if (!product.variants || !Array.isArray(product.variants) || product.variants.length === 0) {
            return false
          }
          
          // Check if any variant has plus size attributes
          return product.variants.some(variant => {
            if (variant && variant.attributes && variant.attributes.size) {
              const size = variant.attributes.size.toString().toUpperCase()
              return size === 'XL' || size === 'XXL' || size === 'XXXL' || 
                     size === '2XL' || size === '3XL' || size === '4XL' || 
                     size.includes('PLUS')
            }
            return false
          })
        })
        
        setProducts(plusSizeProducts)
        setPagination({
          page: response.data.data.pagination?.page || 1,
          limit: response.data.data.pagination?.limit || 12,
          total: plusSizeProducts.length || 0,
          pages: Math.ceil(plusSizeProducts.length / pagination.limit) || 1 // At least 1 page
        })
        
        setLoading(false)
      } catch (err) {
        console.error('Error fetching plus size products:', err)
        setError('Failed to load products. Please try again later.')
        toast.error('Failed to load products')
        setProducts([])
        setPagination({
          page: 1,
          limit: pagination.limit,
          total: 0,
          pages: 0
        })
        setLoading(false)
      }
    }

    fetchProducts()
  }, [pagination.page, pagination.limit, sortBy, priceRange.min, priceRange.max])

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return
    setPagination(prev => ({ ...prev, page: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSortChange = (e) => {
    setSortBy(e.target.value)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page on sort change
  }

  const handlePriceChange = (e) => {
    const { name, value } = e.target
    setPriceRange(prev => ({ ...prev, [name]: value }))
  }

  const applyPriceFilter = () => {
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page on filter change
  }

  const resetFilters = () => {
    setSortBy('newest')
    setPriceRange({ min: '', max: '' })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  if (loading && pagination.page === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-java-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-gray-700 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2 bg-java-600 text-white rounded-md hover:bg-java-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      {/* Header and Breadcrumb */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Plus Size Collection</h1>
        <div className="flex items-center text-sm text-gray-500">
          <Link to="/" className="hover:text-java-600 transition-colors">Home</Link>
          <FiChevronRight className="mx-2" />
          <span className="text-java-600">Plus Size</span>
        </div>
      </div>
      
      {/* Banner */}
      <div className="relative h-48 md:h-64 rounded-lg overflow-hidden mb-8">
        <img 
          src="https://via.placeholder.com/1200x400?text=Plus+Size+Collection" 
          alt="Plus Size Collection"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Stylish Plus Size Fashion</h2>
            <p className="text-sm md:text-base">Comfortable, trendy styles for every body</p>
          </div>
        </div>
      </div>
      
      {/* Filter and Sort Controls */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <button 
            className="flex items-center text-gray-700 hover:text-java-600 mb-4 md:mb-0"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter className="mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          <div className="flex items-center">
            <label htmlFor="sort" className="mr-2 text-gray-700">Sort by:</label>
            <select
              id="sort"
              value={sortBy}
              onChange={handleSortChange}
              className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-java-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
            </select>
          </div>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <motion.div 
            className="bg-gray-50 p-4 rounded-lg mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="min" className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
                <input
                  type="number"
                  id="min"
                  name="min"
                  value={priceRange.min}
                  onChange={handlePriceChange}
                  placeholder="Min"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-java-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="max" className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                <input
                  type="number"
                  id="max"
                  name="max"
                  value={priceRange.max}
                  onChange={handlePriceChange}
                  placeholder="Max"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-java-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex justify-between">
              <button 
                onClick={applyPriceFilter}
                className="px-4 py-2 bg-java-600 text-white rounded-md hover:bg-java-700 transition-colors"
              >
                Apply Filters
              </button>
              
              <button 
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-java-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your filters or check back later for new arrivals.</p>
          <button 
            onClick={resetFilters} 
            className="px-6 py-2 bg-java-600 text-white rounded-md hover:bg-java-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination 
            currentPage={pagination.page} 
            totalPages={pagination.pages} 
            onPageChange={handlePageChange} 
          />
        </div>
      )}
      
      {/* Product count */}
      <div className="mt-4 text-center text-sm text-gray-500">
        Showing {products.length} of {pagination.total} products
      </div>
    </div>
  )
}

export default PlusSize