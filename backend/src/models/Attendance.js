const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manager',
    required: true
  },
  date: { type: Date, required: true },
  clockIn:  { type: Date, required: true },
  clockOut: { type: Date },

  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'late', 'leave', 'on-leave', 'holiday'],
    default: 'present'
  },

  // ── Work Hours ──────────────────────────────────────────────────────────────
  workHours:     { type: Number, default: 0 },   // regular hours (max shiftHours)
  overtimeHours: { type: Number, default: 0 },   // hours beyond shift end

  // ── Overtime Request (employee submits, admin/manager approves) ─────────────
  overtimeMinutes:             { type: Number, default: 0, min: 0 },
  overtimeNote:                { type: String, default: '' },
  overtimeStatus:              { type: String, enum: ['none','pending','approved','rejected'], default: 'none' },
  overtimeRequestedByEmployee: { type: Boolean, default: false },
  overtimeRequestedAt:         { type: Date },
  overtimeApprovedBy:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  overtimeApprovedAt:          { type: Date },
  overtimeRejectionNote:       { type: String, default: '' },


  originalStatus:   { type: String, default: null },
      correctionReason: { type: String, default: '' },
      correctedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      correctedAt:      { type: Date, default: null },
  // ── Auto Checkout flag ──────────────────────────────────────────────────────
  autoCheckedOut: { type: Boolean, default: false },

  // ── Late / Early Leave ──────────────────────────────────────────────────────
  isLate:           { type: Boolean, default: false },
  lateMinutes:      { type: Number,  default: 0 },
  earlyLeave:       { type: Boolean, default: false },
  earlyLeaveMinutes:{ type: Number,  default: 0 },

  location: {
    clockInLocation:  { latitude: Number, longitude: Number, address: String },
    clockOutLocation: { latitude: Number, longitude: Number, address: String }
  },

  remarks:   { type: String, trim: true },
  markedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isApproved:{ type: Boolean, default: true },
  approvedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }

}, { timestamps: true });



// ── Indexes ──────────────────────────────────────────────────────────────────
attendanceSchema.index({ employeeId: 1, date: 1 });
attendanceSchema.index({ managerId: 1, date: 1 });
attendanceSchema.index({ overtimeStatus: 1 });

// ── Pre-save: calculate workHours + overtimeHours automatically ──────────────
attendanceSchema.pre('save', function (next) {
  if (this.clockIn && this.clockOut) {
    const diffMs = this.clockOut - this.clockIn;
    const totalHours = diffMs / (1000 * 60 * 60);

    // Standard shift = 9 hours (10 AM – 7 PM), break already excluded by autoCheckout
    const standardShiftHours = 9;

    if (totalHours > standardShiftHours) {
      this.workHours     = parseFloat(standardShiftHours.toFixed(2));
      this.overtimeHours = parseFloat((totalHours - standardShiftHours).toFixed(2));
    } else {
      this.workHours     = parseFloat(Math.max(0, totalHours).toFixed(2));
      this.overtimeHours = 0;
    }
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);