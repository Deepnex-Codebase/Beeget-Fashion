import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from '../utils/api'
import { toast } from 'react-hot-toast'
import { FiChevronRight, FiFilter, FiAward } from 'react-icons/fi'
import ProductCard from '../components/Shop/ProductCard'
import Pagination from '../components/Common/Pagination'

const BestSeller = () => {
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
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [showFilters, setShowFilters] = useState(false)

  // Function to fetch regular products when no purchase data is available
  const fetchRegularProducts = async () => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = {
        sort: 'createdAt',
        order: 'desc',
        page: 1,
        limit: 100
      }
      
      // Add category filter if not 'all'
      if (categoryFilter !== 'all') {
        params.category = categoryFilter
      }
      
      // Add price range if set
      if (priceRange.min) params.minPrice = priceRange.min
      if (priceRange.max) params.maxPrice = priceRange.max
      
      const response = await axios.get('/products', { params })
      
      if (!response || !response.data || !response.data.data || !response.data.data.products) {
        throw new Error('Invalid API response structure')
      }
      
      const products = response.data.data.products
      
      // Apply manual pagination
      const startIndex = (pagination.page - 1) * pagination.limit
      const endIndex = startIndex + pagination.limit
      const paginatedProducts = products.slice(startIndex, endIndex)
      
      // Update state
      setProducts(paginatedProducts)
      setPagination({
        page: pagination.page,
        limit: pagination.limit,
        total: products.length,
        pages: Math.max(1, Math.ceil(products.length / pagination.limit))
      })
      setLoading(false)
    } catch (err) {
      // console.error('Error fetching regular products:', err)
      setError('Failed to load products. Please try again later.')
      setLoading(false)
    }
  }
  
  useEffect(() => {
    const fetchMostPurchasedProducts = async () => {
      try {
        setLoading(true)
        
        try {
          // First, get all orders to analyze purchase frequency
          const ordersResponse = await axios.get('/orders?limit=1000')
          
          if (!ordersResponse || !ordersResponse.data || !ordersResponse.data.data || !ordersResponse.data.data.orders) {
            throw new Error('Invalid orders API response structure')
          }
          
          const orders = ordersResponse.data.data.orders
          
          // Create a map to count product purchases
          const productPurchaseCounts = {}
          
          // Count how many times each product has been purchased
          orders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
              order.items.forEach(item => {
                if (item.productId) {
                  const productId = typeof item.productId === 'object' ? item.productId._id : item.productId
                  
                  if (productId) {
                    // Initialize or increment the count and add the quantity
                    if (!productPurchaseCounts[productId]) {
                      productPurchaseCounts[productId] = {
                        count: 0,
                        qty: 0
                      }
                    }
                    productPurchaseCounts[productId].count += 1
                    productPurchaseCounts[productId].qty += (item.qty || 1)
                  }
                }
              })
            }
          })
          
          // Get the product IDs sorted by purchase count
          const sortedProductIds = Object.keys(productPurchaseCounts).sort((a, b) => {
            return productPurchaseCounts[b].qty - productPurchaseCounts[a].qty
          })
          
          // If we have no purchase data, fetch regular products
          if (sortedProductIds.length === 0) {
            // console.log('No purchase data found, fetching regular products')
            await fetchRegularProducts()
            return
          }
          
          // Now fetch the actual product details for these IDs
          // Build query parameters for filtering
          const params = {}
          
          // Add category filter if not 'all'
          if (categoryFilter !== 'all') {
            params.category = categoryFilter
          }
          
          // Add price range if set
          if (priceRange.min) params.minPrice = priceRange.min
          if (priceRange.max) params.maxPrice = priceRange.max
          
          const productsResponse = await axios.get('/products?limit=100', { params })
          
          if (!productsResponse || !productsResponse.data || !productsResponse.data.data || !productsResponse.data.data.products) {
            throw new Error('Invalid products API response structure')
          }
          
          const allProducts = productsResponse.data.data.products
          
          // Filter products based on category and price if needed
          let filteredProducts = allProducts
          if (categoryFilter !== 'all') {
            filteredProducts = filteredProducts.filter(product => {
              const productCategory = typeof product.category === 'object' ? product.category._id : product.category
              return productCategory === categoryFilter
            })
          }
          
          if (priceRange.min || priceRange.max) {
            filteredProducts = filteredProducts.filter(product => {
              if (!product.variants || product.variants.length === 0) return false
              
              const price = product.variants[0].price
              const minOk = !priceRange.min || price >= Number(priceRange.min)
              const maxOk = !priceRange.max || price <= Number(priceRange.max)
              return minOk && maxOk
            })
          }
          
          // Add sales data to products and sort by most purchased
          const productsWithSales = filteredProducts.map(product => ({
            ...product,
            sales: productPurchaseCounts[product._id] ? productPurchaseCounts[product._id].qty : 0
          }))
          
          // Sort by actual sales count
          const sortedProducts = productsWithSales.sort((a, b) => b.sales - a.sales)
          
          // Apply manual pagination
          const startIndex = (pagination.page - 1) * pagination.limit
          const endIndex = startIndex + pagination.limit
          const paginatedProducts = sortedProducts.slice(startIndex, endIndex)
          
          // Update state
          setProducts(paginatedProducts)
          setPagination({
            page: pagination.page,
            limit: pagination.limit,
            total: sortedProducts.length,
            pages: Math.max(1, Math.ceil(sortedProducts.length / pagination.limit)) // At least 1 page
          })
          setLoading(false)
        } catch (orderError) {
          // Check if it's a permission error (403 Forbidden) or authentication error (401 Unauthorized)
          const isAuthError = (
            // Standard 403 response check
            (orderError.response && orderError.response.status === 403) ||
            // Standard 401 response check
            (orderError.response && orderError.response.status === 401) ||
            // Check for ERR_BAD_REQUEST with 403 status
            (orderError.code === 'ERR_BAD_REQUEST' && orderError.response && orderError.response.status === 403) ||
            // Check for ERR_BAD_REQUEST with 401 status
            (orderError.code === 'ERR_BAD_REQUEST' && orderError.response && orderError.response.status === 401) ||
            // Check for error message containing 'Access denied', 'Department: orders required', or 'Access token is required'
            (orderError.response && orderError.response.data && 
             orderError.response.data.error && 
             (orderError.response.data.error.message?.includes('Access denied') || 
              orderError.response.data.error.message?.includes('Department: orders required') ||
              orderError.response.data.error.message?.includes('Access token is required')))
          )
          
          if (isAuthError) {
            // console.log('Authentication or permission error accessing orders, falling back to regular products')
            await fetchRegularProducts()
            return
          } else {
            // Re-throw if it's not a permission error
            throw orderError
          }
        }
      } catch (err) {
        // console.error('Error fetching best sellers:', err)
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

    fetchMostPurchasedProducts()
  }, [pagination.page, pagination.limit, categoryFilter, priceRange.min, priceRange.max])

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return
    setPagination(prev => ({ ...prev, page: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page on category change
  }

  const handlePriceChange = (e) => {
    const { name, value } = e.target
    setPriceRange(prev => ({ ...prev, [name]: value }))
  }

  const applyPriceFilter = () => {
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page on filter change
  }

  const resetFilters = () => {
    setCategoryFilter('all')
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
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Best Sellers</h1>
        <div className="flex items-center text-sm text-gray-500">
          <Link to="/" className="hover:text-java-600 transition-colors">Home</Link>
          <FiChevronRight className="mx-2" />
          <span className="text-java-600">Best Sellers</span>
        </div>
      </div>
      
      {/* Banner */}
      <div className="relative h-48 md:h-64 rounded-lg overflow-hidden mb-8">
        <img 
          src="https://via.placeholder.com/1200x400?text=Best+Sellers" 
          alt="Best Sellers"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="flex justify-center mb-2">
              <FiAward className="h-10 w-10 text-yellow-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Our Most Popular Items</h2>
            <p className="text-sm md:text-base">Customer favorites and trending styles</p>
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
            <label htmlFor="category" className="mr-2 text-gray-700">Category:</label>
            <select
              id="category"
              value={categoryFilter}
              onChange={handleCategoryChange}
              className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-java-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="women">Women</option>
              <option value="men">Men</option>
              <option value="accessories">Accessories</option>
              <option value="plus-size">Plus Size</option>
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Price Range</h3>
            
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
          <p className="text-gray-600 mb-6">Try adjusting your filters or check back later.</p>
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

export default BestSeller