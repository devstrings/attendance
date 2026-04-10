const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    enum: ['admin', 'manager', 'employee'],
    required: true
  },
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('✅ Password hashed successfully');
    next();
  } catch (error) {
    console.error('❌ Password hashing error:', error);
    next(error);
  }
});

// ✅ FIXED: Compare password method with debug logs
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('🔐 Comparing passwords...');
    console.log('📝 Candidate password:', candidatePassword);
    console.log('📝 Candidate password length:', candidatePassword.length);
    console.log('📝 Stored hash:', this.password ? this.password.substring(0, 30) + '...' : 'MISSING');
    console.log('📝 Stored hash exists:', !!this.password);
    
    if (!this.password) {
      console.error('❌ Password field is MISSING from user object!');
      return false;
    }
    
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    
    console.log('✅ Password comparison result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('❌ Password comparison error:', error);
    return false;
  }
};

// Hide password in JSON responses
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpires;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);