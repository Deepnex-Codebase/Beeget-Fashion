import mongoose from 'mongoose';

const wishlistItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  productDetails: {
    title: String,
    price: Number,
    image: String,
    slug: String,
    hasStock: Boolean,
    variantCount: Number,
    salePrice: Number
  }
}, { _id: true });

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [wishlistItemSchema]
}, { timestamps: true });

// Create index for faster lookups
wishlistSchema.index({ userId: 1 });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;