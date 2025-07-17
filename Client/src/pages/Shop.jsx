import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAuth from '../hooks/useAuth'
import useCart from '../hooks/useCart'
import useWishlist from '../hooks/useWishlist'
import Button from '../components/Common/Button'
import productImages from '../assets/product-images'
import { toast } from 'react-toastify'
import { ChevronLeftIcon, ChevronRightIcon,ChevronDownIcon, AdjustmentsHorizontalIcon, HeartIcon, ShoppingBagIcon, XMarkIcon, FunnelIcon, ArrowsUpDownIcon, AdjustmentsVerticalIcon, StarIcon, FireIcon, TagIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid, FireIcon as FireIconSolid, EyeIcon } from '@heroicons/react/24/solid'
import { FaHeart, FaRegHeart, FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa'
import FilterSidebar from '../components/Shop/FilterSidebar'
import api from '../utils/api'

const Shop = () => {
  const { isAuthenticated } = useAuth()
  const { addToCart } = useCart()
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    sort: searchParams.get('sort') || 'newest',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || '9', 10)
  })
  
  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (filters.category) params.set('category', filters.category)
    if (filters.sort) params.set('sort', filters.sort)
    if (filters.minPrice) params.set('minPrice', filters.minPrice)
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
    params.set('page', filters.page.toString())
    params.set('limit', filters.limit.toString())
    
    setSearchParams(params)
  }, [filters, setSearchParams])
  
  // State for products and pagination
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const productsPerPage = 9
  
  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Build query parameters
        const queryParams = new URLSearchParams()
        if (filters.category) queryParams.append('category', filters.category)
        if (filters.minPrice) queryParams.append('minPrice', filters.minPrice)
        if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice)
        
        // Map frontend sort values to backend sort parameters
        let sortField = 'createdAt'
        let sortOrder = 'desc'
        
        switch (filters.sort) {
          case 'price-asc':
            sortField = 'variants.price'
            sortOrder = 'asc'
            break
          case 'price-desc':
            sortField = 'variants.price'
            sortOrder = 'desc'
            break
          case 'name-asc':
            sortField = 'title'
            sortOrder = 'asc'
            break
          case 'name-desc':
            sortField = 'title'
            sortOrder = 'desc'
            break
          default:
            // Default is newest first
            sortField = 'createdAt'
            sortOrder = 'desc'
        }
        
        queryParams.append('sort', sortField)
        queryParams.append('order', sortOrder)
        queryParams.append('page', filters.page.toString())
        queryParams.append('limit', filters.limit.toString())
        
        // Make API request
        const response = await api.get(`/products?${queryParams.toString()}`)
        
        if (response.data.success) {
          // Transform backend data to match frontend format if needed
          const backendProducts = response.data.data.products.map(product => ({
            id: product._id,
            _id: product._id,
            title: product.title,
            description: product.description,
            category: product.category?.name || 'Uncategorized',
            price: product.variants && product.variants.length > 0 ? product.variants[0].price : 0,
            originalPrice: product.variants && product.variants.length > 0 ? 
              (product.variants[0].compareAtPrice || product.variants[0].price) : 0,
            images: product.images || [],
            slug: product.slug || product._id,
            // Store the variants array for later use
            variants: product.variants || [],
            // Extract unique sizes from variants
            sizes: product.variants ? 
              [...new Set(product.variants.map(v => 
                v.attributes && v.attributes.size ? v.attributes.size : null
              ).filter(Boolean))] : [],
            // Extract unique colors from variants
            colors: product.variants ? 
              [...new Set(product.variants.map(v => 
                v.attributes && v.attributes.color ? v.attributes.color : null
              ).filter(Boolean))] : [],
            inStock: product.variants && product.variants.some(v => v.stock > 0)
          }))
          
          setProducts(backendProducts)
          setTotalProducts(response.data.data.pagination.total)
          setTotalPages(response.data.data.pagination.pages)
        } else {
          throw new Error('Failed to fetch products')
        }
      } catch (err) {
        console.error('Error fetching products:', err)
        setError('Failed to load products. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProducts()
  }, [filters])
  
  // Pagination data
  const pagination = { 
    total: totalProducts, 
    page: filters.page, 
    pages: totalPages 
  }
  
  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      // Reset to page 1 when filters change (except when changing page)
      ...(name !== 'page' && { page: 1 })
    }))
  }
  
  // Handle add to cart
  const handleAddToCart = (product) => {
    if (!isAuthenticated) {
      toast.info('Please login to add items to your cart')
      return
    }
    
    // Get default size and color from product variants if available
    let defaultSize = null;
    let defaultColor = null;
    let variantSku = null;
    
    // Check if product has variants with size and color attributes
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      // Find first variant that has stock
      const inStockVariant = product.variants.find(v => v.stock > 0);
      
      if (inStockVariant && inStockVariant.attributes) {
        defaultSize = inStockVariant.attributes.size || null;
        defaultColor = inStockVariant.attributes.color || null;
        variantSku = inStockVariant.sku || null;
      }
    }
    
    // If no size found from variants but product has sizes array, use first size
    if (!defaultSize && product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
      defaultSize = product.sizes[0];
    }
    
    // Add to cart with size and color information
    addToCart({
      id: product._id,  // Changed from productId to id
      name: product.title,
      price: product.price,
      image: product.images && product.images.length > 0 ? product.images[0] : '',
      quantity: 1,
      size: defaultSize,
      color: defaultColor,
      variantSku: variantSku
    }, 1, defaultSize, defaultColor)
    
    toast.success(`${product.title} added to cart!`)
  }
  
  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return
    handleFilterChange('page', newPage)
  }
  
  return (
    <div className="bg-white min-h-screen">
      {/* Filter Sidebar */}
      <FilterSidebar 
        isOpen={isFilterSidebarOpen} 
        onClose={() => setIsFilterSidebarOpen(false)} 
        filters={filters} 
        handleFilterChange={handleFilterChange} 
      />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-java-500 to-java-700 text-transparent bg-clip-text">Fashion Collection</h1>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <button 
                className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-full bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-java-300 transition-all"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <FunnelIcon className="h-5 w-5 text-java-500" />
                <span>Filter</span>
              </button>
            </div>
            <div className="relative">
              <div className="relative inline-block text-left">
                <button 
                  className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-full bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-java-300 transition-all"
                  onClick={() => {
                    const sortMenu = document.getElementById('sort-menu');
                    if (sortMenu) {
                      sortMenu.classList.toggle('hidden');
                    }
                  }}
                >
                  <ArrowsUpDownIcon className="h-5 w-5 text-java-500" />
                  <span>Sort by</span>
                </button>
                
                {/* Sort Dropdown Menu */}
                <div id="sort-menu" className="hidden absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleFilterChange('sort', 'newest');
                        document.getElementById('sort-menu').classList.add('hidden');
                      }}
                      className={`block px-4 py-2 text-sm w-full text-left ${filters.sort === 'newest' ? 'bg-java-50 text-java-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      Newest First
                    </button>
                    <button
                      onClick={() => {
                        handleFilterChange('sort', 'price-asc');
                        document.getElementById('sort-menu').classList.add('hidden');
                      }}
                      className={`block px-4 py-2 text-sm w-full text-left ${filters.sort === 'price-asc' ? 'bg-java-50 text-java-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      Price: Low to High
                    </button>
                    <button
                      onClick={() => {
                        handleFilterChange('sort', 'price-desc');
                        document.getElementById('sort-menu').classList.add('hidden');
                      }}
                      className={`block px-4 py-2 text-sm w-full text-left ${filters.sort === 'price-desc' ? 'bg-java-50 text-java-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      Price: High to Low
                    </button>
                    <button
                      onClick={() => {
                        handleFilterChange('sort', 'name-asc');
                        document.getElementById('sort-menu').classList.add('hidden');
                      }}
                      className={`block px-4 py-2 text-sm w-full text-left ${filters.sort === 'name-asc' ? 'bg-java-50 text-java-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      Name: A to Z
                    </button>
                    <button
                      onClick={() => {
                        handleFilterChange('sort', 'name-desc');
                        document.getElementById('sort-menu').classList.add('hidden');
                      }}
                      className={`block px-4 py-2 text-sm w-full text-left ${filters.sort === 'name-desc' ? 'bg-java-50 text-java-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      Name: Z to A
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Product Grid Section - Modern Style */}
        <div className="w-full">
          {isLoading ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 xs:gap-4 md:gap-5">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-white overflow-hidden animate-pulse rounded-xl border border-gray-200 shadow h-full">
                     <div className="h-72 bg-gray-200"></div>
                     <div className="p-4">
                       <div className="h-5 bg-gray-200 rounded-full w-3/4 mb-3"></div>
                       <div className="h-3 bg-gray-200 rounded-full w-1/2 mb-3"></div>
                       <div className="flex justify-between mb-3">
                         <div className="h-5 bg-gray-200 rounded-full w-1/4"></div>
                         <div className="h-4 bg-gray-200 rounded-full w-1/6"></div>
                       </div>
                       <div className="flex justify-between mb-3">
                         <div className="h-5 bg-gray-200 rounded-full w-1/3"></div>
                         <div className="h-4 bg-gray-200 rounded-full w-1/4"></div>
                       </div>
                       {/* Available Sizes Placeholder */}
                       <div className="h-3 bg-gray-200 rounded-full w-2/5 mb-2"></div>
                       <div className="flex gap-1.5 mb-3">
                         <div className="h-5 bg-gray-200 rounded-full w-12"></div>
                         <div className="h-5 bg-gray-200 rounded-full w-12"></div>
                         <div className="h-5 bg-gray-200 rounded-full w-12"></div>
                       </div>
                       {/* Add to Cart Button Placeholder */}
                       <div className="h-10 bg-gray-200 rounded-full w-full mt-2"></div>
                     </div>
                   </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-java-50 text-java-700 p-6 rounded-xl shadow-sm border border-java-100">
              <p className="font-medium">Error loading products</p>
              <p className="text-sm mt-1">{error}</p>
              <button 
                className="mt-3 px-4 py-2 bg-java-500 text-white text-sm rounded-full hover:bg-java-600 transition-colors shadow-md hover:shadow"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
            </div>
          ) : products?.length === 0 ? (
            <div className="bg-white p-8 rounded-lg text-center shadow-sm border border-gray-200 max-w-2xl mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 text-gray-300 bg-gray-50 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-10 h-10">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2 text-gray-800">No Products Found</h3>
              <p className="text-gray-500 mb-6 text-sm max-w-md mx-auto">We couldn't find any products matching your current filter criteria. Try adjusting your filters or browse our entire collection.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  className="px-6 py-2.5 bg-java-500 text-white text-sm font-medium rounded-full hover:bg-java-600 transition-colors shadow-sm hover:shadow flex items-center justify-center gap-2"
                  onClick={() => {
                    setFilters({
                      category: '',
                      sort: 'newest',
                      minPrice: '',
                      maxPrice: '',
                      search: '',
                      page: 1,
                      limit: parseInt(searchParams.get('limit') || '12', 10)
                    })
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear All Filters
                </button>
                <button
                  className="px-6 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors shadow-sm hover:shadow border border-gray-200 flex items-center justify-center gap-2"
                  onClick={() => window.location.href = '/shop'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                  Browse All Products
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4 bg-white p-2 xs:p-3 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <p className="text-xs xs:text-sm text-gray-700">
                    <span className="font-medium text-java-700">{pagination.total}</span> products found
                  </p>
                </div>
                
                {/* Sort indicator */}
                <div className="flex items-center">
                  <div className="relative inline-block text-left">
                    <div 
                      className="flex items-center space-x-1 cursor-pointer bg-java-50 px-2 xs:px-3 py-1 xs:py-1.5 rounded-full border border-java-100 hover:bg-java-100 transition-all"
                      onClick={() => {
                        const sortMenu = document.getElementById('sort-menu');
                        if (sortMenu) {
                          sortMenu.classList.toggle('hidden');
                        }
                      }}
                    >
                      <span className="text-xs xs:text-sm text-java-700 font-medium">SORT BY:</span>
                      <span className="hidden xs:inline text-xs xs:text-sm font-medium text-java-800">
                        {filters.sort === 'newest' && 'Newest First'}
                        {filters.sort === 'price-asc' && 'Price: Low to High'}
                        {filters.sort === 'price-desc' && 'Price: High to Low'}
                        {filters.sort === 'name-asc' && 'Name: A to Z'}
                        {filters.sort === 'name-desc' && 'Name: Z to A'}
                      </span>
                      <ChevronDownIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-java-600" />
                    </div>
                    
                    {/* Sort dropdown menu */}
                    <div 
                      id="sort-menu" 
                      className="hidden absolute right-0 mt-2 w-48 xs:w-56 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    >
                      <div className="py-1">
                        <button
                          onClick={() => {
                            handleFilterChange('sort', 'newest');
                            document.getElementById('sort-menu').classList.add('hidden');
                          }}
                          className={`${filters.sort === 'newest' ? 'bg-java-50 text-java-700' : 'text-gray-700'} group flex w-full items-center px-3 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm hover:bg-gray-50`}
                        >
                          Newest First
                        </button>
                        <button
                          onClick={() => {
                            handleFilterChange('sort', 'price-asc');
                            document.getElementById('sort-menu').classList.add('hidden');
                          }}
                          className={`${filters.sort === 'price-asc' ? 'bg-java-50 text-java-700' : 'text-gray-700'} group flex w-full items-center px-3 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm hover:bg-gray-50`}
                        >
                          Price: Low to High
                        </button>
                        <button
                          onClick={() => {
                            handleFilterChange('sort', 'price-desc');
                            document.getElementById('sort-menu').classList.add('hidden');
                          }}
                          className={`${filters.sort === 'price-desc' ? 'bg-java-50 text-java-700' : 'text-gray-700'} group flex w-full items-center px-3 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm hover:bg-gray-50`}
                        >
                          Price: High to Low
                        </button>
                        <button
                          onClick={() => {
                            handleFilterChange('sort', 'name-asc');
                            document.getElementById('sort-menu').classList.add('hidden');
                          }}
                          className={`${filters.sort === 'name-asc' ? 'bg-java-50 text-java-700' : 'text-gray-700'} group flex w-full items-center px-3 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm hover:bg-gray-50`}
                        >
                          Name: A to Z
                        </button>
                        <button
                          onClick={() => {
                            handleFilterChange('sort', 'name-desc');
                            document.getElementById('sort-menu').classList.add('hidden');
                          }}
                          className={`${filters.sort === 'name-desc' ? 'bg-java-50 text-java-700' : 'text-gray-700'} group flex w-full items-center px-3 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm hover:bg-gray-50`}
                        >
                          Name: Z to A
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 md:gap-5 px-1 xs:px-0">
                {products.map((product) => {
                  // Get product ID (handle both id and _id)
                  const productId = product.id || product._id;
                  // Get product name (handle both title and name)
                  const productName = product.title || product.name;
                  const inWishlist = isInWishlist(productId);
                  
                  // Calculate discount percentage
                  const discountPercentage = product.originalPrice ? 
                    Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 
                    60; // Default to 60% if no originalPrice is provided
                  
                  // Get available sizes from product data
                  const availableSizes = product.category === 'accessories' ? [] : 
                    (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) ? 
                    product.sizes : [];
                  
                  return (
                    <div key={productId} className="group relative rounded-lg xs:rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md overflow-hidden">
                      {/* Discount Tag */}
                      {discountPercentage > 0 && (
                        <div className="absolute left-1 xs:left-1.5 sm:left-2 top-1 xs:top-1.5 sm:top-2 z-10 rounded-full bg-red-500 px-1 xs:px-1.5 sm:px-2.5 py-0.5 xs:py-0.5 sm:py-1 text-[8px] xs:text-[10px] sm:text-xs font-bold text-white">
                          {Math.round(discountPercentage)}% OFF
                        </div>
                      )}
                      
                      {/* Wishlist Button */}
                      <button
                        onClick={() => inWishlist ? removeFromWishlist(productId) : addToWishlist(product)}
                        className="absolute right-1.5 xs:right-2 top-1.5 xs:top-2 z-10 rounded-full bg-white/80 p-1 xs:p-1.5 text-gray-700 backdrop-blur-sm transition-all hover:bg-java-500 hover:text-white shadow-sm"
                        aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        {inWishlist ? 
                          <HeartIconSolid className="h-4 w-4 xs:h-5 xs:w-5 text-red-500" /> : 
                          <HeartIcon className="h-4 w-4 xs:h-5 xs:w-5" />
                        }
                      </button>
                      
                      {/* Product Image Container */}
                      <div className="relative overflow-hidden">
                        <Link to={`/product/${product.slug}`} className="block">
                          <img 
                            src={product.images && product.images.length > 0 ? product.images[0] : productImages.tshirtWhite} 
                            alt={productName} 
                            className="w-full h-48 xs:h-56 sm:h-64 md:h-72 object-cover transition-transform group-hover:scale-105 duration-500 ease-in-out"
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = productImages.tshirtWhite;
                            }}
                          />
                          
                          {/* Product Image Overlay with subtle gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"></div>
                        </Link>
                      </div>
                      
                      {/* Product Info */}
                      <div className="p-2 xs:p-3 sm:p-4">
                        {/* Title and Rating */}
                        <div className="flex justify-between items-start mb-2.5">
                          <Link to={`/product/${product.slug}`} className="block flex-1">
                            <h3 className="text-sm xs:text-base md:text-lg font-medium text-gray-800 hover:text-java-500 transition-colors line-clamp-2">{productName}</h3>
                          </Link>
                          
                          {/* Rating Stars */}
                          <div className="flex items-center bg-gradient-to-r from-java-100 to-java-200 px-1.5 xs:px-2 py-0.5 rounded-full ml-1 xs:ml-2">
                            <StarIconSolid className="h-3 w-3 xs:h-3.5 xs:w-3.5 text-java-600 mr-0.5" />
                            <span className="text-[10px] xs:text-xs font-medium text-java-800">4.0</span>
                          </div>
                        </div>
                        
                        {/* Category Tag */}
                        <div className="mb-2">
                          <span className="inline-block text-[10px] xs:text-xs bg-gray-50 text-gray-500 px-1.5 xs:px-2 py-0.5 rounded-full capitalize border border-gray-100">
                            {product.category || "Women's Fashion"}
                          </span>
                        </div>
                        
                        {/* Price section with improved styling */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-baseline gap-1 xs:gap-1.5">
                            <p className="text-sm xs:text-base md:text-lg font-bold text-red-500">₹{product.price.toFixed(2)}</p>
                            {product.originalPrice && (
                              <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-400 line-through">₹{product.originalPrice.toFixed(2)}</p>
                            )}
                          </div>
                          {discountPercentage > 0 && (
                            <span className="text-[9px] xs:text-[10px] sm:text-xs bg-green-50 text-green-600 font-bold px-1 xs:px-1.5 py-0.5 rounded-full border border-green-100">
                              {discountPercentage}% OFF
                            </span>
                          )}
                        </div>
                        
                        {/* Available Sizes or Premium Quality */}
                        {product.category === 'accessories' ? (
                          <div className="mt-1">
                            <p className="text-[10px] xs:text-xs font-medium text-java-600 mb-0.5 xs:mb-1">Premium Quality</p>
                            <p className="text-[10px] xs:text-xs text-gray-600 line-clamp-1">Handcrafted with genuine materials.</p>
                          </div>
                        ) : (
                          <div>
                            {/* Available Sizes */}
                            {availableSizes.length > 0 && (
                              <div className="mt-1">
                                <p className="text-[10px] xs:text-xs font-medium text-java-600 mb-0.5 xs:mb-1">AVAILABLE SIZES:</p>
                                <div className="flex flex-wrap gap-1 xs:gap-1.5">
                                  {availableSizes.map(size => (
                                    <span key={size} className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">
                                      {size}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Available Colors */}
                            {product.colors && product.colors.length > 0 && (
                              <div className="mt-2">
                                <p className="text-[10px] xs:text-xs font-medium text-java-600 mb-0.5 xs:mb-1">AVAILABLE COLORS:</p>
                                <div className="flex flex-wrap gap-1 xs:gap-1.5">
                                  {product.colors.map(color => (
                                    <span 
                                      key={color} 
                                      className="inline-block w-5 h-5 xs:w-6 xs:h-6 rounded-full border border-gray-200 hover:border-java-200 transition-all cursor-pointer"
                                      style={{ backgroundColor: color.toLowerCase() }}
                                      title={color}
                                    ></span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Add to Cart Button */}
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="w-full mt-3 py-1.5 xs:py-2 px-2 xs:px-3 bg-java-500 text-white text-xs xs:text-sm font-medium rounded-full shadow-sm hover:bg-java-600 flex items-center justify-center gap-1 xs:gap-1.5 transition-colors"
                          aria-label="Add to cart"
                        >
                          <ShoppingBagIcon className="h-3 w-3 xs:h-4 xs:w-4" />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Pagination Controls - Modern Style */}
              {pagination.pages > 1 && (
                <div className="mt-10 mb-6">
                  <div className="flex flex-col items-center justify-between space-y-3 sm:flex-row sm:space-y-0">
                    <div className="flex items-center text-xs xs:text-sm text-gray-500">
                      <span>Showing </span>
                      <span className="font-medium text-gray-700 mx-0.5 xs:mx-1">
                        {(pagination.page - 1) * filters.limit + 1}
                      </span>
                      <span>to </span>
                      <span className="font-medium text-gray-700 mx-0.5 xs:mx-1">
                        {Math.min(pagination.page * filters.limit, pagination.total)}
                      </span>
                      <span>of </span>
                      <span className="font-medium text-gray-700 mx-0.5 xs:mx-1">{pagination.total}</span>
                      <span>products</span>
                    </div>
                    
                    <nav className="flex items-center space-x-0.5 xs:space-x-1" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className={`p-1.5 xs:p-2 rounded-full ${pagination.page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                        aria-label="Previous page"
                      >
                        <ChevronLeftIcon className="h-4 w-4 xs:h-5 xs:w-5" aria-hidden="true" />
                      </button>
                      
                      {/* Page Numbers - Simplified */}
                      <div className="flex items-center">
                        {[...Array(pagination.pages)].map((_, i) => {
                          const pageNum = i + 1;
                          // Show fewer page numbers for simplicity
                          const showPageNum = pageNum === 1 || 
                                            pageNum === pagination.pages || 
                                            Math.abs(pageNum - pagination.page) <= 1;
                          
                          if (!showPageNum) {
                            if (pageNum === 2 || pageNum === pagination.pages - 1) {
                              return (
                                <span key={`ellipsis-${pageNum}`} className="px-0.5 xs:px-1 text-xs xs:text-sm text-gray-400">
                                ...
                              </span>
                              );
                            }
                            return null;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-xs xs:text-sm ${pageNum === pagination.page ? 'bg-java-500 text-white font-medium shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`}
                              aria-current={pageNum === pagination.page ? 'page' : undefined}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className={`p-1.5 xs:p-2 rounded-full ${pagination.page === pagination.pages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                        aria-label="Next page"
                      >
                        <ChevronRightIcon className="h-4 w-4 xs:h-5 xs:w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Shop