import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Button from '../components/Common/Button'
import useAuth from '../hooks/useAuth'
import useCart from '../hooks/useCart'
import axios from '../utils/api'
import { toast } from 'react-toastify'
import { FiCheck, FiX, FiPlus, FiMail } from 'react-icons/fi'
import { sendGuestOTP, verifyGuestOTP, checkEmailVerification } from '../utils/guestVerification'
import gstConfig from '../config/gstConfig'

// Form validation schema
const schema = yup.object().shape({
  // If using saved address, these fields are not required
  firstName: yup.string().when('useExistingAddress', {
    is: false,
    then: () => yup.string().required('First name is required'),
    otherwise: () => yup.string()
  }),
  lastName: yup.string().when('useExistingAddress', {
    is: false,
    then: () => yup.string().required('Last name is required'),
    otherwise: () => yup.string()
  }),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().when('useExistingAddress', {
    is: false,
    then: () => yup.string().required('Phone number is required'),
    otherwise: () => yup.string()
  }),
  address: yup.string().when('useExistingAddress', {
    is: false,
    then: () => yup.string().required('Address is required'),
    otherwise: () => yup.string()
  }),
  city: yup.string().when('useExistingAddress', {
    is: false,
    then: () => yup.string().required('City is required'),
    otherwise: () => yup.string()
  }),
  state: yup.string().when('useExistingAddress', {
    is: false,
    then: () => yup.string().required('State/Province is required'),
    otherwise: () => yup.string()
  }),
  zipCode: yup.string().when('useExistingAddress', {
    is: false,
    then: () => yup.string().required('ZIP/Postal code is required'),
    otherwise: () => yup.string()
  }),
  country: yup.string().when('useExistingAddress', {
    is: false,
    then: () => yup.string().required('Country is required'),
    otherwise: () => yup.string()
  }),
  selectedAddressId: yup.string().when('useExistingAddress', {
    is: true,
    then: () => yup.string().required('Please select an address'),
    otherwise: () => yup.string()
  }),
  paymentMethod: yup.string().required('Payment method is required'),
  cardName: yup.string().when('paymentMethod', {
    is: 'credit-card',
    then: () => yup.string().required('Name on card is required'),
  }),
  cardNumber: yup.string().when('paymentMethod', {
    is: 'credit-card',
    then: () => yup.string().required('Card number is required')
      .matches(/^[0-9]{16}$/, 'Card number must be 16 digits'),
  }),
  cardExpiry: yup.string().when('paymentMethod', {
    is: 'credit-card',
    then: () => yup.string().required('Expiration date is required')
      .matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, 'Expiry date must be in MM/YY format'),
  }),
  cardCvc: yup.string().when('paymentMethod', {
    is: 'credit-card',
    then: () => yup.string().required('CVC is required')
      .matches(/^[0-9]{3,4}$/, 'CVC must be 3 or 4 digits'),
  }),
  termsAccepted: yup.boolean().oneOf([true], 'You must accept the terms and conditions'),
})

