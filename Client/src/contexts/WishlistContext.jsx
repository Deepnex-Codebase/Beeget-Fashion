import { createContext, useState, useEffect, useContext } from 'react'
import { AuthContext } from './AuthContext'
import api from '../utils/api'
import { toast } from 'react-toastify'

const WishlistContext = createContext()

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const { isAuthenticated } = useContext(AuthContext)
  
  // Initialize wishlist from localStorage or backend
  useEffect(() => {
    const fetchWishlist = async () => {
      setLoading(true)
      setError(null)
      
      try {
        if (isAuthenticated) {
          // Fetch wishlist from backend for authenticated users
          const response = await api.get('/wishlist')
          if (response.data.success) {
            // Transform backend format to frontend format if needed
            const backendWishlist = response.data.data.items.map(item => {
              // Always set hasStock to true as per requirement
              const enhancedItem = {
                ...item,
                id: item._id,
                productId: item.productId._id || item.productId,
                title: item.productDetails?.title || (item.productId.title || ''),
                price: item.productDetails?.price || (item.productId.price || 0),
                image: item.productDetails?.image || (item.productId.images && item.productId.images.length > 0 ? item.productId.images[0] : null),
                slug: item.productDetails?.slug || (item.productId.slug || item.productId._id),
                hasStock: true // Override stock status to always be in stock
              }
              
              // If productDetails exists, ensure hasStock is true
              if (enhancedItem.productDetails) {
                enhancedItem.productDetails.hasStock = true
              }
              
              return enhancedItem
            })
            setWishlist(backendWishlist)
          }
        } else {
          // Initialize from localStorage for non-authenticated users
          const storedWishlist = localStorage.getItem('wishlist')
          if (storedWishlist) {
            try {
              // Parse and ensure all items show as in stock
              const parsedWishlist = JSON.parse(storedWishlist).map(item => ({
                ...item,
                hasStock: true,
                productDetails: item.productDetails ? {
                  ...item.productDetails,
                  hasStock: true
                } : undefined
              }))
              setWishlist(parsedWishlist)
            } catch (error) {
              console.error('Error parsing stored wishlist data:', error)
              // Clear invalid data
              localStorage.removeItem('wishlist')
            }
          }
        }
      } catch (err) {
        console.error('Error fetching wishlist:', err)
        setError('Failed to load wishlist. Please try again.')
        
        // Fallback to localStorage if API fails
        const storedWishlist = localStorage.getItem('wishlist')
        if (storedWishlist) {
          try {
            // Parse and ensure all items show as in stock
            const parsedWishlist = JSON.parse(storedWishlist).map(item => ({
              ...item,
              hasStock: true,
              productDetails: item.productDetails ? {
                ...item.productDetails,
                hasStock: true
              } : undefined
            }))
            setWishlist(parsedWishlist)
          } catch (error) {
            console.error('Error parsing stored wishlist data:', error)
          }
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchWishlist()
  }, [isAuthenticated])
  
  // Save wishlist to localStorage for non-authenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('wishlist', JSON.stringify(wishlist))
    }
  }, [wishlist, isAuthenticated])

  // Simulated retry mechanism for demo purposes
  useEffect(() => {
    if (error && retryCount < 3) {
      const retryTimer = setTimeout(() => {
        console.log(`Simulating retry operation (attempt ${retryCount + 1})...`)
        // Reset error before retry
        setError(null)
        // Increment retry count
        setRetryCount(prev => prev + 1)
      }, 2000 * (retryCount + 1)) // Exponential backoff
      
      return () => clearTimeout(retryTimer)
    }
  }, [error, retryCount])
  
  // Add item to wishlist
  const addToWishlist = async (product) => {
    // Use _id if available, otherwise use id
    const productId = product._id || product.id;
    
    // Check if product already exists in wishlist
    if (isInWishlist(productId)) {
      toast.info('Product already in wishlist');
      return; // Already in wishlist
    }
    
    setLoading(true);
    setError(null);
    setRetryCount(0);
    
    try {
      if (isAuthenticated) {
        // Add to backend for authenticated users
        const response = await api.post('/wishlist', { productId });
        
        if (response.data.success) {
          // Transform backend format to frontend format
          const backendWishlist = response.data.data.items.map(item => {
            const enhancedItem = {
              ...item,
              id: item._id,
              productId: item.productId._id || item.productId,
              title: item.productDetails?.title || (item.productId.title || ''),
              price: item.productDetails?.price || (item.productId.price || 0),
              image: item.productDetails?.image || (item.productId.images && item.productId.images.length > 0 ? item.productId.images[0] : null),
              slug: item.productDetails?.slug || (item.productId.slug || item.productId._id),
              hasStock: true // Override stock status to always be in stock
            };
            
            // If productDetails exists, ensure hasStock is true
            if (enhancedItem.productDetails) {
              enhancedItem.productDetails.hasStock = true;
            }
            
            return enhancedItem;
          });
          
          setWishlist(backendWishlist);
          toast.success('Added to wishlist');
        } else {
          throw new Error('Failed to add to wishlist');
        }
      } else {
        // Add to local wishlist for non-authenticated users
        setWishlist(prevWishlist => {
          // Ensure product has all required fields including slug
          const enhancedProduct = {
            ...product,
            productId: {
              _id: productId,
              title: product.title || product.name,
              price: product.price || 0,
              images: product.images || (product.image ? [product.image] : []),
              slug: product.slug || productId // Ensure slug is set
            },
            slug: product.slug || productId, // Set slug at top level too
            _id: productId, // Ensure _id is set for removal
            addedAt: new Date().toISOString(),
            hasStock: true // Always in stock
          };
          
          const newWishlist = [...prevWishlist, enhancedProduct];
          localStorage.setItem('wishlist', JSON.stringify(newWishlist));
          return newWishlist;
        });
        
        toast.success('Added to wishlist');
      }
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      setError('Failed to add to wishlist. Please try again.');
      toast.error('Failed to add to wishlist');
    } finally {
      setLoading(false);
    }
  };
  
  // Remove item from wishlist
  const removeFromWishlist = async (itemId) => {
    setLoading(true)
    setError(null)
    setRetryCount(0)
    
    try {
      if (isAuthenticated) {
        // For authenticated users, directly use the itemId for API call
        // No need to search for the item in the wishlist
        const response = await api.delete(`/wishlist/${itemId}`)
        
        if (response.data.success) {
          // Transform backend format to frontend format
          const backendWishlist = response.data.data.items.map(item => {
            const enhancedItem = {
              ...item,
              id: item._id,
              productId: item.productId._id || item.productId,
              title: item.productDetails?.title || (item.productId.title || ''),
              price: item.productDetails?.price || (item.productId.price || 0),
              image: item.productDetails?.image || (item.productId.images && item.productId.images.length > 0 ? item.productId.images[0] : null),
              slug: item.productDetails?.slug || (item.productId.slug || item.productId._id),
              hasStock: true // Override stock status to always be in stock
            };
            
            // If productDetails exists, ensure hasStock is true
            if (enhancedItem.productDetails) {
              enhancedItem.productDetails.hasStock = true;
            }
            
            return enhancedItem;
          })
          
          setWishlist(backendWishlist)
          toast.success('Removed from wishlist')
        } else {
          throw new Error('Failed to remove from wishlist')
        }
      } else {
        // Remove from local wishlist for non-authenticated users
        setWishlist(prevWishlist => {
          const newWishlist = prevWishlist.filter(item => item._id !== itemId)
          localStorage.setItem('wishlist', JSON.stringify(newWishlist))
          return newWishlist
        })
        
        toast.success('Removed from wishlist')
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err)
      setError('Failed to remove from wishlist. Please try again.')
      toast.error('Failed to remove from wishlist')
    } finally {
      setLoading(false)
    }
  }
  
  // Check if item is in wishlist
  const isInWishlist = (itemId) => {
    return wishlist.some(item => {
      // Check all possible ID formats
      const id = item._id || item.id || (item.productId && (item.productId._id || item.productId))
      return id === itemId
    })
  }
  
  // Clear wishlist
  const clearWishlist = async () => {
    setLoading(true)
    setError(null)
    setRetryCount(0)
    
    try {
      if (isAuthenticated) {
        // Clear from backend for authenticated users
        const response = await api.delete('/wishlist')
        
        if (response.data.success) {
          setWishlist([])
          toast.success('Wishlist cleared')
        } else {
          throw new Error('Failed to clear wishlist')
        }
      } else {
        // Clear local wishlist for non-authenticated users
        setWishlist([])
        localStorage.setItem('wishlist', JSON.stringify([]))
        toast.success('Wishlist cleared')
      }
    } catch (err) {
      console.error('Error clearing wishlist:', err)
      setError('Failed to clear wishlist. Please try again.')
      toast.error('Failed to clear wishlist')
    } finally {
      setLoading(false)
    }
  }
  
  // Retry the last failed operation
  const retryOperation = () => {
    if (error) {
      setError(null)
      setRetryCount(0)
      
      // Simulate retry
      setLoading(true)
      setTimeout(() => {
        setLoading(false)
      }, 800)
    }
  }
  
  // Get wishlist item count
  const getWishlistItemCount = () => {
    return wishlist.length
  }
  
  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        error,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        getWishlistItemCount,
        retryOperation
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export default WishlistContext