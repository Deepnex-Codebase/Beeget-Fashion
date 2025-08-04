import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import useAuth from '../hooks/useAuth'
import Input from '../components/Common/Input'
import Button from '../components/Common/Button'

// Validation schema
const schema = yup.object({
  email: yup.string().email('Please enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required'),
}).required()

const Login = () => {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState('')
  
  // Get redirect path from location state or default to home
  const from = location.state?.from?.pathname || '/'
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: ''
    }
  })
  
  const onSubmit = async (data) => {
    try {
      setServerError('')
      
      // Call the login function from AuthContext
      const result = await login(data.email, data.password)
      
      if (result.success) {
        // Successful login - redirect to intended page
        navigate(from, { replace: true })
      } else if (result.needsVerification) {
        // Email not verified - redirect to OTP verification page
        navigate('/verify-email', { 
          state: { 
            email: data.email,
            message: 'Please verify your email with the OTP sent to your email address.'
          }
        })
      } else if (result.isBanned) {
        // Banned user
        setServerError(`Your account has been banned. Reason: ${result.banReason || 'Violation of terms of service.'}`);
      } else {
        // Other errors
        setServerError(result.error || 'Failed to login. Please try again.')
      }
    } catch (error) {
      setServerError('An unexpected error occurred. Please try again.')
      // console.error('Login error:', error)
    }
  }
  
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-heading font-bold text-java-800">Welcome Back</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
          <div className="mt-2 text-sm text-gray-500">
            <p>Enter your credentials to sign in</p>
          </div>
        </div>
        
        {serverError && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
            {serverError}
          </div>
        )}
        
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
            
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
              required
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>
              
              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-teal-600 hover:text-teal-500">
                  Forgot your password?
                </Link>
              </div>
            </div>
          </div>
          
          <div>
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={loading}
            >
              Sign in
            </Button>
          </div>
          
          <div className="text-center text-sm">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-teal-600 hover:text-teal-500">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login