// Add Cashfree script to document
const loadCashfreeScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { 
    cart, 
    clearCart, 
    getCartSubtotal, 
    getCartTotal, 
    applyCoupon, 
    removeCoupon,
    couponCode,
    couponDiscount,
    couponError,
    checkout,
    loading: cartLoading
  } = useCart()
  
  // State for coupon management
  const [couponInput, setCouponInput] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  
  // State for address management
  const [addresses, setAddresses] = useState([])
  const [useExistingAddress, setUseExistingAddress] = useState(false)
  const [showAddAddressForm, setShowAddAddressForm] = useState(false)
  
  // State for order management
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)
  const [processingOrder, setProcessingOrder] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  
  // State for Cashfree payment
  const [cashfreeOrderToken, setCashfreeOrderToken] = useState('')
  const [cashfreeOrderId, setCashfreeOrderId] = useState('')
  const [cashfreeLoaded, setCashfreeLoaded] = useState(false)
  
  // State for guest checkout
  const [isGuestCheckout, setIsGuestCheckout] = useState(!user)
  
  // State for OTP verification
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [showOtpForm, setShowOtpForm] = useState(false)
  const [otpValue, setOtpValue] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  
  // Initialize form with user data if available
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      paymentMethod: 'credit-card',
      termsAccepted: false
    }
  })
  
  // Get email value from form
  const emailValue = watch('email');
  
  // Handle sending OTP for guest checkout
  const handleSendOTP = async () => {
    if (!emailValue) {
      toast.error('Please enter your email address');
      return;
    }
    
    try {
      setSendingOtp(true);
      const response = await sendGuestOTP(emailValue);
      
      if (response.success) {
        toast.success('OTP sent to your email');
        setShowOtpForm(true);
      } else {
        toast.error(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      // console.error('Error sending OTP:', error);
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };
  
  // Handle verifying OTP
  const handleVerifyOTP = async () => {
    if (!otpValue) {
      toast.error('Please enter the OTP');
      return;
    }
    
    try {
      setVerifyingOtp(true);
      const response = await verifyGuestOTP(emailValue, otpValue);
      
      if (response.success) {
        toast.success('Email verified successfully');
        setIsEmailVerified(true);
        setShowOtpForm(false);
      } else {
        toast.error(response.message || 'Invalid OTP');
      }
    } catch (error) {
      // console.error('Error verifying OTP:', error);
      toast.error('Failed to verify OTP. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };
  
  // Check email verification status when email changes
  useEffect(() => {
    if (isGuestCheckout && emailValue) {
      const checkVerification = async () => {
        try {
          const response = await checkEmailVerification(emailValue);
          if (response.success && response.data && response.data.verified) {
            setIsEmailVerified(true);
          } else {
            setIsEmailVerified(false);
          }
        } catch (error) {
          // console.error('Error checking email verification:', error);
          setIsEmailVerified(false);
        }
      };
      
      checkVerification();
    }
  }, [emailValue, isGuestCheckout]);
  
  // Add useEffect to handle orderId from URL
  useEffect(() => {
    // Extract orderId from URL query parameters
    const params = new URLSearchParams(location.search);
    const orderIdFromUrl = params.get('orderId');
    
    if (orderIdFromUrl) {
      // console.log('Order ID found in URL:', orderIdFromUrl);
      setOrderId(orderIdFromUrl);
      
      // Fetch order details to populate checkout form
      const fetchOrderDetails = async () => {
        try {
          setProcessingOrder(true);
          const response = await axios.get(`/orders/${orderIdFromUrl}`);
          
          if (response.data.success) {
            const orderData = response.data.data;
            // console.log('Order details fetched:', orderData);
            
            // If order payment status is not PENDING, redirect to appropriate page
            if (orderData.payment?.status && orderData.payment.status !== 'PENDING') {
              toast.info('This order has already been processed.');
              navigate('/account/orders');
              return;
            }
            
            // Pre-fill form with order data if available
            if (orderData.shipping && orderData.shipping.address) {
              const address = orderData.shipping.address;
              
              // Set form values based on order data
              if (address.name) {
                const nameParts = address.name.split(' ');
                setValue('firstName', nameParts[0] || '');
                setValue('lastName', nameParts.slice(1).join(' ') || '');
              }
              
              setValue('email', address.email || '');
              setValue('phone', address.phone || '');
              setValue('address', address.street || address.line1 || '');
              setValue('city', address.city || '');
              setValue('state', address.state || '');
              setValue('zipCode', address.pincode || address.zip || '');
              setValue('country', address.country || 'India');
            }
          } else {
            toast.error('Could not load order details. Please try again.');
          }
        } catch (error) {
          // console.error('Error fetching order details:', error);
          toast.error('Failed to load order details. Please try again.');
        } finally {
          setProcessingOrder(false);
        }
      };
      
      fetchOrderDetails();
    }
  }, [location.search, navigate, setValue]);
  
  // Load Cashfree SDK when component mounts
  useEffect(() => {
    const loadCashfreeSDK = async () => {
      const loaded = await loadCashfreeScript();
      if (loaded) {
        setCashfreeLoaded(true);
        // console.log('Cashfree SDK loaded successfully');
      } else {
        // console.error('Failed to load Cashfree SDK');
      }
    };
    
    loadCashfreeSDK();
  }, []);

  // Apply coupon using CartContext
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      toast.error('Please enter a coupon code')
      return
    }
    
    setApplyingCoupon(true)
    try {
      const result = await applyCoupon(couponInput.trim())
      if (result.success) {
        toast.success('Coupon applied successfully')
        setCouponInput('')
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch (error) {
      // Handle any unexpected errors
      console.error('Error applying coupon:', error)
      toast.error('Failed to apply coupon. Please try again.')
    } finally {
      setApplyingCoupon(false)
    }
  }
  
  // Fetch user profile and addresses when component mounts (only for authenticated users)
  useEffect(() => {
    // Skip for guest checkout
    if (!user) {
      setIsLoadingAddress(false);
      return;
    }
    
    const fetchUserAddresses = async () => {
      try {
        setIsLoadingAddress(true);
        const response = await axios.get('/auth/profile');
        
        // console.log('Profile API Response:', response.data);
        
        if (response.data.success) {
          const userData = response.data.data.user; // Access user data correctly
          
          // console.log('User Data:', userData);
          // console.log('Addresses:', userData.addresses);
          
          // Set user data in form
          // Extract first and last name from full name if available
          if (userData.name) {
            const nameParts = userData.name.split(' ');
            setValue('firstName', nameParts[0] || '');
            setValue('lastName', nameParts.slice(1).join(' ') || '');
          }
          
          setValue('email', userData.email || '');
          setValue('phone', userData.whatsappNumber || ''); // Use whatsappNumber field
          
          // Set addresses
          if (userData.addresses && userData.addresses.length > 0) {
            setAddresses(userData.addresses);
            
            // If user has addresses, enable the checkbox by default
            if (userData.addresses.length > 0) {
              setUseExistingAddress(true);
              setValue('useExistingAddress', true);
              
              // Select the default address or the first one
              const defaultAddress = userData.addresses.find(addr => addr.isDefault) || userData.addresses[0];
              if (defaultAddress) {
                setValue('selectedAddressId', defaultAddress._id);
              }
            }
          } else {
            // console.log('No addresses found for user');
          }
        }
      } catch (error) {
        // console.error('Error fetching user profile:', error);
        toast.error('Failed to load your address information');
      } finally {
        setIsLoadingAddress(false);
      }
    };
    
    fetchUserAddresses();
  }, [user, setValue]);
  
  // Watch payment method for conditional fields
  const paymentMethod = watch('paymentMethod')
  
  // Watch selected address ID to auto-fill form fields
  const selectedAddressId = watch('selectedAddressId')
  
  // Check if email is already verified when email changes
  useEffect(() => {
    if (isGuestCheckout && emailValue && !isEmailVerified) {
      const checkVerification = async () => {
        try {
          const response = await checkEmailVerification(emailValue);
          if (response.success && response.data && response.data.verified) {
            setIsEmailVerified(true);
          } else {
            setIsEmailVerified(false);
          }
        } catch (error) {
          // console.error('Error checking email verification:', error);
          setIsEmailVerified(false);
        }
      };
      
      checkVerification();
    }
  }, [emailValue, isGuestCheckout, isEmailVerified]);
  
  // Auto-fill form fields when an address is selected
  useEffect(() => {
    if (useExistingAddress && selectedAddressId && addresses.length > 0) {
      const selectedAddress = addresses.find(addr => addr._id === selectedAddressId);
      if (selectedAddress) {
        // Fill form fields with selected address data
        if (selectedAddress.name) {
          const nameParts = selectedAddress.name.split(' ');
          setValue('firstName', nameParts[0] || '');
          setValue('lastName', nameParts.slice(1).join(' ') || '');
        }
        
        setValue('address', selectedAddress.street || selectedAddress.line1 || '');
        setValue('city', selectedAddress.city || '');
        setValue('state', selectedAddress.state || '');
        setValue('zipCode', selectedAddress.pincode || selectedAddress.zip || '');
        setValue('country', selectedAddress.country || 'India');
        
        if (selectedAddress.phone) {
          setValue('phone', selectedAddress.phone);
        }
      }
    }
  }, [selectedAddressId, useExistingAddress, addresses, setValue]);
  
  // Calculate order summary using CartContext functions
  const subtotal = getCartSubtotal()
  const shippingCost = 0 // Free shipping for all orders
  
  // Calculate total with shipping if not already included in getCartTotal()
  const total = getCartTotal() + shippingCost
  
  // Initialize Cashfree payment
  const initializeCashfreePayment = (orderToken, orderId) => {
    if (!cashfreeLoaded) {
      toast.error('Payment gateway is not loaded. Please try again.');
      return;
    }
    
    // Ensure orderId is a string
    const orderIdStr = String(orderId);
    
    // Store orderId in localStorage for payment callback
    localStorage.setItem('pendingOrderId', orderIdStr);
    
    const cashfree = window.Cashfree({
      mode: 'sandbox', // Change to 'production' for live environment
    });
    
    // Set the callback URLs for success and failure
    const baseUrl = window.location.origin;
    const successUrl = `${baseUrl}/payment/success.html?orderId=${orderIdStr}`;
    const failureUrl = `${baseUrl}/payment/failure.html?orderId=${orderIdStr}`;
    
    const checkoutOptions = {
      paymentSessionId: orderToken,
      redirectTarget: '_blank', // Changed from '_self' to '_blank' to ensure proper redirection
      orderToken: orderToken,
      orderId: orderIdStr,
      components: [
        "order-details",
        "card",
        "upi",
        "app",
        "netbanking",
        "paylater"
      ],
      onSuccess: (data) => {
        // console.log('Payment success:', data);
        // Redirect to success page with orderId
        window.location.href = successUrl;
      },
      onFailure: (data) => {
        // console.log('Payment failed:', data);
        // Redirect to failure page with orderId and error
        window.location.href = `${failureUrl}&error=${encodeURIComponent(data.message || 'Payment failed')}`;
      },
      onError: (error) => {
        // console.error('Payment error:', error);
        // Redirect to failure page with orderId and error
        window.location.href = `${failureUrl}&error=${encodeURIComponent(error.message || 'Payment error')}`;
      }
    };
    
    cashfree.checkout(checkoutOptions)
      .then(function(data) {
        // console.log('Payment initiated:', data);
        // Don't set order as placed or clear cart yet - wait for payment confirmation
        // The backend will handle the payment success via webhook/callback
      })
      .catch(function(error) {
        // console.error('Payment failed:', error);
        toast.error('Payment failed. Please try again.');
        setProcessingOrder(false);
        setProcessingPayment(false);
      });
  };
  
  // Handle form submission with real API integration
  const onSubmit = async (data) => {
    try {
      // Check if email verification is required for guest checkout
      if (isGuestCheckout && !isEmailVerified) {
        toast.error('Please verify your email before proceeding with checkout');
        setProcessingOrder(false);
        return;
      }
      
      setProcessingOrder(true);
      
      // Format shipping address
      const shippingAddress = {
        street: data.address, // Using street instead of line1 to match backend schema
        city: data.city,
        state: data.state,
        pincode: data.zipCode, // Using pincode instead of zip to match backend schema
        country: data.country,
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone
      };
      
      // If user is logged in and wants to save this address
      if (user && data.saveAddress && !useExistingAddress) {
        try {
          await axios.post('/auth/address', {
            type: 'Home', // Default type
            name: `${data.firstName} ${data.lastName}`,
            phone: data.phone,
            street: data.address, // Using street instead of line1 to match backend schema
            city: data.city,
            state: data.state,
            pincode: data.zipCode, // Using pincode instead of zip to match backend schema
            country: data.country,
            isDefault: false // Let backend handle default logic
          });
          toast.success('Address saved to your account');
        } catch (error) {
          // console.error('Error saving address:', error);
          // Continue with checkout even if saving address fails
        }
      }
      
      // Create order payload
      const orderPayload = {
        items: cart.map(item => ({
          productId: item.productId || item.id || item._id,
          variantSku: item.variantSku || (item.variant && item.variant.sku) || `${item.productId || item.id || item._id}-${item.size || 'default'}-${item.color || 'default'}`,
          qty: item.quantity,
          price: item.sellingPrice || item.price || 0, // Send selling price to server
          gstRate: item.gstRate || gstConfig.TOTAL_GST_RATE * 100 // Send GST rate to server (dynamic from config)
        })),
        shipping: {
          address: shippingAddress,
          method: 'Standard',
          cost: 0 // Always free shipping
        },
        payment: {
          method: data.paymentMethod === 'cashfree' ? 'CASHFREE' : data.paymentMethod === 'cod' ? 'COD' : data.paymentMethod.toUpperCase(),
          details: data.paymentMethod === 'cod' ? { codCharge: 0 } : {}
        },
        couponCode: couponCode || null,
        // If using existing address, include the address ID
        addressId: useExistingAddress ? data.selectedAddressId : null,
        // Add customer details for payment processing - ensure these are never empty
        customerName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Customer',
        customerEmail: data.email || 'guest@example.com',
        customerPhone: data.phone || '0000000000',
        // Add isGuestCheckout flag
        isGuestCheckout: isGuestCheckout
      };
      
      // Validate required payment parameters
      if (data.paymentMethod === 'cashfree' && (!orderPayload.customerEmail || !orderPayload.customerPhone)) {
        toast.error('Email and phone number are required for online payment');
        setProcessingOrder(false);
        return;
      }
      
      // Process checkout using CartContext
      const result = await checkout(orderPayload);
      
      if (result.success) {
        if (data.paymentMethod === 'cashfree') {
          // If payment method is Cashfree, initialize payment
          if (result.data && result.data.paymentToken) {
            setCashfreeOrderToken(result.data.paymentToken);
            
            // Safely extract order ID
            let extractedOrderId;
            
            if (result.data.orderId) {
              extractedOrderId = result.data.orderId;
            } else if (result.data.order && typeof result.data.order === 'object') {
              if (result.data.order._id) {
                extractedOrderId = result.data.order._id;
              } else if (result.data.order.id) {
                extractedOrderId = result.data.order.id;
              } else if (result.data.order.order_id) {
                extractedOrderId = result.data.order.order_id;
              }
            } else if (result.data.order_id) {
              extractedOrderId = result.data.order_id;
            } else if (result.data.paymentDetails && result.data.paymentDetails.orderId) {
              extractedOrderId = result.data.paymentDetails.orderId;
            } else if (result.data._id) {
              extractedOrderId = result.data._id;
            }
            
            // If still no order ID, use a fallback
            if (!extractedOrderId) {
              extractedOrderId = 'ORDER-' + Date.now();
            }
            
            // Set the extracted order ID - ensure it's a string
            const finalOrderId = String(extractedOrderId);
            
            setCashfreeOrderId(finalOrderId);
            setOrderId(finalOrderId);
            
            // Show payment processing message instead of order success
            setProcessingPayment(true);
            
            // Initialize Cashfree payment
            initializeCashfreePayment(result.data.paymentToken, finalOrderId);
          } else if (result.data && result.data.data && result.data.data.paymentToken) {
            // Alternative data structure
            setCashfreeOrderToken(result.data.data.paymentToken);
            
            // Safely extract order ID from nested data structure
            let extractedOrderId;
            const nestedData = result.data.data;
            
            if (nestedData.orderId) {
              extractedOrderId = nestedData.orderId;
            } else if (nestedData.order && typeof nestedData.order === 'object') {
              if (nestedData.order._id) {
                extractedOrderId = nestedData.order._id;
              } else if (nestedData.order.id) {
                extractedOrderId = nestedData.order.id;
              }
            } else if (nestedData.paymentDetails && nestedData.paymentDetails.orderId) {
              extractedOrderId = nestedData.paymentDetails.orderId;
            } else if (nestedData.order_id) {
              extractedOrderId = nestedData.order_id;
            }
            
            // If still no order ID, use a fallback
            if (!extractedOrderId) {
              extractedOrderId = 'ORDER-' + Date.now();
            }
            
            // Set the extracted order ID - ensure it's a string
            const finalOrderId = String(extractedOrderId);
            
            setCashfreeOrderId(finalOrderId);
            setOrderId(finalOrderId);
            
            // Show payment processing message instead of order success
            setProcessingPayment(true);
            
            // Initialize Cashfree payment
            initializeCashfreePayment(nestedData.paymentToken, finalOrderId);
          } else {
            // console.error('Payment data structure:', result.data);
            throw new Error('Payment initialization failed. Please try again.');
          }
        } else {
          // For other payment methods, show order confirmation
          // Safely extract order ID from various possible structures
          let extractedOrderId;
          
          if (result.data.order_id) {
            extractedOrderId = result.data.order_id;
          } else if (result.data.orderId) {
            extractedOrderId = result.data.orderId;
            console.log('Using result.data.orderId:', extractedOrderId);
          } else if (result.data.order && typeof result.data.order === 'object') {
            if (result.data.order._id) {
              extractedOrderId = result.data.order._id;
              console.log('Using result.data.order._id:', extractedOrderId);
            } else if (result.data.order.id) {
              extractedOrderId = result.data.order.id;
              console.log('Using result.data.order.id:', extractedOrderId);
            } else if (result.data.order.order_id) {
              extractedOrderId = result.data.order.order_id;
              console.log('Using result.data.order.order_id:', extractedOrderId);
            }
          } else if (result.data.data) {
            // Try to extract from nested data structure
            const nestedData = result.data.data;
            if (nestedData.order_id) {
              extractedOrderId = nestedData.order_id;
            } else if (nestedData.orderId) {
              extractedOrderId = nestedData.orderId;
            } else if (nestedData.order && typeof nestedData.order === 'object') {
              if (nestedData.order._id) {
                extractedOrderId = nestedData.order._id;
              } else if (nestedData.order.id) {
                extractedOrderId = nestedData.order.id;
              } else if (nestedData.order.order_id) {
                extractedOrderId = nestedData.order.order_id;
              }
            }
          }
          
          // If still no order ID, try to use a fallback
          if (!extractedOrderId) {
            extractedOrderId = 'ORDER-' + Date.now();
          }
          
          setOrderId(extractedOrderId);
          setOrderPlaced(true);
          clearCart();
        }
      } else {
        throw new Error(result.error || 'Failed to complete checkout');
      }
    } catch (error) {
      // console.error('Order error:', error);
      toast.error('Failed to place order: ' + (error.message || 'Unknown error'));
      setProcessingOrder(false);
    }
  }
  
  // If cart is empty, redirect to cart page
  if ((!cart || cart.length === 0) && !orderPlaced) {
    return (
      <div className="bg-gray-50 py-12">
        <div className="container-custom">
          <div className="bg-white p-8 rounded-lg shadow-sm text-center max-w-2xl mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h1 className="text-2xl font-semibold mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8">You need to add items to your cart before checking out.</p>
            <Link to="/shop">
              <Button>Shop Now</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  // Show loading state while cart is being fetched
  if (cartLoading) {
    return (
      <div className="bg-gray-50 py-12">
        <div className="container-custom">
          <div className="bg-white p-8 rounded-lg shadow-sm text-center max-w-2xl mx-auto">
            <div className="animate-pulse flex flex-col items-center">
              <div className="rounded-full bg-gray-200 h-16 w-16 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
              <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            </div>
            <p className="text-gray-500 mt-4">Loading your cart...</p>
          </div>
        </div>
      </div>
    )
  }
  
  // Payment processing screen
  if (processingPayment) {
    return (
      <div className="bg-gray-50 py-12">
        <div className="container-custom">
          <div className="bg-white p-8 rounded-lg shadow-sm max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold mb-4">Payment Processing</h1>
            <p className="text-gray-600 mb-2">Please complete your payment in the payment window.</p>
            <p className="text-gray-600 mb-6">Do not close this window until your payment is complete.</p>
            <p className="text-gray-600 mb-8">Your order will be confirmed once the payment is successful.</p>
          </div>
        </div>
      </div>
    )
  }
  
  // Order confirmation screen
  if (orderPlaced) {
    return (
      <div className="bg-gray-50 py-12">
        <div className="container-custom">
          <div className="bg-white p-8 rounded-lg shadow-sm max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold mb-4">Order Placed Successfully!</h1>
            <p className="text-gray-600 mb-2">Thank you for your purchase.</p>
            <p className="text-gray-600 mb-6">Your order number is: <span className="font-semibold">{orderId}</span></p>
            <p className="text-gray-600 mb-8">We've sent a confirmation email with your order details.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/shop">
                <Button>Continue Shopping</Button>
              </Link>
              {user ? (
                <Link to="/account/orders">
                  <Button variant="secondary">View Orders</Button>
                </Link>
              ) : (
                <div className="flex flex-col gap-4">
                  <Link to="/guest-orders">
                    <Button variant="secondary">View Your Orders</Button>
                  </Link>
                  <div className="p-4 bg-blue-50 rounded-lg text-left">
                    <p className="text-sm text-gray-700 mb-2">Create an account to track your orders and get faster checkout next time.</p>
                    <div className="flex space-x-3">
                      <Link to="/register" className="text-sm text-teal hover:text-teal-700 font-medium">
                        Create Account
                      </Link>
                      <Link to="/login" className="text-sm text-teal hover:text-teal-700 font-medium">
                        Login
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-gray-50 py-12">
      <div className="container-custom">
        <h1 className="text-3xl font-heading font-semibold mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Shipping Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
                
                {isLoadingAddress ? (
                  <div className="py-4 text-center">
                    <div className="animate-pulse flex space-x-4 justify-center">
                      <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                      <div className="flex-1 space-y-4 max-w-md">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Loading your address information...</p>
                  </div>
                ) : (
                  <>
                    {!user && (
                      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-medium">Guest Checkout</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">You are checking out as a guest. Your order information will not be saved to an account.</p>
                        <div className="flex items-center">
                          <Link to="/login" className="text-sm text-teal hover:text-teal-700 font-medium">
                            Login to your account
                          </Link>
                          <span className="mx-2 text-gray-400">or</span>
                          <Link to="/register" className="text-sm text-teal hover:text-teal-700 font-medium">
                            Create an account
                          </Link>
                        </div>
                      </div>
                    )}
                    
                    {user && addresses.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center mb-4">
                          <input
                            id="useExistingAddress"
                            type="checkbox"
                            checked={useExistingAddress}
                            onChange={(e) => {
                              setUseExistingAddress(e.target.checked);
                              setValue('useExistingAddress', e.target.checked);
                              // If unchecked, clear the selected address
                              if (!e.target.checked) {
                                setValue('selectedAddressId', '');
                              } else if (addresses.length > 0) {
                                // If checked and addresses exist, select the first one by default
                                const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
                                if (defaultAddress) {
                                  setValue('selectedAddressId', defaultAddress._id);
                                }
                              }
                            }}
                            className="h-4 w-4 text-teal border-gray-300 focus:ring-teal"
                          />
                          <label htmlFor="useExistingAddress" className="ml-2 block text-sm font-medium text-gray-700">
                            Use a saved address
                          </label>
                        </div>
                        
                        {useExistingAddress && (
                          <div className="space-y-3">
                            {addresses.map((address) => (
                              <div key={address._id} className="border rounded-md p-3 flex items-start">
                                <input
                                  type="radio"
                                  id={`address-${address._id}`}
                                  value={address._id}
                                  {...register('selectedAddressId')}
                                  className="h-4 w-4 text-teal border-gray-300 focus:ring-teal mt-1"
                                />
                                <label htmlFor={`address-${address._id}`} className="ml-2 block text-sm">
                                  <div className="font-medium text-gray-700">{address.name || `${address.firstName || ''} ${address.lastName || ''}`}</div>
                                  <div className="text-gray-600">{address.phone}</div>
                                  <div className="text-gray-600">{address.line1}</div>
                                  {address.line2 && <div className="text-gray-600">{address.line2}</div>}
                                  <div className="text-gray-600">
                                    {address.city}, {address.state} {address.zip}
                                  </div>
                                  <div className="text-gray-600">{address.country || 'India'}</div>
                                  {address.isDefault && (
                                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      Default
                                    </span>
                                  )}
                                  {address.type && (
                                    <span className="inline-flex items-center ml-2 mt-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                      {address.type}
                                    </span>
                                  )}
                                </label>
                              </div>
                            ))}
                            {errors.selectedAddressId && (
                              <p className="text-red-500 text-xs mt-1">{errors.selectedAddressId.message}</p>
                            )}
                            
                            <div className="pt-2">
                              <button 
                                type="button" 
                                onClick={() => {
                                  setUseExistingAddress(false);
                                  setValue('useExistingAddress', false);
                                  setShowAddAddressForm(true);
                                }}
                                className="inline-flex items-center text-sm text-teal hover:text-teal-700"
                              >
                                <FiPlus className="mr-1" />
                                Add a new address
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {(!useExistingAddress) && (showAddAddressForm || !addresses.length) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                          <input
                            type="text"
                            id="firstName"
                            {...register('firstName')}
                            className={`w-full px-3 py-2 border rounded-md text-sm ${errors.firstName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal focus:border-teal'}`}
                          />
                          {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                        </div>
                        
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                          <input
                            type="text"
                            id="lastName"
                            {...register('lastName')}
                            className={`w-full px-3 py-2 border rounded-md text-sm ${errors.lastName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal focus:border-teal'}`}
                          />
                          {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                        </div>
                        
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                          <div className="flex">
                            <input
                              type="email"
                              id="email"
                              {...register('email')}
                              className={`w-full px-3 py-2 border rounded-l-md text-sm ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal focus:border-teal'}`}
                              disabled={isEmailVerified}
                            />
                            {isGuestCheckout && !isEmailVerified && (
                              <button
                                type="button"
                                onClick={handleSendOTP}
                                disabled={sendingOtp || !emailValue}
                                className="flex items-center justify-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {sendingOtp ? 'Sending...' : 'Verify'}
                              </button>
                            )}
                            {isGuestCheckout && isEmailVerified && (
                              <div className="flex items-center justify-center px-4 py-2 border border-l-0 border-green-300 rounded-r-md bg-green-50 text-sm font-medium text-green-700">
                                <FiCheck className="mr-1" /> Verified
                              </div>
                            )}
                          </div>
                          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                          
                          {/* OTP Verification Form */}
                          {isGuestCheckout && showOtpForm && !isEmailVerified && (
                            <div className="mt-3 p-3 border border-gray-200 rounded-md bg-gray-50">
                              <p className="text-sm text-gray-600 mb-2">Enter the OTP sent to your email</p>
                              <div className="flex">
                                <input
                                  type="text"
                                  value={otpValue}
                                  onChange={(e) => setOtpValue(e.target.value)}
                                  placeholder="Enter OTP"
                                  className="w-full px-3 py-2 border rounded-l-md text-sm border-gray-300 focus:ring-teal focus:border-teal"
                                />
                                <button
                                  type="button"
                                  onClick={handleVerifyOTP}
                                  disabled={verifyingOtp || !otpValue}
                                  className="flex items-center justify-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {verifyingOtp ? 'Verifying...' : 'Submit'}
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">OTP is valid for 10 minutes</p>
                            </div>
                          )}
                          
                          {isGuestCheckout && !isEmailVerified && !showOtpForm && (
                            <p className="text-xs text-teal-600 mt-1">Email verification is required for guest checkout</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                          <input
                            type="tel"
                            id="phone"
                            {...register('phone')}
                            className={`w-full px-3 py-2 border rounded-md text-sm ${errors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal focus:border-teal'}`}
                          />
                          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                        </div>
                        
                        <div className="md:col-span-2">
                          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                          <input
                            type="text"
                            id="address"
                            {...register('address')}
                            className={`w-full px-3 py-2 border rounded-md text-sm ${errors.address ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal focus:border-teal'}`}
                          />
                          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                        </div>
                        
                        <div>
                          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                          <input
                            type="text"
                            id="city"
                            {...register('city')}
                            className={`w-full px-3 py-2 border rounded-md text-sm ${errors.city ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal focus:border-teal'}`}
                          />
                          {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                        </div>
                        
                        <div>
                          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                          <input
                            type="text"
                            id="state"
                            {...register('state')}
                            className={`w-full px-3 py-2 border rounded-md text-sm ${errors.state ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal focus:border-teal'}`}
                          />
                          {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
                        </div>
                        
                        <div>
                          <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">ZIP/Postal Code</label>
                          <input
                            type="text"
                            id="zipCode"
                            {...register('zipCode')}
                            className={`w-full px-3 py-2 border rounded-md text-sm ${errors.zipCode ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal focus:border-teal'}`}
                          />
                          {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode.message}</p>}
                        </div>
                        
                        <div>
                          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                          <select
                            id="country"
                            {...register('country')}
                            className={`w-full px-3 py-2 border rounded-md text-sm ${errors.country ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal focus:border-teal'}`}
                          >
                            <option value="India">India</option>
                            <option value="United States">United States</option>
                            <option value="Canada">Canada</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Australia">Australia</option>
                            <option value="Germany">Germany</option>
                            <option value="France">France</option>
                            <option value="Japan">Japan</option>
                            <option value="China">China</option>
                          </select>
                          {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>}
                        </div>
                        
                        {user && (
                          <div className="md:col-span-2">
                            <div className="flex items-center">
                              <input
                                id="saveAddress"
                                type="checkbox"
                                {...register('saveAddress')}
                                className="h-4 w-4 text-teal border-gray-300 focus:ring-teal"
                              />
                              <label htmlFor="saveAddress" className="ml-2 block text-sm text-gray-700">
                                Save this address for future orders
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Payment Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                
                <div className="space-y-4">
                  
                  <div className="flex items-center">
                    <input
                      id="cashfree"
                      type="radio"
                      value="cashfree"
                      {...register('paymentMethod')}
                      className="h-4 w-4 text-teal border-gray-300 focus:ring-teal"
                    />
                    <label htmlFor="cashfree" className="ml-2 block text-sm font-medium text-gray-700">
                      Cashfree (Credit/Debit Card, UPI, Netbanking)
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="cod"
                      type="radio"
                      value="cod"
                      {...register('paymentMethod')}
                      className="h-4 w-4 text-teal border-gray-300 focus:ring-teal"
                    />
                    <label htmlFor="cod" className="ml-2 block text-sm font-medium text-gray-700">
                      Cash on Delivery
                    </label>
                  </div>
                  
                  {errors.paymentMethod && <p className="text-red-500 text-xs mt-1">{errors.paymentMethod.message}</p>}
                  
                  {paymentMethod === 'paypal' && (
                    <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50 text-center">
                      <p className="text-sm text-gray-600 mb-2">You will be redirected to PayPal to complete your payment.</p>
                      <svg className="h-10 w-auto mx-auto" viewBox="0 0 101 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M37.6 9.5H32.2C31.9 9.5 31.6 9.7 31.5 10L29.4 23.5C29.4 23.7 29.5 23.9 29.7 23.9H32.2C32.5 23.9 32.8 23.7 32.9 23.4L33.5 19.6C33.6 19.3 33.9 19.1 34.2 19.1H35.9C39.1 19.1 41 17.5 41.5 14.5C41.7 13.3 41.5 12.3 40.9 11.6C40.2 10.3 39 9.5 37.6 9.5ZM38.2 14.7C37.9 16.5 36.5 16.5 35.2 16.5H34.4L35 12.7C35 12.6 35.1 12.5 35.2 12.5H35.6C36.5 12.5 37.3 12.5 37.7 13C38 13.3 38.1 13.9 38.2 14.7Z" fill="#253B80"/>
                        <path d="M53.1 14.6H50.6C50.5 14.6 50.4 14.7 50.4 14.8L50.2 16L50 15.7C49.4 14.8 48.2 14.5 47 14.5C44.5 14.5 42.4 16.4 42 18.9C41.8 20.1 42.1 21.3 42.8 22.1C43.4 22.9 44.4 23.2 45.5 23.2C47.5 23.2 48.6 21.9 48.6 21.9L48.4 23.1C48.4 23.3 48.5 23.5 48.7 23.5H51C51.3 23.5 51.6 23.3 51.7 23L53.4 15C53.5 14.8 53.3 14.6 53.1 14.6ZM49.3 19C49.1 20.2 48.1 21 46.9 21C46.3 21 45.8 20.8 45.5 20.5C45.2 20.2 45.1 19.7 45.2 19.2C45.4 18 46.4 17.2 47.5 17.2C48.1 17.2 48.6 17.7 48.9 17.7C49.2 18 49.4 18.5 49.3 19Z" fill="#253B80"/>
                        <path d="M68.7 14.6H66.2C66 14.6 65.8 14.7 65.7 14.9L62.6 19.4L61.3 15.1C61.2 14.8 61 14.6 60.7 14.6H58.3C58.1 14.6 57.9 14.8 58 15L60.5 22.7L58.1 26.1C58 26.3 58.1 26.6 58.4 26.6H60.9C61.1 26.6 61.3 26.5 61.4 26.3L69 15.1C69.1 14.9 69 14.6 68.7 14.6Z" fill="#253B80"/>
                        <path d="M78.5 9.5H73.1C72.8 9.5 72.5 9.7 72.4 10L70.3 23.5C70.3 23.7 70.4 23.9 70.6 23.9H73.2C73.4 23.9 73.6 23.8 73.6 23.6L74.2 19.6C74.3 19.3 74.6 19.1 74.9 19.1H76.6C79.8 19.1 81.7 17.5 82.2 14.5C82.4 13.3 82.2 12.3 81.6 11.6C80.9 10.3 79.8 9.5 78.5 9.5ZM79 14.7C78.7 16.5 77.3 16.5 76 16.5H75.2L75.8 12.7C75.8 12.6 75.9 12.5 76 12.5H76.4C77.3 12.5 78.1 12.5 78.5 13C78.8 13.3 79 13.9 79 14.7Z" fill="#179BD7"/>
                        <path d="M93.9 14.6H91.4C91.3 14.6 91.2 14.7 91.2 14.8L91 16L90.8 15.7C90.2 14.8 89 14.5 87.8 14.5C85.3 14.5 83.2 16.4 82.8 18.9C82.6 20.1 82.9 21.3 83.6 22.1C84.2 22.9 85.2 23.2 86.3 23.2C88.3 23.2 89.4 21.9 89.4 21.9L89.2 23.1C89.2 23.3 89.3 23.5 89.5 23.5H91.8C92.1 23.5 92.4 23.3 92.5 23L94.2 15C94.3 14.8 94.1 14.6 93.9 14.6ZM90.1 19C89.9 20.2 88.9 21 87.7 21C87.1 21 86.6 20.8 86.3 20.5C86 20.2 85.9 19.7 86 19.2C86.2 18 87.2 17.2 88.3 17.2C88.9 17.2 89.4 17.4 89.7 17.7C90 18 90.2 18.5 90.1 19Z" fill="#179BD7"/>
                        <path d="M97.4 10L95.3 23.5C95.3 23.7 95.4 23.9 95.6 23.9H97.8C98.1 23.9 98.4 23.7 98.5 23.4L100.6 10C100.6 9.8 100.5 9.6 100.3 9.6H97.7C97.6 9.5 97.5 9.7 97.4 10Z" fill="#179BD7"/>
                        <path d="M14.4 9.5H8.9C8.6 9.5 8.3 9.7 8.2 10L6.1 23.5C6.1 23.7 6.2 23.9 6.4 23.9H9.1C9.4 23.9 9.7 23.7 9.8 23.4L10.4 19.6C10.5 19.3 10.8 19.1 11.1 19.1H12.8C16 19.1 17.9 17.5 18.4 14.5C18.6 13.3 18.4 12.3 17.8 11.6C17.1 10.3 15.9 9.5 14.4 9.5ZM15 14.7C14.7 16.5 13.3 16.5 12 16.5H11.2L11.8 12.7C11.8 12.6 11.9 12.5 12 12.5H12.4C13.3 12.5 14.1 12.5 14.5 13C14.8 13.3 15 13.9 15 14.7Z" fill="#253B80"/>
                        <path d="M29.9 14.6H27.4C27.3 14.6 27.2 14.7 27.2 14.8L27 16L26.8 15.7C26.2 14.8 25 14.5 23.8 14.5C21.3 14.5 19.2 16.4 18.8 18.9C18.6 20.1 18.9 21.3 19.6 22.1C20.2 22.9 21.2 23.2 22.3 23.2C24.3 23.2 25.4 21.9 25.4 21.9L25.2 23.1C25.2 23.3 25.3 23.5 25.5 23.5H27.8C28.1 23.5 28.4 23.3 28.5 23L30.2 15C30.3 14.8 30.1 14.6 29.9 14.6ZM26.1 19C25.9 20.2 24.9 21 23.7 21C23.1 21 22.6 20.8 22.3 20.5C22 20.2 21.9 19.7 22 19.2C22.2 18 23.2 17.2 24.3 17.2C24.9 17.2 25.4 17.4 25.7 17.7C26 18 26.2 18.5 26.1 19Z" fill="#253B80"/>
                        <path d="M33.4 10L31.3 23.5C31.3 23.7 31.4 23.9 31.6 23.9H33.8C34.1 23.9 34.4 23.7 34.5 23.4L36.6 10C36.6 9.8 36.5 9.6 36.3 9.6H33.7C33.6 9.5 33.5 9.7 33.4 10Z" fill="#253B80"/>
                      </svg>
                    </div>
                  )}
                  
                  {paymentMethod === 'cashfree' && (
                    <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50 text-center">
                      <p className="text-sm text-gray-600 mb-2">You will be redirected to Cashfree to complete your payment securely.</p>
                      <p className="text-sm text-gray-600 mb-2">Cashfree supports Credit/Debit Cards, UPI, Netbanking, and Wallets.</p>
                      <img src="/images.png" alt="Cashfree" className="h-10 mx-auto mt-2" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Terms and Conditions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="termsAccepted"
                      type="checkbox"
                      {...register('termsAccepted')}
                      className={`h-4 w-4 ${errors.termsAccepted ? 'text-red-500 border-red-500 focus:ring-red-500' : 'text-teal border-gray-300 focus:ring-teal'}`}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="termsAccepted" className="font-medium text-gray-700">I agree to the terms and conditions</label>
                    <p className="text-gray-500">By placing this order, you agree to our <a href="#" className="text-teal hover:underline">Terms of Service</a> and <a href="#" className="text-teal hover:underline">Privacy Policy</a>.</p>
                    {errors.termsAccepted && <p className="text-red-500 text-xs mt-1">{errors.termsAccepted.message}</p>}
                  </div>
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={processingOrder}>
                  {processingOrder ? 'Processing...' : 'Place Order'}
                </Button>
              </div>
            </form>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                      <img src={item.image} alt={item.name || item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name || item.title}</p>
                      <p className="text-sm text-gray-500">
                        {item.size && <span className="mr-1">Size: {item.size}</span>}
                        {item.color && <span>Color: {item.color}</span>}
                      </p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                      </div>
                ))}
              </div>
              
              {/* Coupon Code */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Have a coupon?</h3>
                {!couponCode ? (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Enter coupon code"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-teal focus:border-teal"
                      disabled={applyingCoupon}
                    />
                    <Button 
                      onClick={handleApplyCoupon} 
                      disabled={applyingCoupon || !couponInput.trim()}
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      {applyingCoupon ? 'Applying...' : 'Apply'}
                    </Button>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-md p-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm text-green-600">
                        <FiCheck className="mr-1" />
                        <span>Coupon applied: {couponCode}</span>
                      </div>
                      <Button 
                        onClick={removeCoupon} 
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap"
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="mt-1 text-sm text-green-600">
                      You saved: ₹{parseInt(couponDiscount)}
                    </div>
                  </div>
                )}
                {couponError && (
                  <p className="text-red-500 text-xs mt-1">{couponError}</p>
                )}
              </div>
              
              {/* Summary Details */}
              <div className="border-t border-gray-200 pt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{parseInt(getCartSubtotal())}</span>
                </div>
                
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-₹{parseInt(couponDiscount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">Free</span>
                </div>
                

                
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">GST</span>
                  <span className="font-medium">Included</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>₹{parseInt(total)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Price inclusive of {gstConfig.DISPLAY.TOTAL_GST_RATE} GST</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout