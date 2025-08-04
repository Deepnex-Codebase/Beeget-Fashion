import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import useAuth from '../hooks/useAuth'
import Input from '../components/Common/Input'
import Button from '../components/Common/Button'

// Validation schema
const schema = yup.object({
  email: yup.string().email('Please enter a valid email').required('Email is required'),
}).required()

const ForgotPassword = () => {
  const { forgotPassword } = useAuth()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
    }
  })
  
  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      setServerError('')
      
      // Call the forgotPassword function from AuthContext
      const result = await forgotPassword(data.email)
      
      if (result.success) {
        // Successful password reset request
        setIsSubmitted(true)
      } else {
        // Handle error from forgotPassword function
        setServerError(result.message || 'Failed to send reset link. Please try again.')
      }
    } catch (error) {
      setServerError('An unexpected error occurred. Please try again.')
      // console.error('Password reset request error:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-heading font-bold text-java-800">Forgot Password</h1>
          <p className="mt-2 text-gray-600">
            {isSubmitted 
              ? 'Check your email for the password reset link' 
              : 'Enter your email to receive a password reset link'}
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
              <p>We've sent a password reset link to your email address. Please check your inbox and click the link to reset your password.</p>
            </div>
            
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Didn't receive an email? Check your spam folder or
              </p>
              <Button 
                onClick={() => setIsSubmitted(false)}
                variant="outline"
                size="md"
              >
                Try again
              </Button>
              
              <div className="pt-2">
                <Link to="/login" className="text-java-400 hover:text-java-500 transition-colors font-medium">
                  Return to login
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="your@email.com"
                error={errors.email?.message}
                {...register('email')}
                required
              />
            </div>
            
            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword