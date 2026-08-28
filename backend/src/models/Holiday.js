const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    default: ''
  },
 createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // ✅ NEW — Multi-tenant isolation
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: false,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
holidaySchema.index({ year: 1, month: 1 });
holidaySchema.index({ date: 1 });
holidaySchema.index({ companyId: 1 });   // ✅ NEW

module.exports = mongoose.model('Holiday', holidaySchema);