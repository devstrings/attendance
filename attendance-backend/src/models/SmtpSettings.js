const mongoose = require('mongoose');

const smtpSettingsSchema = new mongoose.Schema({
  isActive:    { type: Boolean, default: true },
  host:        { type: String, default: '' },
  port:        { type: Number, default: 587 },
  secure:      { type: Boolean, default: false },
  encryption:  { type: String, enum: ['TLS', 'SSL', 'NONE'], default: 'TLS' },
  username:    { type: String, default: '' },
  password:    { type: String, default: '' },
  fromAddress: { type: String, default: '' },
  fromName:    { type: String, default: 'Attendance System' },
  replyTo:     { type: String, default: '' },
  notificationEmail: { type: String, default: '' },

  // Notification toggles
  enableLeaveNotifications:       { type: Boolean, default: true },
  enableCorrectionNotifications:  { type: Boolean, default: true },
  enableSystemNotifications:      { type: Boolean, default: true },
  enableAttendanceNotifications:  { type: Boolean, default: false },

  // Stats
  totalEmailsSent:  { type: Number, default: 0 },
  lastEmailSentAt:  { type: Date },
  lastTestedAt:     { type: Date },
  lastTestStatus:   { type: String, enum: ['success', 'failed', null], default: null },
  lastTestError:    { type: String, default: '' },
  updatedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// ── Static: get active settings ──
smtpSettingsSchema.statics.getActiveSettings = async function () {
  // First try DB
  const dbSettings = await this.findOne({ isActive: true }).sort({ updatedAt: -1 });
  if (dbSettings && dbSettings.host && dbSettings.username && dbSettings.password) {
    return dbSettings;
  }

  // ✅ Fallback: use .env variables
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    console.log('📧 Using SMTP settings from .env');
    // Return a mock object that has required methods
    return {
      host:        process.env.EMAIL_HOST,
      port:        parseInt(process.env.EMAIL_PORT) || 587,
      secure:      process.env.EMAIL_PORT === '465',
      username:    process.env.EMAIL_USER,
      password:    process.env.EMAIL_PASSWORD,
      fromAddress: process.env.EMAIL_FROM      || process.env.EMAIL_USER,
      fromName:    process.env.EMAIL_FROM_NAME || 'Attendance System',
      replyTo:     process.env.EMAIL_FROM      || process.env.EMAIL_USER,
      notificationEmail: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      enableLeaveNotifications:      true,
      enableCorrectionNotifications: true,
      enableSystemNotifications:     true,
      enableAttendanceNotifications: false,
      // Mock methods
      getMailerConfig() {
        return {
          host: this.host,
          port: this.port,
          secure: this.secure,
          auth: { user: this.username, pass: this.password },
          tls: { rejectUnauthorized: false }
        };
      },
      getDefaultMailOptions() {
        return {
          from: `"${this.fromName}" <${this.fromAddress}>`
        };
      },
      async updateTestStatus(success, error = '') {
        // no-op for env-based settings
      },
      async incrementEmailCount() {
        // no-op for env-based settings
      }
    };
  }

  return null;
};

// ── Instance: get nodemailer config ──
smtpSettingsSchema.methods.getMailerConfig = function () {
  return {
    host:   this.host,
    port:   this.port,
    secure: this.port === 465 || this.secure,
    auth:   { user: this.username, pass: this.password },
    tls:    { rejectUnauthorized: false }
  };
};

// ── Instance: default mail options ──
smtpSettingsSchema.methods.getDefaultMailOptions = function () {
  return {
    from: `"${this.fromName}" <${this.fromAddress}>`
  };
};

// ── Instance: update test status ──
smtpSettingsSchema.methods.updateTestStatus = async function (success, error = '') {
  this.lastTestedAt   = new Date();
  this.lastTestStatus = success ? 'success' : 'failed';
  this.lastTestError  = error;
  await this.save();
};

// ── Instance: increment email counter ──
smtpSettingsSchema.methods.incrementEmailCount = async function () {
  this.totalEmailsSent += 1;
  this.lastEmailSentAt  = new Date();
  await this.save();
};

module.exports = mongoose.model('SmtpSettings', smtpSettingsSchema);