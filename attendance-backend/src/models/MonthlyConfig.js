const mongoose = require('mongoose');

const monthlyConfigSchema = new mongoose.Schema({
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  workingDays: {
    type: Number,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  holidays: {
    type: Number,
    default: 0
  },
  weekends: {
    type: Number,
    default: 0
  },
  standardWorkHours: {
    type: Number,
    default: 8
  },
  overtimeRate: {
    type: Number,
    default: 1.5
  },
  lateArrivalGracePeriod: {
    type: Number,
    default: 15 // minutes
  },
  halfDayThreshold: {
    type: Number,
    default: 4 // hours
  },
  salaryProcessingDate: {
    type: Date
  },
  isSalaryProcessed: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Unique index for month-year combination
monthlyConfigSchema.index({ month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('MonthlyConfig', monthlyConfigSchema);