import { createContext, useState, useEffect } from 'react'
import axios from '../utils/api'

// Helper function to transform backend cart items to frontend format
const transformCartItems = (items, variantSku = null) => {
  return items.map(item => ({
    id: item.productId._id,
    _id: item._id, // Store the cart item ID for future operations
    name: item.productDetails?.title || item.productId.title,
    title: item.productDetails?.title || item.productId.title,
    price: item.productDetails?.price || (item.productId.variants && item.productId.variants.length > 0 ? parseFloat(item.productId.variants[0].price) : 0),
    mrp: item.productDetails?.mrp || item.productDetails?.price || (item.productId.variants && item.productId.variants.length > 0 ? parseFloat(item.productId.variants[0].mrp || item.productId.variants[0].price) : (item.productId.mrp || item.productId.price || 0)),
    slug: item.productDetails?.slug || item.productId.slug,
    image: item.productDetails?.image || (item.productId.images && item.productId.images.length > 0 ? item.productId.images[0] : null),
    quantity: item.quantity,
    size: item.size || null,
    color: item.color || null,
    gstRate: item.gstRate || 0, // Add GST rate from product
    variantSku: item.variantSku || variantSku, // Ensure variantSku is set
    addedAt: new Date().toISOString()
  }))
}

const CartContext = createContext()

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponError, setCouponError] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Check if user is authenticated
  useEffect(() => {
    const tokens = localStorage.getItem('tokens')
    setIsAuthenticated(!!tokens)
  }, [])
  
  // First, try to load cart from localStorage on initial render
  useEffect(() => {
    const storedCart = localStorage.getItem('cart')
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart)
        setCart(parsedCart)
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('cart')
        setCart([])
      }
    } else {
      // No cart data found in localStorage
    }
    setIsInitialized(true)
  }, []) // Run only once on component mount
  
  // Then, fetch cart from backend if user is authenticated or has a guest session
  useEffect(() => {
    const fetchCartFromBackend = async () => {
      // Skip backend fetch if we already have cart data in localStorage
      const storedCart = localStorage.getItem('cart')
      if (storedCart && JSON.parse(storedCart).length > 0) {
        return
      }
      
      try {
        setLoading(true)
        
        if (isAuthenticated) {
          // Fetch cart for authenticated user
          const response = await axios.get('/cart')
          if (response.data.success) {
            // Transform backend cart format to frontend format
            const backendCart = transformCartItems(response.data.data.items)
            // Only update cart if backend has items, otherwise keep localStorage cart
            if (backendCart.length > 0) {
              setCart(backendCart)
              localStorage.setItem('cart', JSON.stringify(backendCart))
            } else {
              // Backend cart is empty, keeping localStorage cart
            }
          }
        } else {
          // Check if we have a guest session ID
          const guestSessionId = localStorage.getItem('guestSessionId')
          
          if (guestSessionId) {
            // Fetch cart for guest user
            const response = await axios.get(`/cart/guest/${guestSessionId}`)
            if (response.data.success) {
            // Transform backend cart format to frontend format
            const backendCart = transformCartItems(response.data.data.items)
              // Only update cart if backend has items, otherwise keep localStorage cart
              if (backendCart.length > 0) {
                setCart(backendCart)
                localStorage.setItem('cart', JSON.stringify(backendCart))
              } else {
                // Backend guest cart is empty, keeping localStorage cart
              }
            }
          } else {
            // Create a new guest session ID
            const newGuestSessionId = 'guest-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15)
            localStorage.setItem('guestSessionId', newGuestSessionId)
          }
        }
      } catch (err) {
        // Keep localStorage cart on backend error
      } finally {
        setLoading(false)
      }
    }
    
    fetchCartFromBackend()
  }, [isAuthenticated]) // Only run when authentication status changes
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    // Only save to localStorage after initialization and when cart actually changes
    if (isInitialized) {
      localStorage.setItem('cart', JSON.stringify(cart))
    }
  }, [cart, isInitialized])
  
  // Add to cart
  const addToCart = async (product, quantity = 1, size = null, color = null) => {
    try {
      setLoading(true)
      setError(null)
      
      // Ensure quantity is a valid number
      const parsedQuantity = parseInt(quantity, 10)
      if (isNaN(parsedQuantity) || parsedQuantity < 1) {
        quantity = 1 // Set to default valid quantity
      } else {
        quantity = parsedQuantity
      }
      
      // Check if the product is already in the cart with the same size and color
      const existingItemIndex = cart.findIndex(item => 
        (item.id === product.id || item._id === product._id) && 
        (size ? item.size === size : true) && 
        (color ? item.color === color : true)
      )
      
      if (existingItemIndex !== -1) {
        // If product exists, update quantity instead of adding new item
        const newQuantity = cart[existingItemIndex].quantity + quantity
        return updateQuantity(product.id || product._id, newQuantity, size, color)
      }
      
      // Ensure variantSku is not undefined or null
      let variantSku = product.sku || (product.variant && product.variant.sku);
      
      // If still no variantSku, generate a fallback
      if (!variantSku) {
        // Generate a fallback SKU using product ID and size/color if available
        variantSku = `${product.id || product._id}-${size || 'default'}-${color || 'default'}`;
      }
      
      // Prepare the product object with additional properties
      const productToAdd = {
        ...product,
        quantity,
        size,
        color,
        variantSku: variantSku,
        gstRate: product.gstRate || 0, // Add GST rate from product
        mrp: product.mrp || product.price, // Ensure MRP is included
        addedAt: new Date().toISOString()
      }
      
      if (isAuthenticated) {
        // For authenticated users, add to backend
        const response = await axios.post('/cart', {
          productId: product.id || product._id,
          quantity,
          size,
          color,
          variantSku: variantSku // Add variantSku to backend request
        })
        
        if (response.data.success) {
          // Transform backend cart format to frontend format
          const backendCart = transformCartItems(response.data.data.items, variantSku)
          
          // Update state and localStorage in one place
          setCart(backendCart)
          localStorage.setItem('cart', JSON.stringify(backendCart))
        }
      } else {
        // For guest users, check if we have a guest session ID
        const guestSessionId = localStorage.getItem('guestSessionId')
        
        if (!guestSessionId) {
          // Create a new guest session ID if not exists
          const newGuestSessionId = 'guest-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15)
          localStorage.setItem('guestSessionId', newGuestSessionId)
          
          // Add to guest cart in backend
          const response = await axios.post(`/cart/guest/${newGuestSessionId}`, {
            productId: product.id || product._id,
            quantity,
            size,
            color,
            variantSku: variantSku // Add variantSku to backend request
          })
          
          if (response.data.success) {
            // Transform backend cart format to frontend format
            const backendCart = response.data.data.items.map(item => ({
              id: item.productId._id,
              _id: item._id, // Store the cart item ID for future operations
              name: item.productDetails?.title || item.productId.title,
              title: item.productDetails?.title || item.productId.title,
              price: item.productDetails?.price || (item.productId.variants && item.productId.variants.length > 0 ? parseFloat(item.productId.variants[0].price) : 0),
              mrp: item.productDetails?.mrp || (item.productId.variants && item.productId.variants.length > 0 ? parseFloat(item.productId.variants[0].mrp || item.productId.variants[0].price) : (item.productId.mrp || item.productId.price || 0)),
              slug: item.productDetails?.slug || item.productId.slug,
              image: item.productDetails?.image || (item.productId.images && item.productId.images.length > 0 ? item.productId.images[0] : null),
              quantity: item.quantity,
              size: item.size || null,
              color: item.color || null,
              gstRate: item.gstRate || 0, // Add GST rate from product
              variantSku: item.variantSku || variantSku, // Ensure variantSku is set
              addedAt: new Date().toISOString()
            }))
            
            // Update state and localStorage in one place
            setCart(backendCart)
            localStorage.setItem('cart', JSON.stringify(backendCart))
          }
        } else {
          // Add to existing guest cart in backend
          const response = await axios.post(`/cart/guest/${guestSessionId}`, {
            productId: product.id || product._id,
            quantity,
            size,
            color,
            variantSku: variantSku // Add variantSku to backend request
          })
          
          if (response.data.success) {
            // Transform backend cart format to frontend format
            const backendCart = transformCartItems(response.data.data.items, variantSku)
            
            // Update state and localStorage in one place
            setCart(backendCart)
            localStorage.setItem('cart', JSON.stringify(backendCart))
          }
        }
      }
      
      // Dispatch custom event to open cart sidebar
      const event = new CustomEvent('openCartSidebar')
      window.dispatchEvent(event)
      
    } catch (error) {
      setError(error.message || 'Failed to add to cart')
      // Failed to add to cart
    } finally {
      setLoading(false)
    }
  }
  
  // Remove from cart
  const removeFromCart = async (itemId, size = null, color = null) => {
    try {
      setLoading(true)
      setError(null)
      
      if (isAuthenticated) {
        // For authenticated users, remove from backend
        // First find the cart item that matches the criteria
        const cartItem = cart.find(item => 
          (item.id === itemId || item._id === itemId) && 
          (size ? item.size === size : true) && 
          (color ? item.color === color : true)
        )
        
        if (cartItem) {
          // For backend, we need the cart item ID, not the product ID
          const response = await axios.delete(`/cart/${cartItem._id}`)
          
          if (response.data.success) {
            // Transform backend cart format to frontend format
            const backendCart = transformCartItems(response.data.data.items)
            
            // Update state and localStorage in one place
            setCart(backendCart)
            localStorage.setItem('cart', JSON.stringify(backendCart))
            
           
          }
        } else {
          throw new Error('Cart item not found')
        }
      } else {
        // For guest users, check if we have a guest session ID
        const guestSessionId = localStorage.getItem('guestSessionId')
        
        if (guestSessionId) {
          // First find the cart item that matches the criteria
          const cartItem = cart.find(item => 
            (item.id === itemId || item._id === itemId) && 
            (size ? item.size === size : true) && 
            (color ? item.color === color : true)
          )
          
          if (cartItem) {
            // For backend, we need the cart item ID, not the product ID
            const response = await axios.delete(`/cart/guest/${guestSessionId}/${cartItem._id}`)
            
            if (response.data.success) {
              // Transform backend cart format to frontend format
              const backendCart = transformCartItems(response.data.data.items)
              
              // Update state and localStorage in one place
              setCart(backendCart)
              localStorage.setItem('cart', JSON.stringify(backendCart))
              
            
            }
          } else {
            throw new Error('Cart item not found')
          }
        } else {
          // Fallback to localStorage if no guest session ID
          // Fix the filter logic to correctly remove items
          const filteredCart = cart.filter(item => 
            !((item.id === itemId || item._id === itemId) && 
              (!size || item.size === size) && 
              (!color || item.color === color))
          )
          
          // Update state and localStorage in one place
          setCart(filteredCart)
          localStorage.setItem('cart', JSON.stringify(filteredCart))
          
        
        }
      }
    } catch (error) {
      // console.error('Error removing from cart:', error)
      setError(error.message || 'Failed to remove item from cart')
      // Failed to remove item from cart
    } finally {
      setLoading(false)
    }
  }
  
  // Update quantity
  const updateQuantity = async (itemId, quantity, size = null, color = null) => {
    try {
      setLoading(true)
      setError(null)
      
      // Ensure quantity is a valid number
      const parsedQuantity = parseInt(quantity, 10)
      
      // If quantity is invalid, set to 1
      if (isNaN(parsedQuantity) || parsedQuantity < 1) {
        // If quantity is 0 or less, remove the item
        if (parsedQuantity <= 0) {
          return removeFromCart(itemId, size, color)
        }
        // Otherwise set to minimum valid quantity
        quantity = 1
      } else {
        // Use the parsed quantity
        quantity = parsedQuantity
      }
      
      if (isAuthenticated) {
        // For authenticated users, update on backend
        // First find the cart item that matches the criteria
        const cartItem = cart.find(item => 
          (item.id === itemId || item._id === itemId) && 
          (size ? item.size === size : true) && 
          (color ? item.color === color : true)
        )
        
        if (cartItem) {
          // For backend, we need the cart item ID, not the product ID
          // cartItem._id should be the cart item ID from the backend
          const response = await axios.patch(`/cart/${cartItem._id}`, { quantity })
          
          if (response.data.success) {
            // Transform backend cart format to frontend format
            const backendCart = response.data.data.items.map(item => ({
              id: item.productId._id,
              _id: item._id, // Store the cart item ID for future operations
              name: item.productId.title,
              title: item.productId.title,
              price: item.productId.variants && item.productId.variants.length > 0 ? parseFloat(item.productId.variants[0].price) : 0,
              mrp: item.productId.variants && item.productId.variants.length > 0 ? parseFloat(item.productId.variants[0].mrp || item.productId.variants[0].price) : (item.productId.mrp || item.productId.price || 0),
              image: item.productId.images && item.productId.images.length > 0 ? item.productId.images[0] : null,
              quantity: item.quantity,
              size: item.size || null,
              color: item.color || null,
              gstRate: item.gstRate || 0, // Add GST rate from product
              addedAt: new Date().toISOString()
            }))
            
            // Update state and localStorage in one place
            setCart(backendCart)
            localStorage.setItem('cart', JSON.stringify(backendCart))
            
          
          }
        } else {
          throw new Error('Cart item not found')
        }
      } else {
        // For guest users, check if we have a guest session ID
        const guestSessionId = localStorage.getItem('guestSessionId')
        
        if (guestSessionId) {
          // First find the cart item that matches the criteria
          const cartItem = cart.find(item => 
            (item.id === itemId || item._id === itemId) && 
            (size ? item.size === size : true) && 
            (color ? item.color === color : true)
          )
          
          if (cartItem) {
            // For backend, we need the cart item ID, not the product ID
            const response = await axios.patch(`/cart/guest/${guestSessionId}/${cartItem._id}`, { quantity })
            
            if (response.data.success) {
              // Transform backend cart format to frontend format
              const backendCart = transformCartItems(response.data.data.items)
              
              // Update state and localStorage in one place
              setCart(backendCart)
              localStorage.setItem('cart', JSON.stringify(backendCart))
              
              // Cart updated successfully
            }
          } else {
            throw new Error('Cart item not found')
          }
        } else {
          // Fallback to localStorage if no guest session ID
          const updatedCart = cart.map(item => {
            if ((item.id === itemId || item._id === itemId) && 
                (size ? item.size === size : true) && 
                (color ? item.color === color : true)) {
              // Make sure we preserve the mrp value when updating quantity
              return { 
                ...item, 
                quantity,
                mrp: item.mrp || item.price || 0 // Ensure mrp is preserved
              }
            }
            return item
          })
          
          // Update state and localStorage in one place
          setCart(updatedCart)
          localStorage.setItem('cart', JSON.stringify(updatedCart))
          
          
        }
      }
    } catch (error) {
      // console.error('Error updating cart:', error)
      setError(error.message || 'Failed to update cart')
      // Failed to update cart
    } finally {
      setLoading(false)
    }
  }
  
  // Clear cart
  const clearCart = async () => {
    try {
      // console.log('Clearing cart...')
      setLoading(true)
      setError(null)
      
      if (isAuthenticated) {
        // For authenticated users, make a single API call to clear all items
        // This requires a backend endpoint that can clear the entire cart
        // If such endpoint doesn't exist, we can use a more efficient approach
        
        // Option 1: If there's a dedicated clear cart endpoint
        try {
          // Assuming there's an endpoint to clear the entire cart
          // If this endpoint doesn't exist, this will throw an error and we'll use Option 2
          const response = await axios.delete('/cart')
          if (response.data.success) {
            setCart([])
            localStorage.removeItem('cart')
          }
        } catch (clearError) {
          // console.log('No clear cart endpoint, removing items individually')
          // Option 2: More efficient individual removal
          // Instead of awaiting each removal, we can use Promise.all to remove items in parallel
          const removalPromises = cart.map(item => 
            axios.delete(`/cart/${item._id}`).catch(e => console.error(`Failed to remove item ${item._id}:`, e))
          )
          
          // Wait for all removals to complete
          await Promise.all(removalPromises)
          // console.log('Cart cleared from backend')
          setCart([])
          localStorage.removeItem('cart')
        }
      } else {
        // For guest users, check if we have a guest session ID
        const guestSessionId = localStorage.getItem('guestSessionId')
        
        if (guestSessionId) {
          // Try to clear the guest cart with a single API call
          try {
            const response = await axios.delete(`/cart/guest/${guestSessionId}`)
            if (response.data.success) {
              setCart([])
              localStorage.removeItem('cart')
            }
          } catch (clearError) {
            // console.log('No clear guest cart endpoint, removing items individually')
            // More efficient individual removal for guest cart
            const removalPromises = cart.map(item => 
              axios.delete(`/cart/guest/${guestSessionId}/${item._id}`).catch(e => console.error(`Failed to remove guest item ${item._id}:`, e))
            )
            
            // Wait for all removals to complete
            await Promise.all(removalPromises)
            setCart([])
            localStorage.removeItem('cart')
          }
        } else {
          // For non-authenticated users without guest session ID, simply clear localStorage
          setCart([])
          localStorage.removeItem('cart')
        }
      }
      
     
    } catch (error) {
      // console.error('Error clearing cart:', error)
      setError(error.message || 'Failed to clear cart')
      // Failed to clear cart
    } finally {
      setLoading(false)
    }
  }
  
  // Get cart total
  const getCartTotal = () => {
    const subtotal = cart.reduce((total, item) => {
      // Always use MRP instead of price, ensure it's a valid number
      const price = typeof item.mrp === 'number' ? item.mrp : parseFloat(item.mrp || item.price || 0)
      // Ensure quantity is a number
      const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0
      // Ensure we don't add NaN to the total
      return total + (isNaN(price * quantity) ? 0 : price * quantity)
    }, 0)
    
    // Calculate shipping cost (free over ₹1000)
    const shippingCost = subtotal > 1000 ? 0 : 100
    
    // Calculate tax based on each product's GST rate
    const tax = cart.reduce((totalTax, item) => {
      // Always use MRP instead of price
      const price = typeof item.mrp === 'number' ? item.mrp : parseFloat(item.mrp || item.price) || 0
      // Ensure quantity is a number
      const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0
      // Get GST rate from item or use 0 if not available
      const gstRate = item.gstRate || 0
      // Calculate tax for this item
      return totalTax + ((price * quantity * gstRate) / 100)
    }, 0)
    
    // Apply coupon discount if available and add shipping cost and tax
    return subtotal - couponDiscount + shippingCost + tax
  }
  
  // Get cart subtotal (without discount)
  const getCartSubtotal = () => {
    return cart.reduce((total, item) => {
      // Always use MRP instead of price, ensure it's a valid number
      const price = typeof item.mrp === 'number' ? item.mrp : parseFloat(item.mrp || item.price || 0)
      // Ensure quantity is a number
      const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0
      // Ensure we don't add NaN to the total
      return total + (isNaN(price * quantity) ? 0 : price * quantity)
    }, 0)
  }
  
  // Get cart item count
  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }
  
  // Apply coupon code
  const applyCoupon = async (code) => {
    try {
      setCouponError(null)
      setLoading(true)
      
      if (!code) {
        setCouponError('Please enter a coupon code')
        return { success: false, error: 'Please enter a coupon code' }
      }
      
      // Verify coupon with backend
      const response = await axios.post('/promotions/verify-coupon', { couponCode: code })
      
      if (response.data.success) {
        const { discountType, discountValue, minimumPurchase } = response.data.data
        
        // Check minimum purchase requirement
        const subtotal = getCartSubtotal()
        if (minimumPurchase && subtotal < minimumPurchase) {
          setCouponError(`Minimum purchase of ₹${parseInt(minimumPurchase)} required for this coupon`)
          setCouponCode('')
          setCouponDiscount(0)
          return { 
            success: false, 
            error: `Minimum purchase of ₹${parseInt(minimumPurchase)} required for this coupon` 
          }
        }
        
        // Calculate discount
        let discount = 0
        if (discountType === 'percentage') {
          discount = (subtotal * discountValue) / 100
        } else { // fixed amount
          discount = discountValue
        }
        
        // Ensure discount doesn't exceed the total
        if (discount > subtotal) {
          discount = subtotal
        }
        
        setCouponCode(code)
        setCouponDiscount(discount)
        
        // Apply coupon to backend cart if user is authenticated or has a guest session
        if (isAuthenticated) {
          await axios.post('/cart/apply-coupon', { code: code })
        } else {
          const guestSessionId = localStorage.getItem('guestSessionId')
          if (guestSessionId) {
            await axios.post(`/cart/guest/${guestSessionId}/apply-coupon`, { code: code })
          }
        }
        
        // Coupon applied successfully
        
        return { 
          success: true, 
          data: { 
            couponCode: code, 
            discount, 
            discountType, 
            discountValue 
          } 
        }
      } else {
        setCouponError(response.data.error || 'Invalid coupon code')
        setCouponCode('')
        setCouponDiscount(0)
        return { success: false, error: response.data.error || 'Invalid coupon code' }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to apply coupon'
      setCouponError(errorMessage)
      setCouponCode('')
      setCouponDiscount(0)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }
  
  // Remove coupon
  const removeCoupon = async () => {
    try {
      // Remove coupon from backend cart if user is authenticated or has a guest session
      if (isAuthenticated) {
        await axios.post('/cart/remove-coupon')
      } else {
        const guestSessionId = localStorage.getItem('guestSessionId')
        if (guestSessionId) {
          await axios.post(`/cart/guest/${guestSessionId}/remove-coupon`)
        }
      }
      
      // Update local state
      setCouponCode('')
      setCouponDiscount(0)
      setCouponError(null)
      
      // Coupon removed
      
      return { success: true }
    } catch (error) {
      // Still update local state even if backend call fails
      setCouponCode('')
      setCouponDiscount(0)
      setCouponError(null)
      
      // Coupon removed
      
      return { success: true }
    }
  }

  // Get orders for guest user
  const getGuestOrders = async () => {
    try {
      // Check if we have a guest session ID in localStorage
      const guestSessionId = localStorage.getItem('guestSessionId');
      
      if (!guestSessionId) {
        return { success: false, error: 'No guest session found' };
      }
      
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/orders/guest/${guestSessionId}`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data.orders };
      } else {
        throw new Error(response.data.error || 'Failed to fetch guest orders');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch guest orders';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };
  
  // Checkout function
  const checkout = async (orderData) => {
    try {
      setLoading(true)
      setError(null)
      
      // Validate cart items
      if (!cart || cart.length === 0) {
        setError('Your cart is empty. Please add items to your cart before checkout.')
        // Cart is empty
        return { success: false, error: 'Cart is empty' }
      }
      
      // Calculate subtotal and total
      const subtotal = getCartSubtotal()
      const total = getCartTotal()
      
      // Prepare order items from cart
      const validatedItems = cart.map(item => {
        // Ensure we have a valid variantSku
        let variantSku = item.variantSku || item.sku;
        
        // If still no variantSku, try to get it from variant object
        if (!variantSku && item.variant) {
          variantSku = item.variant.sku;
        }
        
        // If still no variantSku, generate a fallback
        if (!variantSku) {
          // Generate a fallback SKU using product ID and size/color if available
          // Include size and color in the SKU to help backend find the right variant
          const size = item.size || 'default';
          const color = item.color || 'default';
          variantSku = `${item.id || item._id}-${size}-${color}`;
        }
        
        // Always use MRP instead of price if available
        const price = item.mrp || item.price;
        
        return {
          productId: item.id || item._id,
          qty: item.quantity,
          variantSku: variantSku,
          price: price,
          size: item.size || null,
          color: item.color || null 
        };
      });
      
      // Generate a guest session ID if user is not authenticated
      if (!isAuthenticated) {
        // Check if we already have a guest session ID in localStorage
        let guestSessionId = localStorage.getItem('guestSessionId');
        
        // If not, create a new one
        if (!guestSessionId) {
          guestSessionId = 'guest-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
          localStorage.setItem('guestSessionId', guestSessionId);
        }
        
        // Add guest session ID to order data
        orderData.guestSessionId = guestSessionId;
      }
      
      // Determine which endpoint to use based on authentication status
      const endpoint = isAuthenticated ? '/orders' : '/orders/guest';
      
      // Create order payload and send to backend
      const response = await axios.post(endpoint, { 
        ...orderData, 
        items: validatedItems,
        couponCode: couponCode || null,
        subtotal,
        total
      })
      
      if (response.data.success) {
        // Only clear cart for non-Cashfree payment methods
        // For Cashfree, cart will be cleared after payment confirmation
        if (orderData.payment.method !== 'CASHFREE') {
          await clearCart()
          
          // Order placed successfully
        } else {
          // For Cashfree, just store the order ID in localStorage
          const orderId = response.data.data.orderId || (response.data.data.order && response.data.data.order._id) || response.data.data._id;
          if (orderId) {
            localStorage.setItem('pendingOrderId', orderId);
          }
        }
        
        return { success: true, data: response.data.data }
      } else {
        throw new Error(response.data.error || 'Failed to complete checkout')
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to complete checkout. Please try again.'
      setError(errorMessage)
      // Checkout error
      return { success: false, error: errorMessage }
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
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartSubtotal,
        getCartItemCount,
        checkout,
        couponCode,
        couponDiscount,
        couponError,
        applyCoupon,
        removeCoupon,
        getGuestOrders,
        // Debug function to check cart state
        debugCart: () => {
          return { cart, localStorage: localStorage.getItem('cart') }
        },
        // Force sync cart with backend
        syncCartWithBackend: async () => {
          // Clear the localStorage check to force backend fetch
          localStorage.removeItem('cart')
          // Trigger backend fetch
          window.location.reload()
        }
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export default CartContext