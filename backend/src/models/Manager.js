const mongoose = require('mongoose');

const managerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
   companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: false,
    default: null
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  cnic: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  dateOfBirth: {
    type: Date
  },
  address: {
    type: String,
    default: ''
  },
  joiningDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  department: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  salary: {
    type: Number,
    default: 0
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountTitle: String,
    branchCode: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phoneNumber: String
  },
  employeesUnder: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }],
  profilePicture: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Remove CNIC unique index
managerSchema.index({ cnic: 1 }, { unique: false, sparse: true });
managerSchema.index({ companyId: 1 });   // ✅ NEW

// Virtual for full name
managerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

managerSchema.set('toJSON', { virtuals: true });
managerSchema.set('toObject', { virtuals: true });

const Manager = mongoose.model('Manager', managerSchema);

module.exports = Manager;
