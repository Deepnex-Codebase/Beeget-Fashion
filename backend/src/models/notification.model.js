import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  message: { 
    type: String,
    required: true,
    trim: true
  },
  type: { 
    type: String, 
    enum: ['update', 'sale', 'new_product', 'promotion', 'other'],
    default: 'update'
  },
  link: { 
    type: String,
    trim: true
  },
  image: { 
    type: String,
    trim: true
  },
  promotionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Promotion',
    required: function() {
      return this.type === 'promotion';
    }
  },
  read: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;