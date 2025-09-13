import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Button from '../components/Common/Button'

const TermsOfService = () => {
  // Get current date for last updated
  const currentDate = new Date()
  const formattedDate = `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getDate()}, ${currentDate.getFullYear()}`
  
  return (
    <div className="container-custom py-12">
      {/* Hero Section */}
      <motion.div 
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">Terms of Service</h1>
        <p className="text-gray-500">Last Updated: {formattedDate}</p>
      </motion.div>
      
      {/* Content */}
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-100">
        <motion.div 
          className="prose prose-lg max-w-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <p className="text-gray-600 mb-6">
            Welcome to Beeget Fashion!
          </p>
          
          <p className="text-gray-600 mb-6">
            These terms and conditions outline the rules and regulations for the use of Beeget Fashion's Website, located at beegetfashion.com
          </p>
          
          <p className="text-gray-600 mb-6">
            By accessing this website we assume you accept these terms and conditions. Do not continue to use beegetfashion.com if you do not agree to take all of the terms and conditions stated on this page.
          </p>
          
          <p className="text-gray-600 mb-6">
            The following terminology applies to these Terms and Conditions, Privacy Statement and Disclaimer Notice and all Agreements: "Client", "You" and "Your" refers to you, the person logged on this website and compliant to the Company's terms and conditions. "The Company", "Ourselves", "We", "Our" and "Us", refers to our Company. "Party", "Parties", or "Us", refers to both the Client and ourselves. All terms refer to the offer, acceptance and consideration of payment necessary to undertake the process of our assistance to the Client in the most appropriate manner for the express purpose of meeting the Client's needs in respect of provision of the Company's stated services, in accordance with and subject to, prevailing law of India. Any use of the above terminology or other words in the singular, plural, capitalization and/or he/she or they, are taken as interchangeable and therefore as referring to same.
          </p>
          
          <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">Cookies</h2>
          <p className="text-gray-600 mb-6">
            We employ the use of cookies. By accessing beegetfashion.com, you agree to use cookies in agreement with the company's Privacy Policy.
          </p>
          
          <p className="text-gray-600 mb-6">
            Most interactive websites use cookies to let us retrieve the user's details for each visit. Cookies are used by our website to enable the functionality of certain areas to make it easier for people visiting our website. Some of our affiliate/advertising partners may also use cookies.
          </p>
          
          <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">Contact Information</h2>
          <p className="text-gray-600 mb-6">
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <p className="text-gray-600 mb-2"><strong>Email:</strong> customersupport@beegetfashion.com</p>
            <p className="text-gray-600 mb-2"><strong>Address:</strong> Beeget Fashion, India</p>
          </div>
          
          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-200">
            <Link to="/privacy">
              <Button variant="outline" className="w-full sm:w-auto">
                Privacy Policy
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" className="w-full sm:w-auto">
                Contact Us
              </Button>
            </Link>
            <Link to="/">
              <Button className="w-full sm:w-auto">
                Back to Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default TermsOfService