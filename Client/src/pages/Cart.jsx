import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../components/Common/Button'
import useAuth from '../hooks/useAuth'
import useCart from '../hooks/useCart'
import { toast } from 'react-toastify'

const Cart = () => {
  // Use cart context instead of static data
  const { cart, loading, error, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartSubtotal, applyCoupon, removeCoupon, couponCode, couponDiscount, couponError } = useCart()
  const { isAuthenticated } = useAuth()
  const [couponInput, setCouponInput] = useState('')
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  
  // Handle coupon application
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      toast.error('Please enter a coupon code')
      return
    }
    
    setIsApplyingCoupon(true)
    const result = await applyCoupon(couponInput)
    setIsApplyingCoupon(false)
    
    if (!result.success) {
      toast.error(result.error || 'Invalid coupon code')
    }
    
    setCouponInput('')
  }
  
  // Handle coupon removal
  const handleRemoveCoupon = () => {
    removeCoupon()
  }
  
  // Handle quantity update
  const handleQuantityChange = (itemId, newQuantity, size, color) => {
    updateQuantity(itemId, newQuantity, size, color)
  }
  
  // Handle item removal
  const handleRemoveItem = (itemId, size, color) => {
    if (window.confirm('Are you sure you want to remove this item?')) {
      removeFromCart(itemId, size, color)
    }
  }
  
  // Handle cart clearing
  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart()
    }
  }

  // Calculate shipping cost (free shipping over ₹499)
  const subtotal = getCartSubtotal()
  const shippingCost = subtotal > 499 ? 0 : 50
  
  // Calculate total with shipping
  const total = getCartTotal() + shippingCost
  
  // Empty cart view
  if (loading) {
    return (
      <div className="bg-gray-50 py-12">
        <div className="container-custom">
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    )
  }
  
  if (cart.length === 0) {
    return (
      <div className="bg-gray-50 py-12">
        <div className="container-custom">
          <motion.div 
            className="bg-white p-8 rounded-lg shadow-sm text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h1 className="text-2xl font-semibold mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8">Looks like you haven't added any products to your cart yet.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/shop">
                <Button>Continue Shopping</Button>
              </Link>
              <Link to={isAuthenticated ? "/account/wishlist" : "/login?redirect=account/wishlist"}>
                <Button variant="secondary">View Wishlist</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-gray-50 py-12">
      <div className="container-custom">
        <h1 className="text-3xl font-heading font-semibold mb-8">Your Shopping Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="hidden sm:grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-center">Total</div>
              </div>
              
              {/* Cart Items List */}
              {cart.map((item) => (
                <div key={`${item.id}-${item.size}-${item.color}`} className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 border-b border-gray-200 items-center">
                  {/* Product Info */}
                  <div className="col-span-6 flex items-center space-x-4">
                    <Link to={`/product/${item.slug}`}>
                      <img 
                        src={item.image || '/image_default.png'} 
                        alt={item.name || item.title} 
                        className="w-16 h-16 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                        onError={(e) => {
                          e.target.src = '/image_default.png';
                        }}
                      />
                    </Link>
                    <div>
                      <Link to={`/product/${item.slug || item.id}`}>
                        <h3 className="font-medium text-charcoal hover:text-teal cursor-pointer">{item.name || item.title}</h3>
                      </Link>
                      <div className="text-sm text-gray-500 mt-1">
                        {item.size && <span className="mr-2">Size: {item.size}</span>}
                        {item.color && <span>Color: {item.color}</span>}
                      </div>
                      <button 
                        onClick={() => handleRemoveItem(item.id || item._id, item.size, item.color)}
                        className="text-sm text-red-500 hover:text-red-700 mt-2 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    </div>
                  </div>
                  
                  {/* Price */}
                  <div className="col-span-2 text-center">
                    <span className="sm:hidden inline-block font-medium mr-2">Price:</span>
                    ₹{parseFloat(item.price).toFixed(2)}
                  </div>
                  
                  {/* Quantity */}
                  <div className="col-span-2 flex items-center justify-center">
                    <span className="sm:hidden inline-block font-medium mr-2">Quantity:</span>
                    <div className="flex items-center">
                      <button 
                        type="button" 
                        className="w-8 h-8 rounded-l-md bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                        onClick={() => handleQuantityChange(item.id || item._id, item.quantity - 1, item.size, item.color)}
                        disabled={item.quantity <= 1}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <input 
                        type="number" 
                        min="1" 
                        value={item.quantity} 
                        onChange={(e) => handleQuantityChange(item.id || item._id, parseInt(e.target.value), item.size, item.color)}
                        className="w-10 h-8 text-center text-sm border-x-0 border-gray-300 focus:ring-0 focus:border-gray-300"
                      />
                      <button 
                        type="button" 
                        className="w-8 h-8 rounded-r-md bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                        onClick={() => handleQuantityChange(item.id || item._id, item.quantity + 1, item.size, item.color)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Total */}
                  <div className="col-span-2 text-center font-medium">
                    <span className="sm:hidden inline-block font-medium mr-2">Total:</span>
                    ₹{(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}
                  </div>
                </div>
              ))}
              
              {/* Cart Actions */}
              <div className="p-4 flex flex-wrap gap-4 justify-between items-center">
                <div className="flex flex-wrap gap-4">
                  <Link to="/shop">
                    <Button variant="secondary" size="sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Continue Shopping
                    </Button>
                  </Link>
                  <Button variant="secondary" size="sm" onClick={handleClearCart}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear Cart
                  </Button>
                </div>
                <Button size="sm" onClick={() => {
                  // Update all cart items by re-applying their current quantities
                  cart.forEach(item => {
                    updateQuantity(item.id || item._id, item.quantity, item.size, item.color);
                  });
                  toast.success('Cart updated successfully!', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true
                  });
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Update Cart
                </Button>
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              {/* Coupon Code */}
              <form className="mb-6">
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-grow px-4 py-2 rounded-l-md border-gray-300 focus:ring-teal focus:border-teal text-sm"
                    disabled={!!couponCode}
                  />
                  <Button 
                    onClick={handleApplyCoupon} 
                    className="rounded-l-none" 
                    size="sm"
                    disabled={isApplyingCoupon || !couponInput.trim() || !!couponCode}
                  >
                    {isApplyingCoupon ? 'Applying...' : 'Apply'}
                  </Button>
                </div>
                {couponError && <p className="text-sm text-red-500 mt-2">{couponError}</p>}
                {couponCode && (
                  <div className="text-green-600 text-sm mt-2 flex items-center justify-between">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Coupon applied</span>
                    </div>
                    <button 
                      onClick={handleRemoveCoupon}
                      className="text-sm text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </form>
              
              {/* Summary Details */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shippingCost === 0 ? 'Free' : `₹${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">Including VAT</p>
                </div>
              </div>
              
              {/* Checkout Button */}
              <div className="mt-6">
                <Link to="/checkout">
                  <Button fullWidth>
                    Proceed to Checkout
                  </Button>
                </Link>
              </div>
              
              {/* Guest Orders Link */}
              {!isAuthenticated && (
                <div className="mt-3">
                  <Link to="/guest-orders" className="text-sm text-teal hover:text-teal-dark flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    View Your Guest Orders
                  </Link>
                </div>
              )}
              
              {/* Payment Methods */}
              {/* <div className="mt-6">
                <p className="text-xs text-gray-500 mb-2">We accept:</p>
                <div className="flex space-x-2">
                  <div className="bg-gray-100 rounded p-1">
                    <svg className="h-6 w-10" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="40" height="24" rx="4" fill="#F3F4F6"/>
                      <path d="M15 7H25V17H15V7Z" fill="#FF5F00"/>
                      <path d="M15.5 12C15.5 9.7 16.6 7.6 18.45 6.05C16.65 4.7 14.3 4 11.9 4C6.4 4 2 7.6 2 12C2 16.4 6.4 20 11.9 20C14.3 20 16.65 19.3 18.45 17.95C16.6 16.4 15.5 14.3 15.5 12Z" fill="#EB001B"/>
                      <path d="M38 12C38 16.4 33.6 20 28.1 20C25.7 20 23.35 19.3 21.55 17.95C23.4 16.4 24.5 14.3 24.5 12C24.5 9.7 23.4 7.6 21.55 6.05C23.35 4.7 25.7 4 28.1 4C33.6 4 38 7.6 38 12Z" fill="#F79E1B"/>
                    </svg>
                  </div>
                  <div className="bg-gray-100 rounded p-1">
                    <svg className="h-6 w-10" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="40" height="24" rx="4" fill="#F3F4F6"/>
                      <path d="M15 7H25V17H15V7Z" fill="#2566AF"/>
                      <path d="M16.5 14.2L17.9 9.8H19.5L18.1 14.2H16.5Z" fill="white"/>
                      <path d="M23.9 9.9C23.5 9.7 22.9 9.6 22.2 9.6C20.5 9.6 19.3 10.5 19.3 11.8C19.3 12.8 20.2 13.3 20.8 13.6C21.4 13.9 21.6 14.1 21.6 14.3C21.6 14.7 21.1 14.8 20.7 14.8C20.1 14.8 19.5 14.7 19 14.4L18.8 14.3L18.6 15.7C19.1 15.9 19.9 16.1 20.7 16.1C22.5 16.1 23.7 15.2 23.7 13.8C23.7 13 23.2 12.4 22.3 12C21.7 11.7 21.4 11.5 21.4 11.2C21.4 11 21.7 10.7 22.3 10.7C22.8 10.7 23.2 10.8 23.5 11L23.7 11.1L23.9 9.9Z" fill="white"/>
                      <path d="M26.9 9.8H25.7L24 14.2H25.7L26.9 9.8Z" fill="white"/>
                      <path d="M29.7 12.1L30.2 10.5L30.5 12.1L30.9 9.8H32.6L31.1 14.2H29.5L28.5 10.7L28 14.2H26.4L27.9 9.8H29.5L29.7 12.1Z" fill="white"/>
                    </svg>
                  </div>
                  <div className="bg-gray-100 rounded p-1">
                    <svg className="h-6 w-10" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="40" height="24" rx="4" fill="#F3F4F6"/>
                      <path d="M27.6 7H25.9C25.5 7 25.2 7.2 25.1 7.5L23 14.5H24.6C24.6 14.5 24.9 14.3 25 14L25.3 13H27.4L27.6 13.9C27.6 14.3 28 14.5 28.3 14.5H29.7L27.6 7ZM25.8 11.6L26.5 9.2L26.9 11.6H25.8Z" fill="#006FCF"/>
                      <path d="M20.3 10.4C20.3 10.1 20.6 9.8 21 9.8H22.9L23.3 7.5C23.3 7.2 23.1 7 22.8 7H19.5C19.1 7 18.8 7.2 18.8 7.5L17.2 14.1C17.2 14.3 17.4 14.6 17.7 14.6H19.4L20 11.7L20.3 10.4Z" fill="#006FCF"/>
                      <path d="M13.9 7.5C13.9 7.2 13.7 7 13.4 7H10.1C9.7 7 9.4 7.2 9.4 7.5L7.8 14.1C7.8 14.3 8 14.6 8.3 14.6H10C10.4 14.6 10.7 14.3 10.7 14.1L11.1 12H12.7C14.4 12 15.5 10.9 15.8 9.3C16 8.1 15.2 7.5 13.9 7.5ZM13.2 9.4C13 10.1 12.4 10.5 11.6 10.5H11L11.4 8.5H12C12.8 8.5 13.3 8.8 13.2 9.4Z" fill="#006FCF"/>
                    </svg>
                  </div>
                  <div className="bg-gray-100 rounded p-1">
                    <svg className="h-6 w-10" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="40" height="24" rx="4" fill="#F3F4F6"/>
                      <path d="M20 8C18.3 8 17 9.3 17 11C17 12.7 18.3 14 20 14C21.7 14 23 12.7 23 11C23 9.3 21.7 8 20 8ZM20 13C18.9 13 18 12.1 18 11C18 9.9 18.9 9 20 9C21.1 9 22 9.9 22 11C22 12.1 21.1 13 20 13Z" fill="#253B80"/>
                      <path d="M25 8H24V14H25V11H27V10H25V8Z" fill="#253B80"/>
                      <path d="M14 8H13V14H14V11H15.5C16.3 11 17 10.3 17 9.5C17 8.7 16.3 8 15.5 8H14ZM15.5 10H14V9H15.5C15.8 9 16 9.2 16 9.5C16 9.8 15.8 10 15.5 10Z" fill="#253B80"/>
                      <path d="M29.5 8H28C27.4 8 27 8.4 27 9V14H28V12H29.5C30.3 12 31 11.3 31 10.5C31 9.7 30.3 9 29.5 9H28V8H29.5C30.9 8 32 9.1 32 10.5C32 11.9 30.9 13 29.5 13H28V14H29.5C31.4 14 33 12.4 33 10.5C33 8.6 31.4 8 29.5 8Z" fill="#253B80"/>
                      <path d="M11 9.5C11 8.7 10.3 8 9.5 8H7V14H8V12H8.5L10 14H11L9.5 12C10.3 12 11 11.3 11 10.5V9.5ZM9.5 11H8V9H9.5C9.8 9 10 9.2 10 9.5V10.5C10 10.8 9.8 11 9.5 11Z" fill="#253B80"/>
                    </svg>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart