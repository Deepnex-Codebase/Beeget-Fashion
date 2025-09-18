import { createContext, useState, useEffect, useContext } from 'react'
import { AuthContext } from './AuthContext'
import api from '../utils/api'
import gstConfig from '../config/gstConfig'
import { convertToGSTInclusive } from '../utils/gstUtils'

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
          
          // Load coupon information from localStorage
          const storedCoupon = localStorage.getItem('cartCoupon')
          if (storedCoupon) {
            try {
              const couponData = JSON.parse(storedCoupon)
              setCouponCode(couponData.code || '')
              setCouponDiscount(couponData.discount || 0)
            } catch (err) {
              console.error('Error parsing coupon from localStorage:', err)
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
    if (!isAuthenticated) {
      if (cart.length > 0) {
        localStorage.setItem('cart', JSON.stringify(cart))
      }
      // Save coupon information to localStorage
      localStorage.setItem('cartCoupon', JSON.stringify({
        code: couponCode,
        discount: couponDiscount
      }))
    }
  }, [cart, couponCode, couponDiscount, isAuthenticated])
  
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
        try {
          const response = await api.post('/cart/apply-coupon', { code })
          
          if (response.data.success) {
            setCouponCode(code)
            const discount = response.data.data.couponDetails?.discount || 0
            setCouponDiscount(discount)
            return { success: true, data: response.data.data }
          } else {
            setCouponError(response.data.message || 'Invalid coupon')
            return { success: false, error: response.data.message || 'Invalid coupon' }
          }
        } catch (error) {
          console.error('Error applying coupon:', error)
          setCouponError(error.response?.data?.message || 'Failed to apply coupon')
          return { success: false, error: error.response?.data?.message || 'Failed to apply coupon' }
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
        const response = await api.post('/cart/remove-coupon')
        if (response.data.success) {
          setCouponCode('')
          setCouponDiscount(0)
          setCouponError(null)
          return { success: true }
        }
        return { success: false, error: response.data.message || 'Failed to remove coupon' }
      } else {
        // For guest users, update state and localStorage
        setCouponCode('')
        setCouponDiscount(0)
        setCouponError(null)
        // Clear coupon data in localStorage
        localStorage.setItem('cartCoupon', JSON.stringify({
          code: '',
          discount: 0
        }))
        return { success: true }
      }
    } catch (error) {
      console.error('Error removing coupon:', error)
      setError('Failed to remove coupon')
      return { success: false, error: error.message || 'Failed to remove coupon' }
    } finally {
      setLoading(false)
    }
  }
  
  // Calculate cart subtotal (GST-exclusive)
  const getCartSubtotal = () => {
    return Math.round(cart.reduce((total, item) => {
      // Use sellingPrice for consistency with backend
      const price = item.sellingPrice || item.price || 0;
      return total + (price * item.quantity)
    }, 0))
  }
  
  // Calculate cart subtotal with GST-inclusive prices (this is the display subtotal)
  const getCartSubtotalInclusive = () => {
    return Math.round(cart.reduce((total, item) => {
      // Use sellingPrice for consistency with backend
      const price = item.sellingPrice || item.price || 0;
      const gstRate = item.gstRate !== undefined ? item.gstRate : 5; // Default 5% GST
      const inclusivePrice = convertToGSTInclusive(price, gstRate);
      return total + (inclusivePrice * item.quantity)
    }, 0))
  }
  
  // Get the discount amount (this is what gets subtracted from subtotal)
  const getDiscountAmount = () => {
    return Math.round(couponDiscount || 0)
  }
  
  // Calculate GST amount from the final total (after discount)
  const getGstAmount = () => {
    const finalTotal = getCartTotal()
    
    // Calculate GST from the final total amount
    let totalGst = 0
    
    // If we have item-specific GST rates, calculate proportionally
    if (cart.length > 0 && cart.some(item => item.gstRate)) {
      const subtotalInclusive = getCartSubtotalInclusive()
      const discountRatio = subtotalInclusive > 0 ? finalTotal / subtotalInclusive : 1
      
      // Calculate GST for each item proportionally
      cart.forEach(item => {
        const price = item.sellingPrice || item.price || 0;
        const gstRate = item.gstRate !== undefined ? item.gstRate : 5;
        const inclusivePrice = convertToGSTInclusive(price, gstRate);
        const itemTotal = inclusivePrice * item.quantity;
        
        // Apply the same ratio as the final total
        const proportionalItemTotal = itemTotal * discountRatio
        
        // Calculate GST from the proportional GST-inclusive price
        const itemGstAmount = (proportionalItemTotal * gstRate) / (100 + gstRate)
        totalGst += itemGstAmount
      })
      
      return Math.round(totalGst)
    } else {
      // Fallback to configured GST rate
      const gstRate = 5; // Default 5% GST
      return Math.round((finalTotal * gstRate) / (100 + gstRate))
    }
  }
  
  // Calculate cart total (subtotal minus discount)
  const getCartTotal = () => {
    const subtotalInclusive = getCartSubtotalInclusive()
    const discount = getDiscountAmount()
    
    // Standard e-commerce: Total = Subtotal - Discount
    return Math.round(Math.max(0, subtotalInclusive - discount))
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
        getCartSubtotalInclusive,
        getDiscountAmount,
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