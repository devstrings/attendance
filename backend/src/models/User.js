const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Worker ko jo permissions di ja sakti hain (superadmin panel ke hisaab se)
const WORKER_PERMISSIONS = [
  'companies:view',     // companies, company admins ki list dekhna
  'usage:view',         // platform usage snapshot
  'auditlogs:view',     // audit logs dekhna
  'companies:suspend'   // company suspend / activate karna
];

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    default: '',
    trim: true
  },
  phoneNumber: {
    type: String,
    default: '',
    trim: true
  },
  address: {
    type: String,
    default: '',
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'worker', 'admin', 'manager', 'employee'],
    required: true
  },

  // Worker ki permissions (sirf role 'worker' ke liye use hogi)
  permissions: {
    type: [{ type: String, enum: WORKER_PERMISSIONS }],
    default: []
  },

  // Multi-tenant support
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: false,
    default: null
  },

  // Aik user ki multiple companies
  companies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }],

  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  otp: String,
  otpExpires: Date,
  profilePicture: { type: String, default: null },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('❌ Password comparison error:', error.message);
    return false;
  }
};

// Hide sensitive fields in JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpires;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

userSchema.index({ email: 1, companyId: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
module.exports.WORKER_PERMISSIONS = WORKER_PERMISSIONS;