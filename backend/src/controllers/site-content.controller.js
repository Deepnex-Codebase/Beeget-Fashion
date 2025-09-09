import { HomePage, AboutPage, ContactPage, Enquiry, Footer } from '../models/cms.model.js';
import { AppError } from '../middlewares/error.middleware.js';
import { logger } from '../utils/logger.js';
import { getFileUrl } from '../config/multer.js';

/**
 * Get the Home Page content
 */
export const getHomePage = async (req, res, next) => {
  try {
    // Find the home page or create a default one if it doesn't exist
    let homePage = await HomePage.findOne();
    
    if (!homePage) {
      // Create default home page with example content
      homePage = await createDefaultHomePage();
    }
    
    // Log successful retrieval
    logger.info('Home page data retrieved successfully');
    
    res.status(200).json(homePage);
  } catch (error) {
    logger.error('Error getting home page:', error);
    next(error);
  }
};

/**
 * Update the Home Page content
 */
export const updateHomePage = async (req, res, next) => {
  try {
    logger.info('Received update request for home page with data:', JSON.stringify(req.body));
    
    // Find the home page or create a default one if it doesn't exist
    let homePage = await HomePage.findOne();
    
    if (!homePage) {
      homePage = new HomePage({});
      logger.info('Created new home page document as none existed');
    }
    
    // Log the blocks structure before update
    logger.info('Blocks structure before update:', JSON.stringify(homePage.blocks));
    
    // Update all fields from request body
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== '__v') {
        // Special handling for blocks to ensure proper structure
        if (key === 'blocks' && Array.isArray(req.body.blocks)) {
          // Process each block to ensure proper structure
          homePage.blocks = req.body.blocks.map(block => {
            // Process hero slider blocks
            if (block.blockType === 'hero_slider' && block.slides) {
              // Ensure each slide has proper image structure
              block.slides = block.slides.map(slide => {
                // Log the slide structure
                logger.info('Processing slide:', JSON.stringify(slide));
                
                // Ensure image objects exist
                if (!slide.desktop_image) slide.desktop_image = {};
                if (!slide.background_image) slide.background_image = {};
                if (!slide.mobile_image) slide.mobile_image = {};
                if (!slide.mobile_background_image) slide.mobile_background_image = {};
                
                return slide;
              });
            }
            return block;
          });
        } else {
          homePage[key] = req.body[key];
        }
      }
    });
    
    // Log the blocks structure after update
    logger.info('Blocks structure after update:', JSON.stringify(homePage.blocks));
    
    // Increment version number
    homePage.version = (homePage.version || 0) + 1;
    homePage.updatedAt = Date.now();
    
    logger.info('Saving updated home page document');
    await homePage.save();
    logger.info('Home page document saved successfully');
    
    // Return the updated document
    res.status(200).json(homePage);
  } catch (error) {
    logger.error('Error updating home page:', error);
    next(error);
  }
};

/**
 * Autosave the Home Page content
 */
export const autosaveHomePage = async (req, res, next) => {
  try {
    logger.info('Received autosave request for home page with data:', JSON.stringify(req.body));
    
    // Find the home page or create a default one if it doesn't exist
    let homePage = await HomePage.findOne();
    
    if (!homePage) {
      homePage = new HomePage({});
      logger.info('Created new home page document as none existed');
    }
    
    // Log the blocks structure before update
    logger.info('Blocks structure before autosave:', JSON.stringify(homePage.blocks));
    
    // Update all fields from request body
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== '__v') {
        // Special handling for blocks to ensure proper structure
        if (key === 'blocks' && Array.isArray(req.body.blocks)) {
          // Process each block to ensure proper structure
          homePage.blocks = req.body.blocks.map(block => {
            // Process hero slider blocks
            if (block.blockType === 'hero_slider' && block.slides) {
              // Ensure each slide has proper image structure
              block.slides = block.slides.map(slide => {
                // Log the slide structure
                logger.info('Processing slide for autosave:', JSON.stringify(slide));
                
                // Ensure image objects exist
                if (!slide.desktop_image) slide.desktop_image = {};
                if (!slide.background_image) slide.background_image = {};
                if (!slide.mobile_image) slide.mobile_image = {};
                if (!slide.mobile_background_image) slide.mobile_background_image = {};
                
                return slide;
              });
            }
            return block;
          });
        } else {
          homePage[key] = req.body[key];
        }
      }
    });
    
    // Log the blocks structure after update
    logger.info('Blocks structure after autosave:', JSON.stringify(homePage.blocks));
    
    // Update autosave timestamp
    homePage.lastAutosaved = Date.now();
    
    logger.info('Saving autosaved home page document');
    await homePage.save();
    logger.info('Home page document autosaved successfully');
    
    res.status(200).json({ message: 'Home page autosaved successfully', timestamp: homePage.lastAutosaved });
  } catch (error) {
    logger.error('Error autosaving home page:', error);
    next(error);
  }
};

