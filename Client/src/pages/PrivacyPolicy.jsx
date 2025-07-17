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
            At Beeget Fashion, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase.
          </p>
          
          <p className="text-gray-600 mb-6">
            Please read this Privacy Policy carefully. By accessing or using our website, you acknowledge that you have read, understood, and agree to be bound by all the terms outlined in this policy.
          </p>
          
          <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">Information We Collect</h2>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Personal Information</h3>
          <p className="text-gray-600 mb-3">
            We may collect personal information that you voluntarily provide to us when you:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-6 space-y-1">
            <li>Register an account</li>
            <li>Place an order</li>
            <li>Subscribe to our newsletter</li>
            <li>Contact our customer service</li>
            <li>Participate in promotions or surveys</li>
          </ul>
          
          <p className="text-gray-600 mb-3">
            This information may include:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-6 space-y-1">
            <li>Name</li>
            <li>Email address</li>
            <li>Mailing address</li>
            <li>Phone number</li>
            <li>Payment information (we do not store complete credit card details)</li>
            <li>Order history</li>
          </ul>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Automatically Collected Information</h3>
          <p className="text-gray-600 mb-3">
            When you visit our website, we may automatically collect certain information about your device and usage patterns. This may include:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-6 space-y-1">
            <li>IP address</li>
            <li>Browser type</li>
            <li>Operating system</li>
            <li>Device information</li>
            <li>Pages visited and time spent</li>
            <li>Referring website</li>
            <li>Click patterns</li>
          </ul>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Cookies and Similar Technologies</h3>
          <p className="text-gray-600 mb-3">
            We use cookies, web beacons, and similar tracking technologies to collect information about your browsing activities. These technologies help us analyze website traffic, customize content, and improve your shopping experience.
          </p>
          <p className="text-gray-600 mb-6">
            You can set your browser to refuse cookies or alert you when cookies are being sent. However, some parts of our website may not function properly if you disable cookies.
          </p>
          
          <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">How We Use Your Information</h2>
          <p className="text-gray-600 mb-3">
            We may use the information we collect for various purposes, including:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-6 space-y-1">
            <li>Processing and fulfilling your orders</li>
            <li>Creating and managing your account</li>
            <li>Providing customer support</li>
            <li>Sending transactional emails (order confirmations, shipping updates)</li>
            <li>Sending marketing communications (if you've opted in)</li>
            <li>Improving our website and product offerings</li>
            <li>Analyzing usage patterns and trends</li>
            <li>Detecting and preventing fraud</li>
            <li>Complying with legal obligations</li>
          </ul>
          
          <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">Information Sharing and Disclosure</h2>
          <p className="text-gray-600 mb-3">
            We may share your information with third parties in the following circumstances:
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Service Providers</h3>
          <p className="text-gray-600 mb-6">
            We may share your information with third-party service providers who perform services on our behalf, such as payment processing, order fulfillment, shipping, customer service, web hosting, data analysis, and marketing assistance. These service providers have access to personal information needed to perform their functions but are prohibited from using it for other purposes.
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Business Transfers</h3>
          <p className="text-gray-600 mb-6">
            If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction. We will notify you via email and/or a prominent notice on our website of any change in ownership or uses of your personal information.
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Legal Requirements</h3>
          <p className="text-gray-600 mb-6">
            We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency).
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Protection of Rights</h3>
          <p className="text-gray-600 mb-6">
            We may disclose your information to protect and defend the rights, property, or safety of Beeget Fashion, our customers, or others.
          </p>
          
          <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">Data Security</h2>
          <p className="text-gray-600 mb-6">
            We implement appropriate technical and organizational measures to protect the security of your personal information. However, please be aware that no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
          </p>
          
          <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">Your Rights and Choices</h2>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Account Information</h3>
          <p className="text-gray-600 mb-6">
            You can review, update, or delete your account information by logging into your account on our website. If you would like to delete your account entirely, please contact us at privacy@beegetfashion.com.
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Marketing Communications</h3>
          <p className="text-gray-600 mb-6">
            You can opt out of receiving promotional emails from us by clicking the "unsubscribe" link in any email we send. Even if you opt out of marketing communications, we will still send you transactional emails related to your account and purchases.
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Cookies</h3>
          <p className="text-gray-600 mb-6">
            Most web browsers are set to accept cookies by default. You can choose to set your browser to remove or reject cookies. Please note that such actions could affect the availability and functionality of our website.
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Do Not Track</h3>
          <p className="text-gray-600 mb-6">
            Some browsers have a "Do Not Track" feature that signals to websites that you visit that you do not want to have your online activity tracked. Due to the lack of a common understanding of how to interpret these signals, our website does not currently respond to "Do Not Track" signals.
          </p>
          
          <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">Children's Privacy</h2>
          <p className="text-gray-600 mb-6">
            Our website is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe that your child has provided us with personal information, please contact us so that we can delete the information.
          </p>
          
          <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">International Data Transfers</h2>
          <p className="text-gray-600 mb-6">
            Your information may be transferred to and processed in countries other than the one in which you reside. These countries may have data protection laws that are different from those in your country. By using our website or providing us with your information, you consent to this transfer.
          </p>
          
          <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">Changes to This Privacy Policy</h2>
          <p className="text-gray-600 mb-6">
            We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will post the revised policy on this page with an updated revision date. We encourage you to review this Privacy Policy periodically.
          </p>
          
          <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">Contact Us</h2>
          <p className="text-gray-600 mb-6">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us at:
          </p>
          <p className="text-gray-600 mb-1">Email: <a href="mailto:privacy@beegetfashion.com" className="text-teal hover:underline">privacy@beegetfashion.com</a></p>
          <p className="text-gray-600 mb-6">Address: 123 Fashion Avenue, Suite 500, New York, NY 10001, United States</p>
          
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
        <Button as={Link} to="/contact" size="lg">
          Contact Us
        </Button>
      </motion.div>
    </div>
  )
}

export default PrivacyPolicy