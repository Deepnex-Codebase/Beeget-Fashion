import mongoose from 'mongoose';

const PromotionSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  discountType: { 
    type: String, 
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: { 
    type: Number, 
    required: true,
    min: 0
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  active: { 
    type: Boolean, 
    default: true 
  },
  promotionType: { 
    type: String, 
    enum: ['general', 'coupon'],
    default: 'general'
  },
  couponPrefix: { 
    type: String,
    default: 'BG'
  },
  couponLength: { 
    type: Number, 
    default: 8
  },
  couponExpireDays: { 
    type: Number, 
    default: 30
  },
  minOrderAmount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  maxUsageCount: { 
    type: Number, 
    default: 1
  },
  image: { 
    type: String
  }
}, { timestamps: true });

// Check if promotion is currently active
PromotionSchema.methods.isActive = function() {
  if (!this.active) return false;
  
  const now = new Date();
  if (this.startDate > now) return false;
  if (this.endDate < now) return false;
  
  return true;
};

const Promotion = mongoose.model('Promotion', PromotionSchema);

export default Promotion;