/**
 * Get the About Page content
 */
export const getAboutPage = async (req, res, next) => {
  try {
    // Find the about page or create a default one if it doesn't exist
    let aboutPage = await AboutPage.findOne();
    
    if (!aboutPage) {
      // Create default about page with example content
      aboutPage = await createDefaultAboutPage();
    }
    
    // Log successful retrieval
    logger.info('About page data retrieved successfully');
    
    res.status(200).json(aboutPage);
  } catch (error) {
    logger.error('Error getting about page:', error);
    next(error);
  }
};

/**
 * Update the About Page content
 */
export const updateAboutPage = async (req, res, next) => {
  try {
    logger.info('Received update request for about page with data:', JSON.stringify(req.body));
    
    // Find the about page or create a default one if it doesn't exist
    let aboutPage = await AboutPage.findOne();
    
    if (!aboutPage) {
      aboutPage = new AboutPage({});
      logger.info('Created new about page document as none existed');
    }
    
    // Update all fields from request body
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== '__v') {
        aboutPage[key] = req.body[key];
      }
    });
    
    // Increment version number
    aboutPage.version = (aboutPage.version || 0) + 1;
    aboutPage.updatedAt = Date.now();
    
    logger.info('Saving updated about page document');
    await aboutPage.save();
    logger.info('About page document saved successfully');
    
    res.status(200).json(aboutPage);
  } catch (error) {
    logger.error('Error updating about page:', error);
    next(error);
  }
};

/**
 * Autosave the About Page content
 */
export const autosaveAboutPage = async (req, res, next) => {
  try {
    logger.info('Received autosave request for about page with data:', JSON.stringify(req.body));
    
    // Find the about page or create a default one if it doesn't exist
    let aboutPage = await AboutPage.findOne();
    
    if (!aboutPage) {
      aboutPage = new AboutPage({});
      logger.info('Created new about page document as none existed');
    }
    
    // Update all fields from request body
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== '__v') {
        aboutPage[key] = req.body[key];
      }
    });
    
    // Update autosave timestamp
    aboutPage.lastAutosaved = Date.now();
    
    logger.info('Saving autosaved about page document');
    await aboutPage.save();
    logger.info('About page document autosaved successfully');
    
    res.status(200).json({ message: 'About page autosaved successfully', timestamp: aboutPage.lastAutosaved });
  } catch (error) {
    logger.error('Error autosaving about page:', error);
    next(error);
  }
};

/**
 * Get the Contact Page content
 */
export const getContactPage = async (req, res, next) => {
  try {
    // Find the contact page or create a default one if it doesn't exist
    let contactPage = await ContactPage.findOne();
    
    if (!contactPage) {
      // Create default contact page with example content
      contactPage = await createDefaultContactPage();
    }
    
    res.status(200).json(contactPage);
  } catch (error) {
    logger.error('Error getting contact page:', error);
    next(error);
  }
};

/**
 * Update the Contact Page content
 */
