import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import useAuth from '../hooks/useAuth'
import Input from '../components/Common/Input'
import Button from '../components/Common/Button'
import api from '../utils/api'

// Validation schema for profile update
const profileSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  whatsappNumber: yup.string().matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number').nullable(),
}).required()

// Validation schema for password change
const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
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

const AccountSettings = () => {
  const { user, updateProfile, changePassword } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')
  const [updateStatus, setUpdateStatus] = useState({
    loading: false,
    success: false,
    error: ''
  })
  
  // Profile form
  const profileForm = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      whatsappNumber: user?.whatsappNumber || '',
    }
  })
  
  // Update form values when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || '',
        email: user.email || '',
        whatsappNumber: user.whatsappNumber || '',
      })
    }
  }, [user, profileForm])
  
  // Password form
  const passwordForm = useForm({
    resolver: yupResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  })
  
  // Handle profile update
  const handleProfileUpdate = async (data) => {
    setUpdateStatus({ loading: true, success: false, error: '' })
    
    try {
      // Call the real API endpoint
      const response = await api.put('/auth/profile', {
        name: data.name,
        whatsappNumber: data.whatsappNumber
      })
      
      if (response.data.success) {
        setUpdateStatus({
          loading: false,
          success: true,
          error: ''
        })
        
        // Update local user data
        const updatedUser = response.data.data.user
        
        // Update auth context
        await updateProfile({
          name: updatedUser.name,
          whatsappNumber: updatedUser.whatsappNumber
        })
        
        // Reset form with updated values to keep form state in sync
        profileForm.reset({
          name: updatedUser.name || '',
          email: updatedUser.email || '',
          whatsappNumber: updatedUser.whatsappNumber || ''
        })
        
        // Invalidate user profile query to refresh data
        queryClient.invalidateQueries(['user-profile'])
        
        // Show success message briefly
        setTimeout(() => {
          setUpdateStatus(prev => ({ ...prev, success: false }))
        }, 3000)
      } else {
        setUpdateStatus({
          loading: false,
          success: false,
          error: response.data.message || 'Failed to update profile'
        })
      }
    } catch (error) {
      setUpdateStatus({
        loading: false,
        success: false,
        error: error.response?.data?.message || 'An unexpected error occurred'
      })
    }
  }
  
  // Handle password change
  const handlePasswordChange = async (data) => {
    setUpdateStatus({ loading: true, success: false, error: '' })
    
    try {
      // Use the changePassword function from AuthContext
      const result = await changePassword(data.currentPassword, data.newPassword)
      
      if (result.success) {
        setUpdateStatus({
          loading: false,
          success: true,
          error: ''
        })
        
        // Reset password form
        passwordForm.reset({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        
        // Show success message briefly
        setTimeout(() => {
          setUpdateStatus(prev => ({ ...prev, success: false }))
        }, 3000)
      } else {
        setUpdateStatus({
          loading: false,
          success: false,
          error: result.error || 'Failed to update password'
        })
      }
    } catch (error) {
      setUpdateStatus({
        loading: false,
        success: false,
        error: error.message || 'Current password is incorrect'
      })
    }
  }
  


  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
        
        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'profile' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'password' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('password')}
          >
            Password
          </button>
        </div>
      
      {/* Status Messages */}
      {updateStatus.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>{activeTab === 'profile' ? 'Profile updated successfully!' : 'Password changed successfully!'}</p>
        </div>
      )}
      
      {updateStatus.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{updateStatus.error}</p>
        </div>
      )}
      
      {/* Profile Information Form */}
      {activeTab === 'profile' && (
        <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6 max-w-md">
          <Input
            label="Full Name"
            placeholder="Your full name"
            error={profileForm.formState.errors.name?.message}
            {...profileForm.register('name')}
          />
          
          <Input
            label="Email Address"
            type="email"
            placeholder="Your email address"
            error={profileForm.formState.errors.email?.message}
            {...profileForm.register('email')}
            disabled
          />
          
          <Input
            label="WhatsApp Number"
            placeholder="Your 10-digit WhatsApp number"
            error={profileForm.formState.errors.whatsappNumber?.message}
            {...profileForm.register('whatsappNumber')}
          />
          
          <Button
            type="submit"
            loading={updateStatus.loading}
          >
            Update Profile
          </Button>
        </form>
      )}
      
      {/* Change Password Form */}
      {activeTab === 'password' && (
        <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-6 max-w-md">
          <Input
            label="Current Password"
            type="password"
            placeholder="Enter your current password"
            error={passwordForm.formState.errors.currentPassword?.message}
            {...passwordForm.register('currentPassword')}
          />
          
          <Input
            label="New Password"
            type="password"
            placeholder="Enter your new password"
            error={passwordForm.formState.errors.newPassword?.message}
            {...passwordForm.register('newPassword')}
          />
          
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Confirm your new password"
            error={passwordForm.formState.errors.confirmPassword?.message}
            {...passwordForm.register('confirmPassword')}
          />
          
          <Button
            type="submit"
            loading={updateStatus.loading}
          >
            Change Password
          </Button>
        </form>
      )}
      
    </div>
    </div>
  )
}

export default AccountSettings