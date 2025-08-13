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
    mrp: Number,
    image: String,
    slug: String
  }
}, { timestamps: true });

const CartSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Types.ObjectId, 
    ref: 'User', 
    index: true
  },
  guestSessionId: {
    type: String,
    index: true
  },
  items: [CartItemSchema],
  // For potential future features like saved for later
  savedItems: [CartItemSchema],
  // Coupon related fields
  coupon: {
    type: String,
    default: null
  },
  couponDiscount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Ensure either userId or guestSessionId is provided
CartSchema.pre('save', function(next) {
  if (!this.userId && !this.guestSessionId) {
    next(new Error('Either userId or guestSessionId must be provided'));
  } else {
    next();
  }
});

// Create index for faster lookups
CartSchema.index({ userId: 1 });

export default mongoose.model('Cart', CartSchema);