export const updateContactPage = async (req, res, next) => {
  try {
    logger.info('Received update request for contact page with data:', JSON.stringify(req.body));
    
    // Find the contact page or create a default one if it doesn't exist
    let contactPage = await ContactPage.findOne();
    
    if (!contactPage) {
      contactPage = new ContactPage({});
      logger.info('Created new contact page document as none existed');
    }
    
    // Update all fields from request body
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== '__v') {
        contactPage[key] = req.body[key];
      }
    });
    
    // Increment version number
    contactPage.version = (contactPage.version || 0) + 1;
    contactPage.updatedAt = Date.now();
    
    logger.info('Saving updated contact page document');
    await contactPage.save();
    logger.info('Contact page document saved successfully');
    
    // Return the updated document
    res.status(200).json(contactPage);
  } catch (error) {
    logger.error('Error updating contact page:', error);
    next(error);
  }
};

/**
 * Autosave the Contact Page content
 */
export const autosaveContactPage = async (req, res, next) => {
  try {
    logger.info('Received autosave request for contact page with data:', JSON.stringify(req.body));
    
    // Find the contact page or create a default one if it doesn't exist
    let contactPage = await ContactPage.findOne();
    
    if (!contactPage) {
      contactPage = new ContactPage({});
      logger.info('Created new contact page document as none existed');
    }
    
    // Update all fields from request body
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== '__v') {
        contactPage[key] = req.body[key];
      }
    });
    
    // Update autosave timestamp
    contactPage.lastAutosaved = Date.now();
    
    logger.info('Saving autosaved contact page document');
    await contactPage.save();
    logger.info('Contact page document autosaved successfully');
    
    res.status(200).json({ message: 'Contact page autosaved successfully', timestamp: contactPage.lastAutosaved });
  } catch (error) {
    logger.error('Error autosaving contact page:', error);
    next(error);
  }
};

/**
 * Get the Footer content
 */
export const getFooter = async (req, res, next) => {
  try {
    // Find the footer or create a default one if it doesn't exist
    let footer = await Footer.findOne();
    
    if (!footer) {
      // Create default footer with example content
      footer = await createDefaultFooter();
    }
    
    res.status(200).json(footer);
  } catch (error) {
    logger.error('Error getting footer:', error);
    next(error);
  }
};

/**
 * Update the Footer content
 */
export const updateFooter = async (req, res, next) => {
  try {
    logger.info('Received update request for footer with data:', JSON.stringify(req.body));
    
    // Find the footer or create a default one if it doesn't exist
    let footer = await Footer.findOne();
    
    if (!footer) {
      footer = new Footer({
        brand_info: {
          name: 'Beeget Fashion',
          description: 'Modern women\'s clothing and accessories.',
          copyright_text: '© 2023 Beeget Fashion. All rights reserved.'
        },
        navigation_columns: [],
        social_links: [],
        newsletter: {
          enabled: true,
          headline: 'Newsletter',
          description: 'Subscribe to our newsletter for updates.',
          button_text: 'Subscribe',
          success_message: 'Thank you for subscribing!'
        }
      });
      logger.info('Created new footer document as none existed');
    }
    
    // Update all fields from request body
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== '__v') {
        footer[key] = req.body[key];
      }
    });
    
    // Increment version number
    footer.version = (footer.version || 0) + 1;
    footer.updatedAt = Date.now();
    
    logger.info('Saving updated footer document');
    await footer.save();
    logger.info('Footer document saved successfully');
    
    // Return the updated document
    res.status(200).json(footer);
  } catch (error) {
    logger.error('Error updating footer:', error);
    next(error);
  }
};

/**
 * Autosave the Footer content
 */
