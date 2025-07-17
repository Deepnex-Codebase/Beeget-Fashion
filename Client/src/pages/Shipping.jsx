import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Button from '../components/Common/Button'

const Shipping = () => {
  return (
    <div className="container-custom py-12">
      {/* Hero Section */}
      <motion.div 
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">Shipping & Returns</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Everything you need to know about our shipping policies and return procedures.
        </p>
      </motion.div>
      
      {/* Content Sections */}
      <div className="max-w-4xl mx-auto">
        {/* Shipping Policy */}
        <motion.section 
          className="mb-12 bg-white p-8 rounded-lg shadow-sm border border-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="text-2xl font-heading font-semibold mb-6 pb-4 border-b border-gray-100">Shipping Policy</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">Processing Time</h3>
              <p className="text-gray-600">
                All orders are processed within 1-2 business days (excluding weekends and holidays) after receiving your order confirmation email. You will receive another notification when your order has shipped.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-medium mb-3">Shipping Options</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipping Method</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Delivery Time</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Standard Shipping</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">5-7 business days</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">₹399 (Free on orders over ₹5000)</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Express Shipping</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">2-3 business days</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">₹899</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Next Day Delivery</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">1 business day</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">₹1499</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                *Business days are Monday through Friday, excluding federal holidays.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-medium mb-3">International Shipping</h3>
              <p className="text-gray-600 mb-3">
                We currently ship to the following countries:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Canada (5-10 business days, ₹1199)</li>
              <li>United Kingdom (7-14 business days, ₹1499)</li>
              <li>Australia (10-15 business days, ₹1899)</li>
              <li>European Union (7-14 business days, ₹1499)</li>
              </ul>
              <p className="text-gray-600 mt-3">
                Please note that international orders may be subject to import duties and taxes, which are the responsibility of the recipient.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-medium mb-3">Tracking Your Order</h3>
              <p className="text-gray-600">
                Once your order ships, you will receive a shipping confirmation email with a tracking number. You can track your order by clicking the tracking link in the email or by logging into your account on our website.
              </p>
            </div>
          </div>
        </motion.section>
        
        {/* Returns & Exchanges */}
        <motion.section 
          className="mb-12 bg-white p-8 rounded-lg shadow-sm border border-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h2 className="text-2xl font-heading font-semibold mb-6 pb-4 border-b border-gray-100">Returns & Exchanges</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">Return Policy</h3>
              <p className="text-gray-600 mb-3">
                We want you to be completely satisfied with your purchase. If you're not happy with your order, we accept returns within 30 days of delivery for a full refund or exchange.
              </p>
              <p className="text-gray-600">
                To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging with all tags attached.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-medium mb-3">Non-Returnable Items</h3>
              <p className="text-gray-600 mb-3">
                The following items cannot be returned or exchanged:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Sale items (marked as "Final Sale")</li>
                <li>Intimates and swimwear</li>
                <li>Gift cards</li>
                <li>Items damaged due to customer misuse</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-medium mb-3">How to Initiate a Return</h3>
              <ol className="list-decimal list-inside text-gray-600 space-y-2">
                <li>Log in to your account and go to your order history</li>
                <li>Select the order containing the item(s) you wish to return</li>
                <li>Click on "Return Items" and follow the instructions</li>
                <li>Print the prepaid return shipping label</li>
                <li>Package your items securely with the original packaging</li>
                <li>Attach the return label to your package</li>
                <li>Drop off the package at your nearest postal service location</li>
              </ol>
              <p className="text-gray-600 mt-3">
                If you don't have an account or prefer assistance, please contact our customer service team at <a href="mailto:returns@beegetfashion.com" className="text-teal hover:underline">returns@beegetfashion.com</a> or call us at <a href="tel:+1-800-123-4567" className="text-teal hover:underline">+1 (800) 123-4567</a>.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-medium mb-3">Refund Process</h3>
              <p className="text-gray-600 mb-3">
                Once we receive your return, we will inspect the item(s) and notify you of the status of your refund. If approved, your refund will be processed within 3-5 business days, and a credit will automatically be applied to your original method of payment.
              </p>
              <p className="text-gray-600">
                Please allow 5-10 business days for the refund to appear in your account, depending on your financial institution.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-medium mb-3">Exchanges</h3>
              <p className="text-gray-600">
                If you need to exchange an item for a different size or color, please follow the return process and place a new order for the desired item. This ensures you get the item you want as quickly as possible, as exchanges may take longer to process.
              </p>
            </div>
          </div>
        </motion.section>
        
        {/* Damaged or Defective Items */}
        <motion.section 
          className="mb-12 bg-white p-8 rounded-lg shadow-sm border border-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h2 className="text-2xl font-heading font-semibold mb-6 pb-4 border-b border-gray-100">Damaged or Defective Items</h2>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              If you receive a damaged or defective item, please contact our customer service team within 48 hours of delivery. We will provide instructions for returning the item and send a replacement at no additional cost.
            </p>
            <p className="text-gray-600">
              Please take photos of the damaged item and packaging to help us process your claim more efficiently.
            </p>
            <p className="text-gray-600">
              Contact us at <a href="mailto:support@beegetfashion.com" className="text-teal hover:underline">support@beegetfashion.com</a> or call <a href="tel:+1-800-123-4567" className="text-teal hover:underline">+1 (800) 123-4567</a> for assistance with damaged or defective items.
            </p>
          </div>
        </motion.section>
        
        {/* CTA Section */}
        <motion.section 
          className="bg-gray-50 p-8 rounded-lg text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <h2 className="text-2xl font-heading font-semibold mb-4">Still Have Questions?</h2>
          <p className="text-gray-600 mb-6">
            Our customer service team is here to help with any questions about shipping, returns, or exchanges.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button as={Link} to="/contact" size="lg">
              Contact Us
            </Button>
            <Button as={Link} to="/faq" variant="secondary" size="lg">
              View FAQ
            </Button>
          </div>
        </motion.section>
      </div>
    </div>
  )
}

export default Shipping