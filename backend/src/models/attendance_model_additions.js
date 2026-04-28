// ============================================================
// 📦 ATTENDANCE MODEL — in fields ko existing schema mein add karo
// attendance.model.js (ya Attendance.js) mein existing fields ke baad paste karo
// ============================================================

// Existing fields ke baad yeh overtime fields add karo:

/*
  // ─── OVERTIME FIELDS ──────────────────────────────────────────
  overtimeMinutes: {
    type: Number,
    default: 0,
    min: 0
  },
  overtimeHours: {
    type: Number,
    default: 0,
    min: 0
  },
  overtimeNote: {
    type: String,
    default: ''
  },
  overtimeStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  overtimeRequestedByEmployee: {
    type: Boolean,
    default: false
  },
  overtimeRequestedAt: {
    type: Date
  },
  overtimeApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'overtimeApproverModel',
    default: null
  },
  overtimeApproverModel: {
    type: String,
    enum: ['User', 'Manager'],
    default: 'User'
  },
  overtimeApprovedAt: {
    type: Date
  },
  overtimeRejectionNote: {
    type: String,
    default: ''
  },
  // ─────────────────────────────────────────────────────────────
*/

// Agar tumhara Attendance model mein workHours field nahi hai to yeh bhi add karo:
/*
  workHours: {
    type: Number,
    default: 0
  },
*/

// ─── AUTO CALCULATE workHours + overtimeHours on save ────────────────
// Attendance model ke pre-save middleware mein (ya existing middleware mein) add karo:

/*
attendanceSchema.pre('save', function(next) {
  // Work hours calculate (clockIn to clockOut)
  if (this.clockIn && this.clockOut) {
    const diffMs = new Date(this.clockOut) - new Date(this.clockIn);
    const diffHours = diffMs / (1000 * 60 * 60);
    this.workHours = parseFloat(diffHours.toFixed(2));

    // Standard shift: 8.5 hours (10:30 AM - 7:00 PM)
    // Overtime = clockOut ke baad 7:30 PM (auto checkout) se zyada time
    // Agar overtimeMinutes manually set nahi hua aur clockOut 7:30 PM se baad hai
    if (this.overtimeStatus === 'none') {
      const clockOutTime = new Date(this.clockOut);
      const autoCheckoutHour = 19; // 7:00 PM
      const autoCheckoutMinute = 30; // 7:30 PM

      const shiftEndMs = new Date(clockOutTime);
      shiftEndMs.setHours(autoCheckoutHour, autoCheckoutMinute, 0, 0);

      if (clockOutTime > shiftEndMs) {
        // Extra time calculate but don't auto-approve — just record
        const extraMs = clockOutTime - shiftEndMs;
        const extraMins = Math.floor(extraMs / (1000 * 60));
        // Note: overtimeStatus 'none' hi rahega jab tak manually set na ho
        // Employee request karega ya admin set karega
      }
    }
  }
  next();
});
*/