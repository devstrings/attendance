const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  // ✅ Short unique code, e.g. "ABC01" — used for login identification
  companyCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  // ✅ URL-friendly identifier, e.g. "abc-traders" — used for subdomain routing later
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  logo: {
    type: String,
    default: null
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  address: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    default: ''
  },
  timezone: {
    type: String,
    default: 'Asia/Karachi'
  },
  subscriptionPlan: {
    type: String,
    enum: ['trial', 'basic', 'standard', 'premium', 'enterprise'],
    default: 'trial'
  },
  subscriptionExpiry: {
    type: Date,
    default: null
  },
  // ✅ Distinct from Company.isActive — lets Super Admin suspend a company
  // without deleting or reusing the generic "isActive" pattern used on User.
  isActive: {
    type: Boolean,
    default: true
  },
  suspendedAt: {
    type: Date,
    default: null
  },
  suspensionReason: {
    type: String,
    default: null
  },
  // ✅ Who created this company (Super Admin's User._id)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

companySchema.index({ companyCode: 1 });
companySchema.index({ slug: 1 });
companySchema.index({ isActive: 1 });

module.exports = mongoose.model('Company', companySchema);