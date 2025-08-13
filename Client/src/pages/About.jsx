import { motion } from 'framer-motion'
import { useContext } from 'react'
import { SiteContentContext } from '../contexts/SiteContentContext'
import { renderAboutPageBlocks } from '../utils/blockRenderers'
import aboutImage from '../assets/10.jpg'

const About = () => {
  const { aboutPageData, loadingAbout } = useContext(SiteContentContext)
  
  // Use data from context or fallback to static content if loading
  const heroTitle = loadingAbout ? 'About Beeget Fashion' : aboutPageData?.heroSection?.title
  const heroDescription = loadingAbout ? "We're on a mission to make sustainable, high-quality fashion accessible to everyone." : aboutPageData?.heroSection?.description
  
  // Get header image from blocks if available
  const headerImage = loadingAbout ? '' : (aboutPageData?.blocks && aboutPageData.blocks.length > 0 && 
    aboutPageData.blocks.find(block => block.blockType === 'page_header')?.background_image?.url) ? 
    aboutPageData.blocks.find(block => block.blockType === 'page_header').background_image.url : ''
  
  const storyTitle = loadingAbout ? 'Our Story' : aboutPageData?.storySection?.title
  const storyContent = loadingAbout ? [
    'Founded in 2023, Beeget Fashion began with a simple idea: create clothing that looks good, feels good, and does good. Our founder, inspired by years in the fashion industry, saw an opportunity to build a brand that prioritizes both style and sustainability.',
    'What started as a small collection has grown into a comprehensive range of modern essentials for everyone. Through it all, our commitment to ethical production and timeless design has remained unwavering.',
    'Today, we\'re proud to offer fashion that doesn\'t compromise on quality, ethics, or style. Every piece in our collection is designed to last, both in durability and design.'
  ] : aboutPageData?.storySection?.paragraphs || []
  
  // Get story image from blocks with proper fallback logic
  const storyImage = loadingAbout ? '' : 
    // First try to get from storySection.image
    aboutPageData?.storySection?.image || 
    // Then try to get from our_story block's image.url
    (aboutPageData?.blocks && aboutPageData.blocks.find(block => block.blockType === 'our_story')?.image?.url) || 
    // Then try to get from our_story block's side_image.url
    (aboutPageData?.blocks && aboutPageData.blocks.find(block => block.blockType === 'our_story')?.side_image?.url) || 
    // Default to empty string if none found
    ''
  
  // Vision and Mission sections
  const visionTitle = loadingAbout ? 'Our Vision' : aboutPageData?.visionSection?.title
  const visionContent = loadingAbout ? [
    'To revolutionize the fashion industry by creating sustainable, high-quality clothing that empowers individuals to express themselves while making a positive impact on the planet.',
    'We envision a world where fashion is not just about looking good, but also about doing good – for people and the environment.'
  ] : aboutPageData?.visionSection?.paragraphs || []
  
  const missionTitle = loadingAbout ? 'Our Mission' : aboutPageData?.missionSection?.title
  const missionContent = loadingAbout ? [
    'To design and deliver fashion that combines style, quality, and sustainability at accessible prices.',
    'To operate with transparency and integrity throughout our supply chain.',
    'To inspire and enable our customers to make conscious fashion choices without compromising on style or comfort.'
  ] : aboutPageData?.missionSection?.paragraphs || []
  
  return (
    <div className="about-page">
      <div className="container-custom py-12">
        {/* Render dynamic blocks if available */}
        {!loadingAbout && aboutPageData?.blocks && aboutPageData.blocks.length > 0 ? (
          <div className="dynamic-blocks">
            {renderAboutPageBlocks(aboutPageData.blocks, false)}
          </div>
        ) : (
          /* Static fallback content - shown only when loading or no blocks available */
          <>
            {/* Hero Section */}
            <motion.div 
              className="text-center mb-16 relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {headerImage && (
                <div className="absolute inset-0 overflow-hidden z-0">
                  <img src={headerImage} alt="About Beeget Fashion" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black bg-opacity-60"></div>
                </div>
              )}
              <div className={`py-16 relative z-20 ${headerImage ? 'text-white' : ''}`}>
                <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">{heroTitle}</h1>
                <p className={`text-lg max-w-3xl mx-auto ${headerImage ? 'text-gray-200' : 'text-gray-600'}`}>
                  {heroDescription}
                </p>
              </div>
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
                    <img src="/10.jpg" alt="About Beeget" className="w-full h-full object-cover rounded-lg" />
                  )}
                </div>
              </div>
            </motion.section>
            
            {/* Our Vision Section */}
            <motion.section 
              className="mb-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="bg-gray-50 p-8 rounded-lg">
                <h2 className="text-3xl font-heading font-semibold mb-6 text-center">{visionTitle}</h2>
                <div className="max-w-3xl mx-auto">
                  {visionContent.map((paragraph, index) => (
                    <p key={index} className="text-gray-600 mb-4 text-center">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </motion.section>
            
            {/* Our Mission Section */}
            <motion.section 
              className="mb-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="bg-gray-50 p-8 rounded-lg">
                <h2 className="text-3xl font-heading font-semibold mb-6 text-center">{missionTitle}</h2>
                <div className="max-w-3xl mx-auto">
                  {missionContent.map((paragraph, index) => (
                    <p key={index} className="text-gray-600 mb-4 text-center">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </motion.section>
            
            {/* Discover Our Latest Collection CTA Strip */}
            <motion.section
              className="mb-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <div className="bg-java-600">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                      <span>Discover Our Latest Collection</span>
                    </h2>
                    <p className="mt-3 text-lg text-white">Explore our newest styles crafted with quality and sustainability in mind.</p>
                  </div>
                  <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
                    <div>
                      <a
                        href="/shop"
                        className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-java-600 bg-white hover:bg-gray-50"
                      >
                        Shop Now
                      </a>
                    </div>
                    <div className="ml-3">
                      <a
                        href="/collections/new-arrivals"
                        className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white border-white hover:bg-java-700"
                      >
                        View New Arrivals
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          </>
        )}
      </div>
    </div>
  )
}

export default About