const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'leave_request',
      'leave_approved',
      'leave_rejected',
      'correction_request',
      'correction_resolved',
      'correction_approved',
      'correction_rejected',
      'attendance_marked',
      'system_update',
      'announcement',
      'warning',
      'attendance_alert',
      'monthly_summary',
      'overtime_added',
      'overtime_request',
      'overtime_approved',
      'overtime_rejected',
      'attendance_corrected',
      'attendance_alert'
    ]
  },
  link: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better performance
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ 
    recipient: userId, 
    isRead: false 
  });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { recipient: userId, isRead: false },
    { 
      $set: { 
        isRead: true, 
        readAt: new Date() 
      } 
    }
  );
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;