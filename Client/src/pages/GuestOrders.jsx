import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CartContext from '../contexts/CartContext';
import useAuth from '../hooks/useAuth';
import { formatDate, formatCurrency } from '../utils/formatters';
import Button from '../components/Common/Button';

const GuestOrders = () => {
  const { getGuestOrders } = useContext(CartContext);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Redirect authenticated users to their account orders page
  useEffect(() => {
    if (user) {
      navigate('/account/orders');
    }
  }, [user, navigate]);
  
  // Fetch guest orders
  useEffect(() => {
    const fetchGuestOrders = async () => {
      try {
        setLoading(true);
        const result = await getGuestOrders();
        
        if (result.success) {
          setOrders(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to load your orders. Please try again.');
        // console.error('Error fetching guest orders:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGuestOrders();
  }, [getGuestOrders]);
  
  // Get order status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'CREATED':
        return 'bg-blue-100 text-blue-800';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (loading) {
    return (
      <div className="container-custom py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container-custom py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Your Guest Orders</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-600 mb-4">You don't have any orders yet.</p>
            <Link to="/shop">
              <Button>Start Shopping</Button>
            </Link>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">Create an account to track your orders and get faster checkout next time.</p>
              <div className="flex space-x-3 justify-center">
                <Link to="/register" className="text-sm text-teal hover:text-teal-700 font-medium">
                  Create Account
                </Link>
                <Link to="/login" className="text-sm text-teal hover:text-teal-700 font-medium">
                  Login
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Order #{order._id ? order._id.substring(Math.max(0, order._id.length - 8)) : 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.createdAt || new Date())}</p>
                  </div>
                  <div>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(order.status || 'CREATED')}`}>
                      {order.status ? order.status.replace('_', ' ') : 'CREATED'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="space-y-3">
                    {(order.order_items || order.items) && (order.order_items || order.items).length > 0 ? (
                      (order.order_items || order.items).map((item) => (
                        <div key={item._id || Math.random().toString()} className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            {item.productId?.images && item.productId.images.length > 0 ? (
                              <img 
                                src={item.productId.images[0]} 
                                alt={item.productId.title} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.productId?.title || 'Product'}</p>
                            <div className="flex text-xs text-gray-500 mt-1">
                              <p>Qty: {item.qty || 1}</p>
                              {item.size && <p className="ml-2">Size: {item.size}</p>}
                              {item.color && <p className="ml-2">Color: {item.color}</p>}
                            </div>
                          </div>
                          <div className="text-sm font-medium">
                            {formatCurrency((item.price || 0) * (item.qty || 1))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No items in this order</p>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span>{formatCurrency(order.subtotal || 0)}</span>
                    </div>
                    {(order.discount || 0) > 0 && (
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-600">Discount:</span>
                        <span className="text-green-600">-{formatCurrency(order.discount || 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">GST:</span>
                      <span>{formatCurrency(order.totalGST || 0)}</span>
                    </div>
                    <div className="flex justify-between font-medium mt-2 pt-2 border-t border-gray-100">
                      <span>Total:</span>
                      <span>{formatCurrency(order.total || 0)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Shipping Address</h3>
                      {order.shipping?.address ? (
                        <>
                          <p className="text-sm text-gray-600">{order.shipping.address.name}</p>
                          <p className="text-sm text-gray-600">{order.shipping.address.street}</p>
                          <p className="text-sm text-gray-600">
                            {order.shipping.address.city}, {order.shipping.address.state} {order.shipping.address.pincode}
                          </p>
                          <p className="text-sm text-gray-600">{order.shipping.address.country || 'India'}</p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-600">No shipping address available</p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2">Payment Method</h3>
                      {order.payment ? (
                        <>
                          <p className="text-sm text-gray-600">{order.payment.method || 'Not specified'}</p>
                          <p className="text-sm text-gray-600">Status: {order.payment.status || 'Unknown'}</p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-600">No payment information available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
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
  );
};

export default GuestOrders;