import React, { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useCart from '../hooks/useCart'
import useAuth from '../hooks/useAuth'
import useWishlist from '../hooks/useWishlist'
import Button from '../components/Common/Button'
import productImages from '../assets/product-images'
import { toast } from 'react-toastify'
import api from '../utils/api'
import Image from '../components/Common/Image'

const ProductDetail = () => {
  const { slug } = useParams()
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showSizeChart, setShowSizeChart] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const imageRef = useRef(null)
  const sizeChartRef = useRef(null)
  const [userRating, setUserRating] = useState(0)
  const [userReview, setUserReview] = useState('')
  
    // Extract unique sizes and colors from variants
  const getUniqueVariantAttributes = () => {
    if (!product || !product.variants || !Array.isArray(product.variants) || product.variants.length === 0) {
      return { sizes: [], colors: [] };
    }
    
    const sizes = [];
    const colors = [];
    
    product.variants.forEach(variant => {
      if (variant.attributes) {
        if (variant.attributes.size && !sizes.includes(variant.attributes.size)) {
          sizes.push(variant.attributes.size);
        }
        if (variant.attributes.color && !colors.includes(variant.attributes.color)) {
          colors.push(variant.attributes.color);
        }
      }
    });
    
    return { sizes, colors };
  };
  
  // Get variant by selected attributes
  const getSelectedVariant = () => {
    if (!product || !product.variants || !Array.isArray(product.variants) || product.variants.length === 0) {
      return null;
    }
    
    return product.variants.find(variant => 
      variant.attributes && 
      variant.attributes.size === selectedSize && 
      variant.attributes.color === selectedColor
    ) || product.variants[0]; // Fallback to first variant if no match
  };
  
  // Check if a specific variant is in stock
  const isVariantInStock = (size, color) => {
    if (!product || !product.variants || !Array.isArray(product.variants) || product.variants.length === 0) {
      return false;
    }
    
    const variant = product.variants.find(v => 
      v.attributes && 
      v.attributes.size === size && 
      v.attributes.color === color
    );
    
    return variant && variant.stock > 0;
  };
  
  // Toggle size chart visibility
  const toggleSizeChart = () => {
    setShowSizeChart(prev => !prev)
  }
  
  // Handle image zoom
  const handleImageZoom = (e) => {
    if (!imageRef.current) return
    
    const { left, top, width, height } = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    
    setZoomPosition({ x, y })
  }
  
  // Toggle zoom state
  const toggleZoom = () => {
    setIsZoomed(prev => !prev)
    if (isZoomed) {
      document.body.style.overflow = 'auto'
    } else {
      document.body.style.overflow = 'hidden'
    }
  }
  
  // Close size chart when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sizeChartRef.current && !sizeChartRef.current.contains(event.target) && showSizeChart) {
        setShowSizeChart(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSizeChart])
  
  // State for review images
  const [reviewImages, setReviewImages] = useState([])
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  
  // Handle review image upload
  const handleReviewImageChange = (e) => {
    const files = Array.from(e.target.files)
    
    // Validate file types
    const validFiles = files.filter(file => {
      const fileType = file.type.split('/')[0]
      return fileType === 'image'
    })
    
    // Validate file count
    if (reviewImages.length + validFiles.length > 5) {
      toast.error('You can upload maximum 5 images')
      return
    }
    
    // Create preview URLs for valid files
    const newImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))
    
    setReviewImages(prev => [...prev, ...newImages])
  }
  
  // Remove review image
  const removeReviewImage = (index) => {
    setReviewImages(prev => {
      const newImages = [...prev]
      // Revoke object URL to avoid memory leaks
      URL.revokeObjectURL(newImages[index].preview)
      newImages.splice(index, 1)
      return newImages
    })
  }
  
  // Submit review handler
  const submitReview = async () => {
    if (userRating === 0) {
      toast.error('Please select a rating')
      return
    }
    
    if (userReview.trim() === '') {
      toast.error('Please write a review')
      return
    }
    
    if (!isAuthenticated) {
      toast.error('Please log in to submit a review')
      return
    }
    
    if (!product || !product._id) {
      toast.error('Product information is missing')
      return
    }
    
    try {
      setIsSubmittingReview(true)
      
      // Create form data for API request
      const formData = new FormData()
      formData.append('productId', product._id)
      formData.append('rating', userRating)
      formData.append('review', userReview)
      
      // Append images if any
      reviewImages.forEach(img => {
        formData.append('images', img.file)
      })
      
      // Send review to backend
      const response = await api.post('/reviews', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
          // The Authorization header will be automatically added by the API interceptor
        }
      })
      
      if (response.data.success) {
        toast.success('Thank you for your review!')
        
        // Reset the form
        setUserRating(0)
        setUserReview('')
        
        // Clear images and revoke object URLs
        reviewImages.forEach(img => URL.revokeObjectURL(img.preview))
        setReviewImages([])
        
        // Refresh reviews
        if (product && product._id) {
          fetchProductReviews(product._id, 1, 'all')
            .then(result => {
              console.log('Reviews refreshed after submission:', result)
              // Reset filter to show all reviews including the new one
              setReviewsFilter('all')
              setReviewsPage(1)
            })
            .catch(err => {
              console.error('Error refreshing reviews after submission:', err)
            })
        }
      } else {
        toast.error(response.data.message || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      const errorMessage = error.response?.data?.message || 'Failed to submit review'
      toast.error(errorMessage)
    } finally {
      setIsSubmittingReview(false)
    }
  }
  
  // Static products data
  const staticProducts = [
    {
      _id: '1',
      title: 'Classic White Tee',
      price: 29.99,
      salePrice: null,
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80'],
      category: 'women',
      slug: 'classic-white-tee',
      description: 'A comfortable white t-shirt for everyday wear.',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['White', 'Black', 'Gray'],
      inventoryCount: 100,
      categories: [{ _id: 'women', name: 'Women' }]
    },
    {
      _id: '2',
      title: 'Slim Fit Jeans',
      price: 59.99,
      salePrice: 49.99,
      images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80'],
      category: 'men',
      slug: 'slim-fit-jeans',
      description: 'Stylish slim fit jeans for a modern look.',
      sizes: ['28', '30', '32', '34', '36'],
      colors: ['Blue', 'Black', 'Gray'],
      inventoryCount: 75,
      categories: [{ _id: 'men', name: 'Men' }]
    },
    {
      _id: '3',
      title: 'Summer Dress',
      price: 49.99,
      salePrice: null,
      images: ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80'],
      category: 'women',
      slug: 'summer-dress',
      description: 'Light and airy summer dress for hot days.',
      sizes: ['XS', 'S', 'M', 'L'],
      colors: ['Floral', 'Blue', 'Pink'],
      inventoryCount: 50,
      categories: [{ _id: 'women', name: 'Women' }]
    },
    {
      _id: '4',
      title: 'Leather Wallet',
      price: 39.99,
      salePrice: 34.99,
      images: ['https://images.unsplash.com/photo-1517254797898-ee1bd9c0115b?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80'],
      category: 'accessories',
      slug: 'leather-wallet',
      description: 'Genuine leather wallet with multiple compartments.',
      sizes: ['One Size'],
      colors: ['Brown', 'Black'],
      inventoryCount: 120,
      categories: [{ _id: 'accessories', name: 'Accessories' }]
    }
  ]
  
  // Product data and loading state
  const [product, setProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [isRelatedLoading, setIsRelatedLoading] = useState(true)
  
  // Reviews state
  const [reviews, setReviews] = useState([])
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    rating5: 0,
    rating4: 0,
    rating3: 0,
    rating2: 0,
    rating1: 0
  })
  const [isReviewsLoading, setIsReviewsLoading] = useState(true)
  const [reviewsPage, setReviewsPage] = useState(1)
  const [reviewsLimit] = useState(5)
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1)
  const [reviewsFilter, setReviewsFilter] = useState('all')
  
  // Fetch reviews for a product
  const fetchProductReviews = async (productId, page = 1, filter = 'all') => {
    return new Promise(async (resolve, reject) => {
      if (!productId) {
        setIsReviewsLoading(false)
        return reject(new Error('Product ID is required'))
      }
      
      setIsReviewsLoading(true)
      
      try {
        // Build query parameters
        const params = new URLSearchParams()
        params.append('page', page)
        params.append('limit', reviewsLimit)
        
        // Add sorting - newest first by default
        params.append('sort', 'createdAt')
        params.append('order', 'desc')
        
        // Add filter based on type
        if (filter !== 'all') {
          if (filter === 'with_photos') {
            params.append('with_photos', 'true') // Changed from 'has_images' to 'with_photos' to match filter button
          } else if (filter === 'recent') {
            // Already sorted by newest first
          } else if (filter === 'highest_rated') {
            params.set('sort', 'rating')
            params.set('order', 'desc')
          } else if (filter === 'lowest_rated') {
            params.set('sort', 'rating')
            params.set('order', 'asc')
          } else if (!isNaN(parseInt(filter))) {
            params.append('rating', parseInt(filter))
          }
        }
        
        const url = `/reviews/product/${productId}?${params.toString()}`
        console.log('Fetching reviews with URL:', url)
        
        const response = await api.get(url)
        
        if (response.data && response.data.success && response.data.data) {
          const { reviews: fetchedReviews, stats, pagination } = response.data.data
          
          setReviews(fetchedReviews)
          setReviewStats(stats)
          setReviewsTotalPages(pagination.pages || 1)
          
          // Log for debugging
          console.log('Fetched reviews:', fetchedReviews.length)
          console.log('Review stats:', stats)
          
          setIsReviewsLoading(false)
          return resolve({ fetchedReviews, stats, pagination })
        } else {
          setIsReviewsLoading(false)
          return reject(new Error('Invalid response format'))
        }
      } catch (error) {
        console.error('Error fetching reviews:', error)
        // If API fails, use empty reviews
        setReviews([])
        setReviewStats({
          averageRating: 0,
          totalReviews: 0,
          rating5: 0,
          rating4: 0,
          rating3: 0,
          rating2: 0,
          rating1: 0
        })
        setReviewsTotalPages(1)
        
        // Show error toast
        toast.error('Failed to load reviews. Please try again.')
        
        setIsReviewsLoading(false)
        return reject(error)
      }
    })
  }
  
  // Handle review filter change
  const handleReviewFilterChange = (filter) => {
    // If already on this filter, do nothing
    if (filter === reviewsFilter) return;
    
    // Update filter state
    setReviewsFilter(filter)
    
    // Reset to first page when filter changes
    setReviewsPage(1) 
    
    // Show loading state
    setIsReviewsLoading(true)
    
    // Fetch reviews with new filter
    if (product && product._id) {
      // Add a small delay for better UX
      setTimeout(() => {
        fetchProductReviews(product._id, 1, filter)
          .then(result => {
            console.log('Filter applied successfully:', filter, result)
          })
          .catch(err => {
            console.error('Error applying filter:', err)
            toast.error('Failed to apply filter. Please try again.')
          })
      }, 300)
    } else {
      // If no product ID, end loading state
      setIsReviewsLoading(false)
      toast.error('Product information is missing')
    }
    
    // Log for debugging
    console.log('Filter changed to:', filter)
  }
  
  // Handle review pagination
  const handleReviewPageChange = (newPage) => {
    if (newPage < 1 || newPage > reviewsTotalPages) return
    
    setReviewsPage(newPage)
    if (product && product._id) {
      setIsReviewsLoading(true)
      fetchProductReviews(product._id, newPage, reviewsFilter)
        .then(result => {
          console.log('Page changed successfully:', newPage, result)
        })
        .catch(err => {
          console.error('Error changing page:', err)
          toast.error('Failed to load reviews for this page. Please try again.')
        })
    } else {
      toast.error('Product information is missing')
    }
  }
  
  // Fetch product based on slug
  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // First try to fetch from backend API
        try {
          const response = await api.get(`/products/${slug}`)
          console.log('Product API response:', response)         
          if (response.data && response.data.success && response.data.data && response.data.data.product) {
            const foundProduct = response.data.data.product
            setProduct(foundProduct)
            
            // Set initial size and color if variants exist
            if (foundProduct.variants && foundProduct.variants.length > 0 && foundProduct.variants[0].attributes) {
              if (foundProduct.variants[0].attributes.size) {
                setSelectedSize(foundProduct.variants[0].attributes.size)
              }
              if (foundProduct.variants[0].attributes.color) {
                setSelectedColor(foundProduct.variants[0].attributes.color)
              }
            }
            
            // Fetch reviews for the product
            if (foundProduct._id) {
              fetchProductReviews(foundProduct._id, reviewsPage, reviewsFilter)
                .then(result => {
                  console.log('Reviews fetched successfully:', result)
                })
                .catch(err => {
                  console.error('Error fetching reviews:', err)
                })
            }
            
            // Fetch related products
            try {
              // Check if category exists and is a valid string (not undefined)
              let relatedResponse;
              if (foundProduct.category && typeof foundProduct.category === 'string' && foundProduct.category.length === 24) {
                // Only use category in query if it exists and looks like a valid ObjectId (24 hex chars)
                relatedResponse = await api.get(`/products?category=${foundProduct.category}&limit=4`);
              } else {
                // If category is invalid or undefined, fetch products without category filter
                relatedResponse = await api.get(`/products?limit=4`);
              }
              
              if (relatedResponse.data && relatedResponse.data.success && relatedResponse.data.data && relatedResponse.data.data.products) {
                const related = relatedResponse.data.data.products
                  .filter(p => p._id !== foundProduct._id)
                  .slice(0, 4)
                setRelatedProducts(related)
              }
            } catch (relatedErr) {
              console.error('Error fetching related products:', relatedErr)
              // Fallback to static related products if available
              const related = staticProducts
                .filter(p => p.category === foundProduct.category && p._id !== foundProduct._id)
                .slice(0, 4)
              setRelatedProducts(related)
            }
            
            return // Exit if we successfully got the product from API
          }
        } catch (apiErr) {
          console.error('API fetch error:', apiErr)
          // Continue to fallback if API fetch fails
        }
        
        // Fallback to static products if API fails
        const foundProduct = staticProducts.find(p => p.slug === slug)
        
        if (foundProduct) {
          setProduct(foundProduct)
          
          // Find related products (same category)
          const related = staticProducts
            .filter(p => p.category === foundProduct.category && p._id !== foundProduct._id)
            .slice(0, 4) // Maximum 4 products
          
          setRelatedProducts(related)
        } else {
          setError('Product not found')
        }
      } catch (err) {
        console.error('Error loading product:', err)
        setError('Error loading product')
      } finally {
        setIsLoading(false)
        setIsRelatedLoading(false)
      }
    }
    
    fetchProduct()
  }, [slug, reviewsPage, reviewsLimit, reviewsFilter])
  
  // Handle quantity change
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value)
    if (value > 0) {
      setQuantity(value)
    }
  }
  
  // Increment quantity
  const incrementQuantity = () => {
    setQuantity(prev => prev + 1)
  }
  
  // Decrement quantity
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }
  
  // Handle add to cart
  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.warning('Please select a size', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
      return
    }
    
    if (!selectedColor) {
      toast.warning('Please select a color', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
      return
    }
    
    // Get the selected variant
    const selectedVariant = getSelectedVariant();
    
    // Check if selected variant is in stock
    if (!selectedVariant || selectedVariant.stock <= 0) {
      toast.error('This product variant is out of stock', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
      return
    }
    
    // Create product object with selected variant details
    const productToAdd = {
      id: product._id,
      name: product.title,
      price: selectedVariant.price ? parseFloat(selectedVariant.price) : 0,
      image: product.images && Array.isArray(product.images) && product.images.length > 0 ? product.images[0].trim().replace(/`/g, '') : '/image_default.png',
      variantId: selectedVariant._id,
      sku: selectedVariant.sku,
      variantSku: selectedVariant.sku, // Explicitly set variantSku to match the backend expectation
      variant: selectedVariant, // Include the full variant object for reference
      size: selectedSize,
      color: selectedColor
    }
    
    // Call addToCart with separate parameters as expected by the function
    addToCart(productToAdd, quantity, selectedSize, selectedColor)
    
    // Open cart sidebar automatically
    document.dispatchEvent(new CustomEvent('openCart'))
  }
  
  // Wishlist handler

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to add items to your wishlist', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
      return
    }
    
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id)
      toast.info(`${product.title} removed from wishlist!`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
    } else {
      addToWishlist({
        id: product._id,
        name: product.title,
        price: product.variants && product.variants.length > 0 && product.variants[0].price ? parseFloat(product.variants[0].price) : 0,
        image: product.images && Array.isArray(product.images) && product.images.length > 0 ? product.images[0].trim().replace(/`/g, '') : '/image_default.png',
        slug: product.slug
      })
      toast.success(`${product.title} added to wishlist!`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
    }
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-200 animate-pulse h-[600px] rounded-lg"></div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 animate-pulse rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 animate-pulse rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 animate-pulse rounded w-full mt-8"></div>
            <div className="h-4 bg-gray-200 animate-pulse rounded w-full"></div>
            <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4"></div>
            <div className="h-10 bg-gray-200 animate-pulse rounded w-full mt-8"></div>
            <div className="h-10 bg-gray-200 animate-pulse rounded w-full"></div>
          </div>
        </div>
      </div>
    )
  }
  
  // Error state
  if (error) {
    return (
      <div className="container-custom py-12">
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <h2 className="text-xl font-semibold mb-2">Error Loading Product</h2>
          <p>We couldn't load the product details. Please try again later.</p>
          <Link to="/shop" className="inline-block mt-4">
            <Button variant="secondary">Return to Shop</Button>
          </Link>
        </div>
      </div>
    )
  }
  
  // If product not found
  if (!product) {
    return (
      <div className="container-custom py-12">
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <h2 className="text-2xl font-semibold mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Link to="/shop">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white py-6">
      <div className="container-custom">
        {/* Breadcrumbs */}
        <nav className="flex mb-4 text-sm">
          <Link to="/" className="text-gray-500 hover:text-pink-500 transition-colors">Home</Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link to="/shop" className="text-gray-500 hover:text-pink-500 transition-colors">Shop</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-700 font-medium">{product.title}</span>
        </nav>
        
        <div className="bg-white overflow-hidden mb-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8">
            {/* Product Images - Left Side */}
            <div className="md:col-span-7 relative">
              {/* Main Image Slider - Myntra Style */}
              <div className="relative overflow-hidden mb-3 group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                {product.salePrice && product.salePrice < product.price && (
                  <div className="absolute top-4 left-4 z-10 bg-java-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                    {Math.round((1 - product.salePrice / product.price) * 100)}% OFF
                  </div>
                )}
                
                {/* Mobile Swipeable Gallery */}
                <div 
                  className="relative w-full overflow-hidden rounded-lg border border-java-100 touch-pan-y"
                >
                  {/* Main Image Container with Swipe Functionality */}
                  <div 
                      ref={imageRef}
                     className={`relative w-full overflow-auto ${isZoomed ? 'cursor-zoom-out' : 'cursor-default'}`}
                     onMouseMove={isZoomed ? handleImageZoom : undefined}
                    >
                      {/* Mobile View - Horizontal Slider */}
                      <div 
                        className="md:hidden w-full min-h-[400px] overflow-x-auto flex snap-x snap-mandatory scroll-smooth"
                        onScroll={(e) => {
                          // Update selectedImageIndex based on scroll position
                          if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                            const slider = e.currentTarget;
                            const slideWidth = slider.offsetWidth;
                            const scrollLeft = slider.scrollLeft;
                            const index = Math.round(scrollLeft / slideWidth);
                            if (index !== selectedImageIndex && index >= 0 && index < product.images.length) {
                              setSelectedImageIndex(index);
                            }
                          }
                        }}
                      >
                        {product.images && Array.isArray(product.images) && product.images.map((image, index) => (
                          <div key={index} className="flex-shrink-0 w-full snap-center p-2 flex items-center justify-center">
                            <Image 
                              src={image ? image.trim().replace(/`/g, '') : null} 
                              alt={`${product.title} view ${index + 1}`} 
                              fallbackSrc="/image_default.png"
                              className="w-full object-contain hover:scale-105 transition-transform duration-300 p-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImageIndex(index);
                                toggleZoom();
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      
                      {/* Desktop View - Grid Layout */}
                      <div className="hidden md:grid grid-cols-2 gap-4 p-3 w-full">
                        {product.images && Array.isArray(product.images) && product.images.map((image, index) => (
                          <div key={index} className="relative rounded-lg overflow-hidden border-2 border-java-200 shadow-md hover:shadow-lg transition-all duration-300">
                            <Image 
                              src={image ? image.trim().replace(/`/g, '') : null} 
                              alt={`${product.title} view ${index + 1}`} 
                              fallbackSrc="/image_default.png"
                              className="w-full object-contain hover:scale-105 transition-transform duration-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImageIndex(index);
                                toggleZoom();
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    {isZoomed && (
                      <div 
                        className="absolute inset-0 bg-white z-20"
                        style={{
                          backgroundImage: `url(${product.images && Array.isArray(product.images) && product.images.length > 0 
                            ? product.images[selectedImageIndex].trim().replace(/`/g, '') // Remove backticks and trim whitespace
                            : '/image_default.png'})`,
                          backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                          backgroundSize: '150%',
                          backgroundRepeat: 'no-repeat'
                        }}
                        onClick={toggleZoom}
                      />
                    )}
                    
                    {/* Fullscreen button for mobile */}
                    <button 
                      className="absolute bottom-4 right-4 bg-java-50 hover:bg-java-100 p-3 rounded-full shadow-md transition-all duration-300 border border-java-200 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleZoom();
                      }}
                      aria-label="Zoom image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-java-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </button>
                  
                    {/* Mobile Pagination Indicators */}
                    <div className="md:hidden absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-10">
                      {product.images && Array.isArray(product.images) && product.images.map((_, index) => (
                        <button
                          key={index}
                          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === selectedImageIndex ? 'bg-java-500 w-4' : 'bg-gray-300'}`}
                          onClick={() => {
                            setSelectedImageIndex(index);
                            // Scroll to this image in the slider
                            const slider = document.querySelector('.snap-x');
                            if (slider) {
                              const slideWidth = slider.offsetWidth;
                              slider.scrollTo({ left: slideWidth * index, behavior: 'smooth' });
                            }
                          }}
                          aria-label={`View image ${index + 1}`}
                        />
                      ))}
                    </div>
                    
                    {/* Navigation Arrows for Mobile */}
                    {product.images && Array.isArray(product.images) && product.images.length > 1 && (
                      <div className="md:hidden absolute inset-y-0 left-0 right-0 flex justify-between items-center px-2 z-10">
                        <button
                          className="bg-white/70 hover:bg-white p-1.5 rounded-full shadow-md transition-all duration-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newIndex = selectedImageIndex === 0 ? product.images.length - 1 : selectedImageIndex - 1;
                            setSelectedImageIndex(newIndex);
                            // Scroll to this image in the slider
                            const slider = document.querySelector('.snap-x');
                            if (slider) {
                              const slideWidth = slider.offsetWidth;
                              slider.scrollTo({ left: slideWidth * newIndex, behavior: 'smooth' });
                            }
                          }}
                          aria-label="Previous image"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          className="bg-white/70 hover:bg-white p-1.5 rounded-full shadow-md transition-all duration-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newIndex = selectedImageIndex === product.images.length - 1 ? 0 : selectedImageIndex + 1;
                            setSelectedImageIndex(newIndex);
                            // Scroll to this image in the slider
                            const slider = document.querySelector('.snap-x');
                            if (slider) {
                              const slideWidth = slider.offsetWidth;
                              slider.scrollTo({ left: slideWidth * newIndex, behavior: 'smooth' });
                            }
                          }}
                          aria-label="Next image"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={handleWishlist}
                  disabled={!isAuthenticated}
                  className="absolute top-4 right-4 z-10 bg-white p-2 rounded-full shadow-sm transition-all duration-300 hover:shadow-md"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-6 w-6 ${isInWishlist(product._id) ? 'text-pink-500 fill-pink-500' : 'text-gray-400'}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
              
              {/* No thumbnail gallery needed as all images are displayed in the main grid */}
            </div>
            
            {/* Product Info - Right Side */}
            <div className="md:col-span-5 flex flex-col">
              {/* Brand & Title */}
              <div className="mb-3 sm:mb-4">
                <div className="text-gray-500 text-sm mb-1">BEEGET FASHION</div>
                <h1 className="text-xl sm:text-2xl font-medium text-gray-900 mb-2">{product.title}</h1>
                
                {/* Ratings */}
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => {
                      // Determine color based on rating
                      const rating = reviewStats.averageRating || 0;
                      let starColor = '';
                      if (rating >= 4) starColor = 'text-green-500';
                      else if (rating >= 3) starColor = 'text-yellow-500';
                      else if (rating > 0) starColor = 'text-red-500';
                      else starColor = 'text-yellow-400'; // Default color when no ratings
                      
                      return (
                        <svg 
                          key={i} 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${i < Math.floor(rating) ? starColor : 'text-gray-300'}`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      );
                    })}
                  </div>
                  <span className="text-gray-500 ml-2 text-xs sm:text-sm">
                    {reviewStats.averageRating ? reviewStats.averageRating.toFixed(1) : '0.0'} | {reviewStats.totalReviews || 0} Ratings
                  </span>
                </div>
                
                {/* Price */}
                <div className="flex items-baseline mb-3 sm:mb-4">
                  {product.variants && product.variants.length > 0 ? (
                    <>
                      <span className="text-xl sm:text-2xl font-semibold text-gray-900">
                        ₹{getSelectedVariant() && getSelectedVariant().price 
                          ? parseFloat(getSelectedVariant().price).toFixed(2) 
                          : '0.00'}
                      </span>
                      {/* No sale price in the API response, so we're just showing the regular price */}
                    </>
                  ) : (
                    <span className="text-xl sm:text-2xl font-semibold text-gray-900">₹0.00</span>
                  )}
                </div>

                {/* Inclusive of all taxes */}
                <div className="text-xs text-gray-500 mb-4">Inclusive of all taxes</div>
                
                {/* Stock Status */}
                <div className="mb-4">
                  {getSelectedVariant() && getSelectedVariant().stock > 10 ? (
                    <span className="text-green-600 font-medium text-sm">In Stock</span>
                  ) : getSelectedVariant() && getSelectedVariant().stock > 0 ? (
                    <span className="text-orange-600 font-medium text-sm">Only {getSelectedVariant().stock} left!</span>
                  ) : (
                    <span className="text-red-600 font-medium text-sm">Out of Stock</span>
                  )}
                </div>
              </div>
              
              {/* Options Selection */}
              <div className="space-y-6 mb-6">
                {/* Size Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900">SELECT SIZE</h3>
                    <button 
                      onClick={toggleSizeChart} 
                      className="text-sm font-medium text-java-500 hover:text-java-600 bg-transparent border-0 p-0 cursor-pointer flex items-center"
                    >
                      <span>Size Chart</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Size Chart Offcanvas */}
                  <AnimatePresence>
                    {showSizeChart && (
                      <>
                        <motion.div 
                          className="fixed inset-0 bg-black bg-opacity-50 z-50"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={toggleSizeChart}
                        />
                        <motion.div 
                          ref={sizeChartRef}
                          className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 overflow-y-auto shadow-xl"
                          initial={{ x: '100%' }}
                          animate={{ x: 0 }}
                          exit={{ x: '100%' }}
                          transition={{ type: 'tween' }}
                        >
                          <div className="p-6">
                            <div className="flex justify-between items-center mb-6 border-b border-java-100 pb-4">
                              <h2 className="text-xl font-medium text-java-800">Size Chart</h2>
                              <button 
                                onClick={toggleSizeChart}
                                className="text-java-500 hover:text-java-700 bg-java-50 hover:bg-java-100 rounded-full p-2 transition-colors duration-200"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            
                            <div className="border border-java-200 rounded-lg overflow-hidden mb-6 shadow-sm">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-java-50">
                                    <th className="py-3 px-4 border-b border-java-100 text-left font-medium text-java-800">Size</th>
                                    <th className="py-3 px-4 border-b border-java-100 text-left font-medium text-java-800">Chest (in)</th>
                                    <th className="py-3 px-4 border-b border-java-100 text-left font-medium text-java-800">Waist (in)</th>
                                    <th className="py-3 px-4 border-b border-java-100 text-left font-medium text-java-800">Hips (in)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="hover:bg-java-50 transition-colors duration-150">
                                    <td className="py-3 px-4 border-b border-java-100 font-medium">XS</td>
                                    <td className="py-3 px-4 border-b border-java-100">31-32</td>
                                    <td className="py-3 px-4 border-b border-java-100">24-25</td>
                                    <td className="py-3 px-4 border-b border-java-100">34-35</td>
                                  </tr>
                                  <tr className="hover:bg-java-50 transition-colors duration-150">
                                    <td className="py-3 px-4 border-b border-java-100 font-medium">S</td>
                                    <td className="py-3 px-4 border-b border-java-100">33-34</td>
                                    <td className="py-3 px-4 border-b border-java-100">26-27</td>
                                    <td className="py-3 px-4 border-b border-java-100">36-37</td>
                                  </tr>
                                  <tr className="hover:bg-java-50 transition-colors duration-150">
                                    <td className="py-3 px-4 border-b border-java-100 font-medium">M</td>
                                    <td className="py-3 px-4 border-b border-java-100">35-36</td>
                                    <td className="py-3 px-4 border-b border-java-100">28-29</td>
                                    <td className="py-3 px-4 border-b border-java-100">38-39</td>
                                  </tr>
                                  <tr className="hover:bg-java-50 transition-colors duration-150">
                                    <td className="py-3 px-4 border-b border-java-100 font-medium">L</td>
                                    <td className="py-3 px-4 border-b border-java-100">37-38</td>
                                    <td className="py-3 px-4 border-b border-java-100">30-31</td>
                                    <td className="py-3 px-4 border-b border-java-100">40-41</td>
                                  </tr>
                                  <tr className="hover:bg-java-50 transition-colors duration-150">
                                    <td className="py-3 px-4 font-medium">XL</td>
                                    <td className="py-3 px-4">39-40</td>
                                    <td className="py-3 px-4">32-33</td>
                                    <td className="py-3 px-4">42-43</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            
                            <div className="mb-6 bg-java-50 p-4 rounded-lg border border-java-100">
                              <h3 className="font-medium mb-3 text-java-800">How to Measure</h3>
                              <ul className="list-disc pl-5 space-y-3 text-sm text-gray-700">
                                <li><span className="font-medium text-java-700">Chest:</span> Measure around the fullest part of your chest, keeping the measuring tape horizontal.</li>
                                <li><span className="font-medium text-java-700">Waist:</span> Measure around your natural waistline, keeping the tape comfortably loose.</li>
                                <li><span className="font-medium text-java-700">Hips:</span> Measure around the fullest part of your hips, about 8 inches below your waist.</li>
                              </ul>
                            </div>
                            
                            <div className="text-sm bg-java-100 p-4 rounded-lg text-java-800 flex items-start">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-java-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p>If you're between sizes, we recommend sizing up for a more comfortable fit.</p>
                            </div>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                  <div className="flex flex-wrap gap-2">
                    {/* Display available sizes based on variants */}
                    {product.variants && product.variants.length > 0 ? (
                      getUniqueVariantAttributes().sizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          className={`flex items-center justify-center h-10 w-10 text-sm font-medium rounded-full transition-all duration-200 
                            ${selectedSize === size 
                              ? 'bg-java-500 text-white border-2 border-java-500 shadow-sm' 
                              : 'bg-white text-gray-900 border border-gray-300 hover:border-java-400 hover:shadow-sm'}
                            ${!isVariantInStock(size, selectedColor) ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                          onClick={() => isVariantInStock(size, selectedColor) && setSelectedSize(size)}
                          disabled={!isVariantInStock(size, selectedColor)}
                        >
                          {size}
                        </button>
                      ))
                    ) : (
                      // Fallback to default sizes if no variants with size attribute
                      ['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                        <button
                          key={size}
                          type="button"
                          className={`flex items-center justify-center h-10 w-10 text-sm font-medium rounded-full transition-all duration-200 ${selectedSize === size 
                            ? 'bg-java-500 text-white border-2 border-java-500 shadow-sm' 
                            : 'bg-white text-gray-900 border border-gray-300 hover:border-java-400 hover:shadow-sm'}`}
                          onClick={() => setSelectedSize(size)}
                        >
                          {size}
                        </button>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Color Selection */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">SELECT COLOR</h3>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-3">
                    {/* Display available colors based on variants */}
                    {product.variants && product.variants.length > 0 ? (
                      getUniqueVariantAttributes().colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`relative flex items-center justify-center h-9 sm:h-10 px-2 sm:px-3 rounded-md border transition-all duration-200 
                            ${selectedColor === color 
                              ? 'border-java-500 bg-java-50 text-java-700 shadow-sm' 
                              : 'border-gray-300 bg-white text-gray-700 hover:border-java-300 hover:bg-java-50/30'}
                            ${!isVariantInStock(selectedSize, color) ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                          onClick={() => isVariantInStock(selectedSize, color) && setSelectedColor(color)}
                          disabled={!isVariantInStock(selectedSize, color)}
                          aria-label={`Select ${color} color`}
                        >
                          <span className={`inline-block h-4 w-4 sm:h-5 sm:w-5 rounded-full mr-1.5 sm:mr-2 border border-gray-300 shadow-inner`} style={{backgroundColor: color.toLowerCase()}}></span>
                          <span className="text-xs font-medium">{color}</span>
                        </button>
                      ))
                    ) : (
                      // Fallback to default colors if no variants with color attribute
                      [
                        { name: 'White', class: 'bg-white' },
                        { name: 'Black', class: 'bg-black' },
                        { name: 'Java', class: 'bg-java-400' },
                        { name: 'Navy', class: 'bg-blue-900' },
                        { name: 'Charcoal', class: 'bg-java-800' }
                      ].map((color) => (
                        <button
                          key={color.name}
                          type="button"
                          className={`relative flex items-center justify-center h-9 sm:h-10 px-2 sm:px-3 rounded-md border transition-all duration-200 ${selectedColor === color.name 
                            ? 'border-java-500 bg-java-50 text-java-700 shadow-sm' 
                            : 'border-gray-300 bg-white text-gray-700 hover:border-java-300 hover:bg-java-50/30'}`}
                          onClick={() => setSelectedColor(color.name)}
                          aria-label={`Select ${color.name} color`}
                        >
                          <span className={`inline-block h-4 w-4 sm:h-5 sm:w-5 rounded-full mr-1.5 sm:mr-2 ${color.class} border border-gray-300 shadow-inner`}></span>
                          <span className="text-xs font-medium">{color.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Quantity Selector */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">QUANTITY</h3>
                  <div className="inline-flex items-center border border-java-200 rounded-md overflow-hidden shadow-sm bg-white">
                    <button 
                      type="button" 
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-java-600 hover:bg-java-50 transition-colors"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min="1" 
                      value={quantity} 
                      onChange={handleQuantityChange}
                      className="w-12 h-10 text-center border-x border-java-200 focus:outline-none focus:ring-0 focus:border-java-400 bg-white"
                    />
                    <button 
                      type="button" 
                      className="w-10 h-10 flex items-center justify-center text-java-600 hover:text-java-700 hover:bg-java-50 transition-colors"
                      onClick={incrementQuantity}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Button 
                  fullWidth 
                  onClick={handleAddToCart}
                  disabled={!(product.variants && product.variants.length > 0 && product.variants[0].stock > 0)}
                  className="bg-java-500 hover:bg-java-600 text-white py-3 rounded-md shadow-sm transition-colors duration-300 flex items-center justify-center gap-2 font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {!(product.variants && product.variants.length > 0 && product.variants[0].stock > 0) ? 'OUT OF STOCK' : 'ADD TO BAG'}
                </Button>
                <Button 
                  variant="secondary" 
                  fullWidth
                  onClick={handleWishlist}
                  disabled={!isAuthenticated}
                  className="border border-java-200 hover:border-java-500 text-java-800 hover:text-java-600 py-3 rounded-md shadow-sm transition-colors duration-300 flex items-center justify-center gap-2 font-medium"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 ${isInWishlist(product._id) ? 'text-java-500 fill-java-500' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {isAuthenticated ? (isInWishlist(product._id) ? 'WISHLISTED' : 'WISHLIST') : 'LOGIN TO WISHLIST'}
                </Button>
              </div>
              
              {/* Delivery & Services */}
              <div className="border border-java-200 rounded-lg p-4 sm:p-5 mb-6 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white max-w-full overflow-hidden">
                <h3 className="text-sm sm:text-base font-medium text-java-800 mb-4 sm:mb-5 border-b border-java-100 pb-2 sm:pb-3 flex items-center overflow-hidden">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-java-500 mr-2 sm:mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <span className="truncate">DELIVERY OPTIONS</span>
                </h3>
                
                {/* Pincode Checker - Responsive for all devices */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-5 bg-java-50 p-3 sm:p-4 rounded-lg border border-java-100 hover:border-java-200 transition-all duration-300 overflow-hidden md:flex-wrap md:p-4">
                  <div className="flex items-start w-full">
                    <div className="bg-white p-2 rounded-full shadow-sm mr-3 mt-0.5 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-java-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="w-full min-w-0 overflow-hidden">
                      <label htmlFor="pincode" className="block text-sm sm:text-base font-medium text-java-700 mb-2 sm:mb-3 truncate">Pincode Checker</label>
                      <div className="flex flex-col sm:flex-row items-center md:flex-wrap md:space-y-2">
                        <div className="w-full mb-2 sm:mb-0 sm:mr-3 border-2 border-java-300 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-java-400 focus-within:border-java-400 transition-all duration-200 shadow-sm hover:shadow-md md:min-w-0 md:w-full md:mb-2">
                          <input 
                            id="pincode"
                            type="text" 
                            placeholder="Enter pincode" 
                            className="text-sm sm:text-base py-2.5 sm:py-3 px-3 sm:px-4 w-full border-none bg-transparent focus:outline-none focus:ring-0 text-java-800 placeholder-java-400 font-medium"
                            maxLength="6"
                            pattern="[0-9]*"
                            inputMode="numeric"
                            aria-label="Enter delivery pincode"
                          />
                        </div>
                        <button className="w-full sm:w-auto bg-java-500 hover:bg-java-600 text-white text-sm sm:text-base font-medium px-4 sm:px-5 py-2.5 sm:py-3 transition-colors duration-200 shadow-sm flex items-center justify-center sm:justify-start whitespace-nowrap rounded-lg sm:rounded-md flex-shrink-0 md:mt-0">
                          <span className="truncate">Check</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center mt-2 sm:mt-3 text-java-700 overflow-hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-java-500 mr-1 sm:mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs sm:text-sm truncate">Enter PIN code to check delivery time & Pay on Delivery Availability</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Estimated Delivery Times - New Section */}
                <div className="mb-5 bg-white p-3 sm:p-5 rounded-lg border border-java-100 hover:border-java-200 transition-all duration-300 overflow-hidden md:max-w-full md:p-4">
                  <h4 className="text-sm sm:text-base font-medium text-java-800 mb-3 sm:mb-4 flex items-center md:text-base">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-java-500 mr-2 sm:mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="truncate md:font-semibold">Estimated Delivery Times</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full md:max-w-full md:gap-3">
                    <div className="flex items-center p-3 sm:p-4 rounded-lg border border-java-100 bg-java-50 hover:bg-java-100 transition-all duration-300 overflow-hidden md:flex-grow">
                      <div className="bg-white p-1.5 sm:p-2 rounded-full shadow-sm mr-2 sm:mr-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-java-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1 w-full">
                        <span className="text-xs sm:text-sm font-semibold text-java-800 block mb-0.5 sm:mb-1 truncate md:text-base">Express Delivery</span>
                        <span className="text-xs sm:text-sm text-java-600 block truncate md:text-sm">1-2 business days</span>
                      </div>
                    </div>
                    <div className="flex items-center p-3 sm:p-4 rounded-lg border border-java-100 bg-java-50 hover:bg-java-100 transition-all duration-300 overflow-hidden md:flex-grow">
                      <div className="bg-white p-1.5 sm:p-2 rounded-full shadow-sm mr-2 sm:mr-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-java-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1 w-full">
                        <span className="text-xs sm:text-sm font-semibold text-java-800 block mb-0.5 sm:mb-1 truncate md:text-base">Standard Delivery</span>
                        <span className="text-xs sm:text-sm text-java-600 block truncate md:text-sm">3-5 business days</span>
                      </div>
                    </div>
                  </div>
                </div>
                
            
              </div>
              
              {/* Product Details */}
              <div className="border border-java-200 rounded-lg p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white">
                <h3 className="text-sm font-medium text-java-800 mb-3 sm:mb-4 border-b border-java-100 pb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-java-500 mr-1.5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  PRODUCT DETAILS
                </h3>
                <div className="bg-java-50 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4 border border-java-100">
                  <p className="text-xs sm:text-sm text-java-700 leading-relaxed">{product.description}</p>
                </div>
                
                <div className="text-xs sm:text-sm text-java-700 space-y-3 sm:space-y-4">
                  <div className="bg-white p-3 sm:p-4 rounded-lg border border-java-100 shadow-sm hover:shadow-md transition-all duration-300">
                    <h4 className="font-medium mb-2 sm:mb-3 text-java-800 flex items-center border-b border-java-50 pb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-java-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Material & Care
                    </h4>
                    <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 sm:space-y-2 ml-1 sm:ml-2">
                      <li className="text-java-700">Premium quality fabric</li>
                      <li className="text-java-700">Machine wash as per instructions</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white p-3 sm:p-4 rounded-lg border border-java-100 shadow-sm hover:shadow-md transition-all duration-300">
                    <h4 className="font-medium mb-2 sm:mb-3 text-java-800 flex items-center border-b border-java-50 pb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-java-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                      Country of Origin
                    </h4>
                    <p className="ml-5 sm:ml-7 bg-java-50 inline-block px-2 sm:px-3 py-1 rounded-md text-java-700">India</p>
                  </div>
                  
                  <div className="bg-white p-3 sm:p-4 rounded-lg border border-java-100 shadow-sm hover:shadow-md transition-all duration-300">
                    <h4 className="font-medium mb-2 sm:mb-3 text-java-800 flex items-center border-b border-java-50 pb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-java-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Manufactured By
                    </h4>
                    <p className="ml-5 sm:ml-7 bg-java-50 inline-block px-2 sm:px-3 py-1 rounded-md text-java-700">Beeget Fashion Private Limited</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        

        
        {/* Ratings & Reviews */}
        <div className="mb-8 sm:mb-12 px-3 sm:px-0">
          <h2 className="text-lg sm:text-xl font-medium mb-4 sm:mb-6 text-java-800 border-b border-java-100 pb-2 sm:pb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 mr-1.5 sm:mr-2 text-java-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            RATINGS & REVIEWS
          </h2>
          <div className="bg-white border border-java-200 rounded-lg p-3 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
              {/* Left Column - Mobile Optimized */}
              <div className="lg:w-1/3 lg:border-r lg:border-java-100 lg:pr-8">
                <div className="text-center bg-java-50 p-3 sm:p-6 rounded-lg mb-4 sm:mb-5 shadow-sm">
                  <div className="text-3xl sm:text-5xl font-medium mb-2 sm:mb-3">
                    <span className={`${reviewStats.averageRating >= 4 ? 'text-green-600' : reviewStats.averageRating >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {reviewStats.averageRating ? reviewStats.averageRating.toFixed(1) : '0.0'}
                    </span>
                    <span className="text-lg sm:text-xl text-gray-600">/5</span>
                  </div>
                  <div className="flex justify-center mb-2 sm:mb-3">
                    {[...Array(5)].map((_, i) => {
                      // Determine color based on rating
                      const rating = reviewStats.averageRating || 0;
                      let starColor = '';
                      if (rating >= 4) starColor = 'text-green-500';
                      else if (rating >= 3) starColor = 'text-yellow-500';
                      else starColor = 'text-red-500';
                      
                      return (
                        <svg 
                          key={i} 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-5 w-5 sm:h-6 sm:w-6 ${i < Math.floor(rating) ? starColor : 'text-gray-200'}`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      );
                    })}
                  </div>
                  <div className="text-xs sm:text-sm text-java-600 mb-1 sm:mb-2">
                    <span className="bg-java-100 text-java-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md font-medium">{reviewStats.totalReviews || 0}</span> <span className="ml-1 sm:ml-2">Verified Ratings</span>
                  </div>
                </div>
                
                {/* Rating Breakdown - Mobile Optimized */}
                <div className="space-y-3 sm:space-y-4 bg-white p-4 sm:p-5 rounded-lg border border-java-100 shadow-sm mb-4 sm:mb-5">
                  <h4 className="font-medium text-java-800 text-xs sm:text-sm mb-3 sm:mb-4 flex items-center border-b border-java-50 pb-1.5 sm:pb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-java-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Rating Breakdown
                  </h4>
                  {[5, 4, 3, 2, 1].map((star) => {
                    // Calculate percentage based on reviewStats
                    const getPercentage = (star) => {
                      if (!reviewStats.totalReviews) return 0;
                      const count = reviewStats[`rating${star}`] || 0;
                      return Math.round((count / reviewStats.totalReviews) * 100);
                    };
                    
                    const percentage = getPercentage(star);
                    const count = reviewStats[`rating${star}`] || 0;
                    
                    // Define colors based on rating value
                    const getRatingColor = (rating) => {
                      if (rating >= 4) return "text-green-600";
                      if (rating === 3) return "text-yellow-600";
                      return "text-red-600";
                    };
                    const getBarColor = (rating) => {
                      if (rating >= 4) return "bg-green-500";
                      if (rating === 3) return "bg-yellow-500";
                      return "bg-red-500";
                    };
                    const textColorClass = getRatingColor(star);
                    const barColorClass = getBarColor(star);
                    
                    return (
                      <div key={star} className="flex items-center">
                        <div className="flex items-center w-12 sm:w-14 flex-shrink-0">
                          <span className={`text-xs sm:text-sm font-medium ${textColorClass}`}>{star}</span>
                          <svg className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${textColorClass} ml-1`} viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        <div className="w-full ml-3 sm:ml-4">
                          <div className="h-2.5 sm:h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${barColorClass} rounded-full`} style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                        <div className="flex justify-between w-20 sm:w-24 text-xs font-medium ml-1.5 sm:ml-2">
                          <span className={textColorClass}>{count}</span>
                          <span className={textColorClass}>{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                
                {/* Write a Review - Mobile Optimized */}
                {isAuthenticated ? (
                  <div className="border border-java-200 rounded-lg p-4 sm:p-5 mt-4 sm:mt-6 shadow-sm bg-white">
                    <h3 className="font-medium text-java-800 mb-3 sm:mb-4 border-b border-java-100 pb-1.5 sm:pb-2 flex items-center text-sm sm:text-base">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-java-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Write a Review
                    </h3>
                    <div className="mb-3 sm:mb-4">
                      <label className="block text-xs sm:text-sm font-medium text-java-700 mb-1.5 sm:mb-2">Rating</label>
                      <div className="flex space-x-1 sm:space-x-2 bg-java-50 p-2 sm:p-3 rounded-lg">
                        {[1, 2, 3, 4, 5].map((star) => {
                          // Define color based on rating value
                          const getStarColor = (rating) => {
                            if (rating >= 4) return "text-green-500";
                            if (rating === 3) return "text-yellow-500";
                            return "text-red-500";
                          };
                          
                          return (
                            <button 
                              key={star}
                              type="button"
                              className="text-xl sm:text-2xl focus:outline-none transition-colors duration-200 w-full flex justify-center"
                              onClick={() => setUserRating(star)}
                            >
                              <span className={userRating >= star ? (userRating >= 4 ? 'text-green-500' : userRating >= 3 ? 'text-yellow-500' : 'text-red-500') : 'text-gray-200'}>★</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mb-3 sm:mb-4">
                      <label htmlFor="review" className="block text-xs sm:text-sm font-medium text-java-700 mb-1.5 sm:mb-2">Your Review</label>
                      <textarea
                        id="review"
                        rows="4"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-java-200 rounded-lg shadow-sm focus:outline-none focus:ring-java-500 focus:border-java-500 bg-white text-xs sm:text-sm"
                        placeholder="Share your experience with this product..."
                        value={userReview}
                        onChange={(e) => setUserReview(e.target.value)}
                      ></textarea>
                    </div>
                    
                    {/* Image Upload Section */}
                    <div className="mb-3 sm:mb-4">
                      <label className="block text-xs sm:text-sm font-medium text-java-700 mb-1.5 sm:mb-2">Add Photos (Optional)</label>
                      <div className="bg-java-50 p-2 sm:p-3 rounded-lg border border-java-100">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {reviewImages.map((img, index) => (
                            <div key={index} className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden border border-java-200 bg-white">
                              <img src={img.preview} alt="Review" className="w-full h-full object-cover" />
                              <button 
                                type="button" 
                                className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 focus:outline-none"
                                onClick={() => removeReviewImage(index)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                          
                          {reviewImages.length < 5 && (
                            <label className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center border-2 border-dashed border-java-300 rounded-md cursor-pointer hover:bg-java-50 transition-colors bg-white">
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleReviewImageChange}
                                multiple={reviewImages.length < 4}
                              />
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-java-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </label>
                          )}
                        </div>
                        <p className="text-xs text-java-600 mt-1">Upload up to 5 images (Max 5MB each)</p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      className="w-full bg-java-500 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-md hover:bg-java-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-java-500 shadow-sm font-medium flex items-center justify-center text-sm"
                      onClick={submitReview}
                      disabled={isSubmittingReview}
                    >
                      {isSubmittingReview ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Submit Review
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="border border-java-200 rounded-lg p-4 sm:p-5 text-center mt-4 sm:mt-6 bg-java-50 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-java-400 mb-2 sm:mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-java-700 mb-2 sm:mb-3 text-sm">Please log in to write a review</p>
                    <Link to="/login" className="text-java-600 font-medium hover:text-java-700 transition-colors bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md inline-block border border-java-200 shadow-sm text-sm">
                      Log in
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Right Column - Mobile Optimized */}
              <div className="lg:w-2/3">
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 text-java-800 border-b border-java-100 pb-1.5 sm:pb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-java-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                    Product Reviews
                  </h3>
                  
                  {/* Review Filter - Mobile Optimized */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex justify-between items-center mb-2 sm:mb-3">
                      <h4 className="text-xs sm:text-sm font-medium text-java-700">Filter Reviews</h4>
                      {reviewsFilter !== 'all' && (
                        <button 
                          className="text-xs text-java-600 hover:text-java-800 flex items-center"
                          onClick={() => handleReviewFilterChange('all')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Clear Filters
                        </button>
                      )}
                    </div>
                    
                    <div className="flex overflow-x-auto sm:flex-wrap gap-1.5 sm:gap-2 bg-java-50 p-2 sm:p-3 rounded-lg whitespace-nowrap sm:whitespace-normal scrollbar-hide">
                      {/* Rating Filters */}
                      <div className="flex gap-1.5 sm:gap-2 mr-2 sm:mr-3 border-r border-java-200 pr-2 sm:pr-3">
                        <button 
                          className={`${reviewsFilter === 'all' ? 'bg-java-500 text-white' : 'bg-white text-java-700 hover:bg-java-100'} px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm flex items-center flex-shrink-0 border ${reviewsFilter === 'all' ? '' : 'border-java-200'}`}
                          onClick={() => handleReviewFilterChange('all')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                          All
                        </button>
                        <button 
                          className={`${reviewsFilter === '5' ? 'bg-java-500 text-white' : 'bg-white text-green-600 hover:bg-green-50'} px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm flex-shrink-0 border ${reviewsFilter === '5' ? '' : 'border-green-200'}`}
                          onClick={() => handleReviewFilterChange('5')}
                        >5 ★</button>
                        <button 
                          className={`${reviewsFilter === '4' ? 'bg-java-500 text-white' : 'bg-white text-green-600 hover:bg-green-50'} px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm flex-shrink-0 border ${reviewsFilter === '4' ? '' : 'border-green-200'}`}
                          onClick={() => handleReviewFilterChange('4')}
                        >4 ★</button>
                        <button 
                          className={`${reviewsFilter === '3' ? 'bg-java-500 text-white' : 'bg-white text-yellow-600 hover:bg-yellow-50'} px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm flex-shrink-0 border ${reviewsFilter === '3' ? '' : 'border-yellow-200'}`}
                          onClick={() => handleReviewFilterChange('3')}
                        >3 ★</button>
                        <button 
                          className={`${reviewsFilter === '2' ? 'bg-java-500 text-white' : 'bg-white text-red-600 hover:bg-red-50'} px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm flex-shrink-0 border ${reviewsFilter === '2' ? '' : 'border-red-200'}`}
                          onClick={() => handleReviewFilterChange('2')}
                        >2 ★</button>
                        <button 
                          className={`${reviewsFilter === '1' ? 'bg-java-500 text-white' : 'bg-white text-red-600 hover:bg-red-50'} px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm flex-shrink-0 border ${reviewsFilter === '1' ? '' : 'border-red-200'}`}
                          onClick={() => handleReviewFilterChange('1')}
                        >1 ★</button>
                      </div>
                      
                      {/* Other Filters */}
                      <div className="flex gap-1.5 sm:gap-2">
                        <button 
                          className={`${reviewsFilter === 'with_photos' ? 'bg-java-500 text-white' : 'bg-white text-java-700 hover:bg-java-100'} px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm flex items-center flex-shrink-0 border ${reviewsFilter === 'with_photos' ? '' : 'border-java-200'}`}
                          onClick={() => handleReviewFilterChange('with_photos')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          With Photos
                        </button>
                        <button 
                          className={`${reviewsFilter === 'recent' ? 'bg-java-500 text-white' : 'bg-white text-java-700 hover:bg-java-100'} px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm flex items-center flex-shrink-0 border ${reviewsFilter === 'recent' ? '' : 'border-java-200'}`}
                          onClick={() => handleReviewFilterChange('recent')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Recent
                        </button>
                        <button 
                          className={`${reviewsFilter === 'highest_rated' ? 'bg-java-500 text-white' : 'bg-white text-java-700 hover:bg-java-100'} px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm flex items-center flex-shrink-0 border ${reviewsFilter === 'highest_rated' ? '' : 'border-java-200'}`}
                          onClick={() => handleReviewFilterChange('highest_rated')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          Highest Rated
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Dynamic Reviews - Mobile Optimized */}
                  <div className="space-y-4 sm:space-y-5">
                    {isReviewsLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-java-500"></div>
                      </div>
                    ) : reviews.length > 0 ? (
                      <>
                        {reviews.map((review, index) => {
                          // Define color based on rating value
                          const getStarColor = (rating) => {
                            if (rating >= 4) return "text-green-500";
                            if (rating === 3) return "text-yellow-500";
                            return "text-red-500";
                          };
                          
                          const getRatingTextColor = (rating) => {
                            if (rating >= 4) return "text-green-700";
                            if (rating === 3) return "text-yellow-700";
                            return "text-red-700";
                          };
                          
                          const starColor = getStarColor(review.rating);
                          const textColor = getRatingTextColor(review.rating);
                          
                          // Format date
                          const formatDate = (dateString) => {
                            const date = new Date(dateString);
                            const now = new Date();
                            const diffTime = Math.abs(now - date);
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            
                            if (diffDays < 7) {
                              return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
                            } else if (diffDays < 30) {
                              const weeks = Math.floor(diffDays / 7);
                              return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
                            } else if (diffDays < 365) {
                              const months = Math.floor(diffDays / 30);
                              return `${months} ${months === 1 ? 'month' : 'months'} ago`;
                            } else {
                              const years = Math.floor(diffDays / 365);
                              return `${years} ${years === 1 ? 'year' : 'years'} ago`;
                            }
                          };
                          
                          return (
                            <div key={review._id || index} className="border border-java-100 rounded-lg p-4 sm:p-5 shadow-sm bg-white hover:shadow-md transition-shadow duration-300">
                              <div className="flex items-center mb-2 sm:mb-3">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <svg key={i} className={`h-4 w-4 sm:h-5 sm:w-5 ${starColor}`} viewBox="0 0 20 20" fill={i < review.rating ? 'currentColor' : 'none'}>
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                                <span className={`ml-1.5 sm:ml-2 text-xs sm:text-sm font-medium ${textColor}`}>{review.title || 'Review'}</span>
                              </div>
                              <p className="text-xs sm:text-sm text-java-700 mb-3 sm:mb-4 bg-java-50 p-3 sm:p-4 rounded-lg border border-java-100">{review.review}</p>
                              
                              {/* Review Images if any */}
                              {review.images && review.images.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                                  {review.images.map((image, imgIndex) => (
                                    <div key={imgIndex} className="w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden border border-java-200">
                                      <Image 
                                        src={image.url || image} 
                                        alt={`Review image ${imgIndex + 1}`} 
                                        fallbackSrc="/image_default.png"
                                        className="w-full h-full object-cover"
                                        onClick={() => handleImageZoom()}
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <div className="flex flex-wrap items-center text-xs text-java-600 border-t border-java-100 pt-2 sm:pt-3">
                                <span className="mr-1.5 sm:mr-2 bg-java-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md font-medium text-xs">
                                  {review.user ? (review.user.name || 'User') : 'Anonymous'}
                                </span> 
                                <span className="mr-1.5 sm:mr-2 hidden sm:inline">|</span>
                                {review.isVerifiedPurchase && (
                                  <span className="mr-1.5 sm:mr-2 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    <span className="text-xs">Verified Purchase</span>
                                  </span>
                                )}
                                <span className="mr-1.5 sm:mr-2 hidden sm:inline">|</span>
                                <span className="text-xs">{formatDate(review.createdAt)}</span>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Pagination */}
                        {reviewsTotalPages > 1 && (
                          <div className="flex justify-center items-center space-x-2 sm:space-x-3 mt-4 sm:mt-6">
                            <button 
                              onClick={() => handleReviewPageChange(reviewsPage - 1)}
                              disabled={reviewsPage === 1}
                              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm ${reviewsPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-java-100 text-java-700 hover:bg-java-200'}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            
                            {[...Array(reviewsTotalPages)].map((_, i) => {
                              const pageNum = i + 1;
                              // Show limited page numbers with ellipsis for better mobile experience
                              if (
                                pageNum === 1 || 
                                pageNum === reviewsTotalPages || 
                                (pageNum >= reviewsPage - 1 && pageNum <= reviewsPage + 1)
                              ) {
                                return (
                                  <button 
                                    key={pageNum}
                                    onClick={() => handleReviewPageChange(pageNum)}
                                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-md text-xs sm:text-sm ${reviewsPage === pageNum ? 'bg-java-500 text-white' : 'bg-java-50 text-java-700 hover:bg-java-100'}`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              } else if (
                                (pageNum === 2 && reviewsPage > 3) || 
                                (pageNum === reviewsTotalPages - 1 && reviewsPage < reviewsTotalPages - 2)
                              ) {
                                return <span key={pageNum} className="text-java-700">...</span>;
                              }
                              return null;
                            })}
                            
                            <button 
                              onClick={() => handleReviewPageChange(reviewsPage + 1)}
                              disabled={reviewsPage === reviewsTotalPages}
                              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm ${reviewsPage === reviewsTotalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-java-100 text-java-700 hover:bg-java-200'}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 bg-java-50 rounded-lg border border-java-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-java-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-java-700 mb-2">No reviews found</p>
                        <p className="text-xs text-java-500">Be the first to review this product!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        

      </div>
    </div>
  )
}

export default ProductDetail