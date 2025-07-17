import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import useAuth from '../hooks/useAuth'
import Input from '../components/Common/Input'
import Button from '../components/Common/Button'

// Validation schema
const schema = yup.object({
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword'), null], 'Passwords must match')
    .required('Confirm password is required'),
}).required()

const ResetPassword = () => {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [resetToken, setResetToken] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Extract token from URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search)
    const token = queryParams.get('token')
    
    if (token) {
      setResetToken(token)
    } else {
      setServerError('Reset token is missing. Please use the link from your email.')
    }
  }, [location])
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      newPassword: '',
      confirmPassword: ''
    }
  })
  
  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      setServerError('')
      
      // Call the resetPassword function from AuthContext
      const result = await resetPassword(resetToken, data.newPassword)
      
      if (result.success) {
        // Successful password reset
        setIsSubmitted(true)
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { message: 'Your password has been reset successfully. You can now log in with your new password.' }
          })
        }, 3000)
      } else {
        // Handle error from resetPassword function
        setServerError(result.message || 'Failed to reset password. Please try again.')
      }
    } catch (error) {
      setServerError('An unexpected error occurred. Please try again.')
      console.error('Password reset error:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-heading font-bold text-java-800">Reset Password</h1>
          <p className="mt-2 text-gray-600">
            {isSubmitted 
              ? 'Your password has been reset successfully' 
              : 'Create a new password for your account'}
          </p>
        </div>
        
        {serverError && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
            {serverError}
          </div>
        )}
        
        {isSubmitted ? (
          <div className="mt-6 space-y-6">
            <div className="bg-green-50 text-green-700 p-4 rounded-md">
              <p>Your password has been reset successfully. You will be redirected to the login page shortly.</p>
            </div>
            
            <div className="text-center">
              <Link to="/login" className="text-java-400 hover:text-java-500 transition-colors font-medium">
                Go to login page
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <Input
                label="New Password"
                type="password"
                placeholder="Enter your new password"
                error={errors.newPassword?.message}
                {...register('newPassword')}
                required
              />
              
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Confirm your new password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
                required
              />
            </div>
            
            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={isLoading || !resetToken}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
            
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link to="/login" className="text-java-400 hover:text-java-500 transition-colors font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPassword