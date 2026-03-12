const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  workingDays: { type: [String], default: ['Monday','Tuesday','Wednesday','Thursday','Friday'] },
  workingHours: {
    startTime: { type: String, default: '10:00' },
    endTime: { type: String, default: '19:00' },
    lateEntryTime: { type: String, default: '10:30' }
  },
  breakTime: { type: Number, default: 60 },
  leavePolicy: {
    allowedLeaves: { type: Number, default: 2 },
    autoAbsentOnExceed: { type: Boolean, default: true }
  },
  weekendDays: { type: [String], default: ['Saturday','Sunday'] },
  isActive: { type: Boolean, default: true },
  effectiveFrom: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('SystemConfig', systemConfigSchema);