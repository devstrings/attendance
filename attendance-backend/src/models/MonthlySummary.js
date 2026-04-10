const mongoose = require('mongoose');

const monthlySummarySchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  month: { type: Number, required: true },   // 1-12
  year:  { type: Number, required: true },

  totalWorkingDays:          { type: Number, default: 0 },
  totalPresent:              { type: Number, default: 0 },
  totalApprovedLeaves:       { type: Number, default: 0 },
  totalUnauthorizedAbsences: { type: Number, default: 0 },

  deductionPerAbsence: { type: Number, default: 500 },
  totalDeduction:      { type: Number, default: 0 },
  totalOvertimeHours:        { type: Number, default: 0 },
absencesCoveredByOvertime: { type: Number, default: 0 },

  baseSalary:  { type: Number, default: 0 },
  netSalary:   { type: Number, default: 0 },

  salarySlipGenerated: { type: Boolean, default: false },
  emailSentLastDay:    { type: Boolean, default: false },
  emailSentFirstDay:   { type: Boolean, default: false },

  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Ek employee ka ek month mein sirf ek summary hogi
monthlySummarySchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('MonthlySummary', monthlySummarySchema);