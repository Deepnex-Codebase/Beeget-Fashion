import { useState, useEffect, useContext } from 'react'
import { motion } from 'framer-motion'
import Button from '../components/Common/Button'
import Input from '../components/Common/Input'
import { toast } from 'react-hot-toast'
import { SiteContentContext } from '../contexts/SiteContentContext'

const Contact = () => {
  const { submitEnquiry, contactPageData, loadingContactPage, fetchContactPageData } = useContext(SiteContentContext)
  
  // Fetch contact page data when component mounts
  useEffect(() => {
    fetchContactPageData()
  }, [])
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [formStatus, setFormStatus] = useState(null)
  const [errors, setErrors] = useState({})
  
  // Reset errors when form data changes
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const newErrors = {...errors}
      
      // Clear specific field errors when user types
      Object.keys(formData).forEach(field => {
        if (formData[field] && newErrors[field]) {
          delete newErrors[field]
        }
      })
      
      setErrors(newErrors)
    }
  }, [formData, errors])
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }
  
  const validateForm = () => {
    const newErrors = {}
    
    // Check required fields
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required'
    if (!formData.message.trim()) newErrors.message = 'Message is required'
    
    // Validate email format
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    // Validate message length
    if (formData.message && formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setFormStatus('sending');
    
    try {
      // Send data to the API using submitEnquiry from SiteContentContext
      // console.log('Contact.jsx: Submitting form data:', formData);
      const response = await submitEnquiry(formData);
      // console.log('Contact.jsx: Submit response:', response);
      
      // Handle success
      setFormStatus('success');
      toast.success('Your message has been sent successfully!');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      
      // Reset form status after 5 seconds
      setTimeout(() => {
        setFormStatus(null);
      }, 5000);
    } catch (error) {
      // console.error('Contact.jsx: Error submitting form:', error);
      // console.log('Contact.jsx: Error details:', error.response?.data);
      // Handle error
      setFormStatus('error');
      toast.error(error.response?.data?.error || 'Failed to send message. Please try again.');
      
      // Reset error status after 5 seconds
      setTimeout(() => {
        setFormStatus(null);
      }, 5000);
    }
  };
  
  // For debugging
  useEffect(() => {
    if (contactPageData) {
      // console.log('Contact page data in component:', contactPageData)
    }
  }, [contactPageData])

  return (
    <div className="container-custom py-12">
      {/* Hero Section */}
      <motion.div 
        className="text-center mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-5xl font-heading font-bold mb-4">
          {contactPageData?.blocks?.find(block => block.blockType === 'page_header')?.headline || "Contact Us"}
        </h1>
        <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
          {contactPageData?.blocks?.find(block => block.blockType === 'page_header')?.subheadline || 
            "Have a question or feedback? We'd love to hear from you. Fill out the form below and our team will get back to you as soon as possible."}
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        {/* Contact Form - Moved to top for mobile */}
        <motion.div 
          className="lg:col-span-2 order-1 lg:order-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-2xl font-heading font-semibold mb-6">
              {contactPageData?.blocks?.find(block => block.blockType === 'enquiry_form')?.form_title || 'Send Us a Message'}
            </h2>
            <p className="text-gray-600 mb-6">
              {contactPageData?.blocks?.find(block => block.blockType === 'enquiry_form')?.description || 'Please fill out the form below with your details and we\'ll get back to you as soon as possible.'}
            </p>
            
            {formStatus === 'error' ? (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>There was an error sending your message. Please try again.</p>
                </div>
              </div>
            ) : formStatus === 'success' ? (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6">
                <div className="flex">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>{contactPageData?.blocks?.find(block => block.blockType === 'enquiry_form')?.success_message || 'Your message has been sent successfully! We\'ll get back to you soon.'}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Input
                      label="Your Name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      error={errors.name}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="Your Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      placeholder="johndoe@example.com"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Input
                    label="Subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleChange}
                    error={errors.subject}
                    placeholder="Your inquiry subject"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-teal focus:border-teal ${errors.message ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="How can we help you?"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Button 
                    type="submit" 
                    fullWidth 
                    disabled={formStatus === 'sending'}
                  >
                    {formStatus === 'sending' ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : 'Send Message'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
        
        {/* Contact Information */}
        <motion.div 
          className="lg:col-span-1 order-2 lg:order-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="bg-gray-50 p-6 md:p-8 rounded-lg h-full">
            <h2 className="text-2xl font-heading font-semibold mb-5">
              {contactPageData?.blocks?.find(block => block.blockType === 'contact_info')?.headline || 'Get In Touch'}
            </h2>
            
            <div className="space-y-5">
              {/* Email */}
              <div className="flex items-start">
                <div className="bg-teal-50 p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">Email Us</h3>
                  <p className="text-gray-600 mb-1">For general inquiries:</p>
                  <a href={`mailto:${contactPageData?.blocks?.find(block => block.blockType === 'contact_info')?.general_email || 'info@beegetfashion.com'}`} className="text-teal hover:underline">
                    {contactPageData?.blocks?.find(block => block.blockType === 'contact_info')?.general_email || 'info@beegetfashion.com'}
                  </a>
                  <p className="text-gray-600 mt-2 mb-1">For customer support:</p>
                  <a href={`mailto:${contactPageData?.blocks?.find(block => block.blockType === 'contact_info')?.support_email || 'support@beegetfashion.com'}`} className="text-teal hover:underline">
                    {contactPageData?.blocks?.find(block => block.blockType === 'contact_info')?.support_email || 'support@beegetfashion.com'}
                  </a>
                </div>
              </div>
              
              {/* Phone */}
              <div className="flex items-start">
                <div className="bg-teal-50 p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">Call Us</h3>
                  <p className="text-gray-600 mb-1">Customer Service:</p>
                  <a href={`tel:${contactPageData?.blocks?.find(block => block.blockType === 'contact_info')?.phone || '+1-800-123-4567'}`} className="text-teal hover:underline">
                    {contactPageData?.blocks?.find(block => block.blockType === 'contact_info')?.phone || '+1 (800) 123-4567'}
                  </a>
                  <p className="text-gray-600 mt-2 mb-1">Business Hours:</p>
                  <p className="text-gray-600">{contactPageData?.blocks?.find(block => block.blockType === 'contact_info')?.business_hours_weekday || 'Monday-Friday: 9am-6pm EST'}</p>
                  <p className="text-gray-600">{contactPageData?.blocks?.find(block => block.blockType === 'contact_info')?.business_hours_sat || 'Saturday: 10am-4pm EST'}</p>
                </div>
              </div>
              
              {/* Location */}
              <div className="flex items-start">
                <div className="bg-teal-50 p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">{contactPageData?.blocks?.find(block => block.blockType === 'contact_info')?.location_title || 'Visit Us'}</h3>
                  <p className="text-gray-600 mb-1">{contactPageData?.blocks?.find(block => block.blockType === 'contact_info')?.location_subtitle || 'Headquarters:' }</p>
                  <address className="text-gray-600 not-italic">
                    {contactPageData?.blocks?.find(block => block.blockType === 'contact_info')?.address_line1 || '123 Fashion Avenue'}<br />
                    {contactPageData?.blocks?.find(block => block.blockType === 'contact_info')?.address_line2 || 'Suite 500'}<br />
                    {contactPageData?.blocks?.find(block => block.blockType === 'contact_info')?.address_line3 || 'New York, NY 10001'}<br />
                    {contactPageData?.blocks?.find(block => block.blockType === 'contact_info')?.address_line4 || 'United States'}
                  </address>
                </div>
              </div>
            </div>
            
            {/* Social Media */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Follow Us</h3>
              <div className="flex space-x-3">
                {/* Facebook */}
                <a 
                  href="https://facebook.com/beegetfashion" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-gray-200 p-2 rounded-full hover:bg-teal hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>

                {/* Instagram */}
                <a 
                  href="https://instagram.com/beegetfashion" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-gray-200 p-2 rounded-full hover:bg-teal hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>

                {/* YouTube */}
                <a 
                  href="https://youtube.com/@beegetfashion" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-gray-200 p-2 rounded-full hover:bg-teal hover:text-white transition-colors"
                  aria-label="YouTube"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>

                {/* LinkedIn */}
                <a 
                  href="https://linkedin.com/company/beegetfashion" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-gray-200 p-2 rounded-full hover:bg-teal hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" clipRule="evenodd"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Map Section removed as requested */}
    </div>
  )
}

export default Contact