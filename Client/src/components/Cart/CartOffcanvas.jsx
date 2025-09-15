import { useEffect, useContext, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { XMarkIcon, ShoppingBagIcon, PlusIcon, MinusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../Common/Button'
import { CartContext } from '../../contexts/CartContext'

const CartOffcanvas = ({ isOpen, onClose }) => {
  const { cart, updateQuantity, removeFromCart, getCartTotal, getCartSubtotal } = useContext(CartContext)
  
  // Close cart when pressing escape key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEscKey)
    return () => window.removeEventListener('keydown', handleEscKey)
  }, [isOpen, onClose])
  
  // Prevent scrolling when cart is open
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
  
  // Calculate cart values using memoization to prevent unnecessary recalculations
  const cartValues = useMemo(() => {
    const subtotal = getCartSubtotal()
    
    // Get GST amount from CartContext (now uses item-specific GST rates)
    const gstAmount = getCartTotal() - getCartSubtotal()
    
    // Calculate shipping cost (free over ₹1000)
    const shippingCost = 0
    
    // Calculate total with shipping
    const total = getCartTotal()
    
    return {
      subtotal: subtotal,
      gstAmount: gstAmount,
      shippingCost: shippingCost,
      total: total
    }
  }, [cart, getCartSubtotal, getCartTotal])
  
  return (
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
          
          {/* Cart panel */}
          <motion.div
            className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-lg z-50 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-java-100">
              <h2 className="text-xl font-medium flex items-center text-java-800">
                <ShoppingBagIcon className="h-5 w-5 mr-2 text-java-600" />
                Your Cart ({cart.length})
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-java-50 transition-colors text-java-600"
                aria-label="Close cart"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* Cart items */}
            <div className="flex-grow overflow-y-auto py-4 px-4">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBagIcon className="h-12 w-12 mx-auto text-java-400 mb-4" />
                  <p onClick={onClose} className="text-gray-600 mb-4">Your cart is empty</p>
                  <Link to="/shop" size="sm" className="bg-java-600 hover:bg-java-700 text-white p-1 px-3 rounded-md">
                    Continue Shopping
                  </Link>
                  {/* <Button onClick={onClose} size="sm" className="bg-java-600 hover:bg-java-700 text-white">Continue Shopping</Button> */}
                </div>
              ) : (
                <ul className="space-y-4">
                  {cart.map((item) => (
                    <li key={`${item.id}-${item.size}-${item.color}`} className="flex gap-4 py-2 border-b border-gray-100">
                      {/* Product image */}
                      <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        <img 
                          src={item.image || '/image_default.png'} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/image_default.png';
                          }}
                        />
                      </div>
                      
                      {/* Product details */}
                      <div className="flex-grow">
                        <h3 className="font-medium text-sm">{item.name}</h3>
                        <p className="text-gray-500 text-xs mb-1">
                          {item.size && <span className="mr-2">Size: {item.size}</span>}
                          {item.color && <span>Color: {item.color}</span>}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center border rounded">
                            <button 
                              onClick={() => updateQuantity(item.id || item._id, Math.max(1, item.quantity - 1), item.size, item.color)}
                              className="px-2 py-1 text-gray-500 hover:text-gray-700"
                              aria-label="Decrease quantity"
                              disabled={item.quantity <= 1}
                            >
                              <MinusIcon className="h-3 w-3" />
                            </button>
                            <span className="px-2 text-sm">{item.quantity || 1}</span>
                            <button 
                              onClick={() => updateQuantity(item.id || item._id, Math.min(99, (item.quantity || 1) + 1), item.size, item.color)}
                              className="px-2 py-1 text-gray-500 hover:text-gray-700"
                              aria-label="Increase quantity"
                              disabled={item.quantity >= 99}
                            >
                              <PlusIcon className="h-3 w-3" />
                            </button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id || item._id, item.size, item.color)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            aria-label="Remove item"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Price */}
                      <div className="text-right">
                        <p className="font-medium">₹{(() => {
                          // Use sellingPrice instead of price for consistency
                          const price = typeof item.sellingPrice === 'number' ? item.sellingPrice : 
                                       (typeof item.price === 'number' ? item.price : parseFloat(item.sellingPrice || item.price || 0));
                          // Ensure quantity is a valid number and at least 1
                          const quantity = typeof item.quantity === 'number' ? Math.max(1, item.quantity) : Math.max(1, parseInt(item.quantity || 1));
                          // Calculate and return the total price
                          const itemTotal = price * quantity;
                          return isNaN(itemTotal) ? 0 : Math.round(itemTotal);
                        })()}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t border-java-100 p-4 bg-java-50">
                <div className="flex justify-between mb-2">
                  <span className="text-java-800">Subtotal:</span>
                  <span className="font-medium text-java-800">₹{Math.round(cartValues.subtotal) || 0}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-java-800 text-xs">GST:</span>
                  <span className="font-medium text-java-800 text-xs">₹{Math.round(cartValues.gstAmount) || 0}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-java-800 text-xs">Shipping:</span>
                  <span className="font-medium text-java-800 text-xs">
                    {cartValues.shippingCost >= 0 ? 'Free' : 'Free'}
                  </span>
                </div>
                <div className="flex justify-between mb-2 pt-2 border-t border-java-100">
                  <span className="text-java-800 font-medium">Total:</span>
                  <span className="font-medium text-java-800">₹{Math.round(cartValues.total) || 0}</span>
                </div>
                <p className="text-xs text-gray-500 mb-4">Price inclusive of GST.</p>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/cart" onClick={onClose}>
                    <Button variant="secondary" fullWidth className="border-java-500 text-java-700 hover:bg-java-50">View Cart</Button>
                  </Link>
                  <Link to="/checkout" onClick={onClose}>
                    <Button fullWidth className="bg-java-600 hover:bg-java-700 text-white">Checkout</Button>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CartOffcanvas