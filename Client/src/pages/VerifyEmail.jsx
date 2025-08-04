import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import useAuth from '../hooks/useAuth'
import Input from '../components/Common/Input'
import Button from '../components/Common/Button'
import api from '../utils/api'

// Validation schema for OTP verification form
const schema = yup.object({
  email: yup.string().email('Please enter a valid email').required('Email is required'),
  otp: yup.string().required('OTP is required').matches(/^[0-9]{6}$/, 'OTP must be 6 digits')
}).required()

const VerifyEmail = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()
  
  // States
  const [verificationStatus, setVerificationStatus] = useState({
    loading: false,
    success: false,
    error: '',
    message: ''
  })
  const [resendStatus, setResendStatus] = useState({
    loading: false,
    success: false,
    error: '',
    message: ''
  })

  // Get email and message from location state (if redirected from login/register)
  const locationState = location.state || {}
  const emailFromState = locationState.email || ''
  const messageFromState = locationState.message || ''

  // Form for OTP verification
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: emailFromState,
      otp: ''
    }
  })

  // Set message from state when component mounts
  useEffect(() => {
    if (messageFromState) {
      setVerificationStatus(prev => ({
        ...prev,
        message: messageFromState
      }))
    }
  }, [messageFromState])

  // Function to verify email with OTP
  const verifyEmailWithOTP = async (data) => {
    setVerificationStatus(prev => ({ ...prev, loading: true, error: '' }))
    
    try {
      // Call the API to verify the OTP
      const response = await api.post('/auth/verify-email', {
        email: data.email,
        otp: data.otp
      })
      
      if (response.data.success) {
        // Successful verification
        setVerificationStatus({
          loading: false,
          success: true,
          error: '',
          message: response.data.message || 'Email verified successfully!'
        })
        
        // Auto-login and redirect after successful verification
        setTimeout(() => {
          navigate('/login', { 
            replace: true,
            state: { message: 'Your email has been verified. You can now log in.' }
          })
        }, 2000)
      } else {
        // This shouldn't happen as API should throw error on failure
        setVerificationStatus({
          loading: false,
          success: false,
          error: response.data.message || 'Failed to verify email',
          message: ''
        })
      }
    } catch (err) {
      // console.error('Email verification error:', err)
      
      // Handle specific error cases
      if (err.response) {
        const { status, data } = err.response
        
        if (status === 400) {
          // Invalid or expired OTP
          setVerificationStatus({
            loading: false,
            success: false,
            error: data.message || 'Invalid or expired OTP. Please request a new one.',
            message: ''
          })
        } else if (status === 404) {
          // User not found
          setVerificationStatus({
            loading: false,
            success: false,
            error: data.message || 'User not found with this email.',
            message: ''
          })
        } else {
          // Other API errors
          setVerificationStatus({
            loading: false,
            success: false,
            error: data.message || 'Failed to verify email',
            message: ''
          })
        }
      } else {
        // Network or other errors
        setVerificationStatus({
          loading: false,
          success: false,
          error: 'Failed to connect to server. Please check your internet connection.',
          message: ''
        })
      }
    }
  }

  // Function to resend verification email - using real API
  const onResendSubmit = async (data) => {
    setResendStatus(prev => ({ ...prev, loading: true, error: '', success: false }))
    
    try {
      // Call the API to resend verification email
      const response = await api.post('/auth/resend-verification', { email: data.email })
      
      if (response.data.success) {
        // Successful resend
        setResendStatus({
          loading: false,
          success: true,
          error: '',
          message: response.data.message || 'Verification email sent successfully! Please check your inbox.'
        })
      } else {
        // This shouldn't happen as API should throw error on failure
        setResendStatus({
          loading: false,
          success: false,
          error: response.data.message || 'Failed to resend verification email',
          message: ''
        })
      }
    } catch (err) {
      // console.error('Resend verification error:', err)
      
      // Handle specific error cases
      if (err.response) {
        const { status, data } = err.response
        
        if (status === 404) {
          // Email not found
          setResendStatus({
            loading: false,
            success: false,
            error: 'No account found with this email address.',
            message: ''
          })
        } else if (status === 400) {
          // Email already verified
          setResendStatus({
            loading: false,
            success: false,
            error: data.message || 'This email is already verified.',
            message: ''
          })
        } else {
          // Other API errors
          setResendStatus({
            loading: false,
            success: false,
            error: data.message || 'Failed to resend verification email',
            message: ''
          })
        }
      } else {
        // Network or other errors
        setResendStatus({
          loading: false,
          success: false,
          error: 'Failed to connect to server. Please check your internet connection.',
          message: ''
        })
      }
    }
  }

  return (
    <div className="max-w-md mx-auto my-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">Email Verification</h1>
      
      {/* Verification Status */}
      {verificationStatus.loading && (
        <div className="text-center mb-4">
          <p>Verifying your email...</p>
        </div>
      )}
      
      {verificationStatus.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>{verificationStatus.message}</p>
        </div>
      )}
      
      {verificationStatus.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{verificationStatus.error}</p>
        </div>
      )}
      
      {verificationStatus.message && !verificationStatus.success && !verificationStatus.error && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <p>{verificationStatus.message}</p>
        </div>
      )}
      
      {/* OTP Verification Form */}
      {!verificationStatus.success && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Verify Your Email with OTP</h2>
          
          <p className="text-gray-600 mb-4">
            Enter the 6-digit OTP sent to your email address to verify your account.
          </p>
          
          <form onSubmit={handleSubmit(verifyEmailWithOTP)}>
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              error={errors.email?.message}
              {...register('email')}
            />
            
            <Input
              label="OTP Code"
              type="text"
              placeholder="Enter 6-digit OTP"
              error={errors.otp?.message}
              {...register('otp')}
              className="mt-4"
            />
            
            <Button
              type="submit"
              className="w-full mt-4"
              loading={verificationStatus.loading}
            >
              Verify Email
            </Button>
          </form>
          
          <div className="mt-6 border-t pt-4">
            <h3 className="text-md font-semibold mb-2">Didn't receive the code?</h3>
            
            {resendStatus.success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                <p>{resendStatus.message}</p>
              </div>
            )}
            
            {resendStatus.error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p>{resendStatus.error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit(onResendSubmit)}>
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                error={errors.email?.message}
                {...register('email')}
              />
              
              <Button
                type="submit"
                className="w-full mt-4"
                variant="secondary"
                loading={resendStatus.loading}
              >
                Resend OTP
              </Button>
            </form>
          </div>
        </div>
      )}
      
      <div className="mt-6 text-center">
        <Link to="/login" className="text-blue-600 hover:text-blue-800">
          Back to Login
        </Link>
      </div>
    </div>
  )
}

export default VerifyEmail