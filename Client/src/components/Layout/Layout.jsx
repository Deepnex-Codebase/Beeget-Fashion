import { Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import NotificationBar from './NotificationBar'

const Layout = ({ hideHeader, children }) => {
  const location = useLocation();
  const isAdminPage = location.pathname.includes('/admin');
  const [notification, setNotification] = useState(null)
  
  // Example notification - in a real app, this would come from a context or prop
  useEffect(() => {
    // Show a welcome notification when the component mounts, but not on admin pages
    if (!isAdminPage) {
      setNotification({
        type: 'info',
        message: 'Welcome to Beeget Fashion! Free shipping on orders over $50.',
        duration: 5000 // Auto-dismiss after 5 seconds
      })
    }
    
    // Auto-dismiss notification after duration
    if (notification?.duration) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, notification.duration)
      
      return () => clearTimeout(timer)
    }
  }, [isAdminPage])
  
  // Function to dismiss notification manually
  const dismissNotification = () => {
    setNotification(null)
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Notification bar - hidden on admin pages */}
      {notification && !isAdminPage && (
        <NotificationBar 
          type={notification.type} 
          message={notification.message} 
          onDismiss={dismissNotification} 
        />
      )}
      
      {/* Header - hidden on admin pages or when hideHeader is true */}
      {!hideHeader && !isAdminPage && <Header />}
      
      {/* Main content */}
      <main className="flex-grow">
        {children || <Outlet />}
      </main>
      
      {/* Footer - hidden on admin pages */}
      {!isAdminPage && <Footer />}
    </div>
  )
}

export default Layout