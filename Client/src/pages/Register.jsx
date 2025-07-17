import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import useAuth from '../hooks/useAuth'
import Input from '../components/Common/Input'
import Button from '../components/Common/Button'

// Validation schema
const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Please enter a valid email').required('Email is required'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  terms: yup.boolean().oneOf([true], 'You must accept the terms and conditions')
}).required()

const Register = () => {
  const { register: registerUser, loading } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false
    }
  })
  
  const onSubmit = async (data) => {
    try {
      setServerError('')
      
      // Remove confirmPassword and terms from data before processing
      const { confirmPassword, terms, firstName, lastName, ...otherData } = data
      
      // Combine firstName and lastName into a single name field
      const userData = {
        ...otherData,
        name: `${firstName} ${lastName}`
      }
      
      // Call the register function from AuthContext
      const result = await registerUser(userData)
      
      if (result.success) {
        // Successful registration - redirect to OTP verification page
        navigate('/verify-email', { 
          state: { 
            email: userData.email,
            message: result.message || 'Registration successful! Please enter the OTP sent to your email to verify your account.', 
            needsVerification: true,
            type: 'success' 
          } 
        })
      } else {
        // Registration failed
        setServerError(result.error || 'Failed to register. Please try again.')
      }
    } catch (error) {
      setServerError('An unexpected error occurred. Please try again.')
      console.error('Registration error:', error)
    }
  }
  
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-heading font-bold text-charcoal">Create an Account</h1>
          <p className="mt-2 text-gray-600">Join Beeget Fashion today</p>
        </div>
        
        {serverError && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
            {serverError}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                type="text"
                placeholder="John"
                error={errors.firstName?.message}
                {...register('firstName')}
                required
              />
              
              <Input
                label="Last Name"
                type="text"
                placeholder="Doe"
                error={errors.lastName?.message}
                {...register('lastName')}
                required
              />
            </div>
            
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
              helperText="Must be at least 8 characters with uppercase, lowercase, and number"
              {...register('password')}
              required
            />
            
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
              required
            />
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  className="h-4 w-4 text-teal border-gray-300 rounded focus:ring-teal"
                  {...register('terms')}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-gray-700">
                  I agree to the{' '}
                  <Link to="/terms" className="text-teal hover:text-teal/80 transition-colors">
                    Terms and Conditions
                  </Link>
                  {' '}and{' '}
                  <Link to="/privacy-policy" className="text-teal hover:text-teal/80 transition-colors">
                    Privacy Policy
                  </Link>
                </label>
                {errors.terms && (
                  <p className="mt-1 text-sm text-red-600">{errors.terms.message}</p>
                )}
              </div>
            </div>
          </div>
          
          <Button
            type="submit"
            fullWidth
            size="lg"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-teal hover:text-teal/80 transition-colors font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register