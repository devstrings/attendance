const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
   companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: false,
    default: null
  },
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
  basicSalary: {
    type: Number,
    required: true
  },
  allowances: {
    houseRent: {
      type: Number,
      default: 0
    },
    transport: {
      type: Number,
      default: 0
    },
    medical: {
      type: Number,
      default: 0
    },
    other: {
      type: Number,
      default: 0
    }
  },
  deductions: {
    tax: {
      type: Number,
      default: 0
    },
    insurance: {
      type: Number,
      default: 0
    },
    providentFund: {
      type: Number,
      default: 0
    },
    lateDeductions: {
      type: Number,
      default: 0
    },
    absentDeductions: {
      type: Number,
      default: 0
    },
    other: {
      type: Number,
      default: 0
    }
  },
  overtime: {
    hours: {
      type: Number,
      default: 0
    },
    amount: {
      type: Number,
      default: 0
    }
  },
  attendance: {
    totalDays: {
      type: Number,
      required: true
    },
    presentDays: {
      type: Number,
      required: true
    },
    absentDays: {
      type: Number,
      default: 0
    },
    lateDays: {
      type: Number,
      default: 0
    },
    halfDays: {
      type: Number,
      default: 0
    },
    leaves: {
      type: Number,
      default: 0
    }
  },
  grossSalary: {
    type: Number,
    required: true
  },
  totalDeductions: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processed', 'paid', 'on-hold'],
    default: 'pending'
  },
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['bank-transfer', 'cash', 'cheque'],
    default: 'bank-transfer'
  },
  remarks: {
    type: String,
    trim: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
salarySchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });
salarySchema.index({ companyId: 1 });   // ✅ NEW

// Calculate totals before saving
salarySchema.pre('save', function(next) {
  // Calculate gross salary
  const totalAllowances = 
    (this.allowances.houseRent || 0) +
    (this.allowances.transport || 0) +
    (this.allowances.medical || 0) +
    (this.allowances.other || 0);
  
  this.grossSalary = this.basicSalary + totalAllowances + (this.overtime.amount || 0);
  
  // Calculate total deductions
  this.totalDeductions = 
    (this.deductions.tax || 0) +
    (this.deductions.insurance || 0) +
    (this.deductions.providentFund || 0) +
    (this.deductions.lateDeductions || 0) +
    (this.deductions.absentDeductions || 0) +
    (this.deductions.other || 0);
  
  // Calculate net salary
  this.netSalary = this.grossSalary - this.totalDeductions;
  
  next();
});

module.exports = mongoose.model('Salary', salarySchema);