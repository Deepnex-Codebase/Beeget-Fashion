import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../components/Common/Button'

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(false)
  
  // Static featured products data
  const featuredProducts = [
    {
      id: 1,
      name: 'Classic White Tee',
      price: 29.99,
      originalPrice: 49.99,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80',
      category: 'Women',
      slug: 'classic-white-tee',
      rating: '4.8',
      sizes: ['XS', 'S', 'M', 'L', 'XL']
    },
    {
      id: 2,
      name: 'Slim Fit Jeans',
      price: 59.99,
      originalPrice: 89.99,
      image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80',
      category: 'Men',
      slug: 'slim-fit-jeans',
      rating: '4.7',
      sizes: ['30', '32', '34', '36']
    },
    {
      id: 3,
      name: 'Summer Floral Dress',
      price: 49.99,
      originalPrice: 79.99,
      image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80',
      category: 'Women',
      slug: 'summer-dress',
      rating: '4.9',
      sizes: ['XS', 'S', 'M', 'L']
    },
    {
      id: 4,
      name: 'Premium Leather Wallet',
      price: 39.99,
      originalPrice: 59.99,
      image: 'https://images.unsplash.com/photo-1517254797898-ee1bd9c0115b?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80',
      category: 'Accessories',
      slug: 'leather-wallet',
      rating: '4.6'
      // No sizes for accessories
    },
  ]
  
  // Hero section images
  const heroImages = [
    'https://janasya.com/cdn/shop/files/Maternity_main_Banner_Desktop.webp?v=1749642930&width=2000',
    'https://janasya.com/cdn/shop/files/Work-Wear-Banner_b447b0b8-d88c-4e5b-9a01-55f169eb1c87.webp?v=1749210863&width=2000',
    'https://janasya.com/cdn/shop/files/Everyday-Essentials-Banner_Desktop.webp?v=1749469271&width=2000',
    'https://janasya.com/cdn/shop/files/Every-Day-Cottons-Banner.webp?v=1747810597&width=2000',
    'https://janasya.com/cdn/shop/files/Cotton_days_main_Banner_Desktop.webp?v=1749642851&width=2000',
    'https://janasya.com/cdn/shop/files/Plus-Size-Banner_f7214f3b-c047-446f-8976-b958cbf01a74.webp?v=1749294158&width=2000'
  ]
  
  // Mobile hero images
  const mobileHeroImages = [
    'https://janasya.com/cdn/shop/files/Maternity_main_Banner_Mobile.webp?v=1749642930&width=767',
    'https://janasya.com/cdn/shop/files/Work-Wear-Banner_Mobile.webp?v=1749210863&width=767',
    'https://janasya.com/cdn/shop/files/Everyday-Essentials-Banner_Mobile.webp?v=1749469271&width=767',
    'https://janasya.com/cdn/shop/files/Every-Day-Cottons-Banner_Mobile.webp?v=1747810597&width=767',
    'https://janasya.com/cdn/shop/files/Cotton_days_main_Banner_Mobile.webp?v=1749642851&width=767',
    'https://janasya.com/cdn/shop/files/Plus-Size-Banner_Mobile.webp?v=1749294158&width=767'
  ]
  
  // Slide change logic - static implementation
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentSlide((prev) => (prev === heroImages.length - 1 ? 0 : prev + 1))
    }, 5000)
    
    // Cleanup function
    return () => clearTimeout(timer)
  }, [currentSlide, heroImages.length])
  
  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  }
  
  // Handle manual slide navigation
  const goToSlide = (index) => {
    setCurrentSlide(index)
  }
  
  // Handle next slide
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === heroImages.length - 1 ? 0 : prev + 1))
  }
  
  // Handle previous slide
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1))
  }
  
  return (
    <div>
      {/* Hero Section with Slider */}
      <section className="relative h-[50vh] md:h-screen overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.div
            key={currentSlide}
            className="absolute inset-0 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            <picture>
              <source media="(max-width: 767px)" srcSet={mobileHeroImages[currentSlide]} />
              <img 
                src={heroImages[currentSlide]} 
                alt={`Fashion collection slide ${currentSlide + 1}`} 
                className="w-full h-full object-cover object-top md:object-center"
              />
            </picture>
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation arrows */}
        <button 
          onClick={prevSlide}
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-1 md:p-2 rounded-full backdrop-blur-sm transition-colors"
          aria-label="Previous slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button 
          onClick={nextSlide}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-1 md:p-2 rounded-full backdrop-blur-sm transition-colors"
          aria-label="Next slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        {/* Slide indicators */}
        <div className="absolute bottom-3 md:bottom-6 left-0 right-0 z-20 flex justify-center gap-1 md:gap-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-colors ${currentSlide === index ? 'bg-white' : 'bg-white/40'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>
      {/* Categories Section */}
      <section className="w-full py-4 bg-white">
        <div className="container-fluid mx-auto px-0">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 md:mb-8">Shop by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-0">
            {/* Category 1 */}
            <div className="relative overflow-hidden h-[350px] md:h-[500px] lg:h-[700px] group">
              <img
                src="https://janasya.com/cdn/shop/files/Category_Tops-_-Tunics_81e3ee9f-6fc4-46de-870b-ad38e8af53e9.webp?v=1749643032&width=800"
                alt="Tops & Tunics"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex flex-col justify-end p-4 md:p-6">
                <h3 className="text-white text-xl md:text-2xl font-bold mb-2 md:mb-4 uppercase tracking-wider text-center">Tops & Tunics</h3>
                <a href="/shop/tops-tunics" className="text-white text-center hover:underline text-sm md:text-base">Shop Collection</a>
              </div>
            </div>
            
            {/* Category 2 */}
            <div className="relative overflow-hidden h-[350px] md:h-[500px] lg:h-[700px] group">
              <img
                src="https://janasya.com/cdn/shop/files/Category_Dresses_6ecf0375-1c4b-47d7-9a2f-d16d53cde092.webp?v=1749643031&width=800"
                alt="Green Cotton Solid A-line Co-ords Set"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex flex-col justify-end p-4 md:p-6">
                <h3 className="text-white text-xl md:text-2xl font-bold mb-2 md:mb-4 uppercase tracking-wider text-center">Dresses</h3>
                <a href="/shop/dresses" className="text-white text-center hover:underline text-sm md:text-base">Shop Collection</a>
              </div>
            </div>
            
            {/* Category 3 */}
            <div className="relative overflow-hidden h-[350px] md:h-[500px] lg:h-[700px] group">
              <img
                src="https://janasya.com/cdn/shop/files/Category_Co-Ords_be9f086d-1b5c-4421-ad29-4ee5b69bca25.webp?v=1749646113&width=800"
                alt="Co-Ords"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex flex-col justify-end p-4 md:p-6">
                <h3 className="text-white text-xl md:text-2xl font-bold mb-2 md:mb-4 uppercase tracking-wider text-center">Co-Ords</h3>
                <a href="/shop/co-ords" className="text-white text-center hover:underline text-sm md:text-base">Shop Collection</a>
              </div>
            </div>
            
            {/* Category 4 */}
            <div className="relative overflow-hidden h-[350px] md:h-[500px] lg:h-[700px] group">
              <img
                src="https://janasya.com/cdn/shop/files/Category_Kurta-Sets_e4faa5de-ffc7-48c9-bfc7-9e3dbcff1fa9.webp?v=1749643202&width=800"
                alt="Kurta Sets"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex flex-col justify-end p-4 md:p-6">
                <h3 className="text-white text-xl md:text-2xl font-bold mb-2 md:mb-4 uppercase tracking-wider text-center">Kurta Sets</h3>
                <a href="/shop/kurta-sets" className="text-white text-center hover:underline text-sm md:text-base">Shop Collection</a>
              </div>
            </div>
            
            {/* Category 5 */}
            <div className="relative overflow-hidden h-[350px] md:h-[500px] lg:h-[700px] group">
              <img
                src="https://janasya.com/cdn/shop/files/Category_Suit-Set_4ea2d3e2-b4b1-4cee-bf6b-03e2e7d21d62.webp?v=1749643032&width=800"
                alt="Suit Sets"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex flex-col justify-end p-4 md:p-6">
                <h3 className="text-white text-xl md:text-2xl font-bold mb-2 md:mb-4 uppercase tracking-wider text-center">Suit Sets</h3>
                <a href="/shop/suit-sets" className="text-white text-center hover:underline text-sm md:text-base">Shop Collection</a>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Summer Festive Banner Section */}
      <section className="w-full overflow-hidden">
        <picture>
          <source media="(max-width: 767px)" srcSet="https://janasya.com/cdn/shop/files/Summer-Festive-Banner_Mobile.webp?v=1749643277&width=767" />
          <img 
            src="https://janasya.com/cdn/shop/files/Summer-Festive-Banner_Desktop.webp?v=1749643277&width=2000" 
            alt="Summer Festive Collection" 
            className="w-full h-auto object-cover"
          />
        </picture>
      </section>
      
      {/* Work Anywhere Banner Section */}
      <section className="w-full overflow-hidden">
        <picture>
          <source media="(max-width: 767px)" srcSet="https://janasya.com/cdn/shop/files/Work-Anywhere_Mobile.webp?v=1744953148&width=767" />
          <img 
            src="https://janasya.com/cdn/shop/files/Work-Anywhere_Desktop.webp?v=1744953148&width=2000" 
            alt="Work Anywhere Collection" 
            className="w-full h-auto object-cover"
          />
        </picture>
      </section>
      
      {/* WATCH AND BUY Section */}
      <section className="w-full py-10 md:py-14 bg-gray-50">
        <div className="container-fluid">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8 lg:mb-10 relative">
            <span className="bg-blue-600 text-white px-3 py-1 md:px-4 md:py-1">WATCH AND BUY</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 md:gap-6">
            {/* Product 1 */}
            <div className="group relative rounded-xl xs:rounded-2xl border border-gray-100 bg-white shadow transition-all hover:shadow-lg overflow-hidden">
              {/* Discount Tag */}
              <div className="absolute left-1 xs:left-1.5 sm:left-2 top-1 xs:top-1.5 sm:top-2 z-10 rounded-full bg-red-500 px-1 xs:px-1.5 sm:px-2.5 py-0.5 xs:py-0.5 sm:py-1 text-[8px] xs:text-[10px] sm:text-xs font-bold text-white">
                60% OFF
              </div>
              
              {/* Wishlist Button */}
              <button
                className="absolute right-1.5 xs:right-2 top-1.5 xs:top-2 z-10 rounded-full bg-white/80 p-1 xs:p-1.5 text-gray-700 backdrop-blur-sm transition-all hover:bg-java-500 hover:text-white shadow-sm"
                aria-label="Add to wishlist"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 xs:h-5 xs:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              
              {/* Product Image Container */}
              <div className="relative overflow-hidden">
                <Link to="/product/off-white-kurta-set" className="block">
                  <img
                    src="https://janasya.com/cdn/shop/files/Category_Tops-_-Tunics_81e3ee9f-6fc4-46de-870b-ad38e8af53e9.webp?v=1749643032&width=800"
                    alt="Off White Dobby Pure Cotton Self Design A-line Kurta Pant Set"
                    className="w-full h-56 xs:h-64 sm:h-72 md:h-80 object-cover transition-transform group-hover:scale-105 duration-500 ease-in-out"
                    loading="lazy"
                  />
                  
                  {/* Product Image Overlay with subtle gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"></div>
                </Link>
              </div>
              
              {/* Product Info */}
              <div className="p-3 xs:p-4 sm:p-5">
                {/* Title and Rating */}
                <div className="flex justify-between items-start mb-2.5">
                  <Link to="/product/off-white-kurta-set" className="block flex-1">
                    <h3 className="text-sm xs:text-base md:text-lg font-medium text-gray-800 hover:text-java-500 transition-colors line-clamp-2">Off White Dobby Pure Cotton Self Design A-line Kurta Pant Set</h3>
                  </Link>
                  
                  {/* Rating Stars */}
                  <div className="flex items-center bg-gradient-to-r from-java-100 to-java-200 px-1.5 xs:px-2 py-0.5 rounded-full ml-1 xs:ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 xs:h-3.5 xs:w-3.5 text-java-600 mr-0.5">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] xs:text-xs font-medium text-java-800">4.5</span>
                  </div>
                </div>
                
                {/* Category Tag */}
                <div className="mb-2">
                  <span className="inline-block text-[10px] xs:text-xs bg-gray-50 text-gray-500 px-2 xs:px-2.5 py-0.5 xs:py-1 rounded-full capitalize border border-gray-100">
                    Women's Fashion
                  </span>
                </div>
                
                {/* Price section with improved styling */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-baseline gap-1 xs:gap-1.5">
                    <p className="text-sm xs:text-base md:text-lg font-bold text-red-500">₹1,599.00</p>
                    <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-400 line-through">₹3,999.00</p>
                  </div>
                  
                </div>
                
                {/* Available Sizes */}
                <div className="mt-1">
                  <p className="text-[10px] xs:text-xs font-medium text-java-600 mb-0.5 xs:mb-1">AVAILABLE SIZES:</p>
                  <div className="flex flex-wrap gap-1 xs:gap-1.5">
                    <span className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">3XL</span>
                    <span className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">4XL</span>
                    <span className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">5XL</span>
                  </div>
                </div>
                
                {/* Add to Cart Button */}
                <button
                  className="w-full mt-3 py-1.5 xs:py-2 px-2 xs:px-3 bg-java-500 text-white text-xs xs:text-sm font-medium rounded-full shadow-sm hover:bg-java-600 flex items-center justify-center gap-1 xs:gap-1.5 transition-colors"
                  aria-label="Add to cart"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 xs:h-4 xs:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Add to Cart
                </button>
              </div>
            </div>

            {/* Product 2 */}
            <div className="group relative rounded-xl xs:rounded-2xl border border-gray-100 bg-white shadow transition-all hover:shadow-lg overflow-hidden">
              {/* Discount Tag */}
              <div className="absolute left-1 xs:left-1.5 sm:left-2 top-1 xs:top-1.5 sm:top-2 z-10 rounded-full bg-red-500 px-1 xs:px-1.5 sm:px-2.5 py-0.5 xs:py-0.5 sm:py-1 text-[8px] xs:text-[10px] sm:text-xs font-bold text-white">
                42% OFF
              </div>
              
              {/* Wishlist Button */}
              <button
                className="absolute right-1.5 xs:right-2 top-1.5 xs:top-2 z-10 rounded-full bg-white/80 p-1 xs:p-1.5 text-gray-700 backdrop-blur-sm transition-all hover:bg-java-500 hover:text-white shadow-sm"
                aria-label="Add to wishlist"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 xs:h-5 xs:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              
              {/* Product Image Container */}
              <div className="relative overflow-hidden">
                <Link to="/product/green-cotton-co-ords" className="block">
                  <img
                    src="https://janasya.com/cdn/shop/files/Category_Dresses_6ecf0375-1c4b-47d7-9a2f-d16d53cde092.webp?v=1749643031&width=800"
                    alt="Green Cotton Solid A-line Co-ords Set"
                    className="w-full h-56 xs:h-64 sm:h-72 md:h-80 object-cover transition-transform group-hover:scale-105 duration-500 ease-in-out"
                    loading="lazy"
                  />
                  
                  {/* Product Image Overlay with subtle gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"></div>
                </Link>
              </div>
              
              {/* Product Info */}
              <div className="p-3 xs:p-4 sm:p-5">
                {/* Title and Rating */}
                <div className="flex justify-between items-start mb-2.5">
                  <Link to="/product/green-cotton-co-ords" className="block flex-1">
                    <h3 className="text-sm xs:text-base md:text-lg font-medium text-gray-800 hover:text-java-500 transition-colors line-clamp-2">Green Cotton Solid A-line Co-ords Set</h3>
                  </Link>
                  
                  {/* Rating Stars */}
                  <div className="flex items-center bg-gradient-to-r from-java-100 to-java-200 px-1.5 xs:px-2 py-0.5 rounded-full ml-1 xs:ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 xs:h-3.5 xs:w-3.5 text-java-600 mr-0.5">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] xs:text-xs font-medium text-java-800">4.2</span>
                  </div>
                </div>
                
                {/* Category Tag */}
                <div className="mb-2">
                  <span className="inline-block text-[10px] xs:text-xs bg-gray-50 text-gray-500 px-2 xs:px-2.5 py-0.5 xs:py-1 rounded-full capitalize border border-gray-100">
                    Women's Fashion
                  </span>
                </div>
                
                {/* Price section with improved styling */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-baseline gap-1 xs:gap-1.5">
                    <p className="text-sm xs:text-base md:text-lg font-bold text-red-500">₹1,499.00</p>
                    <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-400 line-through">₹2,599.00</p>
                  </div>
               
                </div>
                
                {/* Available Sizes */}
                <div className="mt-1">
                  <p className="text-[10px] xs:text-xs font-medium text-java-600 mb-0.5 xs:mb-1">AVAILABLE SIZES:</p>
                  <div className="flex flex-wrap gap-1 xs:gap-1.5">
                    <span className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">3XL</span>
                    <span className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">4XL</span>
                    <span className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">5XL</span>
                  </div>
                </div>
                
                {/* Add to Cart Button */}
                <button
                  className="w-full mt-3 py-1.5 xs:py-2 px-2 xs:px-3 bg-java-500 text-white text-xs xs:text-sm font-medium rounded-full shadow-sm hover:bg-java-600 flex items-center justify-center gap-1 xs:gap-1.5 transition-colors"
                  aria-label="Add to cart"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 xs:h-4 xs:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Add to Cart
                </button>
              </div>
            </div>

            {/* Product 3 */}
            <div className="group relative rounded-xl xs:rounded-2xl border border-gray-100 bg-white shadow transition-all hover:shadow-lg overflow-hidden">
              {/* Discount Tag */}
              <div className="absolute left-1 xs:left-1.5 sm:left-2 top-1 xs:top-1.5 sm:top-2 z-10 rounded-full bg-red-500 px-1 xs:px-1.5 sm:px-2.5 py-0.5 xs:py-0.5 sm:py-1 text-[8px] xs:text-[10px] sm:text-xs font-bold text-white">
                56% OFF
              </div>
              
              {/* Wishlist Button */}
              <button
                className="absolute right-1.5 xs:right-2 top-1.5 xs:top-2 z-10 rounded-full bg-white/80 p-1 xs:p-1.5 text-gray-700 backdrop-blur-sm transition-all hover:bg-java-500 hover:text-white shadow-sm"
                aria-label="Add to wishlist"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 xs:h-5 xs:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              
              {/* Product Image Container */}
              <div className="relative overflow-hidden">
                <Link to="/product/white-cotton-co-ord-set" className="block">
                  <img
                    src="https://janasya.com/cdn/shop/files/Category_Co-Ords_be9f086d-1b5c-4421-ad29-4ee5b69bca25.webp?v=1749646113&width=800"
                    alt="White Pure Cotton Floral Printed A-line Co-ord Set"
                    className="w-full h-56 xs:h-64 sm:h-72 md:h-80 object-cover transition-transform group-hover:scale-105 duration-500 ease-in-out"
                    loading="lazy"
                  />
                  
                  {/* Product Image Overlay with subtle gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"></div>
                </Link>
              </div>
              
              {/* Product Info */}
              <div className="p-3 xs:p-4 sm:p-5">
                {/* Title and Rating */}
                <div className="flex justify-between items-start mb-2.5">
                  <Link to="/product/white-cotton-co-ord-set" className="block flex-1">
                    <h3 className="text-sm xs:text-base md:text-lg font-medium text-gray-800 hover:text-java-500 transition-colors line-clamp-2">White Pure Cotton Floral Printed A-line Co-ord Set</h3>
                  </Link>
                  
                  {/* Rating Stars */}
                  <div className="flex items-center bg-gradient-to-r from-java-100 to-java-200 px-1.5 xs:px-2 py-0.5 rounded-full ml-1 xs:ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 xs:h-3.5 xs:w-3.5 text-java-600 mr-0.5">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] xs:text-xs font-medium text-java-800">4.7</span>
                  </div>
                </div>
                
                {/* Category Tag */}
                <div className="mb-2">
                  <span className="inline-block text-[10px] xs:text-xs bg-gray-50 text-gray-500 px-2 xs:px-2.5 py-0.5 xs:py-1 rounded-full capitalize border border-gray-100">
                    Women's Fashion
                  </span>
                </div>
                
                {/* Price section with improved styling */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-baseline gap-1 xs:gap-1.5">
                    <p className="text-sm xs:text-base md:text-lg font-bold text-red-500">₹1,599.00</p>
                    <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-400 line-through">₹3,599.00</p>
                  </div>
                
                </div>
                
                {/* Available Sizes */}
                <div className="mt-1">
                  <p className="text-[10px] xs:text-xs font-medium text-java-600 mb-0.5 xs:mb-1">AVAILABLE SIZES:</p>
                  <div className="flex flex-wrap gap-1 xs:gap-1.5">
                    <span className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">3XL</span>
                    <span className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">4XL</span>
                    <span className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">5XL</span>
                  </div>
                </div>
                
                {/* Add to Cart Button */}
                <button
                  className="w-full mt-3 py-1.5 xs:py-2 px-2 xs:px-3 bg-java-500 text-white text-xs xs:text-sm font-medium rounded-full shadow-sm hover:bg-java-600 flex items-center justify-center gap-1 xs:gap-1.5 transition-colors"
                  aria-label="Add to cart"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 xs:h-4 xs:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Add to Cart
                </button>
              </div>
            </div>

            {/* Product 4 */}
            <div className="group relative rounded-lg xs:rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md overflow-hidden">
              {/* Discount Tag */}
              <div className="absolute left-1 xs:left-1.5 sm:left-2 top-1 xs:top-1.5 sm:top-2 z-10 rounded-full bg-red-500 px-1 xs:px-1.5 sm:px-2.5 py-0.5 xs:py-0.5 sm:py-1 text-[8px] xs:text-[10px] sm:text-xs font-bold text-white">
                30% OFF
              </div>
              
              {/* Wishlist Button */}
              <button
                className="absolute right-1.5 xs:right-2 top-1.5 xs:top-2 z-10 rounded-full bg-white/80 p-1 xs:p-1.5 text-gray-700 backdrop-blur-sm transition-all hover:bg-java-500 hover:text-white shadow-sm"
                aria-label="Add to wishlist"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 xs:h-5 xs:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              
              {/* Product Image Container */}
              <div className="relative overflow-hidden">
                <Link to="/product/teal-blue-kurta-set" className="block">
                  <img
                    src="https://janasya.com/cdn/shop/files/Category_Kurta-Sets_e4faa5de-ffc7-48c9-bfc7-9e3dbcff1fa9.webp?v=1749643202&width=800"
                    alt="Teal Blue Floral Printed Kurta with Pants"
                    className="w-full h-56 xs:h-64 sm:h-72 md:h-80 object-cover transition-transform group-hover:scale-105 duration-500 ease-in-out"
                    loading="lazy"
                  />
                  
                  {/* Product Image Overlay with subtle gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"></div>
                </Link>
              </div>
              
              {/* Product Info */}
              <div className="p-3 xs:p-4 sm:p-5">
                {/* Title and Rating */}
                <div className="flex justify-between items-start mb-2.5">
                  <Link to="/product/teal-blue-kurta-set" className="block flex-1">
                    <h3 className="text-sm xs:text-base md:text-lg font-medium text-gray-800 hover:text-java-500 transition-colors line-clamp-2">Teal Blue Floral Printed Kurta with Pants</h3>
                  </Link>
                  
                  {/* Rating Stars */}
                  <div className="flex items-center bg-gradient-to-r from-java-100 to-java-200 px-1.5 xs:px-2 py-0.5 rounded-full ml-1 xs:ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 xs:h-3.5 xs:w-3.5 text-java-600 mr-0.5">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] xs:text-xs font-medium text-java-800">4.5</span>
                  </div>
                </div>
                
                {/* Category Tag */}
                <div className="mb-2">
                  <span className="inline-block text-[10px] xs:text-xs bg-gray-50 text-gray-500 px-1.5 xs:px-2 py-0.5 rounded-full capitalize border border-gray-100">
                    Ethnic Wear
                  </span>
                </div>
                
                {/* Price section with improved styling */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-baseline gap-1 xs:gap-1.5">
                    <p className="text-sm xs:text-base md:text-lg font-bold text-red-500">₹1,399.00</p>
                    <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-400 line-through">₹1,999.00</p>
                  </div>
                  
                </div>
                {/* Available Sizes */}
                <div className="mt-1">
                  <p className="text-[10px] xs:text-xs font-medium text-java-600 mb-0.5 xs:mb-1">AVAILABLE SIZES:</p>
                  <div className="flex flex-wrap gap-1 xs:gap-1.5">
                    <span className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">3XL</span>
                    <span className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">4XL</span>
                    <span className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">5XL</span>
                  </div>
                </div>
               
                
                {/* Add to Cart Button */}
                <button
                  className="w-full mt-3 py-1.5 xs:py-2 px-2 xs:px-3 bg-java-500 text-white text-xs xs:text-sm font-medium rounded-full shadow-sm hover:bg-java-600 flex items-center justify-center gap-1 xs:gap-1.5 transition-colors"
                  aria-label="Add to cart"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 xs:h-4 xs:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Add to Cart
                </button>
              </div>
            </div>

            {/* Product 5 */}
            <div className="group relative rounded-lg xs:rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md overflow-hidden">
              {/* Discount Tag */}
              <div className="absolute left-1 xs:left-1.5 sm:left-2 top-1 xs:top-1.5 sm:top-2 z-10 rounded-full bg-red-500 px-1 xs:px-1.5 sm:px-2.5 py-0.5 xs:py-0.5 sm:py-1 text-[8px] xs:text-[10px] sm:text-xs font-bold text-white">
                40% OFF
              </div>
              
              {/* Wishlist Button */}
              <button
                className="absolute right-1.5 xs:right-2 top-1.5 xs:top-2 z-10 rounded-full bg-white/80 p-1 xs:p-1.5 text-gray-700 backdrop-blur-sm transition-all hover:bg-java-500 hover:text-white shadow-sm"
                aria-label="Add to wishlist"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 xs:h-5 xs:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              
              {/* Product Image Container */}
              <div className="relative overflow-hidden">
                <Link to="/product/maroon-maxi-dress" className="block">
                  <img
                    src="https://janasya.com/cdn/shop/files/Category_Dresses_a1e9e5a0-8e5c-4c1e-a1a0-a0a1c2c5a1a0.webp?v=1749646113&width=800"
                    alt="Maroon Floral Printed Maxi Dress"
                    className="w-full h-56 xs:h-64 sm:h-72 md:h-80 object-cover transition-transform group-hover:scale-105 duration-500 ease-in-out"
                    loading="lazy"
                  />
                  
                  {/* Product Image Overlay with subtle gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"></div>
                </Link>
              </div>
              
              {/* Product Info */}
              <div className="p-3 xs:p-4 sm:p-5">
                {/* Title and Rating */}
                <div className="flex justify-between items-start mb-2.5">
                  <Link to="/product/maroon-maxi-dress" className="block flex-1">
                    <h3 className="text-sm xs:text-base md:text-lg font-medium text-gray-800 hover:text-java-500 transition-colors line-clamp-2">Maroon Floral Printed Maxi Dress</h3>
                  </Link>
                  
                  {/* Rating Stars */}
                  <div className="flex items-center bg-gradient-to-r from-java-100 to-java-200 px-1.5 xs:px-2 py-0.5 rounded-full ml-1 xs:ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 xs:h-3.5 xs:w-3.5 text-java-600 mr-0.5">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] xs:text-xs font-medium text-java-800">4.8</span>
                  </div>
                </div>
                
                {/* Category Tag */}
                <div className="mb-2">
                  <span className="inline-block text-[10px] xs:text-xs bg-gray-50 text-gray-500 px-1.5 xs:px-2 py-0.5 rounded-full capitalize border border-gray-100">
                    Dresses
                  </span>
                </div>
                
                {/* Price section with improved styling */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-baseline gap-1 xs:gap-1.5">
                    <p className="text-sm xs:text-base md:text-lg font-bold text-red-500">₹1,199.00</p>
                    <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-400 line-through">₹1,999.00</p>
                  </div>
                 
                </div>
                
                {/* Available Sizes */}
                <div className="mt-1">
                  <p className="text-[10px] xs:text-xs font-medium text-java-600 mb-0.5 xs:mb-1">AVAILABLE SIZES:</p>
                  <div className="flex flex-wrap gap-1 xs:gap-1.5">
                    <span className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">S</span>
                    <span className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">M</span>
                    <span className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">L</span>
                    <span className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">XL</span>
                  </div>
                </div>
                
                {/* Add to Cart Button */}
                <button
                  className="w-full mt-3 py-1.5 xs:py-2 px-2 xs:px-3 bg-java-500 text-white text-xs xs:text-sm font-medium rounded-full shadow-sm hover:bg-java-600 flex items-center justify-center gap-1 xs:gap-1.5 transition-colors"
                  aria-label="Add to cart"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 xs:h-4 xs:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Add to Cart
                </button>
              </div>
            </div>

            {/* Product 6 */}
            <div className="group relative rounded-lg xs:rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md overflow-hidden">
              {/* Discount Tag */}
              <div className="absolute left-1 xs:left-1.5 sm:left-2 top-1 xs:top-1.5 sm:top-2 z-10 rounded-full bg-red-500 px-1 xs:px-1.5 sm:px-2.5 py-0.5 xs:py-0.5 sm:py-1 text-[8px] xs:text-[10px] sm:text-xs font-bold text-white">
                45% OFF
              </div>
              
              {/* Wishlist Button */}
              <button
                className="absolute right-1.5 xs:right-2 top-1.5 xs:top-2 z-10 rounded-full bg-white/80 p-1 xs:p-1.5 text-gray-700 backdrop-blur-sm transition-all hover:bg-java-500 hover:text-white shadow-sm"
                aria-label="Add to wishlist"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 xs:h-5 xs:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              
              {/* Product Image Container */}
              <div className="relative overflow-hidden">
                <Link to="/product/navy-blue-coord-set" className="block">
                  <img
                    src="https://janasya.com/cdn/shop/files/Category_Tops-_-Tunics_81e3ee9f-6fc4-46de-870b-ad38e8af53e9.webp?v=1749643032&width=800"
                    alt="Navy Blue Pure Cotton Floral Printed A-line Co-ord Set"
                    className="w-full h-56 xs:h-64 sm:h-72 md:h-80 object-cover transition-transform group-hover:scale-105 duration-500 ease-in-out"
                    loading="lazy"
                  />
                  
                  {/* Product Image Overlay with subtle gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"></div>
                </Link>
              </div>
              
              {/* Product Info */}
              <div className="p-3 xs:p-4 sm:p-5">
                {/* Title and Rating */}
                <div className="flex justify-between items-start mb-2.5">
                  <Link to="/product/navy-blue-coord-set" className="block flex-1">
                    <h3 className="text-sm xs:text-base md:text-lg font-medium text-gray-800 hover:text-java-500 transition-colors line-clamp-2">Navy Blue Pure Cotton Floral Printed A-line Co-ord Set</h3>
                  </Link>
                  
                  {/* Rating Stars */}
                  <div className="flex items-center bg-gradient-to-r from-java-100 to-java-200 px-1.5 xs:px-2 py-0.5 rounded-full ml-1 xs:ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 xs:h-3.5 xs:w-3.5 text-java-600 mr-0.5">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] xs:text-xs font-medium text-java-800">4.5</span>
                  </div>
                </div>
                
                {/* Category Tag */}
                <div className="mb-2">
                  <span className="inline-block text-[10px] xs:text-xs bg-gray-50 text-gray-500 px-1.5 xs:px-2 py-0.5 rounded-full capitalize border border-gray-100">
                    Co-ord Sets
                  </span>
                </div>
                
                {/* Price section with improved styling */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-baseline gap-1 xs:gap-1.5">
                    <p className="text-sm xs:text-base md:text-lg font-bold text-red-500">₹1,499.00</p>
                    <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-400 line-through">₹2,699.00</p>
                  </div>
                 
                </div>
                
               {/* Available Sizes */}
                <div className="mt-1">
                  <p className="text-[10px] xs:text-xs font-medium text-java-600 mb-0.5 xs:mb-1">AVAILABLE SIZES:</p>
                  <div className="flex flex-wrap gap-1 xs:gap-1.5">
                    <span className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">3XL</span>
                    <span className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">4XL</span>
                    <span className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">5XL</span>
                  </div>
                </div>
                
                {/* Add to Cart Button */}
                <button
                  className="w-full mt-3 py-1.5 xs:py-2 px-2 xs:px-3 bg-java-500 text-white text-xs xs:text-sm font-medium rounded-full shadow-sm hover:bg-java-600 flex items-center justify-center gap-1 xs:gap-1.5 transition-colors"
                  aria-label="Add to cart"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 xs:h-4 xs:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Add to Cart
                </button>
              </div>
            </div>

            {/* Product 7 */}
            <div className="group relative rounded-lg xs:rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md overflow-hidden">
              {/* Discount Tag */}
              <div className="absolute left-1 xs:left-1.5 sm:left-2 top-1 xs:top-1.5 sm:top-2 z-10 rounded-full bg-red-500 px-1 xs:px-1.5 sm:px-2.5 py-0.5 xs:py-0.5 sm:py-1 text-[8px] xs:text-[10px] sm:text-xs font-bold text-white">
                60% OFF
              </div>
              
              {/* Wishlist Button */}
              <button
                className="absolute right-1.5 xs:right-2 top-1.5 xs:top-2 z-10 rounded-full bg-white/80 p-1 xs:p-1.5 text-gray-700 backdrop-blur-sm transition-all hover:bg-java-500 hover:text-white shadow-sm"
                aria-label="Add to wishlist"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 xs:h-5 xs:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              
              {/* Product Image Container */}
              <div className="relative overflow-hidden">
                <Link to="/product/yellow-kurta-set" className="block">
                  <img
                    src="https://janasya.com/cdn/shop/files/Category_Dresses_6ecf0375-1c4b-47d7-9a2f-d16d53cde092.webp?v=1749643031&width=800"
                    alt="Yellow Dobby Pure Cotton Self Design Straight Kurta Pant Set"
                    className="w-full h-56 xs:h-64 sm:h-72 md:h-80 object-cover transition-transform group-hover:scale-105 duration-500 ease-in-out"
                    loading="lazy"
                  />
                  
                  {/* Product Image Overlay with subtle gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"></div>
                </Link>
              </div>
              
              {/* Product Info */}
              <div className="p-3 xs:p-4 sm:p-5">
                {/* Title and Rating */}
                <div className="flex justify-between items-start mb-2.5">
                  <Link to="/product/yellow-kurta-set" className="block flex-1">
                    <h3 className="text-sm xs:text-base md:text-lg font-medium text-gray-800 hover:text-java-500 transition-colors line-clamp-2">Yellow Dobby Pure Cotton Self Design Straight Kurta Pant Set</h3>
                  </Link>
                  
                  {/* Rating Stars */}
                  <div className="flex items-center bg-gradient-to-r from-java-100 to-java-200 px-1.5 xs:px-2 py-0.5 rounded-full ml-1 xs:ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 xs:h-3.5 xs:w-3.5 text-java-600 mr-0.5">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] xs:text-xs font-medium text-java-800">4.9</span>
                  </div>
                </div>
                
                {/* Category Tag */}
                <div className="mb-2">
                  <span className="inline-block text-[10px] xs:text-xs bg-gray-50 text-gray-500 px-1.5 xs:px-2 py-0.5 rounded-full capitalize border border-gray-100">
                    Ethnic Wear
                  </span>
                </div>
                
                {/* Price section with improved styling */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-baseline gap-1 xs:gap-1.5">
                    <p className="text-sm xs:text-base md:text-lg font-bold text-red-500">₹1,899.00</p>
                    <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-400 line-through">₹4,747.00</p>
                  </div>
                
                </div>
                
                {/* Available Sizes */}
                <div className="mt-1">
                  <p className="text-[10px] xs:text-xs font-medium text-java-600 mb-0.5 xs:mb-1">AVAILABLE SIZES:</p>
                  <div className="flex flex-wrap gap-1 xs:gap-1.5">
                    <span className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">S</span>
                    <span className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">M</span>
                    <span className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">L</span>
                    <span className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">XL</span>
                  </div>
                </div>
                
                {/* Add to Cart Button */}
                <button
                  className="w-full mt-3 py-1.5 xs:py-2 px-2 xs:px-3 bg-java-500 text-white text-xs xs:text-sm font-medium rounded-full shadow-sm hover:bg-java-600 flex items-center justify-center gap-1 xs:gap-1.5 transition-colors"
                  aria-label="Add to cart"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 xs:h-4 xs:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Ready Set Summer Banner Section */}
    
      
      {/* Summer Festive Banner Section */}
      <section className="w-full overflow-hidden">
        <img 
          src="https://janasya.com/cdn/shop/files/Ready-Set-Summer_Desktop_e512ef97-cffd-4394-a6dc-5fe0753d0d8a.webp?v=1749643465&width=2000" 
          alt="Summer Festive Collection" 
          className="w-full h-auto object-cover"
        />
      </section>
      
      {/* Work Anywhere Banner Section */}
      <section className="w-full overflow-hidden">
        <img 
          src="https://janasya.com/cdn/shop/files/Playful-Florals-Banner_22e33db5-ce61-4687-ba79-b7f36909abf7.webp?v=1749643623&width=2000" 
          alt="Work Anywhere Collection" 
          className="w-full h-auto object-cover"
        />
      </section>  
      <section className="w-full overflow-hidden">
        <img 
          src="https://janasya.com/cdn/shop/files/Plus-Size_Collections_Banner_Desktop.webp?v=1749643755&width=2000" 
          alt="Work Anywhere Collection" 
          className="w-full h-auto object-cover"
        />
      </section>
      {/* Featured Products Section */}
      <section className="py-10 md:py-14 lg:py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-heading font-semibold mb-6 md:mb-8 lg:mb-10 text-center">Featured Products</h2>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl xs:rounded-2xl overflow-hidden shadow animate-pulse">
                  <div className="h-64 bg-gray-300"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {featuredProducts.map((product) => {
                // Calculate discount percentage if applicable
                const discountPercentage = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
                
                return (
                  <motion.div 
                    key={product.id} 
                    className="group relative rounded-xl xs:rounded-2xl border border-gray-100 bg-white shadow transition-all hover:shadow-lg overflow-hidden"
                    variants={itemVariants}
                  >
                    {/* Discount Tag - Only show if there's a discount */}
                    {discountPercentage > 0 && (
                      <div className="absolute left-1 xs:left-1.5 sm:left-2 top-1 xs:top-1.5 sm:top-2 z-10 rounded-full bg-red-500 px-1 xs:px-1.5 sm:px-2.5 py-0.5 xs:py-0.5 sm:py-1 text-[8px] xs:text-[10px] sm:text-xs font-bold text-white">
                        {discountPercentage}% OFF
                      </div>
                    )}
                    
                    {/* Wishlist Button */}
                    <button
                      className="absolute right-1.5 xs:right-2 top-1.5 xs:top-2 z-10 rounded-full bg-white/80 p-1 xs:p-1.5 text-gray-700 backdrop-blur-sm transition-all hover:bg-java-500 hover:text-white shadow-sm"
                      aria-label="Add to wishlist"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 xs:h-5 xs:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    
                    {/* Product Image Container */}
                    <div className="relative overflow-hidden">
                      <Link to={`/product/${product.slug}`} className="block">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-56 xs:h-64 sm:h-72 md:h-80 object-cover transition-transform group-hover:scale-105 duration-500 ease-in-out"
                          loading="lazy"
                        />
                        
                        {/* Product Image Overlay with subtle gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"></div>
                      </Link>
                    </div>
                    
                    {/* Product Info */}
                    <div className="p-3 xs:p-4 sm:p-5">
                      {/* Title and Rating */}
                      <div className="flex justify-between items-start mb-2.5">
                        <Link to={`/product/${product.slug}`} className="block flex-1">
                          <h3 className="text-sm xs:text-base md:text-lg font-medium text-gray-800 hover:text-java-500 transition-colors line-clamp-2">{product.name}</h3>
                        </Link>
                        
                        {/* Rating Stars */}
                        <div className="flex items-center bg-gradient-to-r from-java-100 to-java-200 px-1.5 xs:px-2 py-0.5 rounded-full ml-1 xs:ml-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 xs:h-3.5 xs:w-3.5 text-java-600 mr-0.5">
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                          </svg>
                          <span className="text-[10px] xs:text-xs font-medium text-java-800">{product.rating || '4.5'}</span>
                        </div>
                      </div>
                      
                      {/* Category Tag */}
                      <div className="mb-2">
                        <span className="inline-block text-[10px] xs:text-xs bg-gray-50 text-gray-500 px-2 xs:px-2.5 py-0.5 xs:py-1 rounded-full capitalize border border-gray-100">
                          {product.category || 'Fashion'}
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
                      {product.sizes ? (
                        <div className="mt-1">
                          <p className="text-[10px] xs:text-xs font-medium text-java-600 mb-0.5 xs:mb-1">AVAILABLE SIZES:</p>
                          <div className="flex flex-wrap gap-1 xs:gap-1.5">
                            {product.sizes.map((size, index) => (
                              <span key={index} className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer">{size}</span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1">
                          <p className="text-[10px] xs:text-xs font-medium text-java-600 mb-0.5 xs:mb-1">PREMIUM QUALITY</p>
                        </div>
                      )}
                      
                      {/* Add to Cart Button */}
                      <button
                        className="w-full mt-3 py-1.5 xs:py-2 px-2 xs:px-3 bg-java-500 text-white text-xs xs:text-sm font-medium rounded-full shadow-sm hover:bg-java-600 flex items-center justify-center gap-1 xs:gap-1.5 transition-colors"
                        aria-label="Add to cart"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 xs:h-4 xs:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        Add to Cart
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
          
          <div className="text-center mt-10">
            <Button as={Link} to="/shop" variant="secondary">
              View All Products
            </Button>
          </div>
        </div>
      </section>
      
      {/* Newsletter Section */}
      <section className="py-16 bg-teal text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-heading font-semibold mb-4">Join Our Newsletter</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.</p>
          
          <form className="max-w-md mx-auto flex">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="flex-grow px-4 py-2 rounded-l-md focus:outline-none text-charcoal" 
              required 
            />
            <Button type="submit" className="rounded-l-none">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </div>
  )
}

export default Home