import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
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
  parent: { 
    type: mongoose.Types.ObjectId, 
    ref: 'Category',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for child categories
CategorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Pre-find middleware to populate children
CategorySchema.pre(/^find/, function(next) {
  this.populate({
    path: 'children',
    select: 'name description image active order'
  });
  next();
});

const Category = mongoose.model('Category', CategorySchema);

export default Category;