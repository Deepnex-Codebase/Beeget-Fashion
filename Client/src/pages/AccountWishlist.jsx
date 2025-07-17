import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import useWishlist from '../hooks/useWishlist'
import useCart from '../hooks/useCart'
import Button from '../components/Common/Button'

const AccountWishlist = () => {
  const { wishlist, loading, error, removeFromWishlist, clearWishlist } = useWishlist()
  const { addToCart } = useCart()
  const [isClearing, setIsClearing] = useState(false)

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error, {
        position: "top-right",
        autoClose: 3000,
      })
    }
  }, [error])

  // Add to cart handler
  const handleAddToCart = (item) => {
    // Use productDetails price if available, otherwise use product price
    const price = item.productDetails?.price || 
      (item.productId.variants && item.productId.variants.length > 0 ? 
        item.productId.variants[0].price : 
        item.productId.price)

    const productToAdd = {
      id: item.productId._id || item.productId,
      name: item.productId.title,
      price: price,
      image: item.productId.images?.[0] || item.productDetails?.image || ''
    }
    
    addToCart(productToAdd, 1)
    toast.success(`${item.productId.title} added to cart!`, {
      position: "top-right",
      autoClose: 3000,
    })
    
    // Open cart sidebar automatically
    document.dispatchEvent(new CustomEvent('openCart'))
  }

  // Remove from wishlist handler
  const handleRemove = (itemId) => {
    console.log('Removing item from wishlist with ID:', itemId)
    removeFromWishlist(itemId)
  }

  // Clear wishlist handler
  const handleClearWishlist = () => {
    if (window.confirm('Are you sure you want to clear your wishlist?')) {
      setIsClearing(true)
      clearWishlist()
      setIsClearing(false)
      toast.info('Wishlist cleared!', {
        position: "top-right",
        autoClose: 3000,
      })
    }
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-heading font-semibold">My Wishlist</h2>
          {wishlist.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearWishlist}
              disabled={isClearing}
            >
              {isClearing ? 'Clearing...' : 'Clear Wishlist'}
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : wishlist.length === 0 ? (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-700">Your wishlist is empty</h3>
            <p className="mt-2 text-gray-500">Browse our collection and add items to your wishlist</p>
            <Link to="/shop">
              <Button className="mt-6">
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => {
              // Get price from productDetails or from variants
              const price = item.productDetails?.price || 
                (item.productId.variants && item.productId.variants.length > 0 ? 
                  item.productId.variants[0].price : 
                  item.productId.price || 0);
              
              // Always consider product in stock (as per requirement)
              const hasStock = true; // Override stock check to always show Add to Cart button
              
              // Get image from product or productDetails
              const productImage = item.productId.images?.[0] || 
                item.productDetails?.image || 
                '/placeholder-product.jpg';
              
              return (
                <div key={item._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300">
                  {/* Product Image with Badge */}
                  <div className="relative">
                    <Link to={`/product/${item.productId.slug || item.productDetails?.slug || item.slug || item._id}`} className="block h-56 overflow-hidden bg-gray-100">
                      <img 
                        src={productImage} 
                        alt={item.productId.title || item.productDetails?.title} 
                        className="w-full h-full object-cover transition-transform hover:scale-110 duration-500"
                      />
                    </Link>
                    {/* Stock badge removed as per requirement */}
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-4">
                    <Link to={`/product/${item.productId.slug || item.productDetails?.slug || item.slug || item._id}`} className="block">
                      <h3 className="text-lg font-medium text-gray-800 hover:text-teal-600 transition-colors line-clamp-2">
                        {item.productId.title || item.productDetails?.title}
                      </h3>
                    </Link>
                    
                    {/* Price Section */}
                    <div className="mt-3 flex justify-between items-center">
                      <div>
                        {item.productId.salePrice ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-semibold text-teal-600">
                              ₹{item.productId.salePrice.toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              ₹{price.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-lg font-semibold text-gray-800">
                            ₹{price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Added {new Date(item.addedAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {/* Variants Info (if available) */}
                    {item.productId.variants && item.productId.variants.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Variants:</span> {item.productId.variants.length} available
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="mt-4 flex space-x-2">
                      <Link 
                        to={`/product/${item.productId.slug || item.productDetails?.slug || item.slug || item._id}`}
                      >
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="flex-1 transition-all duration-300"
                        >
                          Show Detail
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-none hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-300"
                        onClick={() => handleRemove(item._id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  )
}

export default AccountWishlist;