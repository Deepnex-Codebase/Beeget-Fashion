import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  roles: { 
    type: [String], 
    enum: ['user', 'subadmin', 'admin'], 
    default: ['user'] 
  },
  whatsappNumber: { 
    type: String, 
    match: /^[6-9]\d{9}$/ 
  },
  otp: {
    code: String,
    expiresAt: Date
  },
  addresses: [{
    addressType: String,
    name: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    isDefault: Boolean
  }],
  wishlist: [{ 
    type: mongoose.Types.ObjectId, 
    ref: 'Product' 
  }],
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: function() {
      // Set default department to 'all' for subadmins
      return this.roles && this.roles.includes('subadmin') ? 'all' : '';
    }
  },
  permissions: {
    type: [String],
    default: function() {
      // Set default permissions to ['all_permissions'] for subadmins
      return this.roles && this.roles.includes('subadmin') ? ['all_permissions'] : [];
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

// Create index on email field
UserSchema.index({ email: 1 });

// Method to check if password is correct
UserSchema.methods.comparePassword = async function(candidatePassword) {
  console.log('DEBUG - comparePassword called:', {
    hasPasswordHash: !!this.passwordHash,
    passwordHashLength: this.passwordHash ? this.passwordHash.length : 0,
    candidatePasswordLength: candidatePassword ? candidatePassword.length : 0
  });
  
  const result = await bcrypt.compare(candidatePassword, this.passwordHash);
  console.log('DEBUG - comparePassword result:', result);
  return result;
};

// Pre-save hook to hash password
UserSchema.pre('save', async function(next) {
  console.log('DEBUG - User pre-save hook triggered:', {
    isModified: this.isModified('passwordHash'),
    isNew: this.isNew,
    hasPasswordHash: !!this.passwordHash
  });
  
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('passwordHash')) {
    console.log('DEBUG - Password not modified, skipping hash');
    return next();
  }

  try {
    console.log('DEBUG - Hashing password...');
    // Generate a salt
    const salt = await bcrypt.genSalt(12);
    // Hash the password using the salt
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    console.log('DEBUG - Password hashed successfully');
    next();
  } catch (error) {
    console.error('DEBUG - Error hashing password:', error);
    next(error);
  }
});

// Update the updatedAt field on save
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', UserSchema);

export default User;