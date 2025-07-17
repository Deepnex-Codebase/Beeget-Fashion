import { createContext, useState, useEffect } from 'react'
import api from '../utils/api'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [tokens, setTokens] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Login function - using real API
  const login = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      
      // Call the login API endpoint
      const response = await api.post('/auth/login', { email, password })
      
      if (response.data.success) {
        // Extract data from response
        const { token, user } = response.data.data
        
        // Create tokens object
        const tokensObj = { accessToken: token }
        
        // Save token and user data
        api.setAuthToken(tokensObj)
        setUser(user)
        setTokens(tokensObj)
        
        // Save to localStorage - store tokens as JSON object
        localStorage.setItem('tokens', JSON.stringify(tokensObj))
        localStorage.setItem('user', JSON.stringify(user))
        
        console.log('Login successful')
        return { success: true, message: 'Login successful' }
      } else {
        // This shouldn't happen as API should throw error on failure
        const errorMessage = response.data.message || 'Login failed'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (err) {
      console.error('Login error:', err)
      
      // Handle specific error cases
      if (err.response) {
        const { status, data } = err.response
        
        if (status === 403 && data.message.includes('not verified')) {
          // Email not verified case
          return {
            success: false,
            error: 'Email not verified',
            needsVerification: true,
            email: email
          }
        } else if (status === 401) {
          // Invalid credentials
          const errorMessage = 'Invalid email or password'
          setError(errorMessage)
          return { success: false, error: errorMessage }
        } else {
          // Other API errors
          const errorMessage = data.message || 'Failed to login'
          setError(errorMessage)
          return { success: false, error: errorMessage }
        }
      } else {
        // Network or other errors
        const errorMessage = 'Failed to connect to server. Please check your internet connection.'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } finally {
      setLoading(false)
    }
  }
  
  // Register function - using real API
  const register = async (userData) => {
    try {
      setLoading(true)
      setError(null)
      
      // Call the register API endpoint
      const response = await api.post('/auth/register', userData)
      
      if (response.data.success) {
        console.log('Registration successful')
        
        // Return success with verification needed
        return { 
          success: true, 
          message: response.data.message || 'Registration successful. Please check your email for verification.',
          needsVerification: true,
          email: userData.email
        }
      } else {
        // This shouldn't happen as API should throw error on failure
        const errorMessage = response.data.message || 'Registration failed'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (err) {
      console.error('Registration error:', err)
      
      // Handle specific error cases
      if (err.response) {
        const { status, data } = err.response
        
        if (status === 409) {
          // Email already exists
          const errorMessage = 'Email already exists'
          setError(errorMessage)
          return { success: false, error: errorMessage }
        } else {
          // Other API errors
          const errorMessage = data.message || 'Failed to register'
          setError(errorMessage)
          return { success: false, error: errorMessage }
        }
      } else {
        // Network or other errors
        const errorMessage = 'Failed to connect to server. Please check your internet connection.'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } finally {
      setLoading(false)
    }
  }
  
  // Initialize auth state from localStorage and validate token
  useEffect(() => {
    console.log('Initializing auth state from localStorage')
    const storedTokens = localStorage.getItem('tokens')
    const storedUser = localStorage.getItem('user')
    
    const initializeAuth = async () => {
      if (storedTokens && storedUser) {
        try {
          // Parse tokens
          const parsedTokens = JSON.parse(storedTokens)
          
          // Set the token in API headers
          api.setAuthToken(parsedTokens)
          setTokens(parsedTokens)
          
          // Parse user data
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
          
          // Validate token by making a request to get user profile
          const response = await api.get('/auth/profile')
          if (response.data.success) {
            // Update user data with latest from server
            setUser(response.data.data.user)
            console.log('Token validated and user profile updated')
          }
        } catch (error) {
          console.error('Token validation failed:', error)
          // Clear invalid auth data
          localStorage.removeItem('tokens')
          localStorage.removeItem('user')
          api.setAuthToken(null)
          setUser(null)
          setTokens(null)
        }
      }
      
      setLoading(false)
    }
    
    initializeAuth()
  }, [])

  // Logout function - using real API
  const logout = async () => {
    try {
      setLoading(true)
      
      // Call the logout API endpoint
      // Note: Some implementations might not need a server call for logout
      // as it can be handled client-side by removing the token
      try {
        // Optional: Call logout endpoint if your API has one
        await api.post('/auth/logout')
      } catch (error) {
        // If the API call fails, we still want to log out locally
        console.log('Logout API call failed, proceeding with local logout')
      }
      
      // Clear auth token from API
      api.setAuthToken(null)
      
      // Clear state
      setUser(null)
      setTokens(null)
      setError(null)
      
      // Clear localStorage
      localStorage.removeItem('user')
      localStorage.removeItem('tokens')
      
      return { success: true }
    } catch (err) {
      console.error('Logout error:', err)
      // Even if there's an error, we should still clear local state
      setUser(null)
      setTokens(null)
      localStorage.removeItem('user')
      return { success: true }
    } finally {
      setLoading(false)
    }
  }
  
  // Get user profile - using real API
  const getProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if user is logged in
      if (!tokens?.accessToken) {
        const errorMessage = 'User not authenticated'
        setError(errorMessage)
        return { 
          success: false, 
          error: errorMessage
        }
      }
      
      // Call the get profile API endpoint
      const response = await api.get('/auth/profile')
      
      if (response.data.success) {
        // Update user data in state with the latest from server
        const userData = response.data.data.user
        setUser(userData)
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(userData))
        
        return { 
          success: true, 
          data: userData
        }
      } else {
        // This shouldn't happen as API should throw error on failure
        const errorMessage = response.data.message || 'Failed to get profile'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (err) {
      console.error('Get profile error:', err)
      
      // Handle specific error cases
      if (err.response) {
        const { status, data } = err.response
        
        if (status === 401) {
          // Token expired or invalid
          logout() // Force logout
          const errorMessage = 'Session expired. Please login again.'
          setError(errorMessage)
          return { success: false, error: errorMessage }
        } else {
          // Other API errors
          const errorMessage = data.message || 'Failed to get profile'
          setError(errorMessage)
          return { success: false, error: errorMessage }
        }
      } else {
        // Network or other errors
        const errorMessage = 'Failed to connect to server. Please check your internet connection.'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } finally {
      setLoading(false)
    }
  }
  
  // Update user profile - using real API
  const updateProfile = async (profileData) => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if user is logged in
      if (!tokens?.accessToken) {
        const errorMessage = 'User not authenticated'
        setError(errorMessage)
        return { 
          success: false, 
          error: errorMessage
        }
      }
      
      // Call the update profile API endpoint
      const response = await api.put('/auth/profile', profileData)
      
      if (response.data.success) {
        // Update user data in state with the updated data from server
        const updatedUser = response.data.data.user
        
        // Merge the updated data with existing user data
        const mergedUser = { ...user, ...updatedUser }
        setUser(mergedUser)
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(mergedUser))
        
        return { 
          success: true, 
          message: response.data.message || 'Profile updated successfully',
          data: updatedUser
        }
      } else {
        // This shouldn't happen as API should throw error on failure
        const errorMessage = response.data.message || 'Failed to update profile'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (err) {
      console.error('Update profile error:', err)
      
      // Handle specific error cases
      if (err.response) {
        const { status, data } = err.response
        
        if (status === 401) {
          // Token expired or invalid
          logout() // Force logout
          const errorMessage = 'Session expired. Please login again.'
          setError(errorMessage)
          return { success: false, error: errorMessage }
        } else if (status === 400) {
          // Validation error
          const errorMessage = data.message || 'Invalid profile data'
          setError(errorMessage)
          return { success: false, error: errorMessage }
        } else {
          // Other API errors
          const errorMessage = data.message || 'Failed to update profile'
          setError(errorMessage)
          return { success: false, error: errorMessage }
        }
      } else {
        // Network or other errors
        const errorMessage = 'Failed to connect to server. Please check your internet connection.'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } finally {
      setLoading(false)
    }
  }
  
  // Check if user is authenticated
  const isAuthenticated = !!user
  
  // Check if user is admin
  const isAdmin = user?.roles?.includes('admin') || user?.role === 'admin' || false
  
  // Check if user is subadmin
  const isSubAdmin = user?.roles?.includes('subadmin') || user?.role === 'subadmin' || isAdmin || false
  console.log(isSubAdmin )
  // Check if user has specific permission
  const hasPermission = (permission) => {
    if (isAdmin) return true // Admin has all permissions
    if (!isSubAdmin) return false // Only subadmins can have specific permissions
    return user?.permissions?.includes(permission) || false
  }
  
  // Forgot password function - using real API
  const forgotPassword = async (email) => {
    try {
      setLoading(true)
      setError(null)
      
      // Call the forgot password API endpoint
      const response = await api.post('/auth/forgot-password', { email })
      
      if (response.data.success) {
        return { 
          success: true, 
          message: response.data.message || 'If your email exists in our system, you will receive a password reset link.'
        }
      } else {
        // This shouldn't happen as API should throw error on failure
        const errorMessage = response.data.message || 'Failed to process request'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (err) {
      console.error('Forgot password error:', err)
      
      // Handle specific error cases
      if (err.response) {
        const { status, data } = err.response
        
        if (status === 400) {
          // Invalid email format
          const errorMessage = 'Please provide a valid email address.'
          setError(errorMessage)
          return { success: false, error: errorMessage }
        } else {
          // Other API errors
          const errorMessage = data.message || 'Failed to process request'
          setError(errorMessage)
          return { success: false, error: errorMessage }
        }
      } else {
        // Network or other errors
        const errorMessage = 'Failed to connect to server. Please check your internet connection.'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } finally {
      setLoading(false)
    }
  }
  
  // Change password function - using real API
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true)
      setError(null)
      
      // Call the real API endpoint
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      })
      
      if (response.data.success) {
        return { 
          success: true, 
          message: response.data.message || 'Password changed successfully' 
        }
      } else {
        // This shouldn't happen as API should throw error on failure
        const errorMessage = response.data.message || 'Failed to change password'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (err) {
      console.error('Change password error:', err)
      
      // Handle specific error cases
      if (err.response) {
        const { status, data } = err.response
        
        if (status === 401) {
          // Current password is incorrect
          const errorMessage = data.message || 'Current password is incorrect'
          setError(errorMessage)
          return { success: false, error: errorMessage }
        } else {
          // Other API errors
          const errorMessage = data.message || 'Failed to change password'
          setError(errorMessage)
          return { success: false, error: errorMessage }
        }
      } else {
        // Network or other errors
        const errorMessage = 'Failed to connect to server. Please check your internet connection.'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } finally {
      setLoading(false)
    }
  }

  // Reset password function - using real API
  const resetPassword = async (token, newPassword) => {
    try {
      setLoading(true)
      setError(null)
      
      // Call the reset password API endpoint
      const response = await api.post('/auth/reset-password', { token, newPassword })
      
      if (response.data.success) {
        return { 
          success: true, 
          message: response.data.message || 'Password has been reset successfully. You can now login with your new password.'
        }
      } else {
        // This shouldn't happen as API should throw error on failure
        const errorMessage = response.data.message || 'Failed to reset password'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (err) {
      console.error('Reset password error:', err)
      
      // Handle specific error cases
      if (err.response) {
        const { status, data } = err.response
        
        if (status === 400 && data.message.includes('password')) {
          // Password validation error
          const errorMessage = data.message || 'Password must meet the requirements.'
          setError(errorMessage)
          return { success: false, error: errorMessage }
        } else if (status === 400 || status === 404) {
          // Invalid or expired token
          const errorMessage = 'Invalid or expired reset token.'
          setError(errorMessage)
          return { success: false, error: errorMessage }
        } else {
          // Other API errors
          const errorMessage = data.message || 'Failed to reset password'
          setError(errorMessage)
          return { success: false, error: errorMessage }
        }
      } else {
        // Network or other errors
        const errorMessage = 'Failed to connect to server. Please check your internet connection.'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } finally {
      setLoading(false)
    }
  }
  
  // Verify email function - using real API
  const verifyEmail = async (email, otp) => {
    try {
      setLoading(true)
      setError(null)
      
      // Call the verify email API endpoint
      const response = await api.post('/auth/verify-email', { email, otp })
      
      if (response.data.success) {
        return { 
          success: true, 
          message: response.data.message || 'Email verified successfully. You can now login.'
        }
      } else {
        // This shouldn't happen as API should throw error on failure
        const errorMessage = response.data.message || 'Email verification failed'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (err) {
      console.error('Email verification error:', err)
      
      // Handle specific error cases
      if (err.response) {
        const { status, data } = err.response
        
        if (status === 400) {
          // Invalid OTP
          const errorMessage = 'Invalid OTP. Please check and try again.'
          setError(errorMessage)
          return { success: false, error: errorMessage }
        } else if (status === 404) {
          // Email not found
          const errorMessage = 'Email not found or verification request expired.'
          setError(errorMessage)
          return { success: false, error: errorMessage }
        } else {
          // Other API errors
          const errorMessage = data.message || 'Failed to verify email'
          setError(errorMessage)
          return { success: false, error: errorMessage }
        }
      } else {
        // Network or other errors
        const errorMessage = 'Failed to connect to server. Please check your internet connection.'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        forgotPassword,
        changePassword,
        resetPassword,
        verifyEmail,
        isAuthenticated,
        isAdmin,
        isSubAdmin,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext