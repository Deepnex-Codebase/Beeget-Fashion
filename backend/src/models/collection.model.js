import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const CollectionSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  image: { 
    type: String
  },
  active: { 
    type: Boolean, 
    default: true 
  },
  order: { 
    type: Number, 
    default: 0 
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  products: [{ 
    type: mongoose.Types.ObjectId, 
    ref: 'Product'
  }]
}, {
  timestamps: true
});

// Method to check if collection is currently active
CollectionSchema.methods.isActive = function() {
  if (!this.active) return false;
  
  const now = new Date();
  if (this.startDate && this.startDate > now) return false;
  if (this.endDate && this.endDate < now) return false;
  
  return true;
};

// Add pre-save hook for logging
CollectionSchema.pre('save', function(next) {
  try {
    logger.info(`Saving collection: ${this._id}, Name: ${this.name}`);
    logger.info(`Collection products: ${JSON.stringify(this.products)}`);
    next();
  } catch (error) {
    logger.error(`Error in collection pre-save hook: ${error.message}`);
    next(error);
  }
});

const Collection = mongoose.model('Collection', CollectionSchema);

export default Collection;