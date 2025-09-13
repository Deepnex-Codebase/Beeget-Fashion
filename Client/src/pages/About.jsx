import { motion } from 'framer-motion'
import aboutImage from '../assets/10.jpg'

const About = () => {
  // Static content
  const heroTitle = 'About Beeget Fashion'
  const heroDescription = "Beeget Fashion was founded in 2025 by Bhupendra Mishra, with a passion to blend the richness of ethnic tradition with the charm of modern fashion."
  
  const storyTitle = 'About Us'
  const storyContent = [
    'Beeget Fashion was founded in 2025 by Bhupendra Mishra, with a passion to blend the richness of ethnic tradition with the charm of modern fashion. The name "Beeget" is derived from the word "beget", which means to bring into existence — just like how we aim to bring timeless style and confidence into every woman\'s life through our clothing.',
    'At Beeget Fashion, we design outfits that celebrate Indian culture with a modern twist. From elegant ethnic wear to contemporary fusion styles, every piece is crafted to empower women to feel stylish, graceful, and confident — without compromising on comfort or affordability.',
    'We believe that fashion is not just about clothes, it\'s about identity, self-expression, and confidence. That\'s why Beeget Fashion is committed to offering high-quality, trendsetting designs at competitive prices, ensuring that every woman feels beautiful inside and out.'
  ]
  
  const visionTitle = 'Our Vision'
  const visionContent = [
    'To become a trusted and loved fashion destination for women across India by offering stylish, high-quality, and affordable clothing that inspires confidence and reflects individuality.',
    'We envision a world where every woman — regardless of age, size, or budget — has access to fashion that makes her feel empowered, elegant, and expressive.'
  ]
  
  const missionTitle = 'Our Mission'
  const missionContent = [
    'To deliver the best blend of ethnic and modern fashion with superior quality at affordable prices.',
    'To ensure that every purchase brings satisfaction to our customers — through thoughtful designs, reliable quality, and excellent service.',
    'To build long-term brand loyalty by consistently exceeding expectations in fabric, fitting, and fashion innovation.',
    'To support Indian artisans and fashion talent by showcasing craftsmanship with a modern outlook.',
    'To become a go-to fashion brand for women who want value, style, and confidence — all in one.'
  ]
  
  return (
    <div className="about-page">
      <div className="container-custom py-12">
        {/* Static Content */}
        <>
            {/* Hero Section */}
            <motion.div 
              className="text-center mb-16 relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-0 overflow-hidden z-0">
                <div className="w-full h-full bg-gradient-to-br from-java-600 to-java-800 flex items-center justify-center">
                  <div className="text-white text-6xl font-bold opacity-20">BEEGET</div>
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-40"></div>
              </div>
              <div className="py-16 relative z-20 text-white">
                <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">{heroTitle}</h1>
                <p className="text-lg max-w-3xl mx-auto text-gray-200">
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
                  <img src="/10.jpg" alt="About Beeget" className="w-full h-full object-cover rounded-lg" />
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
      </div>
    </div>
  )
}

export default About