import { useState, useEffect } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import Button from '../components/Common/Button'
import AccountOrders from './AccountOrders'
import AccountWishlist from './AccountWishlist'
import AccountAddresses from './AccountAddresses'
import AccountSettings from './AccountSettings'
import AccountReturns from '../components/Account/AccountReturns'
import api from '../utils/api'
import { useQuery } from '@tanstack/react-query'
import useWishlist from '../hooks/useWishlist'

const Account = () => {
  const { user, logout } = useAuth()
  const { wishlist } = useWishlist()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(() => {  
    // Set active tab based on current path
    const path = location.pathname
    if (path.includes('/account/orders')) return 'orders'
    if (path.includes('/account/returns')) return 'returns'
    if (path.includes('/account/wishlist')) return 'wishlist'
    if (path.includes('/account/addresses')) return 'addresses'
    if (path.includes('/account/settings')) return 'settings'
    return 'profile' // Default tab
  })
  
  // Update browser URL without navigation when tab changes
  useEffect(() => {
    if (activeTab === 'profile') {
      window.history.replaceState(null, '', '/account')
    } else {
      window.history.replaceState(null, '', `/account/${activeTab}`)
    }
  }, [activeTab])
  
  // Fetch user profile data using React Query
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await api.get('/auth/profile')
      return response.data.data.user
    },
    enabled: !!user,
    onError: (error) => {
      // console.error('Error fetching user profile:', error)
    },
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false
  })

  // Fetch orders count using React Query
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await api.get('/orders');
      return response.data.data.orders || [];
    },
    enabled: !!user,
    onError: (error) => {
      // console.error('Error fetching orders:', error);
    },
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Fetch addresses count using React Query
  const { data: addressesData, isLoading: addressesLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const response = await api.get('/auth/profile');
      return response.data.data.user.addresses || [];
    },
    enabled: !!user,
    onError: (error) => {
      // console.error('Error fetching addresses:', error);
    },
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Get counts
  const ordersCount = ordersData?.length || 0;
  const wishlistCount = wishlist?.length || 0;
  const addressesCount = addressesData?.length || 0;
  
  // If user is not logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  return (
    <div className="bg-gray-50 py-12">
      <div className="container-custom">
        <h1 className="text-3xl font-heading font-semibold mb-8">My Account</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* User Info */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 text-xl font-semibold">
                    {userProfile?.name?.charAt(0) || user?.name?.charAt(0) || ''}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {userProfile?.name || user?.name || ''}
                    </h2>
                    <p className="text-gray-600 text-sm">{userProfile?.email || user?.email || ''}</p>
                  </div>
                </div>
              </div>
              
              {/* Navigation */}
              <nav className="p-2">
                <ul className="space-y-1">
                  <li>
                    <button 
                      className={`block w-full text-left px-4 py-2 rounded-md ${activeTab === 'profile' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => setActiveTab('profile')}
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </div>
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`block w-full text-left px-4 py-2 rounded-md ${activeTab === 'orders' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => setActiveTab('orders')}
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        Orders
                      </div>
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`block w-full text-left px-4 py-2 rounded-md ${activeTab === 'returns' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => setActiveTab('returns')}
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                        </svg>
                        Returns
                      </div>
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`block w-full text-left px-4 py-2 rounded-md ${activeTab === 'wishlist' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => setActiveTab('wishlist')}
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Wishlist
                      </div>
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`block w-full text-left px-4 py-2 rounded-md ${activeTab === 'addresses' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => setActiveTab('addresses')}
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Addresses
                      </div>
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`block w-full text-left px-4 py-2 rounded-md ${activeTab === 'settings' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => setActiveTab('settings')}
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </div>
                    </button>
                  </li>
                </ul>
              </nav>
              
              {/* Logout Button */}
              <div className="p-4 border-t border-gray-200">
                <Button 
                  variant="secondary" 
                  fullWidth 
                  onClick={logout}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </Button>
              </div>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Tab content */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Name</h3>
                      <p className="text-gray-800">
                        {profileLoading ? 'Loading...' : (userProfile?.name || user?.name || 'Not provided')}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Email Address</h3>
                      <p className="text-gray-800">
                        {profileLoading ? 'Loading...' : (userProfile?.email || user?.email || 'Not provided')}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">WhatsApp Number</h3>
                      <p className="text-gray-800">
                        {profileLoading ? 'Loading...' : (userProfile?.whatsappNumber || 'Not provided')}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Account Status</h3>
                      <p className="text-gray-800">
                        {profileLoading ? 'Loading...' : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userProfile?.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {userProfile?.isVerified ? 'Verified' : 'Not Verified'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-6">Account Summary</h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          <h3 className="font-medium">Orders</h3>
                        </div>
                        <p className="text-2xl font-semibold">{ordersLoading ? '...' : ordersCount}</p>
                        <button onClick={() => setActiveTab('orders')} className="text-sm text-teal-600 hover:text-teal-700 mt-2 inline-block">
                          View Orders
                        </button>
                      </div>
                        
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <h3 className="font-medium">Wishlist</h3>
                        </div>
                        <p className="text-2xl font-semibold">{wishlistCount}</p>
                        <button onClick={() => setActiveTab('wishlist')} className="text-sm text-teal-600 hover:text-teal-700 mt-2 inline-block">
                          View Wishlist
                        </button>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <h3 className="font-medium">Addresses</h3>
                        </div>
                        <p className="text-2xl font-semibold">{addressesLoading ? '...' : addressesCount}</p>
                        <button onClick={() => setActiveTab('addresses')} className="text-sm text-teal-600 hover:text-teal-700 mt-2 inline-block">
                          Manage Addresses
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Orders tab */}
              {activeTab === 'orders' && (
                <AccountOrders />
              )}
              
              {/* Returns tab */}
              {activeTab === 'returns' && (
                <AccountReturns />
              )}
              
              {/* Wishlist tab */}
              {activeTab === 'wishlist' && (
                <AccountWishlist />
              )}
              
              {/* Addresses tab */}
              {activeTab === 'addresses' && (
                <AccountAddresses />
              )}
              
              {/* Settings tab */}
              {activeTab === 'settings' && (
                <AccountSettings />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Account