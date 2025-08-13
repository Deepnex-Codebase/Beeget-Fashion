import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from '../utils/api'
// Toast import removed
// import { toast } from 'react-hot-toast'
import { FiChevronRight, FiFilter } from 'react-icons/fi'
import ProductCard from '../components/Shop/ProductCard'
import Pagination from '../components/Common/Pagination'

const NewArrivals = () => {
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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        
        // Build query parameters
        const params = {
          sort: 'createdAt', // Sort by creation date
          order: 'desc',    // Newest first
          page: pagination.page,
          limit: 30 // Get more products to ensure we have enough after filtering
        }
        
        // Add category filter if not 'all'
        if (categoryFilter !== 'all') {
          params.category = categoryFilter
        }
        
        // Add price range if set
        if (priceRange.min) params.minPrice = priceRange.min
        if (priceRange.max) params.maxPrice = priceRange.max
        
        const response = await axios.get('/products', { params })
        
        // Check if response and response.data exist
        if (!response || !response.data) {
          throw new Error('Invalid API response structure')
        }
        
        // Check if response.data.data exists and contains products array
        if (!response.data.data || !response.data.data.products || !Array.isArray(response.data.data.products)) {
          // console.error('Products data is missing or not an array:', response.data)
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
        // console.log('Products data structure:', response.data.data.products.length, 'products found')
        
        // Filter to only include products created in the last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const newArrivals = response.data.data.products.filter(product => {
          if (!product || !product.createdAt) return false
          const createdAt = new Date(product.createdAt)
          return createdAt >= thirtyDaysAgo
        })
        
        // Apply manual pagination to filtered results
        const startIndex = (pagination.page - 1) * pagination.limit
        const endIndex = startIndex + pagination.limit
        const paginatedProducts = newArrivals.slice(startIndex, endIndex)
        
        setProducts(paginatedProducts)
        setPagination({
          page: pagination.page,
          limit: pagination.limit,
          total: newArrivals.length,
          pages: Math.max(1, Math.ceil(newArrivals.length / pagination.limit)) // At least 1 page
        })
        
        setLoading(false)
      } catch (err) {
        // console.error('Error fetching new arrivals:', err)
        setError('Failed to load products. Please try again later.')
        // Error notification removed
        // toast.error('Failed to load products')
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
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">New Arrivals</h1>
        <div className="flex items-center text-sm text-gray-500">
          <Link to="/" className="hover:text-java-600 transition-colors">Home</Link>
          <FiChevronRight className="mx-2" />
          <span className="text-java-600">New Arrivals</span>
        </div>
      </div>
      
      {/* Banner */}
      <div className="relative h-48 md:h-64 rounded-lg overflow-hidden mb-8">
        <img 
          src="https://placehold.co/1200x400?text=New+Arrivals" 
          alt="New Arrivals"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Fresh Styles Just In</h2>
            <p className="text-sm md:text-base">Discover our latest fashion arrivals</p>
          </div>
        </div>
      </div>
      
      {/* Filter section removed */}
      
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

export default NewArrivals