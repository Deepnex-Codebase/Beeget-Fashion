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
  variants: [{
    sku: { 
      type: String, 
      unique: true 
    },
    price: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    stock: { 
      type: Number, 
      default: 0 
    },
    attributes: {
      type: Map,
      of: String
    }
  }],
  images: [String],
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