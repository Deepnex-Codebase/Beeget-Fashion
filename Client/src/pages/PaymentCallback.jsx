import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../utils/api'
import { toast } from 'react-hot-toast'
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import useCart from '../hooks/useCart'

const PaymentCallback = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { clearCart } = useCart()
  
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('processing') // processing, success, failed
  const [orderId, setOrderId] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [orderStatus, setOrderStatus] = useState('')
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState({})
  const [directAccess, setDirectAccess] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [cartCleared, setCartCleared] = useState(false)
  
  // Function to check order status with retries
  const checkOrderStatus = (orderId, retryCount = 0) => {
    if (retryCount >= 5) {
      setStatus('failed');
      setError('Payment verification timed out. Please check your order status in your account.');
      return;
    }
    
    // Wait for 2 seconds before retrying
    setTimeout(() => {
      // console.log(`Retrying payment status check (attempt ${retryCount + 1})...`);
      
      // Call API to check payment status
      axios.post('/orders/payment/callback', {
        orderId: orderId,
        txStatus: 'STATUS_CHECK' // Special flag to indicate this is just a status check
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Source': 'frontend'
        }
      })
        .then(response => {
          // console.log(`Retry ${retryCount + 1} response:`, response.data);
          if (response.data.success) {
            const paymentStatus = response.data.data.paymentStatus;
            const orderStatus = response.data.data.orderStatus;
            
            setPaymentStatus(paymentStatus);
            setOrderStatus(orderStatus);
            
            if (paymentStatus === 'PAID') {
              setStatus('success');
              // Clear stored orderId from localStorage after successful verification
              localStorage.removeItem('pendingOrderId');
              
              // Clear cart if not already cleared
              if (!cartCleared) {
                clearCart();
                setCartCleared(true);
              }
            } else if (paymentStatus === 'FAILED') {
              setStatus('failed');
              setError('Payment failed. Please try again.');
              localStorage.removeItem('pendingOrderId');
            } else {
              // If payment is still processing, check again
              checkOrderStatus(orderId, retryCount + 1);
            }
          } else {
            // If API returns error, retry
            checkOrderStatus(orderId, retryCount + 1);
          }
        })
        .catch(err => {
          // console.error(`Retry ${retryCount + 1} error:`, err);
          // If API error, retry
          checkOrderStatus(orderId, retryCount + 1);
        });
    }, 2000);
  };
  
  useEffect(() => {
    // Extract parameters from URL
    const params = new URLSearchParams(window.location.search);
    const orderIdParam = params.get('orderId');
    const paymentIdParam = params.get('paymentId');
    const txStatusParam = params.get('txStatus');
    const errorParam = params.get('error');
    
    // Get stored orderId from localStorage as fallback
    const storedOrderId = localStorage.getItem('pendingOrderId');
    const finalOrderId = orderIdParam || storedOrderId;
    
    // Debug information
    const debugData = {
      orderIdParam,
      paymentIdParam,
      txStatusParam,
      errorParam,
      storedOrderId,
      finalOrderId,
      url: window.location.href
    };
    
    setDebugInfo(debugData);
    // console.log('Payment Callback Debug Info:', debugData);
    
    if (finalOrderId) {
      setOrderId(finalOrderId);
      setLoading(true);
      
      // Prepare data for API call
      const callbackData = {
        orderId: finalOrderId,
        paymentId: paymentIdParam,
        txStatus: txStatusParam || 'STATUS_CHECK' // Don't default to SUCCESS, use STATUS_CHECK to verify with backend
      };
      
      if (errorParam) {
        setError(errorParam);
        callbackData.txStatus = 'FAILED';
      }
      
      // Call API to verify payment
      axios.post('/orders/payment/callback', callbackData, {
        headers: {
          'Content-Type': 'application/json',
          'X-Source': 'frontend'
        }
      })
        .then(response => {
          // console.log('Payment verification response:', response.data);
          setLoading(false);
          
          if (response.data.success) {
            const paymentStatus = response.data.data.paymentStatus;
            const orderStatus = response.data.data.orderStatus;
            
            setPaymentStatus(paymentStatus);
            setOrderStatus(orderStatus);
            
            if (paymentStatus === 'PAID') {
              setStatus('success');
              // Clear stored orderId from localStorage after successful verification
              localStorage.removeItem('pendingOrderId');
              
              // Clear cart if not already cleared
              if (!cartCleared) {
                clearCart();
                setCartCleared(true);
              }
            } else if (paymentStatus === 'FAILED') {
              setStatus('failed');
              setError('Payment failed. Please try again.');
              localStorage.removeItem('pendingOrderId');
            } else {
              // If payment is still processing, check again after a delay
              checkOrderStatus(finalOrderId, 0);
            }
          } else {
            setStatus('failed');
            setError(response.data.message || 'Payment verification failed');
          }
        })
        .catch(err => {
          // console.error('Error verifying payment:', err);
          setLoading(false);
          setStatus('failed');
          setError('Error verifying payment. Please contact customer support.');
          
          // If API error, try checking order status after a delay
          checkOrderStatus(finalOrderId, 0);
        });
    } else {
      setLoading(false);
      setStatus('failed');
      setError('Order ID not found. Please contact customer support.');
    }
  }, []);

  const isSuccessful = paymentStatus === 'PAID' || paymentStatus === 'SUCCESS' || 
                     paymentStatus === 'CAPTURED' || paymentStatus === 'AUTHORIZED';
  
  const isFailed = paymentStatus === 'FAILED' || paymentStatus === 'FAILURE' || 
                  paymentStatus === 'CANCELLED';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-center mb-6">Payment Status</h2>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4" />
              <p className="text-gray-600">Verifying payment status...</p>
            </div>
          ) : status === 'success' || isSuccessful ? (
            <div className="text-center py-6">
              <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-600 mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-6">Your order has been confirmed.</p>
              <div className="flex flex-col space-y-3">
                <Link to="/account/orders" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">
                  View Order
                </Link>
                <Link to="/shop" className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition">
                  Continue Shopping
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <FaTimesCircle className="text-6xl text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-600 mb-2">Payment Failed</h3>
              <p className="text-gray-600 mb-2">{error || 'There was an issue with your payment.'}</p>
              <div className="flex flex-col space-y-3 mt-4">
                <Link to="/checkout" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">
                  Try Again
                </Link>
                <Link to="/shop" className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition">
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  )
}

export default PaymentCallback