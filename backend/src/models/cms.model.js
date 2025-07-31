import mongoose from 'mongoose';

// Schema for social links in the footer and other sections
const SocialLinkSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    required: true,
    trim: true
  }
});

// Schema for links in the footer and other sections
const LinkSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  }
});

// Schema for buttons/CTAs
const ButtonSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  link: {
    type: String,
    required: true,
    trim: true
  }
});

// Schema for image fields with alt text
const ImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    trim: true
  },
  alt: {
    type: String,
    required: true,
    trim: true
  }
});

// Schema for product relations
const ProductRelationSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  }
});

// Schema for team members
const TeamMemberSchema = new mongoose.Schema({
  photo: ImageSchema,
  name: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  }
});

// Schema for value cards
const ValueCardSchema = new mongoose.Schema({
  icon: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  }
});

// Schema for category items
const CategoryItemSchema = new mongoose.Schema({
  image: ImageSchema,
  label: {
    type: String,
    required: true,
    trim: true
  },
  collection_link: {
    type: String,
    required: true,
    trim: true
  }
});

// Base schema for modular blocks
const ModularBlockSchema = new mongoose.Schema({
  blockType: {
    type: String,
    required: true,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  }
}, { discriminatorKey: 'blockType', _id: false });

// Home Page Blocks

// Hero Section Block
const HeroSectionSchema = new mongoose.Schema({
  background_image: ImageSchema,
  headline: {
    type: String,
    required: true,
    trim: true
  },
  subheadline: {
    type: String,
    required: true,
    trim: true
  },
  cta_text: {
    type: String,
    required: true,
    trim: true
  },
  cta_link: {
    type: String,
    required: true,
    trim: true
  },
  overlay_style: {
    type: String,
    enum: ['light', 'dark'],
    default: 'dark'
  }
});

// Shop by Category Grid Block
const ShopByCategorySchema = new mongoose.Schema({
  categories: [CategoryItemSchema]
});

// Promotional Banner Block
const PromotionalBannerSchema = new mongoose.Schema({
  banner_image: ImageSchema,
  headline: {
    type: String,
    required: true,
    trim: true
  },
  subheadline: {
    type: String,
    required: true,
    trim: true
  },
  cta_text: {
    type: String,
    required: true,
    trim: true
  },
  cta_link: {
    type: String,
    required: true,
    trim: true
  },
  align: {
    type: String,
    enum: ['left', 'right'],
    default: 'left'
  }
});

// Watch and Buy Carousel Block
const WatchAndBuySchema = new mongoose.Schema({
  headline: {
    type: String,
    default: 'WATCH AND BUY',
    trim: true
  },
  products: [ProductRelationSchema]
});

// Featured Products Grid Block
const FeaturedProductsSchema = new mongoose.Schema({
  headline: {
    type: String,
    default: 'Featured Products',
    trim: true
  },
  products: [ProductRelationSchema]
});

// Newsletter Signup Strip Block
const NewsletterSignupSchema = new mongoose.Schema({
  headline: {
    type: String,
    required: true,
    trim: true
  },
  subtext: {
    type: String,
    required: true,
    trim: true
  }
});

// About Page Blocks

// Page Header Block
const PageHeaderSchema = new mongoose.Schema({
  headline: {
    type: String,
    required: true,
    trim: true
  },
  subheadline: {
    type: String,
    required: true,
    trim: true
  }
});

// Our Story Block
const OurStorySchema = new mongoose.Schema({
  rich_text_story: {
    type: String,
    required: true,
    trim: true
  },
  side_image: ImageSchema
});

// Our Values Cards Block
const OurValuesSchema = new mongoose.Schema({
  value_cards: [ValueCardSchema]
});

// Meet Our Team Grid Block
const MeetOurTeamSchema = new mongoose.Schema({
  team_members: [TeamMemberSchema]
});

// CTA Strip Block
const CTAStripSchema = new mongoose.Schema({
  headline: {
    type: String,
    required: true,
    trim: true
  },
  buttons: [ButtonSchema]
});

// Contact Page Blocks

