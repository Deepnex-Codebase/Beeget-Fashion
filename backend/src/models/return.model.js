import mongoose from 'mongoose';

const ReturnSchema = new mongoose.Schema({
  orderId: { 
    type: mongoose.Types.ObjectId, 
    ref: 'Order',
    required: true
  },
  userId: { 
    type: mongoose.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  items: [{
    productId: { 
      type: mongoose.Types.ObjectId, 
      ref: 'Product', 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true, 
      min: 1 
    },
    reason: { 
      type: String, 
      required: true,
      enum: ['wrong_item', 'defective', 'not_as_described', 'size_issue', 'quality_issue', 'changed_mind', 'other']
    },
    description: { 
      type: String 
    }
  }],
  returnStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'completed'], 
    default: 'pending' 
  },
  refundStatus: { 
    type: String, 
    enum: ['pending', 'processed', 'failed'], 
    default: 'pending' 
  },
  refundAmount: { 
    type: Number, 
    default: 0 
  },
  trackingInfo: {
    carrier: String,
    trackingNumber: String,
    returnLabel: String
  },
  adminNotes: String,
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

export default mongoose.model('Return', ReturnSchema);