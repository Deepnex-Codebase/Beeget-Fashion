import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  order_id: {
    type: String,
    unique: true
  },
  userId: { 
    type: mongoose.Types.ObjectId, 
    ref: 'User' 
  },
  guestSessionId: String,
  items: [{
    productId: { 
      type: mongoose.Types.ObjectId, 
      ref: 'Product', 
      required: true 
    },
    variantSku: { 
      type: String, 
      required: true 
    },
    qty: { 
      type: Number, 
      required: true, 
      min: 1 
    },
    mrp: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    gstRate: Number,
    gstAmount: Number,
    totalPrice: Number
  }],
  shipping: {
    address: {
      type: Object,
      required: true
    },
    courier: String,
    trackingId: String,
    shipmentId: String  // Added shipmentId field to store ShipRocket shipment ID
  },
  payment: {
    method: { 
      type: String, 
      enum: ['COD', 'ONLINE', 'CASHFREE'], 
      required: true 
    },
    cfOrderId: String,
    status: { 
      type: String, 
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'], 
      default: 'PENDING' 
    }
  },
  // Add coupon field
  coupon: {
    code: String,
    discountType: String,
    value: Number,
    discount: Number
  },
  subtotal: Number,
  discount: Number,
  total: Number,
  totalGST: Number,
  status: {
    type: String,
    enum: ['CREATED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'PAYMENT_FAILED', 'STOCK_ISSUE'],
    default: 'CREATED'
  },
  statusHistory: [{
    status: { 
      type: String, 
      required: true 
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    },
    note: String
  }],
  returnRequest: {
    reason: String,
    images: [String],
    status: { 
      type: String, 
      enum: ['REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED'] 
    }
  },
  exchangeRequest: {
    newVariant: String,
    status: { 
      type: String, 
      enum: ['REQUESTED', 'APPROVED', 'COMPLETED'] 
    }
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
OrderSchema.index({ userId: 1 });
OrderSchema.index({ 'shipping.trackingId': 1 });
OrderSchema.index({ userId: 1, 'shipping.trackingId': 1 });
OrderSchema.index({ 'statusHistory.timestamp': 1 });
OrderSchema.index({ 'returnRequest.status': 1 });
OrderSchema.index({ 'exchangeRequest.status': 1 });

// Update the updatedAt field on save
OrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add a status to the status history when status changes
OrderSchema.pre('save', function(next) {
  const currentStatus = this.statusHistory && this.statusHistory.length > 0 
    ? this.statusHistory[this.statusHistory.length - 1].status 
    : null;
  
  // If this is a new order or status has changed, add to history
  if (!currentStatus || (this.isModified('statusHistory') && this.statusHistory.length > 0 && 
      this.statusHistory[this.statusHistory.length - 1].status !== currentStatus)) {
    this.statusHistory.push({
      status: this.statusHistory[this.statusHistory.length - 1].status,
      timestamp: Date.now()
    });
  }
  
  next();
});

const Order = mongoose.model('Order', OrderSchema);

export default Order;