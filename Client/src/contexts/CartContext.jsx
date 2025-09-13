import { createContext, useState, useEffect, useContext } from 'react'
import { AuthContext } from './AuthContext'
import api from '../utils/api'

const CartContext = createContext()

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponError, setCouponError] = useState(null)
  const { isAuthenticated, user } = useContext(AuthContext)
  
  // Initialize cart from localStorage or backend
  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true)
      setError(null)
      
      try {
        if (isAuthenticated) {
          // Fetch cart from backend for authenticated users
          const response = await api.get('/cart')
          if (response.data.success) {
            // Transform backend format to frontend format if needed
            const backendCart = response.data.data.items.map(item => {
              if (!item || !item.productId) return null; // Skip null items
              
              // Get product details
              const product = item.productId
              
              // Create cart item with all necessary properties
              return {
                id: item._id || '',
                productId: product._id || '',
                name: product.title || '',
                title: product.title || '',
                price: product.price || 0,
                mrp: product.mrp || product.price || 0, // Use MRP or fallback to price
                image: product.images && product.images.length > 0 ? product.images[0] : '',
                quantity: item.quantity || 1,
                size: item.size || null,
                color: item.color || null,
                slug: product.slug || '',
                variantSku: item.variantSku || null
              }
            }).filter(item => item !== null) // Remove any null items
            
            setCart(backendCart)
            
            // Set coupon information if available
            if (response.data.data.coupon) {
              setCouponCode(response.data.data.coupon.code || '')
              setCouponDiscount(response.data.data.couponDiscount || 0)
            }
          }
        } else {
          // Initialize from localStorage for non-authenticated users
          const storedCart = localStorage.getItem('cart')
          if (storedCart) {
            try {
              setCart(JSON.parse(storedCart))
            } catch (err) {
              console.error('Error parsing cart from localStorage:', err)
              setCart([])
              localStorage.removeItem('cart')
            }
          }
        }
      } catch (err) {
        console.error('Error fetching cart:', err)
        setError('Failed to load cart. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchCart()
  }, [isAuthenticated])
  
  // Save cart to localStorage whenever it changes (for non-authenticated users)
  useEffect(() => {
    if (!isAuthenticated && cart.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cart))
    }
  }, [cart, isAuthenticated])
  
  // Add item to cart
  const addToCart = async (product, quantity = 1, size = null, color = null) => {
    if (!product || !product.id) {
      setError('Invalid product')
      return
    }
    
    try {
      setLoading(true)
      
      // Check if item already exists in cart
      const existingItemIndex = cart.findIndex(item => 
        item.id === product.id && 
        item.size === size && 
        item.color === color
      )
      
      if (existingItemIndex !== -1) {
        // Update quantity if item exists
        const updatedCart = [...cart]
        updatedCart[existingItemIndex].quantity += quantity
        
        if (isAuthenticated) {
          // Update in backend
          await api.put(`/cart/item/${updatedCart[existingItemIndex].id}`, {
            quantity: updatedCart[existingItemIndex].quantity
          })
        }
        
        setCart(updatedCart)
      } else {
        // Add new item
        const newItem = {
          ...product,
          quantity,
          size,
          color
        }
        
        if (isAuthenticated) {
          // Add to backend
          const response = await api.post('/cart', {
            productId: product.id,
            quantity,
            size,
            color,
            variantSku: product.variantSku || null
          })
          
          if (response.data.success) {
            // Use the returned item from backend which includes the item ID
            const backendItem = response.data.data.items.find(item => 
              item.productId._id === product.id && 
              item.size === size && 
              item.color === color
            )
            
            if (backendItem) {
              newItem.id = backendItem._id
            }
          }
        }
        
        setCart([...cart, newItem])
      }
    } catch (err) {
      console.error('Error adding to cart:', err)
      setError('Failed to add item to cart')
    } finally {
      setLoading(false)
    }
  }
  
  // Update item quantity
  const updateQuantity = async (itemId, quantity) => {
    try {
      setLoading(true)
      
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        return removeFromCart(itemId)
      }
      
      const updatedCart = cart.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
      
      if (isAuthenticated) {
        // Update in backend
        await api.put(`/cart/item/${itemId}`, { quantity })
      }
      
      setCart(updatedCart)
    } catch (err) {
      console.error('Error updating quantity:', err)
      setError('Failed to update quantity')
    } finally {
      setLoading(false)
    }
  }
  
  // Remove item from cart
  const removeFromCart = async (itemId) => {
    try {
      setLoading(true)
      
      const updatedCart = cart.filter(item => item.id !== itemId)
      
      if (isAuthenticated) {
        // Remove from backend
        await api.delete(`/cart/item/${itemId}`)
      }
      
      setCart(updatedCart)
    } catch (err) {
      console.error('Error removing from cart:', err)
      setError('Failed to remove item from cart')
    } finally {
      setLoading(false)
    }
  }
  
  // Clear cart
  const clearCart = async () => {
    try {
      setLoading(true)
      
      if (isAuthenticated) {
        // Clear in backend
        await api.delete('/cart')
      }
      
      setCart([])
      setCouponCode('')
      setCouponDiscount(0)
      setCouponError(null)
      
      if (!isAuthenticated) {
        localStorage.removeItem('cart')
      }
    } catch (err) {
      console.error('Error clearing cart:', err)
      setError('Failed to clear cart')
    } finally {
      setLoading(false)
    }
  }
  
  // Apply coupon
  const applyCoupon = async (code) => {
    try {
      setLoading(true)
      setCouponError(null)
      
      if (isAuthenticated) {
        // Apply coupon in backend
        const response = await api.post('/cart/coupon', { code })
        
        if (response.data.success) {
          setCouponCode(code)
          setCouponDiscount(response.data.data.couponDiscount || 0)
        } else {
          setCouponError(response.data.message || 'Invalid coupon')
        }
      } else {
        // For non-authenticated users, just set the coupon code
        // In a real app, you would validate the coupon on the frontend
        setCouponCode(code)
        setCouponDiscount(0) // Set a default discount or calculate based on cart total
      }
    } catch (err) {
      console.error('Error applying coupon:', err)
      setCouponError(err.response?.data?.message || 'Failed to apply coupon')
    } finally {
      setLoading(false)
    }
  }
  
  // Remove coupon
  const removeCoupon = async () => {
    try {
      setLoading(true)
      
      if (isAuthenticated) {
        // Remove coupon in backend
        await api.delete('/cart/coupon')
      }
      
      setCouponCode('')
      setCouponDiscount(0)
      setCouponError(null)
    } catch (err) {
      console.error('Error removing coupon:', err)
      setError('Failed to remove coupon')
    } finally {
      setLoading(false)
    }
  }
  
  // Calculate cart subtotal
  const getCartSubtotal = () => {
    return cart.reduce((total, item) => {
      // Use selling price (price) for calculations, not MRP
      return total + (item.price * item.quantity)
    }, 0)
  }
  
  // Calculate cart total with discounts
  const getCartTotal = () => {
    const subtotal = getCartSubtotal()
    const discount = couponDiscount || 0
    
    // Apply discount
    return Math.max(0, subtotal - discount)
  }
  
  // Get total number of items in cart
  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }
  
  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        couponCode,
        couponDiscount,
        couponError,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
        getCartSubtotal,
        getCartTotal,
        getCartItemCount
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export default CartContext