export const autosaveFooter = async (req, res, next) => {
  try {
    logger.info('Received autosave request for footer with data:', JSON.stringify(req.body));
    
    // Find the footer or create a default one if it doesn't exist
    let footer = await Footer.findOne();
    
    if (!footer) {
      footer = new Footer({
        brand_info: {
          name: 'Beeget Fashion',
          description: 'Modern women\'s clothing and accessories.',
          copyright_text: '© 2023 Beeget Fashion. All rights reserved.'
        },
        navigation_columns: [],
        social_links: [],
        newsletter: {
          enabled: true,
          headline: 'Newsletter',
          description: 'Subscribe to our newsletter for updates.',
          button_text: 'Subscribe',
          success_message: 'Thank you for subscribing!'
        }
      });
      logger.info('Created new footer document as none existed');
    }
    
    // Update all fields from request body
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== '__v') {
        footer[key] = req.body[key];
      }
    });
    
    // Update autosave timestamp
    footer.lastAutosaved = Date.now();
    
    logger.info('Saving autosaved footer document');
    await footer.save();
    logger.info('Footer document autosaved successfully');
    
    res.status(200).json({ message: 'Footer autosaved successfully', timestamp: footer.lastAutosaved });
  } catch (error) {
    logger.error('Error autosaving footer:', error);
    next(error);
  }
};

/**
 * Submit a contact enquiry
 */
export const submitEnquiry = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !subject || !message) {
      throw new AppError('All fields are required', 400);
    }
    
    // Create new enquiry
    const newEnquiry = new Enquiry({
      name,
      email,
      subject,
      message,
      status: 'new'
    });
    
    await newEnquiry.save();
    
    // TODO: Send email notification to admin
    
    res.status(201).json({ message: 'Enquiry submitted successfully' });
  } catch (error) {
    logger.error('Error submitting enquiry:', error);
    next(error);
  }
};

/**
 * Get all enquiries with pagination and filtering
 */
export const getEnquiries = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status = '', search = '' } = req.query;
    
    // Build query
    const query = {};
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination
    const enquiries = await Enquiry.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Enquiry.countDocuments(query);
    
    res.status(200).json({
      enquiries,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalItems: total
    });
  } catch (error) {
    logger.error('Error getting enquiries:', error);
    next(error);
  }
};

/**
 * Update an enquiry status
 */
export const updateEnquiryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, responseMessage } = req.body;
    
    // Validate status
    if (!['new', 'read', 'replied', 'archived'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }
    
    // Prepare update object
    const updateData = { status };
    
    // If response message is provided, add it to the update
    if (responseMessage) {
      updateData.responseMessage = responseMessage;
    }
    
    // Find and update enquiry
    const enquiry = await Enquiry.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!enquiry) {
      throw new AppError('Enquiry not found', 404);
    }
    
    // If status is 'replied' and we have a response message, send email to user
    if (status === 'replied' && responseMessage) {
      try {
        // Import email service
        const { sendEnquiryResponseEmail } = await import('../services/email.service.js');
        
        // Send email to user
        await sendEnquiryResponseEmail(
          enquiry.email,
          enquiry.name,
          enquiry.subject,
          responseMessage
        );
        
        logger.info(`Response email sent to ${enquiry.email} for enquiry ${enquiry._id}`);
      } catch (emailError) {
        logger.error(`Failed to send response email: ${emailError.message}`);
        // We don't want to fail the status update if email sending fails
        // So we just log the error and continue
      }
    }
    
    res.status(200).json(enquiry);
  } catch (error) {
    logger.error('Error updating enquiry status:', error);
    next(error);
  }
};

/**
 * Delete an enquiry
 */
export const deleteEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find and delete the enquiry
    const enquiry = await Enquiry.findByIdAndDelete(id);
    
    if (!enquiry) {
      throw new AppError('Enquiry not found', 404);
    }
    
    logger.info(`Enquiry ${id} deleted successfully`);
    res.status(200).json({
      success: true,
      message: 'Enquiry deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting enquiry:', error);
    next(error);
  }
};

/**
 * Upload CMS Image
 */
