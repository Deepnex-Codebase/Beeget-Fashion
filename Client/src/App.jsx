import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { WishlistProvider } from './contexts/WishlistContext'
import { SiteContentProvider } from './contexts/SiteContentContext'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/Common/ProtectedRoute'
import ScrollToTop from './components/Common/ScrollToTop'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'))
const Shop = lazy(() => import('./pages/Shop'))
const Product = lazy(() => import('./pages/Product'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const Account = lazy(() => import('./pages/Account'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const CityAnalytics = lazy(() => import('./components/Admin/CityAnalytics'))

const OrderDetails = lazy(() => import('./pages/OrderDetails'))
const NotFound = lazy(() => import('./pages/NotFound'))
const PaymentCallback = lazy(() => import('./pages/PaymentCallback'))

// New pages
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Shipping = lazy(() => import('./pages/Shipping'))
const FAQ = lazy(() => import('./pages/FAQ'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const Collections = lazy(() => import('./pages/Collections'))
const CollectionDetail = lazy(() => import('./pages/CollectionDetail'))
const PlusSize = lazy(() => import('./pages/PlusSize'))
const NewArrivals = lazy(() => import('./pages/NewArrivals'))
const BestSeller = lazy(() => import('./pages/BestSeller'))

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-16 h-16 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <SiteContentProvider>
            <ToastContainer position="bottom-right" autoClose={3000} />
            <ScrollToTop />
            <Suspense fallback={<LoadingFallback />}>
            <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="shop" element={<Shop />} />
              <Route path="product/:slug" element={<Product />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="verify-email" element={<VerifyEmail />} />
              <Route path="payment/callback" element={<PaymentCallback />} />
              
              {/* New routes */}
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="shipping" element={<Shipping />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="privacy" element={<PrivacyPolicy />} />
              <Route path="terms-of-service" element={<TermsOfService />} />
              <Route path="terms" element={<TermsOfService />} />
              <Route path="collections" element={<Collections />} />
              <Route path="collections/:id" element={<CollectionDetail />} />
              <Route path="plus-size" element={<PlusSize />} />
              <Route path="new-arrivals" element={<NewArrivals />} />
              <Route path="best-seller" element={<BestSeller />} />
              
                <Route path="*" element={<Account />} />
              
              {/* Protected Admin Routes */}
              <Route path="admin" element={<ProtectedRoute adminOnly={true} />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="city-analytics" element={<CityAnalytics />} />
                <Route path="orders/:orderId" element={<OrderDetails />} />
              </Route>
              
              {/* Protected SubAdmin Routes */}
              <Route path="subadmin" element={<ProtectedRoute subAdminOnly={true} />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="city-analytics" element={<CityAnalytics />} />
              </Route>
              
              {/* Permission-based Routes - Example */}
              <Route path="products" element={<ProtectedRoute requiredPermission="manage_products" requiredDepartment="Catalog" />}>
                <Route path="manage" element={<AdminDashboard />} />
              </Route>
              
              {/* Orders Routes */}
              <Route path="orders" element={<ProtectedRoute requiredPermission="view_orders" requiredDepartment="Orders" />}>
                <Route path="manage" element={<AdminDashboard />} />
              </Route>
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Route>
            </Routes>
            </Suspense>
          </SiteContentProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default App