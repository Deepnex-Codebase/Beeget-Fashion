import { Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Header from './Header'
import Footer from './Footer'
import NotificationBar from './NotificationBar'
import PromoBanner from './PromoBanner'

const Layout = ({ hideHeader, children }) => {
  const location = useLocation();
  const isAdminPage = location.pathname.includes('/admin');
  const [notification, setNotification] = useState(null)
  
  // Function to dismiss notification manually
  const dismissNotification = () => {
    setNotification(null)
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Promo Banner - hidden on admin pages */}
      {!isAdminPage && <PromoBanner />}
      
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