export const uploadCmsImage = async (req, res, next) => {
  try {
    logger.info('CMS image upload request received');
    logger.info('Image upload capacity increased to 10MB');
    logger.info('Request headers:', req.headers);
    logger.info('Request files:', req.files);
    logger.info('Request file:', req.file);
    
    if (!req.file) {
      logger.error('No image file provided in request');
      throw new AppError('No image file provided', 400);
    }

    logger.info(`File received: ${req.file.originalname}, size: ${req.file.size}, mimetype: ${req.file.mimetype}`);

    // Generate the file URL
    const imageUrl = getFileUrl(req.file.path);
    
    logger.info(`CMS image uploaded successfully: ${req.file.filename}`);
    logger.info(`Generated URL: ${imageUrl}`);
    
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: imageUrl,
        path: req.file.path
      }
    });
  } catch (error) {
    logger.error('Error uploading CMS image:', error);
    next(error);
  }
};

/**
 * Upload CMS Video
 */
export const uploadCmsVideo = async (req, res, next) => {
  try {
    logger.info('CMS video upload request received');
    logger.info('Request headers:', req.headers);
    logger.info('Request files:', req.files);
    logger.info('Request file:', req.file);
    
    if (!req.file) {
      logger.error('No video file provided in request');
      throw new AppError('No video file provided', 400);
    }

    logger.info(`File received: ${req.file.originalname}, size: ${req.file.size}, mimetype: ${req.file.mimetype}`);

    // Generate the file URL
    const videoUrl = getFileUrl(req.file.path);
    
    logger.info(`CMS video uploaded successfully: ${req.file.filename}`);
    logger.info(`Generated URL: ${videoUrl}`);
    
    res.status(200).json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: videoUrl,
        path: req.file.path
      }
    });
  } catch (error) {
    logger.error('Error uploading CMS video:', error);
    next(error);
  }
};

/**
 * Helper function to create a default home page
 */
