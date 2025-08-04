import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from '../utils/api'
import { toast } from 'react-hot-toast'
import { FiChevronRight, FiArrowLeft, FiShoppingBag } from 'react-icons/fi'
import ProductCard from '../components/Shop/ProductCard'

const CollectionDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [collection, setCollection] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCollectionDetails = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`/collections/${id}`)
        
        // Check response structure and extract collection data
        let collectionData;
        if (response.data && response.data.data && response.data.data.collection) {
          // New API response structure
          collectionData = response.data.data.collection;
        } else {
          // Direct response structure
          collectionData = response.data;
        }
        
        setCollection(collectionData)
        // console.log('Collection data:', collectionData)
        
        // Fetch products in this collection
        try {
          const productsResponse = await axios.get(`/products?collection=${id}`)
          // console.log('Products response:', productsResponse.data)
          
          // Handle different response structures
          let productsData = [];
          if (productsResponse.data && productsResponse.data.data && productsResponse.data.data.products) {
            // Standard API response structure
            productsData = productsResponse.data.data.products;
          } else if (Array.isArray(productsResponse.data)) {
            // Direct array response
            productsData = productsResponse.data;
          } else if (productsResponse.data && Array.isArray(productsResponse.data.products)) {
            // Alternative structure
            productsData = productsResponse.data.products;
          }
          
          setProducts(productsData)
          // console.log(`Found ${productsData.length} products in collection`)
        } catch (productErr) {
          // console.error('Error fetching collection products:', productErr)
          setProducts([])
        }
        
        setLoading(false)
      } catch (err) {
        // console.error('Error fetching collection details:', err)
        setError('Failed to load collection details. Please try again later.')
        toast.error('Failed to load collection details')
        setLoading(false)
      }
    }

    if (id) {
      fetchCollectionDetails()
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-java-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-gray-700 mb-6">{error || 'Collection not found'}</p>
        <button 
          onClick={() => navigate('/collections')} 
          className="px-6 py-2 bg-java-600 text-white rounded-md hover:bg-java-700 transition-colors"
        >
          Back to Collections
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-java-600 transition-colors">Home</Link>
        <FiChevronRight className="mx-2" />
        <Link to="/collections" className="hover:text-java-600 transition-colors">Collections</Link>
        <FiChevronRight className="mx-2" />
        <span className="text-java-600">{collection.name}</span>
      </div>
      
      {/* Back button */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/collections')} 
          className="flex items-center text-java-600 hover:text-java-700 transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          Back to Collections
        </button>
      </div>
      
      {/* Collection header */}
      <div className="bg-white rounded-lg overflow-hidden shadow-md mb-8">
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img 
            src={collection.image || 'https://via.placeholder.com/1200x400?text=Collection'} 
            alt={collection.name}
            className="w-full h-full object-cover"
          />
          {collection.startDate && collection.endDate && (
            <div className="absolute top-4 right-4 bg-java-600 text-white px-3 py-1 rounded-md">
              Limited Time Collection
            </div>
          )}
        </div>
        <div className="p-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{collection.name}</h1>
          {collection.description && (
            <p className="text-gray-700 mb-4">{collection.description}</p>
          )}
          {collection.startDate && collection.endDate && (
            <div className="text-sm text-gray-500 mb-4">
              Available from {new Date(collection.startDate).toLocaleDateString()} to {new Date(collection.endDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
      
      {/* Products section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Products in this Collection</h2>
        
        {products.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <FiShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">This collection doesn't have any products yet.</p>
            <Link 
              to="/shop" 
              className="inline-block px-6 py-2 bg-java-600 text-white rounded-md hover:bg-java-700 transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
      
      {/* Related collections section could be added here */}
    </div>
  )
}

export default CollectionDetail