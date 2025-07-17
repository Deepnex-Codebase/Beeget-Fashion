import { motion } from 'framer-motion'
import Button from '../components/Common/Button'
import { Link } from 'react-router-dom'

const About = () => {
  return (
    <div className="container-custom py-12">
      {/* Hero Section */}
      <motion.div 
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">About Beeget Fashion</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          We're on a mission to make sustainable, high-quality fashion accessible to everyone.
        </p>
      </motion.div>
      
      {/* Our Story Section */}
      <motion.section 
        className="mb-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-heading font-semibold mb-6">Our Story</h2>
            <p className="text-gray-600 mb-4">
              Founded in 2023, Beeget Fashion began with a simple idea: create clothing that looks good, feels good, and does good. Our founder, inspired by years in the fashion industry, saw an opportunity to build a brand that prioritizes both style and sustainability.
            </p>
            <p className="text-gray-600 mb-4">
              What started as a small collection has grown into a comprehensive range of modern essentials for everyone. Through it all, our commitment to ethical production and timeless design has remained unwavering.
            </p>
            <p className="text-gray-600">
              Today, we're proud to offer fashion that doesn't compromise on quality, ethics, or style. Every piece in our collection is designed to last, both in durability and design.
            </p>
          </div>
          <div className="bg-gray-200 h-96 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-lg">Company Image</span>
          </div>
        </div>
      </motion.section>
      
      {/* Our Values Section */}
      <motion.section 
        className="mb-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <h2 className="text-3xl font-heading font-semibold mb-10 text-center">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-50 p-8 rounded-lg">
            <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-4">Sustainability</h3>
            <p className="text-gray-600">
              We're committed to reducing our environmental footprint through responsible sourcing, eco-friendly materials, and ethical manufacturing processes.
            </p>
          </div>
          
          <div className="bg-gray-50 p-8 rounded-lg">
            <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-4">Quality</h3>
            <p className="text-gray-600">
              We believe in creating pieces that stand the test of time. From fabric selection to final stitching, quality is at the heart of everything we do.
            </p>
          </div>
          
          <div className="bg-gray-50 p-8 rounded-lg">
            <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-4">Inclusivity</h3>
            <p className="text-gray-600">
              Fashion should be for everyone. We design with diverse body types, styles, and preferences in mind, ensuring our collections are accessible and inclusive.
            </p>
          </div>
        </div>
      </motion.section>
      
      {/* Team Section */}
      <motion.section 
        className="mb-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <h2 className="text-3xl font-heading font-semibold mb-10 text-center">Meet Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Team Member 1 */}
          <div className="text-center">
            <div className="bg-gray-200 h-64 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-400">Photo</span>
            </div>
            <h3 className="text-xl font-semibold">Jane Doe</h3>
            <p className="text-gray-600">Founder & CEO</p>
          </div>
          
          {/* Team Member 2 */}
          <div className="text-center">
            <div className="bg-gray-200 h-64 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-400">Photo</span>
            </div>
            <h3 className="text-xl font-semibold">John Smith</h3>
            <p className="text-gray-600">Creative Director</p>
          </div>
          
          {/* Team Member 3 */}
          <div className="text-center">
            <div className="bg-gray-200 h-64 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-400">Photo</span>
            </div>
            <h3 className="text-xl font-semibold">Emily Chen</h3>
            <p className="text-gray-600">Head of Design</p>
          </div>
          
          {/* Team Member 4 */}
          <div className="text-center">
            <div className="bg-gray-200 h-64 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-400">Photo</span>
            </div>
            <h3 className="text-xl font-semibold">Michael Johnson</h3>
            <p className="text-gray-600">Sustainability Lead</p>
          </div>
        </div>
      </motion.section>
      
      {/* CTA Section */}
      <motion.section 
        className="bg-gray-50 p-12 rounded-lg text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <h2 className="text-3xl font-heading font-semibold mb-4">Join Our Journey</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Discover our latest collections and be part of our mission to transform the fashion industry.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button as={Link} to="/shop" size="lg">
            Shop Now
          </Button>
          <Button as={Link} to="/contact" variant="secondary" size="lg">
            Contact Us
          </Button>
        </div>
      </motion.section>
    </div>
  )
}

export default About