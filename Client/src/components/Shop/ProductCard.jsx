import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HeartIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import useCart from '../../hooks/useCart'
import useWishlist from '../../hooks/useWishlist'
// toast removed
import Image from '../Common/Image'

const ProductCard = ({ product }) => {
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [isHovered, setIsHovered] = useState(false)
  const [selectedSize, setSelectedSize] = useState(null)
  
  // Check if product is in wishlist
  const inWishlist = isInWishlist(product._id)
  
  // Get the first variant for price display
  const firstVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null
  
  // Find variant by selected size or use first variant
  const selectedVariant = selectedSize && product.variants && product.variants.length > 0 ? 
    product.variants.find(v => v.attributes && v.attributes.size === selectedSize) : firstVariant
  
  // Get MRP and selling price
  const mrp = selectedVariant && selectedVariant.mrp ? selectedVariant.mrp : 
    (product.mrp ? product.mrp : (selectedVariant && selectedVariant.sellingPrice ? selectedVariant.sellingPrice * 1.2 : 0))
  const sellingPrice = selectedVariant && selectedVariant.sellingPrice ? selectedVariant.sellingPrice : 
    (selectedVariant && selectedVariant.price ? selectedVariant.price : (product.price ? product.price : 0))
  
  // Get variant attributes for display
  const variantAttributes = selectedVariant && selectedVariant.attributes ? selectedVariant.attributes : {}
  const variantSize = selectedSize || (variantAttributes.size || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : null))
  const variantColor = variantAttributes.color || null
  
  // Update selected variant when size changes
  useEffect(() => {
    if (selectedSize && product.variants && product.variants.length > 0) {
      // Force re-render to update prices
      // The state update in setSelectedSize already triggered a re-render
      // which updates the selectedVariant, mrp, and sellingPrice
      
      // This useEffect ensures that when product.variants changes (like during initial load)
      // we still update the selected size if needed
      const hasVariantWithSelectedSize = product.variants.some(v => 
        v.attributes && v.attributes.size === selectedSize
      )
      
      if (!hasVariantWithSelectedSize && product.variants.length > 0 && product.variants[0].attributes) {
        // If the currently selected size doesn't exist in variants, reset to first available size
        setSelectedSize(product.variants[0].attributes.size || null)
      }
    }
  }, [selectedSize, product.variants])
  
  // Get all available sizes
  const availableSizes = product.variants ? 
    [...new Set(product.variants.filter(v => v.attributes && v.attributes.size)
      .map(v => v.attributes.size))] : 
    (product.sizes || [])
  
  // Handle add to cart
  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const productToAdd = {
      id: product._id,
      name: product.title,
      price: sellingPrice,
      image: product.images && product.images.length > 0 ? product.images[0] : '',
      size: variantSize,
      color: variantColor,
      variantSku: selectedVariant ? selectedVariant.sku : null,
      mrp: mrp
    }
    
    addToCart(productToAdd, 1, variantSize, variantColor)
    // Product added to cart
    
    // Open cart sidebar automatically
    document.dispatchEvent(new CustomEvent('openCart'))
  }
  
  // Handle wishlist toggle
  const handleWishlistToggle = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (inWishlist) {
      removeFromWishlist(product._id)
      // Product removed from wishlist
    } else {
      const productToAdd = {
        productId: product._id,
        title: product.title,
        price: sellingPrice,
        image: product.images && product.images.length > 0 ? product.images[0] : '',
        size: variantSize,
        color: variantColor,
        variantSku: selectedVariant ? selectedVariant.sku : null,
        mrp: mrp
      }
      
      addToWishlist(productToAdd)
      // Product added to wishlist
    }
  }
  
  return (
    <motion.div 
      className="group relative bg-white rounded-lg shadow-sm overflow-hidden"
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-2 right-2 z-10 bg-white/80 p-1.5 rounded-full shadow-sm transition-all hover:bg-java-500 hover:text-white"
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {inWishlist ? (
            <HeartSolidIcon className="h-5 w-5 text-java-500 hover:text-white" />
          ) : (
            <HeartIcon className="h-5 w-5" />
          )}
        </button>
        
        <Link to={`/product/${product.slug || product._id}`} className="block">
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden bg-gray-100">
            <Image 
              src={product.images && product.images.length > 0 ? product.images[0] : null}
              alt={product.title || 'Product image'}
              fallbackSrc="/image_default.png"
              className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            />
            
            {/* Sale badge if on sale */}
            {product.onSale && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                SALE
              </div>
            )}
            
            {/* New badge if recent */}
            {product.isNew && (
              <div className="absolute top-2 left-14 bg-java-500 text-white text-xs font-bold px-2 py-1 rounded">
                NEW
              </div>
            )}
          </div>
        </Link>
        
        {/* Product Info */}
        <div className="p-4">
          <Link to={`/product/${product.slug || product._id}`} className="block">
            <h3 className="text-sm font-medium text-gray-900 truncate hover:text-java-600 transition-colors">{product.title}</h3>
          </Link>
          
          {/* Category */}
          {product.category && (
            <div className="mt-1">
              <span className="text-xs text-gray-500">{typeof product.category === 'object' ? product.category.name || 'Category' : product.category}</span>
            </div>
          )}
          
          {/* Rating */}
          {product.rating && typeof product.rating !== 'object' && (
            <div className="mt-1 flex items-center">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg 
                    key={i} 
                    className={`h-3 w-3 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="ml-1 text-xs text-gray-500">({product.rating})</span>
            </div>
          )}
          
          {/* Price section */}
          <div className="mt-1 flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold text-java-600">
                ₹{sellingPrice ? parseInt(parseFloat(sellingPrice)) : ''}
                {mrp && mrp > sellingPrice && (
                  <span className="ml-2 text-sm text-gray-500 line-through">
                    ₹{mrp ? parseInt(parseFloat(mrp)) : ''}
                  </span>
                )}
                {!mrp && sellingPrice && (
                  <span className="ml-2 text-sm text-gray-500 line-through">
                    ₹{parseInt(parseFloat(sellingPrice) * 1.2)}
                  </span>
                )}
              </p>
              
              {/* Display size-specific price info */}
              {selectedSize && (
                <span className="text-xs text-gray-600 block">
                  Size: {selectedSize}
                </span>
              )}
              
              {/* GST Rate if available */}
              {product.gstRate > 0 && (
                <span className="text-xs text-gray-500 block">
                  Incl. {product.gstRate}% GST
                </span>
              )}
            </div>
            
            {/* Stock indicator */}
            {firstVariant && firstVariant.stock <= 5 && firstVariant.stock > 0 && (
              <span className="text-xs text-orange-500">Only {firstVariant.stock} left</span>
            )}
            {firstVariant && firstVariant.stock === 0 && (
              <span className="text-xs text-red-500">Out of stock</span>
            )}
          </div>
          
          {/* Size selection */}
          {availableSizes.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">Select Size:</p>
              <div className="flex flex-wrap gap-1">
                {availableSizes.map(size => (
                  <button
                    key={size}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedSize(size);
                      // Force re-render to update price and MRP based on selected size
                    }}
                    className={`inline-block px-2 py-1 text-xs border rounded-md ${selectedSize === size 
                      ? 'bg-java-500 text-white border-java-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-java-300'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Color display */}
          {variantColor && (
            <div className="mt-2">
              <span className="inline-block px-1.5 py-0.5 text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700">
                Color: {variantColor}
              </span>
            </div>
          )}
          
          {/* Add to cart button */}
          <button
            onClick={handleAddToCart}
            disabled={selectedVariant && selectedVariant.stock === 0}
            className={`mt-3 w-full py-2 px-3 rounded-full flex items-center justify-center gap-1.5 text-xs font-medium transition-colors ${
              selectedVariant && selectedVariant.stock === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-java-500 text-white hover:bg-java-600 shadow-sm'
            }`}
          >
            <ShoppingBagIcon className="h-4 w-4" />
            {selectedVariant && selectedVariant.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default ProductCard