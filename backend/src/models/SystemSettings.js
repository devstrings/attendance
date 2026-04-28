const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  workingHours: {
    officeStartTime: {
      type: String,
      default: '10:30'
    },
    lateEntryAfter: {
      type: String,
      default: '10:32'
    },
    officeEndTime: {
      type: String,
      default: '19:00'
    },
    breakMinutes: {
      type: Number,
      default: 60
    }
  },
  
  workingDays: {
    type: [String],
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  
  autoClockOut: {
    enabled: {
      type: Boolean,
      default: true
    },
    graceMinutes: {
      type: Number,
      default: 15 // Auto clock-out at 19:15 if office ends at 19:00
    }
  },
  
  leavePolicy: {
    allowedLeavesPerMonth: {
      type: Number,
      default: 2
    },
    autoMarkAbsent: {
      type: Boolean,
      default: true
    }
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
systemSettingsSchema.index({}, { unique: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);