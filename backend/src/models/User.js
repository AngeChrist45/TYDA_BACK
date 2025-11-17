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
    required: [true, 'Email requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Format email invalide']
  },
  phone: {
    type: String,
    required: [true, 'Téléphone requis'],
    unique: true,
    trim: true,
    match: [/^\+225[0-9]{8,10}$/, 'Format téléphone ivoirien invalide']
  },
  password: {
    type: String,
    required: [true, 'Mot de passe requis'],
    minlength: [6, 'Mot de passe trop court']
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
    description: {
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
    validatedAt: Date,
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  otpCode: String,
  otpExpires: Date,
  otpAttempts: {
    type: Number,
    default: 0
  },
  lastOTPRequest: Date,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.otpCode;
      delete ret.otpExpires;
      delete ret.otpAttempts;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      return ret;
    }
  }
});

userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1, accountStatus: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

userSchema.methods.isVerified = function() {
  return this.isEmailVerified && this.isPhoneVerified && this.accountStatus === 'active';
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
