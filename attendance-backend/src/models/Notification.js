const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientModel'
  },
  recipientModel: {
    type: String,
    required: true,
    enum: ['Admin', 'Manager', 'Employee']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'senderModel'
  },
  senderModel: {
    type: String,
    enum: ['Admin', 'Manager', 'Employee', 'System']
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
      'system_update',
      'attendance_marked',
      'warning',
      'announcement'
    ]
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  link: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes for faster queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, recipientModel: 1 });

// Virtual for formatted date
notificationSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  return await this.save();
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(recipientId, recipientModel) {
  return await this.countDocuments({
    recipient: recipientId,
    recipientModel: recipientModel,
    isRead: false
  });
};

// Static method to mark all as read for a user
notificationSchema.statics.markAllAsRead = async function(recipientId, recipientModel) {
  return await this.updateMany(
    {
      recipient: recipientId,
      recipientModel: recipientModel,
      isRead: false
    },
    { isRead: true }
  );
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;