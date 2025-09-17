import mongoose from 'mongoose';

const promoBannerSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Banner text is required'],
      trim: true,
    },
    link: {
      type: String,
      trim: true,
      default: null,
    },
    backgroundColor: {
      type: String,
      default: '#4299e1', // Default blue color
    },
    textColor: {
      type: String,
      default: '#ffffff', // Default white color
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null, // Null means no end date
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to ensure only one active banner at a time
promoBannerSchema.pre('save', async function (next) {
  // If this banner is being set to active
  if (this.isActive) {
    // Find all other active banners and deactivate them
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isActive: true },
      { isActive: false }
    );
  }
  next();
});

// Method to check if a banner is currently active based on dates
promoBannerSchema.methods.isCurrentlyActive = function () {
  const now = new Date();
  const isAfterStart = now >= this.startDate;
  const isBeforeEnd = this.endDate ? now <= this.endDate : true;
  
  return this.isActive && isAfterStart && isBeforeEnd;
};

// Static method to get the currently active banner
promoBannerSchema.statics.getActiveBanner = async function () {
  const now = new Date();
  
  return this.findOne({
    isActive: true,
    startDate: { $lte: now },
    $or: [
      { endDate: null },
      { endDate: { $gte: now } }
    ]
  });
};

const PromoBanner = mongoose.model('PromoBanner', promoBannerSchema);

export default PromoBanner;