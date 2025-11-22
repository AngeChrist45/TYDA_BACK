const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true,
    minlength: [2, 'Le prénom doit faire au moins 2 caractères']
  },
  lastName: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    minlength: [2, 'Le nom doit faire au moins 2 caractères']
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Format email invalide']
  },
  phone: {
    type: String,
    required: [true, 'Numéro de téléphone requis'],
    unique: true,
    trim: true,
    match: [/^\+225[0-9]{8,10}$/, 'Format téléphone ivoirien invalide (+225XXXXXXXX)']
  },
  pin: {
    type: String,
    required: [true, 'Code PIN requis'],
    minlength: [4, 'Le PIN doit faire au moins 4 chiffres'],
    maxlength: [60, 'PIN invalide'] // 60 pour le hash bcrypt
  },
  address: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['client', 'vendeur', 'admin'],
    default: 'client'
  },
  accountStatus: {
    type: String,
    enum: ['pending_verification', 'active', 'suspended', 'deleted'],
    default: 'pending_verification'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  vendorInfo: {
    businessName: {
      type: String,
      trim: true
    },
    businessDescription: {
      type: String,
      trim: true
    },
    businessAddress: {
      type: String,
      trim: true
    },
    fullName: {
      type: String,
      trim: true
    },
    photo: {
      type: String,
      trim: true
    },
    identityDocument: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      enum: ['alimentation', 'vetements', 'electronique', 'maison', 'services', 'autres']
    },
    validationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectionReason: {
      type: String,
      trim: true
    },
    requestedAt: Date,
    validatedAt: Date,
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  notifications: [{
    type: {
      type: String,
      enum: ['vendor_approved', 'vendor_rejected', 'product_approved', 'product_rejected', 'order_update', 'system'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    data: mongoose.Schema.Types.Mixed
  }],
  otpCode: String,
  otpExpires: Date,
  otpAttempts: {
    type: Number,
    default: 0
  },
  lastOTPRequest: Date,
  lastLogin: Date,
  pinAttempts: {
    type: Number,
    default: 0
  },
  pinLockedUntil: Date,
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.pin;
      delete ret.otpCode;
      delete ret.otpExpires;
      delete ret.otpAttempts;
      delete ret.pinAttempts;
      delete ret.pinLockedUntil;
      return ret;
    }
  }
});

userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1, accountStatus: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('pin')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.pin = await bcrypt.hash(this.pin, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePin = async function(candidatePin) {
  try {
    return await bcrypt.compare(candidatePin, this.pin);
  } catch (error) {
    throw error;
  }
};

userSchema.methods.isPinLocked = function() {
  return !!(this.pinLockedUntil && this.pinLockedUntil > Date.now());
};

userSchema.methods.incPinAttempts = function() {
  if (this.pinLockedUntil && this.pinLockedUntil < Date.now()) {
    return this.updateOne({
      $unset: { pinLockedUntil: 1 },
      $set: { pinAttempts: 1 }
    });
  }
  
  const updates = { $inc: { pinAttempts: 1 } };
  
  if (this.pinAttempts + 1 >= 5 && !this.isPinLocked()) {
    updates.$set = { pinLockedUntil: Date.now() + 15 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetPinAttempts = function() {
  return this.updateOne({
    $unset: { pinAttempts: 1, pinLockedUntil: 1 }
  });
};

userSchema.methods.isVerified = function() {
  return this.isPhoneVerified && this.accountStatus === 'active';
};

userSchema.methods.canSell = function() {
  return this.role === 'vendeur' && 
         this.isVerified() && 
         this.vendorInfo && 
         this.vendorInfo.validationStatus === 'approved';
};

userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

const User = mongoose.model('User', userSchema);

module.exports = User;
