const mongoose = require('mongoose');

const correctionRequestSchema = new mongoose.Schema({
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
  attendanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance'
  },
  attendanceDate: {
    type: Date,
    required: true
  },
  currentStatus: {
    type: String,
    required: true,
    enum: ['present', 'absent', 'late', 'half-day', 'leave', 'holiday']
  },
  requestedStatus: {
    type: String,
    required: true,
    enum: ['present', 'absent', 'late', 'half-day', 'leave']
  },
  currentClockIn: {
    type: String
  },
  currentClockOut: {
    type: String
  },
  requestedClockIn: {
    type: String
  },
  requestedClockOut: {
    type: String
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  issueType: {
    type: String,
    required: true,
    enum: [
      'wrong_status',
      'missed_clock_in',
      'missed_clock_out',
      'wrong_time',
      'technical_issue',
      'other'
    ]
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'resolved'],
    default: 'pending'
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolverModel: {
    type: String,
    enum: ['Admin', 'Manager', 'User']
  },
  resolverName: {
    type: String
  },
  resolvedAt: {
    type: Date
  },
  resolution: {
    type: String,
    trim: true,
    maxlength: 500
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  evidence: [{
    type: {
      type: String,
      enum: ['image', 'document', 'screenshot']
    },
    filename: String,
    path: String,
    uploadedAt: Date,
    description: String
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes
correctionRequestSchema.index({ employee: 1, status: 1, createdAt: -1 });
correctionRequestSchema.index({ attendanceDate: 1, status: 1 });
correctionRequestSchema.index({ status: 1, priority: 1 });

// Virtual for formatted attendance date
correctionRequestSchema.virtual('formattedAttendanceDate').get(function() {
  return this.attendanceDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Method to check if request is overdue
correctionRequestSchema.methods.isOverdue = function() {
  if (this.status !== 'pending') return false;
  const daysSinceCreation = Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
  return daysSinceCreation > 3; // Consider overdue after 3 days
};

// Static method to get pending count
correctionRequestSchema.statics.getPendingCount = async function() {
  return await this.countDocuments({ status: 'pending' });
};

// Static method to get overdue requests
correctionRequestSchema.statics.getOverdueRequests = async function() {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  return await this.find({
    status: 'pending',
    createdAt: { $lt: threeDaysAgo }
  }).populate('employee', 'name email');
};

// Static method to get employee's correction history
correctionRequestSchema.statics.getEmployeeCorrectionStats = async function(employeeId) {
  const total = await this.countDocuments({ employee: employeeId });
  const pending = await this.countDocuments({ employee: employeeId, status: 'pending' });
  const approved = await this.countDocuments({ employee: employeeId, status: 'approved' });
  const rejected = await this.countDocuments({ employee: employeeId, status: 'rejected' });

  return {
    total,
    pending,
    approved,
    rejected,
    approvalRate: total > 0 ? ((approved / total) * 100).toFixed(2) : 0
  };
};

const CorrectionRequest = mongoose.model('CorrectionRequest', correctionRequestSchema);

module.exports = CorrectionRequest;