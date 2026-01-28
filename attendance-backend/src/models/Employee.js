const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // ✅ CRITICAL: Manager reference
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manager',
    required: false // Optional - employee can exist without manager temporarily
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
  employeeCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  cnic: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null/empty values
    trim: true,
    default: null // Use null instead of empty string
  },
  dateOfBirth: {
    type: Date
  },
  address: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    required: true,
    default: 'General'
  },
  designation: {
    type: String,
    required: true,
    default: 'Employee'
  },
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'intern'],
    default: 'full-time'
  },
  joiningDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  salary: {
    type: Number,
    default: 0
  },
  workSchedule: {
    shiftStartTime: {
      type: String,
      default: '09:00'
    },
    shiftEndTime: {
      type: String,
      default: '17:00'
    },
    workingDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    }
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
  profilePicture: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Attendance tracking
  totalPresent: {
    type: Number,
    default: 0
  },
  totalAbsent: {
    type: Number,
    default: 0
  },
  totalLate: {
    type: Number,
    default: 0
  },
  totalLeaves: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// ✅ Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// ✅ Indexes for better performance
employeeSchema.index({ employeeCode: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ managerId: 1 });
employeeSchema.index({ userId: 1 });

// ✅ Enable virtuals in JSON/Object
employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

// ✅ Pre-remove hook - cleanup when employee is deleted
employeeSchema.pre('remove', async function(next) {
  try {
    // Remove employee from manager's employeesUnder array
    if (this.managerId) {
      const Manager = mongoose.model('Manager');
      await Manager.findByIdAndUpdate(
        this.managerId,
        { $pull: { employeesUnder: this._id } }
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Employee', employeeSchema);

