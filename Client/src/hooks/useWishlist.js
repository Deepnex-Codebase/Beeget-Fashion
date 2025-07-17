import { useContext } from 'react'
import WishlistContext from '../contexts/WishlistContext'

/**
 * Custom hook to access wishlist context
 * @returns {Object} Wishlist context values and methods
 */
const useWishlist = () => {
  const context = useContext(WishlistContext)
  
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  
  return context
}

export default useWishlist