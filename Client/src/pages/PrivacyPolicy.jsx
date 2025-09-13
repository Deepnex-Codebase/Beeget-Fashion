import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Button from '../components/Common/Button'

const PrivacyPolicy = () => {
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
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">Privacy Policy</h1>
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
            We respect your privacy and are committed to maintaining it. When you shop on this Website, we will ask you to input and will collect Personal Information from you such as your name, e-mail address, billing address, delivery address, telephone number, product selections, credit card or other payment information and password.
          </p>
          
          <p className="text-gray-600 mb-6">
            We may also collect information about where you are on the internet (eg the URL you came from, IP address, domain types like .co.uk and .com), your browser type, the country where your computer is located, the pages of our website that were viewed during your visit, the advertisements you clicked on. We may collect this information even if you do not register with us. None of this data is of a personal nature and will help us improve the quality of our service.
          </p>
          
          <p className="text-gray-600 mb-6">
            If you consent, to notify you of products or special offers that may be of interest to you. You agree that you do not object to us contacting you for any of the above purposes whether by telephone, e-mail or in writing and you confirm that you do not and will not consider any of the above as being a breach of any of your rights.
          </p>
          
          <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">How We Use The Information We Collect</h2>
          
          <ul className="list-disc list-inside text-gray-600 mb-6 space-y-1">
            <li>Processing your orders</li>
            <li>Administering your account</li>
            <li>Improving the website's performance by analyzing statistical data</li>
          </ul>
          
          <p className="text-gray-600 mb-6">
            If you consent, to notify you of products or special offers that may be of interest to you. You agree that you do not object to us contacting you for any of the above purposes whether by telephone, e-mail or in writing and you confirm that you do not and will not consider any of the above as being a breach of any of your rights.
          </p>
          
          <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">Information Sharing</h2>
          <p className="text-gray-600 mb-6">
            We will not release your Personal Information to any company outside for mailing or marketing purposes.
          </p>
          
          <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">Payment Security</h2>
          <p className="text-gray-600 mb-6">
            We do not hold any of your credit card information. This information is securely collected by our authorized payment processor. With the industry's most-advanced encryption, fraud prevention and protection policies, Secure Trading are dedicated to keeping your account safe and secure. Once your information reaches Secure Trading, it resides on a server that is heavily guarded both physically and electronically. Secure Trading servers sit behind an electronic firewall and are not directly connected to the Internet, so your private information is available only to authorized computers.
          </p>
          
          <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">Policy Updates</h2>
          <p className="text-gray-600 mb-6">
            Please check back frequently to see any updates or changes to our privacy policy.
          </p>
          
          <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">Contact Us</h2>
          <p className="text-gray-600 mb-6">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us at:
          </p>
          <p className="text-gray-600 mb-1">Email: <a href="mailto:customersupport@beegetfashion.com" className="text-teal hover:underline">customersupport@beegetfashion.com</a></p>
          <p className="text-gray-600 mb-6">Address: Beeget Fashion, India</p>
          
          <p className="text-gray-600 italic mt-10">
            This Privacy Policy was last updated on {formattedDate}.
          </p>
        </motion.div>
      </div>
      
      {/* CTA Section */}
      <motion.div 
        className="max-w-4xl mx-auto mt-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <p className="text-gray-600 mb-6">
          Have questions about our privacy practices? We're here to help.
        </p>
        <Link to="/contact">
          <Button size="lg">
            Contact Us
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}

export default PrivacyPolicy