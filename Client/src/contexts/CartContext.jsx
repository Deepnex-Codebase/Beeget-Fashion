import { createContext, useState, useEffect, useContext } from 'react'
import { AuthContext } from './AuthContext'
import api from '../utils/api'
import gstConfig from '../config/gstConfig'

export const CartContext = createContext()

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
              
              // Get product details from the stored productDetails
              const productDetails = item.productDetails || {};
              const product = item.productId;
              
              // Create cart item with all necessary properties
              return {
                id: item._id || '',
                productId: product._id || '', // Ensure productId is always set correctly
                name: productDetails.title || product.title || '',
                title: productDetails.title || product.title || '',
                price: productDetails.price || 0,
                sellingPrice: productDetails.sellingPrice || productDetails.price || 0,
                mrp: productDetails.mrp || productDetails.price || 0,
                image: productDetails.image || (product.images && product.images.length > 0 ? product.images[0] : ''),
                quantity: item.quantity || 1,
                size: item.size || null,
                color: item.color || null,
                slug: productDetails.slug || product.slug || '',
                variantSku: item.variantSku || null,
                gstRate: item.gstRate || productDetails.gstRate || 0
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
    if (!product || (!product.id && !product._id)) {
      setError('Invalid product')
      return
    }
    
    try {
      setLoading(true)
      
      const productId = product._id || product.id
      
      // Check if item already exists in cart
      const existingItemIndex = cart.findIndex(item => 
        item.productId === productId && 
        item.size === size && 
        item.color === color
      )
      
      if (existingItemIndex !== -1) {
        // Update quantity if item exists
        const updatedCart = [...cart]
        updatedCart[existingItemIndex].quantity += quantity
        
        if (isAuthenticated) {
          // Update in backend
          await api.patch(`/cart/${updatedCart[existingItemIndex].id}`, {
            quantity: updatedCart[existingItemIndex].quantity
          })
        }
        
        setCart(updatedCart)
      } else {
        // Add new item
        const newItem = {
          id: '', // Will be set from backend response if authenticated
          productId: productId,
          name: product.title || product.name || '',
          title: product.title || product.name || '',
          price: product.price || 0,
          sellingPrice: product.sellingPrice || product.price || 0,
          mrp: product.mrp || product.price || 0,
          image: product.image || (product.images && product.images.length > 0 ? product.images[0] : ''),
          quantity,
          size,
          color,
          slug: product.slug || '',
          variantSku: product.variantSku || null,
          gstRate: product.gstRate || 0
        }
        
        if (isAuthenticated) {
          // Add to backend
          const response = await api.post('/cart', {
            productId: productId,
            quantity,
            size,
            color,
            variantSku: product.variantSku || null
          })
          
          if (response.data.success) {
            // Find the newly added item in the response
            const items = response.data.data.items || []
            const backendItem = items.find(item => 
              (item.productId._id === productId || item._id === items[items.length - 1]._id) && 
              item.size === size && 
              item.color === color
            )
            
            if (backendItem) {
              newItem.id = backendItem._id
              
              // Update with product details from backend if available
              if (backendItem.productDetails) {
                newItem.price = backendItem.productDetails.price || newItem.price
                newItem.sellingPrice = backendItem.productDetails.sellingPrice || newItem.sellingPrice
                newItem.mrp = backendItem.productDetails.mrp || newItem.mrp
                newItem.gstRate = backendItem.gstRate || backendItem.productDetails.gstRate || newItem.gstRate
              }
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
        const response = await api.patch(`/cart/${itemId}`, { quantity })
        
        // Update item with latest product details from backend if available
        if (response.data && response.data.success && response.data.data) {
          const updatedItem = response.data.data.items.find(item => item._id === itemId)
          if (updatedItem && updatedItem.productDetails) {
            const itemIndex = updatedCart.findIndex(item => item.id === itemId)
            if (itemIndex !== -1) {
              updatedCart[itemIndex].price = updatedItem.productDetails.price || updatedCart[itemIndex].price
              updatedCart[itemIndex].sellingPrice = updatedItem.productDetails.sellingPrice || updatedCart[itemIndex].sellingPrice
              updatedCart[itemIndex].mrp = updatedItem.productDetails.mrp || updatedCart[itemIndex].mrp
              updatedCart[itemIndex].gstRate = updatedItem.gstRate || updatedItem.productDetails.gstRate || updatedCart[itemIndex].gstRate
            }
          }
        }
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
        await api.delete(`/cart/${itemId}`)
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
      // Use sellingPrice for consistency with backend
      const price = item.sellingPrice || item.price || 0;
      return total + (price * item.quantity)
    }, 0)
  }
  
  // Calculate GST amount (using item-specific GST rates)
  const getGstAmount = () => {
    const subtotal = getCartSubtotal()
    const discount = couponDiscount || 0
    const discountedAmount = Math.max(0, subtotal - discount)
    
    // Calculate GST based on each item's GST rate
    let totalGst = 0
    
    // If we have item-specific GST rates, use them
    if (cart.length > 0 && cart.some(item => item.gstRate)) {
      // Calculate GST for each item individually
      cart.forEach(item => {
        const itemPrice = (item.sellingPrice || item.price || 0) * item.quantity
        const itemGstRate = item.gstRate || gstConfig.TOTAL_GST_RATE * 100 // Default to config rate if not specified
        totalGst += (itemPrice * itemGstRate) / 100
      })
      
      // Apply discount proportionally to GST
      if (discount > 0 && subtotal > 0) {
        const discountRatio = discount / subtotal
        totalGst = totalGst * (1 - discountRatio)
      }
      
      return totalGst
    } else {
      // Fallback to configured GST rate
      return discountedAmount * gstConfig.TOTAL_GST_RATE
    }
  }
  
  // Calculate cart total with discounts and GST
  const getCartTotal = () => {
    const subtotal = getCartSubtotal()
    const discount = couponDiscount || 0
    const discountedAmount = Math.max(0, subtotal - discount)
    const gstAmount = getGstAmount()
    
    // Apply discount and add GST
    return discountedAmount + gstAmount
  }
  
  // Get total number of items in cart
  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }
  
  // Process checkout
  const checkout = async (orderData) => {
    try {
      setLoading(true)
      
      // Create order API endpoint
      const response = await api.post('/orders', orderData)
      
      if (response.data.success) {
        // Clear cart after successful order
        await clearCart()
        return response.data
      } else {
        throw new Error(response.data.message || 'Checkout failed')
      }
    } catch (err) {
      console.error('Error during checkout:', err)
      throw err
    } finally {
      setLoading(false)
    }
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
        getGstAmount,
        getCartTotal,
        getCartItemCount,
        checkout
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export default CartContext