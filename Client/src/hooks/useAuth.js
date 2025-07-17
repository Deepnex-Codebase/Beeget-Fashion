import { useContext } from 'react'
import AuthContext from '../contexts/AuthContext'

/**
 * Custom hook to access authentication context
 * @returns {Object} Authentication context values and methods
 */
const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

export default useAuth