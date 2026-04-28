const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  employeeEmail: {
    type: String,
    required: true
  },
  leaveType: {
    type: String,
    required: true,
    enum: ['sick', 'casual', 'annual', 'emergency', 'unpaid', 'other'],
    default: 'casual'
  },
  fromDate: {
    type: Date,
    required: true
  },
  toDate: {
    type: Date,
    required: true
  },
  numberOfDays: {
    type: Number,
    required: true,
    min: 0.5
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'approverModel'
  },
  approverModel: {
    type: String,
    enum: ['Admin', 'Manager']
  },
  approverName: {
    type: String
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  attachments: [{
    filename: String,
    path: String,
    uploadedAt: Date
  }],
  comments: [{
    by: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'comments.byModel'
    },
    byModel: {
      type: String,
      enum: ['Admin', 'Manager', 'Employee']
    },
    byName: String,
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
leaveRequestSchema.index({ employee: 1, status: 1, createdAt: -1 });
leaveRequestSchema.index({ status: 1, fromDate: 1 });
leaveRequestSchema.index({ fromDate: 1, toDate: 1 });

// Virtual for duration display
leaveRequestSchema.virtual('durationText').get(function() {
  if (this.numberOfDays === 1) {
    return '1 day';
  } else if (this.numberOfDays === 0.5) {
    return 'Half day';
  }
  return `${this.numberOfDays} days`;
});

// Method to calculate number of days
leaveRequestSchema.methods.calculateDays = function() {
  const oneDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round(Math.abs((this.toDate - this.fromDate) / oneDay)) + 1;
  return diffDays;
};

// Pre-save hook to auto-calculate days
leaveRequestSchema.pre('save', function(next) {
  if (this.isModified('fromDate') || this.isModified('toDate')) {
    if (!this.numberOfDays || this.numberOfDays === 0) {
      this.numberOfDays = this.calculateDays();
    }
  }
  next();
});

// Static method to get pending requests count
leaveRequestSchema.statics.getPendingCount = async function() {
  return await this.countDocuments({ status: 'pending' });
};

// Static method to get employee's leave balance
leaveRequestSchema.statics.getEmployeeLeaveStats = async function(employeeId, year) {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59);

  const approvedLeaves = await this.find({
    employee: employeeId,
    status: 'approved',
    fromDate: { $gte: startOfYear, $lte: endOfYear }
  });

  const totalDays = approvedLeaves.reduce((sum, leave) => sum + leave.numberOfDays, 0);

  return {
    totalApproved: approvedLeaves.length,
    totalDays: totalDays,
    year: year 
  };
};

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

module.exports = LeaveRequest;