// Contact Info Panel Block
const ContactInfoSchema = new mongoose.Schema({
  general_email: {
    type: String,
    required: true,
    trim: true
  },
  support_email: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  business_hours_weekday: {
    type: String,
    required: true,
    trim: true
  },
  business_hours_sat: {
    type: String,
    required: true,
    trim: true
  },
  address_line1: {
    type: String,
    required: true,
    trim: true
  },
  address_line2: {
    type: String,
    trim: true
  },
  address_line3: {
    type: String,
    trim: true
  },
  address_line4: {
    type: String,
    trim: true
  },
  map_embed: {
    type: String,
    trim: true
  }
});

// Enquiry Form Block
const EnquiryFormSchema = new mongoose.Schema({
  // This is just a placeholder as the form fields are handled in the frontend
  // and submissions are stored in the Enquiry model
  form_title: {
    type: String,
    default: 'Send us a message',
    trim: true
  }
});

// Social Links Row Block
const SocialLinksRowSchema = new mongoose.Schema({
  links: [SocialLinkSchema]
});

// Schema for Home Page
const HomePageSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Home Page',
    trim: true
  },
  slug: {
    type: String,
    default: 'home',
    unique: true,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  blocks: [
    {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  ],
  version: {
    type: Number,
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastAutosaved: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Schema for About Page
const AboutPageSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'About Page',
    trim: true
  },
  slug: {
    type: String,
    default: 'about',
    unique: true,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  blocks: [
    {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  ],
  version: {
    type: Number,
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastAutosaved: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Schema for Contact Page
const ContactPageSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Contact Page',
    trim: true
  },
  slug: {
    type: String,
    default: 'contact',
    unique: true,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  blocks: [
    {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  ],
  version: {
    type: Number,
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastAutosaved: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Schema for Enquiries
const EnquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  responseMessage: {
    type: String,
    trim: true,
    default: null
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'archived'],
    default: 'new'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Schema for Footer entity
const FooterSchema = new mongoose.Schema({
  // Brand Information
  brand_info: {
    name: {
      type: String,
      required: true,
      default: 'Beeget Fashion',
      trim: true
    },
    description: {
      type: String,
      required: true,
      default: 'Modern women\'s clothing and accessories. Premium fabrics, sustainable practices, and timeless designs—elegant, versatile, and made for you.',
      trim: true
    },
    logo_url: {
      type: String,
      trim: true
    },
    logo_alt: {
      type: String,
      trim: true
    },
    copyright_text: {
      type: String,
      default: '© 2023 Beeget Fashion. All rights reserved.',
      trim: true
    }
  },
  
  // Navigation Columns (replaces quickLinks and informationLinks)
  navigation_columns: [
    {
      title: {
        type: String,
        required: true,
        trim: true
      },
      links: [
        {
          text: {
            type: String,
            required: true,
            trim: true
          },
          url: {
            type: String,
            required: true,
            trim: true
          }
        }
      ]
    }
  ],
  
  // Social Links
  social_links: [SocialLinkSchema],
  
  // Newsletter Section
  newsletter: {
    enabled: {
      type: Boolean,
      default: true
    },
    headline: {
      type: String,
      default: 'Newsletter',
      trim: true
    },
    description: {
      type: String,
      default: 'Subscribe to our newsletter for updates on new arrivals, sales, and more.',
      trim: true
    },
    button_text: {
      type: String,
      default: 'Subscribe',
      trim: true
    },
    success_message: {
      type: String,
      default: 'Thank you for subscribing!',
      trim: true
    }
  },
  
  // Metadata
  updatedAt: {
    type: Date,
    default: Date.now
  },
  version: {
    type: Number,
    default: 1
  },
  lastAutosaved: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Create models
const HomePage = mongoose.model('HomePage', HomePageSchema);
const AboutPage = mongoose.model('AboutPage', AboutPageSchema);
const ContactPage = mongoose.model('ContactPage', ContactPageSchema);
const Enquiry = mongoose.model('Enquiry', EnquirySchema);
const Footer = mongoose.model('Footer', FooterSchema);

export { HomePage, AboutPage, ContactPage, Enquiry, Footer };