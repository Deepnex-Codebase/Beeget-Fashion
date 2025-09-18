import { CmsPage, Footer } from '../models/cms.model.js';
import { AppError } from '../middlewares/error.middleware.js';
import { logger } from '../utils/logger.js';

/**
 * Get all CMS pages with pagination and filtering
 */
export const getCmsPages = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    
    // Build query
    const query = {};
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { metaDescription: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination
    const pages = await CmsPage.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await CmsPage.countDocuments(query);
    
    res.status(200).json({
      pages,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalItems: total
    });
  } catch (error) {
    logger.error('Error getting CMS pages:', error);
    next(error);
  }
};

/**
 * Get a single CMS page by ID or slug
 */
export const getCmsPage = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    
    // Check if identifier is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    
    let page;
    if (isValidObjectId) {
      page = await CmsPage.findById(identifier);
    } else {
      page = await CmsPage.findOne({ slug: identifier });
    }
    
    if (!page) {
      throw new AppError('CMS page not found', 404);
    }
    
    res.status(200).json(page);
  } catch (error) {
    logger.error('Error getting CMS page:', error);
    next(error);
  }
};

/**
 * Create a new CMS page
 */
export const createCmsPage = async (req, res, next) => {
  try {
    const { title, slug, metaDescription, status, isHomePage, contentBlocks } = req.body;
    
    // Validate required fields
    if (!title || !slug) {
      throw new AppError('Title and slug are required', 400);
    }
    
    // Check if slug already exists
    const existingPage = await CmsPage.findOne({ slug });
    if (existingPage) {
      throw new AppError('A page with this slug already exists', 400);
    }
    
    // If setting as homepage, unset any existing homepage
    if (isHomePage) {
      await CmsPage.updateMany({ isHomePage: true }, { isHomePage: false });
    }
    
    // Create new page
    const newPage = new CmsPage({
      title,
      slug,
      metaDescription,
      status: status || 'draft',
      isHomePage: isHomePage || false,
      contentBlocks: contentBlocks || []
    });
    
    await newPage.save();
    
    res.status(201).json(newPage);
  } catch (error) {
    logger.error('Error creating CMS page:', error);
    next(error);
  }
};

/**
 * Update a CMS page
 */
export const updateCmsPage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, slug, metaDescription, status, isHomePage, contentBlocks } = req.body;
    
    // Find page
    const page = await CmsPage.findById(id);
    if (!page) {
      throw new AppError('CMS page not found', 404);
    }
    
    // If changing slug, check if new slug already exists
    if (slug && slug !== page.slug) {
      const existingPage = await CmsPage.findOne({ slug, _id: { $ne: id } });
      if (existingPage) {
        throw new AppError('A page with this slug already exists', 400);
      }
    }
    
    // If setting as homepage, unset any existing homepage
    if (isHomePage && !page.isHomePage) {
      await CmsPage.updateMany({ isHomePage: true }, { isHomePage: false });
    }
    
    // Update page
    page.title = title || page.title;
    page.slug = slug || page.slug;
    page.metaDescription = metaDescription !== undefined ? metaDescription : page.metaDescription;
    page.status = status || page.status;
    page.isHomePage = isHomePage !== undefined ? isHomePage : page.isHomePage;
    page.contentBlocks = contentBlocks || page.contentBlocks;
    page.updatedAt = Date.now();
    
    await page.save();
    
    res.status(200).json(page);
  } catch (error) {
    logger.error('Error updating CMS page:', error);
    next(error);
  }
};

/**
 * Delete a CMS page
 */
export const deleteCmsPage = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const page = await CmsPage.findByIdAndDelete(id);
    if (!page) {
      throw new AppError('CMS page not found', 404);
    }
    
    res.status(200).json({ message: 'CMS page deleted successfully' });
  } catch (error) {
    logger.error('Error deleting CMS page:', error);
    next(error);
  }
};

/**
 * Get the footer content
 */
export const getFooter = async (req, res, next) => {
  try {
    // Find the footer or create a default one if it doesn't exist
    let footer = await Footer.findOne();
    
    if (!footer) {
      // Create default footer
      footer = await createDefaultFooter();
    }
    
    res.status(200).json(footer);
  } catch (error) {
    logger.error('Error getting footer:', error);
    next(error);
  }
};

/**
 * Update the footer content
 */
export const updateFooter = async (req, res, next) => {
  try {
    const {
      brandName,
      descriptionParagraph,
      socialLinks,
      quickLinksTitle,
      quickLinks,
      informationTitle,
      informationLinks,
      newsletterHeadline,
      newsletterSubtext
    } = req.body;
    
    // Find the footer or create a default one if it doesn't exist
    let footer = await Footer.findOne();
    
    if (!footer) {
      footer = new Footer({});
    }
    
    // Update footer fields
    if (brandName !== undefined) footer.brandName = brandName;
    if (descriptionParagraph !== undefined) footer.descriptionParagraph = descriptionParagraph;
    if (socialLinks !== undefined) footer.socialLinks = socialLinks;
    if (quickLinksTitle !== undefined) footer.quickLinksTitle = quickLinksTitle;
    if (quickLinks !== undefined) footer.quickLinks = quickLinks;
    if (informationTitle !== undefined) footer.informationTitle = informationTitle;
    if (informationLinks !== undefined) footer.informationLinks = informationLinks;
    if (newsletterHeadline !== undefined) footer.newsletterHeadline = newsletterHeadline;
    if (newsletterSubtext !== undefined) footer.newsletterSubtext = newsletterSubtext;
    
    footer.updatedAt = Date.now();
    
    await footer.save();
    
    res.status(200).json(footer);
  } catch (error) {
    logger.error('Error updating footer:', error);
    next(error);
  }
};

/**
 * Helper function to create a default footer
 */
const createDefaultFooter = async () => {
  const defaultFooter = new Footer({
    brandName: 'Beeget Fashion',
    descriptionParagraph: 'Modern women\'s clothing and accessories. Premium fabrics, sustainable practices, and timeless designs—elegant, versatile, and made for you.',
    socialLinks: [
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
    quickLinksTitle: 'Quick Links',
    quickLinks: [
      { label: 'Shop All', url: '/shop' },
      { label: 'Women', url: '/shop?category=women' },
      { label: 'Men', url: '/shop?category=men' },
      { label: 'Accessories', url: '/shop?category=accessories' },
      { label: 'Sale', url: '/shop?sale=true' }
    ],
    informationTitle: 'Information',
    informationLinks: [
      { label: 'About Us', url: '/about' },
      { label: 'Contact Us', url: '/contact' },
      { label: 'Shipping & Returns', url: '/shipping' },
      { label: 'FAQ', url: '/faq' },
      { label: 'Privacy Policy', url: '/privacy-policy' }
    ],
    newsletterHeadline: 'Newsletter',
    newsletterSubtext: 'Subscribe to our newsletter for updates on new arrivals, sales, and more.',
    contactInfo: {
      address: 'First and Second Floor Plot 258 Ambika Nagar Bamroli Surat',
      phone: '+91 9714730985',
      whatsapp: '+91 9714730985',
      email: 'customersupport@beegetfashion.com'
    }
  });
  
  await defaultFooter.save();
  return defaultFooter;
};