import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: { 
    type: String, 
    enum: ['percent', 'fixed'],
    required: true
  },
  value: { 
    type: Number, 
    required: true,
    min: 0
  },
  minOrderValue: { 
    type: Number, 
    default: 0,
    min: 0
  },
  usageLimit: { 
    type: Number, 
    default: null
  },
  usedCount: { 
    type: Number, 
    default: 0 
  },
  validFrom: { 
    type: Date, 
    default: Date.now 
  },
  validUntil: { 
    type: Date, 
    required: true 
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
CouponSchema.index({ code: 1 });
CouponSchema.index({ validUntil: 1 });

// Method to check if coupon is valid
CouponSchema.methods.isValid = function(orderValue) {
  const now = new Date();
  
  // Check if coupon is expired
  if (now > this.validUntil || now < this.validFrom) {
    return { 
      valid: false, 
      reason: 'COUPON_EXPIRED',
      message: 'This coupon has expired or is not yet active'
    };
  }
  
  // Check if coupon has reached usage limit
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) {
    return { 
      valid: false, 
      reason: 'COUPON_USAGE_EXCEEDED',
      message: 'This coupon has reached its maximum usage limit'
    };
  }
  
  // Check if order meets minimum value requirement
  // This ensures that when orderValue equals or exceeds minOrderValue, the coupon is valid
  if (Number(orderValue) < Number(this.minOrderValue)) {
    return { 
      valid: false, 
      reason: 'ORDER_VALUE_TOO_LOW', 
      minOrderValue: this.minOrderValue,
      message: `Minimum purchase of ₹${this.minOrderValue} required for this coupon`
    };
  }
  
  // Calculate discount amount
  let discountAmount = 0;
  if (this.discountType === 'percent') {
    discountAmount = (orderValue * this.value) / 100;
  } else { // fixed discount
    discountAmount = this.value;
  }
  
  return { 
    valid: true, 
    discountAmount,
    discountType: this.discountType,
    value: this.value
  };
};

// Update the updatedAt field on save
CouponSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Coupon = mongoose.model('Coupon', CouponSchema);

export default Coupon;