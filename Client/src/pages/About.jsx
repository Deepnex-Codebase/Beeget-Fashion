import { motion } from 'framer-motion'
import Button from '../components/Common/Button'
import { Link } from 'react-router-dom'
import { useContext } from 'react'
import { SiteContentContext } from '../contexts/SiteContentContext'
import { renderAboutPageBlocks } from '../utils/blockRenderers'

const About = () => {
  const { aboutPageData, loadingAbout } = useContext(SiteContentContext)
  
  // Use data from context or fallback to static content if loading
  const heroTitle = loadingAbout ? 'About Beeget Fashion' : aboutPageData?.heroSection?.title
  const heroDescription = loadingAbout ? "We're on a mission to make sustainable, high-quality fashion accessible to everyone." : aboutPageData?.heroSection?.description
  
  const storyTitle = loadingAbout ? 'Our Story' : aboutPageData?.storySection?.title
  const storyContent = loadingAbout ? [
    'Founded in 2023, Beeget Fashion began with a simple idea: create clothing that looks good, feels good, and does good. Our founder, inspired by years in the fashion industry, saw an opportunity to build a brand that prioritizes both style and sustainability.',
    'What started as a small collection has grown into a comprehensive range of modern essentials for everyone. Through it all, our commitment to ethical production and timeless design has remained unwavering.',
    'Today, we\'re proud to offer fashion that doesn\'t compromise on quality, ethics, or style. Every piece in our collection is designed to last, both in durability and design.'
  ] : aboutPageData?.storySection?.paragraphs || []
  
  const storyImage = loadingAbout ? '' : aboutPageData?.storySection?.image
  
  const valuesTitle = loadingAbout ? 'Our Values' : aboutPageData?.valuesSection?.title
  const values = loadingAbout ? [
    {
      title: 'Sustainability',
      description: 'We\'re committed to reducing our environmental footprint through responsible sourcing, eco-friendly materials, and ethical manufacturing processes.',
      icon: 'globe'
    },
    {
      title: 'Quality',
      description: 'We believe in creating pieces that stand the test of time. From fabric selection to final stitching, quality is at the heart of everything we do.',
      icon: 'quality'
    },
    {
      title: 'Inclusivity',
      description: 'Fashion should be for everyone. We design with diverse body types, styles, and preferences in mind, ensuring our collections are accessible and inclusive.',
      icon: 'people'
    }
  ] : aboutPageData?.valuesSection?.values || []
  
  const teamTitle = loadingAbout ? 'Meet Our Team' : aboutPageData?.teamSection?.title
  const teamMembers = loadingAbout ? [
    { name: 'Jane Doe', position: 'Founder & CEO', photo: { url: '', alt: '' } },
    { name: 'John Smith', position: 'Creative Director', photo: { url: '', alt: '' } },
    { name: 'Emily Chen', position: 'Head of Design', photo: { url: '', alt: '' } },
    { name: 'Michael Johnson', position: 'Sustainability Lead', photo: { url: '', alt: '' } }
  ] : aboutPageData?.teamSection?.members || []
  
  const ctaTitle = loadingAbout ? 'Join Our Journey' : aboutPageData?.ctaSection?.title
  const ctaDescription = loadingAbout ? 'Discover our latest collections and be part of our mission to transform the fashion industry.' : aboutPageData?.ctaSection?.description
  const ctaPrimaryButton = loadingAbout ? { text: 'Shop Now', link: '/shop' } : aboutPageData?.ctaSection?.primaryButton || { text: 'Shop Now', link: '/shop' }
  const ctaSecondaryButton = loadingAbout ? { text: 'Contact Us', link: '/contact' } : aboutPageData?.ctaSection?.secondaryButton || { text: 'Contact Us', link: '/contact' }
  
  return (
    <div className="container-custom py-12">
      {/* Render dynamic blocks if available */}
      {!loadingAbout && aboutPageData?.blocks && (
        <div className="dynamic-blocks">
          {renderAboutPageBlocks(aboutPageData.blocks, false)}
        </div>
      )}
      
      {/* Static fallback content - shown only when loading or no blocks available */}
      {(loadingAbout || !aboutPageData?.blocks) && (
        <>
        {/* Hero Section */}
      <motion.div 
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">{heroTitle}</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          {heroDescription}
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
            <h2 className="text-3xl font-heading font-semibold mb-6">{storyTitle}</h2>
            {storyContent.map((paragraph, index) => (
              <p key={index} className="text-gray-600 mb-4">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="bg-gray-200 h-96 rounded-lg flex items-center justify-center">
            {storyImage ? (
              <img src={storyImage} alt="Our Story" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <span className="text-gray-400 text-lg">Company Image</span>
            )}
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
        <h2 className="text-3xl font-heading font-semibold mb-10 text-center">{valuesTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <div key={index} className="bg-gray-50 p-8 rounded-lg">
              <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                {value.icon === 'globe' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                )}
                {value.icon === 'quality' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                )}
                {value.icon === 'people' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-semibold mb-4">{value.title}</h3>
              <p className="text-gray-600">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </motion.section>
      
      {/* Team Section */}
      <motion.section 
        className="mb-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <h2 className="text-3xl font-heading font-semibold mb-10 text-center">{teamTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <div key={index} className="text-center">
              <div className="bg-gray-200 h-64 rounded-lg mb-4 flex items-center justify-center">
                {member.photo?.url ? (
                  <img src={member.photo.url} alt={member.photo.alt || member.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <span className="text-gray-400">Photo</span>
                )}
              </div>
              <h3 className="text-xl font-semibold">{member.name}</h3>
              <p className="text-gray-600">{member.position}</p>
            </div>
          ))}
        </div>
      </motion.section>
      
      {/* CTA Section */}
      <motion.section 
        className="bg-gray-50 p-12 rounded-lg text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <h2 className="text-3xl font-heading font-semibold mb-4">{ctaTitle}</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          {ctaDescription}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to={ctaPrimaryButton.link}>
            <Button size="lg">
              {ctaPrimaryButton.text}
            </Button>
          </Link>
          <Link to={ctaSecondaryButton.link}>
            <Button variant="secondary" size="lg">
              {ctaSecondaryButton.text}
            </Button>
          </Link>
        </div>
      </motion.section>
      </>
      )}
    </div>
  )
}

export default About