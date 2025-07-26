import { useState, useContext, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBagIcon, UserIcon, Bars3Icon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import AuthContext from '../../contexts/AuthContext'
import CartContext from '../../contexts/CartContext'
import logoImage from '../../assets/WhatsApp_Image_2025-06-18_at_4.21.26_PM-removebg-preview.png'
import CartOffcanvas from '../Cart/CartOffcanvas'
import NavbarOffcanvas from './NavbarOffcanvas'
import { motion, AnimatePresence } from 'framer-motion'

const Header = () => {
  const [navbarOpen, setNavbarOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { isAuthenticated, isAdmin, isSubAdmin, user, logout } = useContext(AuthContext)
  const { cart, getCartItemCount } = useContext(CartContext)
  const navigate = useNavigate()
  
  // Toggle navbar offcanvas
  const toggleNavbar = () => {
    setNavbarOpen(!navbarOpen)
  }
  
  // Close navbar offcanvas
  const closeNavbar = () => {
    setNavbarOpen(false)
  }
  
  // Toggle cart sidebar
  const toggleCart = () => {
    setCartOpen(!cartOpen)
  }
  
  // Close cart sidebar
  const closeCart = () => {
    setCartOpen(false)
  }
  
  // Toggle search bar
  const toggleSearch = () => {
    setSearchOpen(!searchOpen)
  }
  
  // Close search bar
  const closeSearch = () => {
    setSearchOpen(false)
  }
  
  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }
  
  // Listen for custom openCart event
  useEffect(() => {
    const handleOpenCart = () => {
      setCartOpen(true)
    }
    
    document.addEventListener('openCart', handleOpenCart)
    return () => document.removeEventListener('openCart', handleOpenCart)
  }, [])
  
  // Close search when pressing escape key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && searchOpen) {
        closeSearch()
      }
    }
    
    window.addEventListener('keydown', handleEscKey)
    return () => window.removeEventListener('keydown', handleEscKey)
  }, [searchOpen])
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container-custom py-4">
        <div className="grid grid-cols-3 items-center">
          {/* Menu Button (Left) */}
          <div className="flex justify-start">
            <button 
              className="p-2" 
              onClick={toggleNavbar}
              aria-label="Toggle menu"
            >
              <Bars3Icon className="h-6 w-6 text-java-800" />
            </button>
          </div>
          
          {/* Logo (Center) */}
          <div className="flex justify-center">
            <Link to="/" className="flex items-center">
              <img src={logoImage} alt="Beeget Fashion" className="h-10" />
            </Link>
          </div>
           
           {/* User Actions (Right) */}
          <div className="flex items-center justify-end space-x-4">
            {/* Search Icon */}
            <button 
              onClick={toggleSearch} 
              className="relative p-2 text-java-800 hover:text-java-400 transition-colors"
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="h-6 w-6" />
            </button>
            
            {/* Cart Icon with Item Count */}
            <button 
              onClick={toggleCart} 
              className="relative p-2 text-java-800 hover:text-java-400 transition-colors"
              aria-label="Open cart"
            >
              <ShoppingBagIcon className="h-6 w-6" />
              {getCartItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-java-400 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getCartItemCount()}
                </span>
              )}
            </button>
            
            {/* User Account - Hidden on mobile, visible on larger screens */}
            <div className="hidden sm:block">
              {isAuthenticated ? (
                <div className="relative">
                  <button 
                    className="flex items-center space-x-1 p-2"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                  >
                    <UserIcon className="h-6 w-6 text-java-800 hover:text-java-400 transition-colors" />
                    <span className="hidden lg:inline text-sm">
                      {user?.firstName || 'Account'}
                    </span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 ${dropdownOpen ? 'block' : 'hidden'}`}>
                    <Link 
                      to="/account" 
                      className="block px-4 py-2 text-sm text-java-800 hover:bg-java-50"
                    >
                      My Profile
                    </Link>                
                    {isAdmin && (
                      <Link 
                        to="/admin/dashboard" 
                        className="block px-4 py-2 text-sm text-java-800 hover:bg-java-50"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    {isSubAdmin && !isAdmin && (
                      <Link 
                        to="/subadmin/dashboard" 
                        className="block px-4 py-2 text-sm text-java-800 hover:bg-java-50"
                      >
                        SubAdmin Dashboard
                      </Link>
                    )}
                    <button 
                      onClick={logout} 
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-java-50"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="text-java-800 hover:text-java-400 transition-colors"
                >
                  <UserIcon className="h-6 w-6" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
        
      
      {/* Search Bar Animation */}
      <AnimatePresence>
        {searchOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSearch}
            />
            
            {/* Search Bar */}
            <motion.div 
              className="fixed top-0 left-0 right-0 bg-white shadow-lg z-50 p-3 md:p-4"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <form onSubmit={handleSearchSubmit} className="container-custom flex items-center w-full max-w-full">
                <div className="relative flex-grow">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for products..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-java-400 focus:border-java-400 text-sm md:text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                <button 
                  type="button" 
                  className="ml-1 md:ml-2 p-1 md:p-2 text-gray-500 hover:text-gray-700 flex-shrink-0"
                  onClick={closeSearch}
                  aria-label="Close search"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Cart Offcanvas */}
      <CartOffcanvas isOpen={cartOpen} onClose={closeCart} />
      
      {/* Navbar Offcanvas */}
      <NavbarOffcanvas isOpen={navbarOpen} onClose={closeNavbar} />
    </header>
  )
}

export default Header