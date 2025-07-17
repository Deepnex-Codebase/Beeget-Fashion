import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Types.ObjectId, 
    ref: 'Product',
    required: true,
    index: true
  },
  user: { 
    type: mongoose.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5
  },
  review: { 
    type: String, 
    required: true,
    trim: true
  },
  images: [String],
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

// Create compound index for user and product to ensure one review per user per product
ReviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Update the updatedAt field on save
ReviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Review = mongoose.model('Review', ReviewSchema);

export default Review;