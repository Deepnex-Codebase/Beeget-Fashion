import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from '../utils/api'
import { toast } from 'react-hot-toast'
import { FiChevronRight } from 'react-icons/fi'

const Collections = () => {
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true)
        setError(null) // Reset error state
        
        console.log('Fetching collections from API...')
        
        // Use the correct endpoint based on the API routes
        console.log('API base URL:', axios.defaults.baseURL)
        const response = await axios.get('/collections')
        // No active filter parameter needed anymore
        console.log('API response status:', response.status)
        
        // Check if response and response.data exist
        if (!response || !response.data) {
          throw new Error('Invalid API response structure')
        }
        
        // Log the full response for debugging
        console.log('Full API response:', response.data)
        
        // Backend now returns array directly
        const collectionData = Array.isArray(response.data) ? response.data : []
        console.log(`Received ${collectionData.length} collections directly from API`)
        
        // Final validation of collection data
        if (collectionData.length === 0) {
          console.warn('No collections found in the response')
        } else {
          console.log(`Successfully loaded ${collectionData.length} collections`)
        }
        
        setCollections(collectionData)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching collections:', err)
        setError('Failed to load collections. Please try again later.')
        toast.error('Failed to load collections')
        setCollections([])
        setLoading(false)
      }
    }

    fetchCollections()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-java-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-gray-700 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2 bg-java-600 text-white rounded-md hover:bg-java-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (collections.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">No Collections Found</h2>
        <p className="text-gray-600 mb-6">There are currently no collections available.</p>
        <Link 
          to="/shop" 
          className="px-6 py-2 bg-java-600 text-white rounded-md hover:bg-java-700 transition-colors"
        >
          Browse All Products
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Our Collections</h1>
        <div className="flex items-center text-sm text-gray-500">
          <Link to="/" className="hover:text-java-600 transition-colors">Home</Link>
          <FiChevronRight className="mx-2" />
          <span className="text-java-600">Collections</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <motion.div
            key={collection._id}
            className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -5 }}
          >
            <Link to={`/collections/${collection._id}`}>
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={collection.image || 'https://via.placeholder.com/400x300?text=Collection'} 
                  alt={collection.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                {collection.startDate && collection.endDate && (
                  <div className="absolute top-4 right-4 bg-java-600 text-white text-xs px-2 py-1 rounded">
                    Limited Time
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{collection.name}</h2>
                {collection.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{collection.description}</p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-java-600 font-medium">View Collection</span>
                  <FiChevronRight className="text-java-600" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default Collections