const createDefaultHomePage = async () => {
  const defaultHomePage = new HomePage({
    title: 'Home Page',
    slug: 'home',
    status: 'published',
    blocks: [
      {
        blockType: 'hero_section',
        background_image: {
          url: '/uploads/products/hero-banner.jpg',
          alt: 'Beeget Fashion Hero Image'
        },
        headline: 'Elevate Your Style',
        subheadline: 'Discover our new collection of premium fashion essentials',
        cta_text: 'Shop Now',
        cta_link: '/shop',
        overlay_style: 'dark',
        order: 1
      },
      {
        blockType: 'shop_by_category',
        categories: [
          {
            image: {
              url: '/uploads/products/category-dresses.jpg',
              alt: 'Dresses Category'
            },
            label: 'Dresses',
            collection_link: '/shop?category=dresses'
          },
          {
            image: {
              url: '/uploads/products/category-tops.jpg',
              alt: 'Tops Category'
            },
            label: 'Tops',
            collection_link: '/shop?category=tops'
          },
          {
            image: {
              url: '/uploads/products/category-bottoms.jpg',
              alt: 'Bottoms Category'
            },
            label: 'Bottoms',
            collection_link: '/shop?category=bottoms'
          },
          {
            image: {
              url: '/uploads/products/category-outerwear.jpg',
              alt: 'Outerwear Category'
            },
            label: 'Outerwear',
            collection_link: '/shop?category=outerwear'
          },
          {
            image: {
              url: '/uploads/products/category-accessories.jpg',
              alt: 'Accessories Category'
            },
            label: 'Accessories',
            collection_link: '/shop?category=accessories'
          },
          {
            image: {
              url: '/uploads/products/category-shoes.jpg',
              alt: 'Shoes Category'
            },
            label: 'Shoes',
            collection_link: '/shop?category=shoes'
          }
        ],
        order: 2
      },
      {
        blockType: 'promotional_banner',
        banner_image: {
          url: '/uploads/products/summer-banner.jpg',
          alt: 'Summer Festivities Banner'
        },
        headline: 'Summer Festivities',
        subheadline: 'Light fabrics, vibrant colors, and breezy silhouettes for your summer adventures',
        cta_text: 'Shop Collection',
        cta_link: '/shop?collection=summer',
        align: 'left',
        order: 3
      },
      {
        blockType: 'promotional_banner',
        banner_image: {
          url: '/uploads/products/work-banner.jpg',
          alt: 'Work Anywhere Banner'
        },
        headline: 'Work Anywhere',
        subheadline: 'Versatile pieces that transition seamlessly from office to evening',
        cta_text: 'Explore Workwear',
        cta_link: '/shop?collection=workwear',
        align: 'right',
        order: 3
      },
      {
        blockType: 'watch_and_buy',
        headline: 'WATCH AND BUY',
        products: [
          { productId: '60d21b4667d0d8992e610c85' },
          { productId: '60d21b4667d0d8992e610c86' },
          { productId: '60d21b4667d0d8992e610c87' },
          { productId: '60d21b4667d0d8992e610c88' }
        ],
        order: 6
      },
      {
        blockType: 'promotional_banner',
        banner_image: {
          url: '/uploads/products/dresses-banner.jpg',
          alt: 'Dresses Banner'
        },
        headline: 'Dresses for Every Occasion',
        subheadline: 'From casual day dresses to elegant evening wear',
        cta_text: 'Shop Dresses',
        cta_link: '/shop?category=dresses',
        align: 'left',
        order: 6
      },
      {
        blockType: 'promotional_banner',
        banner_image: {
          url: '/uploads/products/florals-banner.jpg',
          alt: 'Playful Florals Banner'
        },
        headline: 'Playful Florals',
        subheadline: 'Add a touch of nature to your wardrobe with our floral prints',
        cta_text: 'Discover More',
        cta_link: '/shop?pattern=floral',
        align: 'right',
        order: 7
      },
      {
        blockType: 'promotional_banner',
        banner_image: {
          url: '/uploads/products/plus-size-banner.jpg',
          alt: 'Plus Size Banner'
        },
        headline: 'Inclusive Sizing',
        subheadline: 'Beautiful styles available in sizes 0-24',
        cta_text: 'Shop Plus Size',
        cta_link: '/shop?size=plus',
        align: 'left',
        order: 8
      },
      {
        blockType: 'featured_products',
        headline: 'Featured Products',
        products: [
          { productId: '60d21b4667d0d8992e610c89' },
          { productId: '60d21b4667d0d8992e610c8a' },
          { productId: '60d21b4667d0d8992e610c8b' },
          { productId: '60d21b4667d0d8992e610c8c' },
          { productId: '60d21b4667d0d8992e610c8d' },
          { productId: '60d21b4667d0d8992e610c8e' },
          { productId: '60d21b4667d0d8992e610c8f' },
          { productId: '60d21b4667d0d8992e610c90' }
        ],
        order: 9
      },
      {
        blockType: 'newsletter_signup',
        headline: 'Join Our Newsletter',
        subtext: 'Subscribe to receive updates on new arrivals, special offers and other discount information.',
        order: 10
      }
    ],
    version: 1
  });
  
  await defaultHomePage.save();
  return defaultHomePage;
};

/**
 * Helper function to create a default about page
 */
