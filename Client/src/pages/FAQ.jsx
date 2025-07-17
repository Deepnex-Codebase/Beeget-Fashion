import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Button from '../components/Common/Button'

const FAQ = () => {
  // State to track which FAQ items are expanded
  const [expandedItems, setExpandedItems] = useState({})
  
  // Toggle FAQ item expansion
  const toggleItem = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }
  
  // FAQ categories and questions
  const faqCategories = [
    {
      id: 'orders',
      title: 'Orders & Shipping',
      questions: [
        {
          id: 'order-tracking',
          question: 'How can I track my order?',
          answer: 'Once your order ships, you will receive a shipping confirmation email with a tracking number. You can click the tracking link in the email or log into your account on our website to view your order status.'
        },
        {
          id: 'shipping-time',
          question: 'How long will it take to receive my order?',
          answer: 'Standard shipping typically takes 5-7 business days. Express shipping takes 2-3 business days, and Next Day Delivery will arrive the next business day if ordered before 1 PM EST. International shipping times vary by country.'
        },
        {
          id: 'shipping-cost',
          question: 'How much does shipping cost?',
          answer: 'Standard shipping is ₹399, but free on orders over ₹5000. Express shipping is ₹899, and Next Day Delivery is ₹1499. International shipping rates vary by country. You can view all shipping options and costs during checkout.'
        },
        {
          id: 'international-shipping',
          question: 'Do you ship internationally?',
          answer: 'Yes, we currently ship to Canada, the United Kingdom, Australia, and countries within the European Union. International shipping rates and delivery times vary by location.'
        }
      ]
    },
    {
      id: 'returns',
      title: 'Returns & Exchanges',
      questions: [
        {
          id: 'return-policy',
          question: 'What is your return policy?',
          answer: 'We accept returns within 30 days of delivery for a full refund or exchange. Items must be unused, in the same condition you received them, and in the original packaging with all tags attached.'
        },
        {
          id: 'return-process',
          question: 'How do I return an item?',
          answer: 'To return an item, log into your account, go to your order history, select the order with the item(s) you wish to return, and click "Return Items." Follow the instructions to print a prepaid return shipping label. If you don\'t have an account, contact our customer service team for assistance.'
        },
        {
          id: 'refund-time',
          question: 'When will I receive my refund?',
          answer: 'Once we receive your return, we will inspect the item(s) and process your refund within 3-5 business days. Please allow 5-10 business days for the refund to appear in your account, depending on your financial institution.'
        },
        {
          id: 'exchange-item',
          question: 'Can I exchange an item for a different size or color?',
          answer: 'Yes, you can exchange items for a different size or color. We recommend following the return process and placing a new order for the desired item to ensure you get it as quickly as possible.'
        }
      ]
    },
    {
      id: 'products',
      title: 'Products & Sizing',
      questions: [
        {
          id: 'size-guide',
          question: 'How do I find the right size?',
          answer: 'We provide detailed size guides on each product page. You can also refer to our general size guide in the footer of our website. If you\'re between sizes, we typically recommend sizing up for a more comfortable fit.'
        },
        {
          id: 'materials',
          question: 'What materials do you use in your clothing?',
          answer: 'We use a variety of sustainable and high-quality materials, including organic cotton, recycled polyester, and TENCEL™ Lyocell. You can find specific material information on each product page.'
        },
        {
          id: 'care-instructions',
          question: 'How should I care for my Beeget Fashion items?',
          answer: 'Care instructions vary by product and material. Generally, we recommend washing in cold water, hanging to dry, and avoiding bleach. Specific care instructions can be found on the product tags and product pages.'
        },
        {
          id: 'restocking',
          question: 'Will you restock sold-out items?',
          answer: 'We regularly restock popular items. You can sign up for notifications on product pages to be alerted when a sold-out item becomes available again.'
        }
      ]
    },
    {
      id: 'account',
      title: 'Account & Payment',
      questions: [
        {
          id: 'create-account',
          question: 'Do I need to create an account to make a purchase?',
          answer: 'No, you can check out as a guest. However, creating an account allows you to track orders, save your shipping information, and earn rewards.'
        },
        {
          id: 'payment-methods',
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover), PayPal, Apple Pay, and Google Pay.'
        },
        {
          id: 'order-cancellation',
          question: 'Can I cancel or modify my order after it\'s placed?',
          answer: 'You can cancel or modify your order within 1 hour of placing it by contacting our customer service team. After that, we begin processing orders and may not be able to make changes.'
        },
        {
          id: 'account-security',
          question: 'How do you protect my personal information?',
          answer: 'We use industry-standard encryption and security measures to protect your personal and payment information. We never store your full credit card details on our servers. You can read more in our Privacy Policy.'
        }
      ]
    },
    {
      id: 'sustainability',
      title: 'Sustainability & Ethics',
      questions: [
        {
          id: 'sustainable-practices',
          question: 'What sustainable practices does Beeget Fashion follow?',
          answer: 'We prioritize sustainable materials, ethical manufacturing, minimal packaging, carbon-neutral shipping, and a circular approach through our recycling program. We\'re constantly working to improve our environmental impact.'
        },
        {
          id: 'factory-conditions',
          question: 'How do you ensure fair working conditions in your factories?',
          answer: 'All our manufacturing partners are required to meet strict ethical standards. We conduct regular audits to ensure fair wages, safe working conditions, and no child labor. We\'re committed to transparency throughout our supply chain.'
        },
        {
          id: 'packaging',
          question: 'Is your packaging eco-friendly?',
          answer: 'Yes, we use recycled and recyclable materials for all our packaging. Our shipping boxes, tissue paper, and mailers are made from post-consumer recycled content and are fully recyclable or compostable.'
        },
        {
          id: 'recycling-program',
          question: 'Do you have a recycling program for old clothes?',
          answer: 'Yes, we offer a take-back program where you can send us your worn Beeget Fashion items for recycling. In return, you\'ll receive a discount on your next purchase. Contact customer service for details on how to participate.'
        }
      ]
    }
  ]
  
  return (
    <div className="container-custom py-12">
      {/* Hero Section */}
      <motion.div 
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">Frequently Asked Questions</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Find answers to common questions about our products, ordering, shipping, returns, and more.
        </p>
      </motion.div>
      
      {/* Search Bar */}
      <motion.div 
        className="max-w-2xl mx-auto mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="relative">
          <input
            type="text"
            placeholder="Search for answers..."
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-md focus:ring-teal focus:border-teal"
          />
          <svg
            className="absolute left-4 top-3.5 h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </motion.div>
      
      {/* FAQ Categories */}
      <div className="max-w-4xl mx-auto">
        {faqCategories.map((category, categoryIndex) => (
          <motion.section 
            key={category.id}
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (categoryIndex * 0.1), duration: 0.5 }}
          >
            <h2 className="text-2xl font-heading font-semibold mb-6">{category.title}</h2>
            <div className="space-y-4">
              {category.questions.map((item) => (
                <div 
                  key={item.id} 
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    className="w-full flex justify-between items-center p-4 text-left bg-white hover:bg-gray-50 transition-colors"
                    onClick={() => toggleItem(item.id)}
                  >
                    <span className="font-medium text-lg">{item.question}</span>
                    <svg
                      className={`h-5 w-5 text-gray-500 transform transition-transform ${expandedItems[item.id] ? 'rotate-180' : ''}`}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {expandedItems[item.id] && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                      <p className="text-gray-600">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        ))}
      </div>
      
      {/* Contact CTA */}
      <motion.div 
        className="max-w-4xl mx-auto mt-16 bg-gray-50 p-8 rounded-lg text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <h2 className="text-2xl font-heading font-semibold mb-4">Couldn't Find Your Answer?</h2>
        <p className="text-gray-600 mb-6">
          Our customer service team is here to help with any questions you may have.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button as={Link} to="/contact" size="lg">
            Contact Us
          </Button>
          <Button as="a" href="mailto:support@beegetfashion.com" variant="secondary" size="lg">
            Email Support
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default FAQ