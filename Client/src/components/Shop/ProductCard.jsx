import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HeartIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import useCart from '../../hooks/useCart'
import useWishlist from '../../hooks/useWishlist'
import { toast } from 'react-hot-toast'

const ProductCard = ({ product }) => {
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [isHovered, setIsHovered] = useState(false)
  
  // Check if product is in wishlist
  const inWishlist = isInWishlist(product._id)
  
  // Get the first variant for price display
  const firstVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null
  const price = firstVariant ? firstVariant.price : product.price
  
  // Handle add to cart
  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const productToAdd = {
      id: product._id,
      name: product.title,
      price: price,
      image: product.images && product.images.length > 0 ? product.images[0] : ''
    }
    
    addToCart(productToAdd, 1)
    toast.success(`${product.title} added to cart!`)
    
    // Open cart sidebar automatically
    document.dispatchEvent(new CustomEvent('openCart'))
  }
  
  // Handle wishlist toggle
  const handleWishlistToggle = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (inWishlist) {
      removeFromWishlist(product._id)
      toast.success(`${product.title} removed from wishlist`)
    } else {
      const productToAdd = {
        productId: product._id,
        title: product.title,
        price: price,
        image: product.images && product.images.length > 0 ? product.images[0] : ''
      }
      
      addToWishlist(productToAdd)
      toast.success(`${product.title} added to wishlist`)
    }
  }
  
  return (
    <motion.div 
      className="group relative bg-white rounded-lg shadow-sm overflow-hidden"
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product.slug || product._id}`} className="block">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.images && product.images.length > 0 ? (
            <img 
              src={product.images[0]} 
              alt={product.title} 
              className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = '/placeholder-product.jpg'
              }}
            />
          ) : (
            <img 
              src="/placeholder-product.jpg" 
              alt="Product placeholder" 
              className="w-full h-full object-cover object-center"
            />
          )}
          
          {/* Sale badge if on sale */}
          {product.onSale && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              SALE
            </div>
          )}
          
          {/* New badge if recent */}
          {product.isNew && (
            <div className="absolute top-2 right-2 bg-java-500 text-white text-xs font-bold px-2 py-1 rounded">
              NEW
            </div>
          )}
          
         
        </div>
        
        {/* Product Info */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 truncate">{product.title}</h3>
          <div className="mt-1 flex justify-between items-center">
            <p className="text-lg font-semibold text-java-600">
              ${price?.toFixed(2)}
              {product.compareAtPrice && (
                <span className="ml-2 text-sm text-gray-500 line-through">
                  ${product.compareAtPrice?.toFixed(2)}
                </span>
              )}
            </p>
            
            {/* Stock indicator */}
            {firstVariant && firstVariant.stock <= 5 && firstVariant.stock > 0 && (
              <span className="text-xs text-orange-500">Only {firstVariant.stock} left</span>
            )}
            {firstVariant && firstVariant.stock === 0 && (
              <span className="text-xs text-red-500">Out of stock</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default ProductCard