const createDefaultAboutPage = async () => {
  const defaultAboutPage = new AboutPage({
    title: 'About Page',
    slug: 'about',
    status: 'published',
    blocks: [
      {
        blockType: 'page_header',
        headline: 'About Beeget Fashion',
        subheadline: 'Modern women\'s clothing with a focus on quality, sustainability, and timeless design.',
        order: 1
      },
      {
        blockType: 'our_vision',
        headline: 'Our Vision',
        rich_text_content: '<p>To become a trusted and loved fashion destination for women across India by offering stylish, high-quality, and affordable clothing that inspires confidence and reflects individuality.</p><p>We envision a world where every woman — regardless of age, size, or budget — has access to fashion that makes her feel empowered, elegant, and expressive.</p>',
        order: 2
      },
      {
        blockType: 'our_mission',
        headline: 'Our Mission',
        rich_text_content: '<p>To deliver the best blend of ethnic and modern fashion with superior quality at affordable prices.</p><p>To ensure that every purchase brings satisfaction to our customers — through thoughtful designs, reliable quality, and excellent service.</p><p>To build long-term brand loyalty by consistently exceeding expectations in fabric, fitting, and fashion innovation.</p><p>To support Indian artisans and fashion talent by showcasing craftsmanship with a modern outlook.</p><p>To become a go-to fashion brand for women who want value, style, and confidence — all in one.</p>',
        order: 3
      },
      {
        blockType: 'our_story',
        rich_text_story: '<p>Founded in 2018, Beeget Fashion was born from a passion for creating beautiful, high-quality clothing that empowers women to feel confident and comfortable.</p><p>Our founder, Sarah Johnson, spent over a decade in the fashion industry before launching Beeget with a mission to create clothing that combines timeless elegance with modern sensibility.</p><p>We believe that great style shouldn\'t come at the expense of ethical practices. That\'s why we work closely with our manufacturing partners to ensure fair labor practices and use sustainable materials whenever possible.</p><p>Every piece in our collection is thoughtfully designed to be versatile, long-lasting, and effortlessly stylish. We focus on premium fabrics, impeccable tailoring, and designs that transcend seasonal trends.</p>',
        side_image: {
          url: '/uploads/products/about-story.jpg',
          alt: 'Beeget Fashion Studio'
        },
        order: 5
      },
      {
        blockType: 'our_values',
        value_cards: [
          {
            icon: 'quality',
            title: 'Quality First',
            description: 'We use premium fabrics and maintain high standards in our manufacturing process to create pieces that last.'
          },
          {
            icon: 'sustainability',
            title: 'Sustainability',
            description: 'We\'re committed to reducing our environmental impact through responsible sourcing and production methods.'
          },
          {
            icon: 'inclusivity',
            title: 'Inclusivity',
            description: 'We design for women of all shapes, sizes, and backgrounds, with a wide range of sizes and styles.'
          },
          {
            icon: 'transparency',
            title: 'Transparency',
            description: 'We believe in being open about our processes, pricing, and the people who make our clothes.'
          }
        ],
        order: 6
      },
      {
        blockType: 'meet_our_team',
        headline: 'Meet Our Team',
        team_members: [
          {
            photo: {
              url: '/uploads/products/team-sarah.jpg',
              alt: 'Sarah Johnson'
            },
            name: 'Sarah Johnson',
            position: 'Founder & Creative Director'
          },
          {
            photo: {
              url: '/uploads/products/team-michael.jpg',
              alt: 'Michael Chen'
            },
            name: 'Michael Chen',
            position: 'Head of Design'
          },
          {
            photo: {
              url: '/uploads/products/team-elena.jpg',
              alt: 'Elena Rodriguez'
            },
            name: 'Elena Rodriguez',
            position: 'Production Manager'
          },
          {
            photo: {
              url: '/uploads/products/team-david.jpg',
              alt: 'David Kim'
            },
            name: 'David Kim',
            position: 'Sustainability Officer'
          }
        ],
        order: 7
      },
      {
        blockType: 'cta_strip',
        headline: 'Discover Our Latest Collection',
        buttons: [
          {
            text: 'Shop Now',
            link: '/shop'
          },
          {
            text: 'Contact Us',
            link: '/contact'
          }
        ],
        order: 4
      }
    ],
    version: 1
  });
  
  await defaultAboutPage.save();
  return defaultAboutPage;
};

/**
 * Helper function to create a default contact page
 */
