import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
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
  // Product detail fields
  color: String, // Single color (for backward compatibility)
  colors: [String], // Multiple colors
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
  importerDetails: String,
  sleeveLength: String,
  stitchType: String,
  manufacturerDetails: String,
  packerDetails: String,
  variants: [{
    sku: { 
      type: String, 
      sparse: true,
      unique: true 
    },
    price: { 
      type: Number, 
      min: 0 
    },
    meeshoPrice: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    wrongDefectivePrice: { 
      type: Number, 
      min: 0 
    },
    mrp: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    stock: { 
      type: Number, 
      default: 0 
    },
    bustSize: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    shoulderSize: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    waistSize: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    sizeLength: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    hipSize: { 
      type: Number, 
      min: 0 
    },
    attributes: {
      type: Map,
      of: String
    },
    images: [String],
  }],
  images: [String],
  video: String, // Add video field for product
  media_type: { // Field to determine if main media is video or image
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  gstRate: { 
    type: Number, 
    default: 0 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Create indexes
ProductSchema.index({ 'variants.sku': 1 });
ProductSchema.index({ category: 1 });
// Compound index for price filtering
ProductSchema.index({ category: 1, 'variants.price': 1 });

// Update the updatedAt field on save
ProductSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Product = mongoose.model('Product', ProductSchema);

export default Product;