import { Link } from 'react-router-dom'
import Button from '../components/Common/Button'

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <h1 className="text-9xl font-bold text-teal">404</h1>
        <h2 className="text-3xl font-heading font-semibold mt-4 mb-6">Page Not Found</h2>
        <p className="text-lg text-gray-600 max-w-md mx-auto mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button as={Link} to="/" size="lg">
            Go to Homepage
          </Button>
          <Button as={Link} to="/shop" variant="secondary" size="lg">
            Browse Products
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NotFound