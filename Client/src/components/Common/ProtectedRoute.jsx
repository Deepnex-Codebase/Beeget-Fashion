import { Navigate, Outlet } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

const ProtectedRoute = ({ adminOnly = false, subAdminOnly = false, requiredPermission = null }) => {
  const { isAuthenticated, isAdmin, isSubAdmin, hasPermission, loading } = useAuth()
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  // If admin route but user is not admin, redirect to home
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />
  }

  // console.log(sub)
  
  // If subadmin route but user is not subadmin or admin, redirect to home
  if (!isSubAdmin) {
    return <Navigate to="/" replace />
  }
  
  // If specific permission is required but user doesn't have it, redirect to home
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" replace />
  }
  
  // Render child routes
  return <Outlet />
}

export default ProtectedRoute