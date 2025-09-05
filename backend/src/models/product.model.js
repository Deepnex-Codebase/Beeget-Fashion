import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  sku: { 
    type: String, 
    unique: true,
    required: true
  },
  sellingPrice: { 
    type: Number, 
    required: true,
    min: 0 
  },
  mrp: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  marketplacePrices: {
    meesho: { type: Number, min: 0 },
    wrongDefective: { type: Number, min: 0 }
  },
  stock: { 
    type: Number, 
    required: true,
    default: 0 
  },
  isInStock: {
    type: Boolean,
    default: true
  },

  // Size measurements
  bustSize: { type: Number, required: true, min: 0 },
  shoulderSize: { type: Number, required: true, min: 0 },
  waistSize: { type: Number, required: true, min: 0 },
  sizeLength: { type: Number, required: true, min: 0 },
  hipSize: { type: Number, min: 0 },

  // Extra attributes
  attributes: {
    type: Map,
    of: String
  },

  images: [String],

  // 🚀 Shiprocket Fields
  hsn: {
    type: String,
    required: true,
    default: '6204' // Ready-made garments
  },
  weight: {
    type: Number, // in kg
    required: true,
    default: 0.3
  },
  dimensions: {
    length: { type: Number, required: true, default: 30 },
    breadth: { type: Number, required: true, default: 25 },
    height: { type: Number, required: true, default: 2 }
  }
});

const ProductSchema = new mongoose.Schema(
  {
    // Basic
    title: { 
      type: String, 
      required: true 
    },
    description: String,

    category: { 
      type: mongoose.Types.ObjectId, 
      ref: 'Category',
      index: true 
    },

    // Product details
    color: String,
    colors: [String],
    comboOf: String,
    fabric: String,
    fitShape: String,
    length: String,
    neck: String,
    occasion: String,
    pattern: String,
    printType: String,
    sleeveType: String,
    stitchingType: String,
    countryOfOrigin: String,
    brand: String,
    embellishment: String,
    ornamentation: String,
    sleeveStyling: String,
    sleeveLength: String,
    stitchType: String,

    // Compliance / Legal
    importerDetails: String,
    manufacturerDetails: String,
    packerDetails: String,

    // Variants (sizes/colors with stock)
    variants: [variantSchema],

    // Media
    images: [String],
    primaryImage: { type: String },
    video: String,
    media_type: { 
      type: String,
      enum: ['image', 'video'],
      default: 'image'
    },

    // Tax
    gstRate: { 
      type: Number, 
      default: 0 
    },

    // Flags
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

// Indexes
ProductSchema.index({ 'variants.sku': 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ category: 1, 'variants.price': 1 });

// Auto update updatedAt
ProductSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Product = mongoose.model('Product', ProductSchema);

export default Product;
