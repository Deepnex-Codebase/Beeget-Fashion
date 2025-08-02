import { useEffect, useContext } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { XMarkIcon, HomeIcon, ShoppingBagIcon, UserIcon, InformationCircleIcon, EnvelopeIcon, SparklesIcon, HeartIcon, StarIcon, FireIcon, ClipboardDocumentListIcon, HeartIcon as HeartIconSolid } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import AuthContext from '../../contexts/AuthContext'

const NavbarOffcanvas = ({ isOpen, onClose }) => {
  const { isAuthenticated, isAdmin, isSubAdmin, user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  
  // Close navbar when pressing escape key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEscKey)
    return () => window.removeEventListener('keydown', handleEscKey)
  }, [isOpen, onClose])
  
  // Prevent scrolling when navbar is open
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
  
  // Handle logout
  const handleLogout = () => {
    logout()
    onClose()
    navigate('/')
  }
  
  return (
    <>
    {/* Mobile Bottom Navigation Bar - visible only on small screens */}
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 sm:hidden shadow-lg">
      <div className="flex justify-around items-center py-2">
        <NavLink to="/" className={({ isActive }) => `flex flex-col items-center px-3 py-1 relative ${isActive ? 'text-java-600' : 'text-gray-600'}`}>
          {({ isActive }) => (
            <>
              <span className={`absolute -top-2 w-10 h-1 rounded-full bg-java-600 ${isActive ? 'opacity-100' : 'opacity-0'}`}></span>
              <HomeIcon className="h-6 w-6" />
              <span className="text-xs mt-1">Home</span>
            </>
          )}
        </NavLink>
        
        <NavLink to="/shop" className={({ isActive }) => `flex flex-col items-center px-3 py-1 relative ${isActive ? 'text-java-600' : 'text-gray-600'}`}>
          {({ isActive }) => (
            <>
              <span className={`absolute -top-2 w-10 h-1 rounded-full bg-java-600 ${isActive ? 'opacity-100' : 'opacity-0'}`}></span>
              <ShoppingBagIcon className="h-6 w-6" />
              <span className="text-xs mt-1">Shop</span>
            </>
          )}
        </NavLink>
        
        <NavLink to="/plus-size" className={({ isActive }) => `flex flex-col items-center px-3 py-1 relative ${isActive ? 'text-java-600' : 'text-gray-600'}`}>
          {({ isActive }) => (
            <>
              <span className={`absolute -top-2 w-10 h-1 rounded-full bg-java-600 ${isActive ? 'opacity-100' : 'opacity-0'}`}></span>
              <HeartIcon className="h-6 w-6" />
              <span className="text-xs mt-1">Plus Size</span>
            </>
          )}
        </NavLink>
        
        <NavLink to={isAuthenticated ? "/account" : "/login"} className={({ isActive }) => `flex flex-col items-center px-3 py-1 relative ${isActive ? 'text-java-600' : 'text-gray-600'}`}>
          {({ isActive }) => (
            <>
              <span className={`absolute -top-2 w-10 h-1 rounded-full bg-java-600 ${isActive ? 'opacity-100' : 'opacity-0'}`}></span>
              <UserIcon className="h-6 w-6" />
              <span className="text-xs mt-1">Profile</span>
            </>
          )}
        </NavLink>
      </div>
    </div>
    
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Navbar panel */}
          <motion.div
            className="fixed bottom-0 h-[85vh] sm:h-full sm:top-0 sm:left-0 w-full sm:w-80 bg-white shadow-lg z-50 flex flex-col rounded-t-3xl sm:rounded-none"
            initial={{ y: '100%', x: 0, opacity: 1 }}
            animate={{ y: 0, x: 0, opacity: 1 }}
            exit={{ y: '100%', x: 0, opacity: 1 }}
            transition={{ type: 'tween', duration: 0.3 }}
          >
            {/* Header */}
            <motion.div 
              className="flex flex-col border-b border-gray-200"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Mobile handle - visible only on small screens */}
              <div className="sm:hidden flex justify-center pt-1 pb-2">
                <div className="w-16 h-1 bg-gray-300 rounded-full"></div>
              </div>
              
              <div className="flex items-center justify-between p-4">
              <motion.h2 
                className="text-xl font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Menu
              </motion.h2>
              <motion.button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <XMarkIcon className="h-6 w-6" />
              </motion.button>
              </div>
            </motion.div>
            
            {/* Navigation Links */}
            <motion.div className="flex-grow overflow-y-auto py-4 px-4">
              <motion.nav 
                className="space-y-4"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.3
                    }
                  }
                }}
              >
                {/* Main Navigation */}
                <motion.div 
                  className="space-y-2"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1 }
                  }}
                >
                  <motion.div
                    variants={{
                      hidden: { x: -20, opacity: 0 },
                      visible: { x: 0, opacity: 1 }
                    }}
                    whileHover={{ scale: 1.03 }}
                  >
                    <NavLink 
                      to="/" 
                      className={({ isActive }) => 
                        `flex items-center p-2 rounded-lg ${isActive ? 'bg-java-50 text-java-600' : 'text-java-800 hover:bg-gray-100'}`
                      }
                      onClick={onClose}
                    >
                      <HomeIcon className="h-5 w-5 mr-3" />
                      Home
                    </NavLink>
                  </motion.div>
                  
                  <motion.div
                    variants={{
                      hidden: { x: -20, opacity: 0 },
                      visible: { x: 0, opacity: 1 }
                    }}
                    whileHover={{ scale: 1.03 }}
                  >
                    <NavLink 
                      to="/shop" 
                      className={({ isActive }) => 
                        `flex items-center p-2 rounded-lg ${isActive ? 'bg-java-50 text-java-600' : 'text-java-800 hover:bg-gray-100'}`
                      }
                      onClick={onClose}
                    >
                      <ShoppingBagIcon className="h-5 w-5 mr-3" />
                      Shop
                    </NavLink>
                  </motion.div>
                  
                  {/* Plus Size Section */}
                  <motion.div
                    variants={{
                      hidden: { x: -20, opacity: 0 },
                      visible: { x: 0, opacity: 1 }
                    }}
                    whileHover={{ scale: 1.03 }}
                  >
                    <NavLink 
                      to="/plus-size" 
                      className={({ isActive }) => 
                        `flex items-center p-2 rounded-lg ${isActive ? 'bg-java-50 text-java-600' : 'text-java-800 hover:bg-gray-100'}`
                      }
                      onClick={onClose}
                    >
                      <HeartIcon className="h-5 w-5 mr-3" />
                      Plus Size
                    </NavLink>
                  </motion.div>
                  
                  {/* New Arrivals Section */}
                  <motion.div
                    variants={{
                      hidden: { x: -20, opacity: 0 },
                      visible: { x: 0, opacity: 1 }
                    }}
                    whileHover={{ scale: 1.03 }}
                  >
                    <NavLink 
                      to="/new-arrivals" 
                      className={({ isActive }) => 
                        `flex items-center p-2 rounded-lg ${isActive ? 'bg-java-50 text-java-600' : 'text-java-800 hover:bg-gray-100'}`
                      }
                      onClick={onClose}
                    >
                      <SparklesIcon className="h-5 w-5 mr-3" />
                      New Arrivals
                    </NavLink>
                  </motion.div>
                  
                  {/* Collection Section */}
                  <motion.div
                    variants={{
                      hidden: { x: -20, opacity: 0 },
                      visible: { x: 0, opacity: 1 }
                    }}
                    whileHover={{ scale: 1.03 }}
                  >
                    <NavLink 
                      to="/collections" 
                      className={({ isActive }) => 
                        `flex items-center p-2 rounded-lg ${isActive ? 'bg-java-50 text-java-600' : 'text-java-800 hover:bg-gray-100'}`
                      }
                      onClick={onClose}
                    >
                      <StarIcon className="h-5 w-5 mr-3" />
                      Collection
                    </NavLink>
                  </motion.div>
                  
                  {/* Best Seller Section */}
                  <motion.div
                    variants={{
                      hidden: { x: -20, opacity: 0 },
                      visible: { x: 0, opacity: 1 }
                    }}
                    whileHover={{ scale: 1.03 }}
                  >
                    <NavLink 
                      to="/best-seller" 
                      className={({ isActive }) => 
                        `flex items-center p-2 rounded-lg ${isActive ? 'bg-java-50 text-java-600' : 'text-java-800 hover:bg-gray-100'}`
                      }
                      onClick={onClose}
                    >
                      <FireIcon className="h-5 w-5 mr-3" />
                      Best Seller
                    </NavLink>
                  </motion.div>
                
                  
                  {/* Contact link removed from upper navigation */}
                </motion.div>
                
                {/* User Account Section */}
                <motion.div 
                  className="pt-4 mt-4 border-t border-gray-200"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { delay: 0.2 } }
                  }}
                >
                  <motion.h3 
                    className="text-sm font-medium text-gray-500 mb-2"
                    variants={{
                      hidden: { y: 10, opacity: 0 },
                      visible: { y: 0, opacity: 1 }
                    }}
                  >
                    Your Account
                  </motion.h3>
                  
                  {!isAuthenticated ? (
                    <>
                      <motion.div
                        variants={{
                          hidden: { x: -20, opacity: 0 },
                          visible: { x: 0, opacity: 1 }
                        }}
                        whileHover={{ scale: 1.03 }}
                      >
                        <NavLink 
                          to="/login" 
                          className={({ isActive }) => 
                            `flex items-center p-2 rounded-lg ${isActive ? 'bg-java-50 text-java-600' : 'text-java-800 hover:bg-gray-100'}`
                          }
                          onClick={onClose}
                        >
                          <UserIcon className="h-5 w-5 mr-3" />
                          Login / Register
                        </NavLink>
                      </motion.div>
                      
                    </>
                  ) : (
                    <motion.div 
                      className="space-y-2"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1 }
                      }}
                    >
                      {/* User Info */}
                      <motion.div 
                        className="p-3 bg-java-50 rounded-lg mb-2"
                        variants={{
                          hidden: { y: 10, opacity: 0 },
                          visible: { y: 0, opacity: 1 }
                        }}
                      >
                        <motion.p 
                          className="font-medium"
                          variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1 }
                          }}
                        >
                          {user?.firstName} {user?.lastName}
                        </motion.p>
                        <motion.p 
                          className="text-sm text-gray-600"
                          variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1, transition: { delay: 0.1 } }
                          }}
                        >
                          {user?.email}
                        </motion.p>
                      </motion.div>
                      
                      {/* Account Links */}
                      <motion.div
                        variants={{
                          hidden: { x: -20, opacity: 0 },
                          visible: { x: 0, opacity: 1 }
                        }}
                        whileHover={{ scale: 1.03 }}
                      >
                        <NavLink 
                          to="/account/profile" 
                          className={({ isActive }) => 
                            `flex items-center p-2 rounded-lg ${isActive ? 'bg-java-50 text-java-600' : 'text-java-800 hover:bg-gray-100'}`
                          }
                          onClick={onClose}
                        >
                          <UserIcon className="h-5 w-5 mr-3" />
                          My Profile
                        </NavLink>
                      </motion.div>
                      
                      <motion.div
                        variants={{
                          hidden: { x: -20, opacity: 0 },
                          visible: { x: 0, opacity: 1 }
                        }}
                        whileHover={{ scale: 1.03 }}
                      >
                        <NavLink 
                          to="/account/orders" 
                          className={({ isActive }) => 
                            `flex items-center p-2 rounded-lg ${isActive ? 'bg-java-50 text-java-600' : 'text-java-800 hover:bg-gray-100'}`
                          }
                          onClick={onClose}
                        >
                          <ClipboardDocumentListIcon className="h-5 w-5 mr-3" />
                          My Orders
                        </NavLink>
                      </motion.div>
                      
                      <motion.div
                        variants={{
                          hidden: { x: -20, opacity: 0 },
                          visible: { x: 0, opacity: 1 }
                        }}
                        whileHover={{ scale: 1.03 }}
                      >
                        <NavLink 
                          to="/account/wishlist" 
                          className={({ isActive }) => 
                            `flex items-center p-2 rounded-lg ${isActive ? 'bg-java-50 text-java-600' : 'text-java-800 hover:bg-gray-100'}`
                          }
                          onClick={onClose}
                        >
                          <HeartIconSolid className="h-5 w-5 mr-3" />
                          My Wishlist
                        </NavLink>
                      </motion.div>
                      
                      {/* Admin Dashboard Link */}
                      {isAdmin && (
                        <motion.div
                          variants={{
                            hidden: { x: -20, opacity: 0 },
                            visible: { x: 0, opacity: 1 }
                          }}
                          whileHover={{ scale: 1.03 }}
                        >
                          <NavLink 
                            to="/admin/dashboard" 
                            className={({ isActive }) => 
                              `flex items-center p-2 rounded-lg ${isActive ? 'bg-java-50 text-java-600' : 'text-java-800 hover:bg-gray-100'}`
                            }
                            onClick={onClose}
                          >
                            <UserIcon className="h-5 w-5 mr-3" />
                            Admin Dashboard
                          </NavLink>
                        </motion.div>
                      )}
                      
                      {/* SubAdmin Dashboard Link */}
                      {isSubAdmin && !isAdmin && (
                        <motion.div
                          variants={{
                            hidden: { x: -20, opacity: 0 },
                            visible: { x: 0, opacity: 1 }
                          }}
                          whileHover={{ scale: 1.03 }}
                        >
                          <NavLink 
                            to="/subadmin/dashboard" 
                            className={({ isActive }) => 
                              `flex items-center p-2 rounded-lg ${isActive ? 'bg-java-50 text-java-600' : 'text-java-800 hover:bg-gray-100'}`
                            }
                            onClick={onClose}
                          >
                            <UserIcon className="h-5 w-5 mr-3" />
                            SubAdmin Dashboard
                          </NavLink>
                        </motion.div>
                      )}
                      
                      {/* Logout Button */}
                      <motion.div
                        variants={{
                          hidden: { x: -20, opacity: 0 },
                          visible: { x: 0, opacity: 1 }
                        }}
                        whileHover={{ scale: 1.03 }}
                      >
                        <button 
                          onClick={handleLogout}
                          className="flex items-center p-2 rounded-lg w-full text-left text-red-600 hover:bg-gray-100"
                        >
                          <XMarkIcon className="h-5 w-5 mr-3" />
                          Logout
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              </motion.nav>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  )
}

export default NavbarOffcanvas