const createDefaultContactPage = async () => {
  const defaultContactPage = new ContactPage({
    title: 'Contact Page',
    slug: 'contact',
    status: 'published',
    blocks: [
      {
        blockType: 'page_header',
        headline: 'Contact Us',
        subheadline: 'We\'d love to hear from you. Get in touch with our team for any questions or feedback.',
        order: 1
      },
      {
        blockType: 'contact_info',
        general_email: 'hello@beegetfashion.com',
        support_email: 'support@beegetfashion.com',
        phone: '+1 (555) 123-4567',
        business_hours_weekday: 'Monday to Friday: 9am - 6pm EST',
        business_hours_sat: 'Saturday: 10am - 4pm EST',
        address_line1: 'Beeget Fashion HQ',
        address_line2: '123 Fashion Avenue',
        address_line3: 'New York, NY 10001',
        address_line4: 'United States',
        map_embed: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.9663095343008!2d-74.0059418846111!3d40.74127904379132!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a9b3117469%3A0xd134e199a405a163!2sEmpire%20State%20Building!5e0!3m2!1sen!2sus!4v1629321053840!5m2!1sen!2sus" width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>',
        order: 2
      },
      {
        blockType: 'enquiry_form',
        form_title: 'Send us a message',
        order: 3
      },
      {
        blockType: 'social_links_row',
        links: [
          {
            platform: 'Facebook',
            url: 'https://facebook.com/beegetfashion',
            icon: 'facebook'
          },
          {
            platform: 'Instagram',
            url: 'https://instagram.com/beegetfashion',
            icon: 'instagram'
          },
          {
            platform: 'Twitter',
            url: 'https://twitter.com/beegetfashion',
            icon: 'twitter'
          },
          {
            platform: 'Pinterest',
            url: 'https://pinterest.com/beegetfashion',
            icon: 'pinterest'
          }
        ],
        order: 4
      }
    ],
    version: 1
  });
  
  await defaultContactPage.save();
  return defaultContactPage;
};

/**
 * Helper function to create a default footer
 */
const createDefaultFooter = async () => {
  const defaultFooter = new Footer({
    // Brand Information
    brand_info: {
      name: 'Beeget Fashion',
      description: 'Modern women\'s clothing and accessories. Premium fabrics, sustainable practices, and timeless designs—elegant, versatile, and made for you.',
      logo_url: '/images/logo.svg',
      logo_alt: 'Beeget Fashion Logo',
      copyright_text: '© 2023 Beeget Fashion. All rights reserved.'
    },
    
    // Navigation Columns
    navigation_columns: [
      {
        title: 'Quick Links',
        links: [
          { text: 'Shop All', url: '/shop' },
          { text: 'New Arrivals', url: '/shop?new=true' },
          { text: 'Bestsellers', url: '/shop?bestsellers=true' },
          { text: 'Dresses', url: '/shop?category=dresses' },
          { text: 'Sale', url: '/shop?sale=true' }
        ]
      },
      {
        title: 'Information',
        links: [
          { text: 'About Us', url: '/about' },
          { text: 'Contact Us', url: '/contact' },
          { text: 'Shipping & Returns', url: '/shipping' },
          { text: 'FAQ', url: '/faq' },
          { text: 'Privacy Policy', url: '/privacy-policy' }
        ]
      }
    ],
    
    // Social Links
    social_links: [
      {
        platform: 'Facebook',
        url: 'https://www.facebook.com/share/16yorjMnQi/',
        icon: 'facebook'
      },
      {
        platform: 'Instagram',
        url: 'https://www.instagram.com/beegetfashion?igsh=YWc5MGM0eGdrbzly',
        icon: 'instagram'
      },
      {
        platform: 'YouTube',
        url: 'https://youtube.com/@beegetfashion?si=EhstRf4mrsg8_jmJ',
        icon: 'youtube'
      },
      {
        platform: 'LinkedIn',
        url: 'https://www.linkedin.com/company/beeget-fashion/',
        icon: 'linkedin'
      },
      {
        platform: 'Pinterest',
        url: 'https://pinterest.com/beegetfashion',
        icon: 'pinterest'
      }
    ],
    
    // Contact Information
    contact_info: {
      address: 'First and Second Floor Plot 258 Ambika Nagar Bamroli Surat',
      phone: '+91 9714730985',
      whatsapp: '+91 9714730985',
      email: 'customersupport@beegetfashion.com'
    },
    
    // Newsletter Section
    newsletter: {
      enabled: true,
      headline: 'Newsletter',
      description: 'Subscribe to our newsletter for updates on new arrivals, sales, and more.',
      button_text: 'Subscribe',
      success_message: 'Thank you for subscribing!'
    },
    
    version: 1
  });
  
  await defaultFooter.save();
  return defaultFooter;
};
