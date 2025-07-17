import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 1, 
    default: 1 
  },
  size: { 
    type: String, 
    default: null 
  },
  color: { 
    type: String, 
    default: null 
  },
  variantSku: { 
    type: String, 
    default: null 
  },
  gstRate: {
    type: Number,
    default: 0
  },
  // Store product details at the time of adding to cart
  productDetails: {
    title: String,
    price: Number,
    image: String,
    slug: String
  }
}, { timestamps: true });

const CartSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  items: [CartItemSchema],
  // For potential future features like saved for later
  savedItems: [CartItemSchema]
}, { timestamps: true });

// Create index for faster lookups
CartSchema.index({ userId: 1 });

export default mongoose.model('Cart', CartSchema);