const Notification = require('../models/Notification');
const User = require('../models/User');

// ✅ SIMPLE: Direct notification create function
const createNotification = async (recipientId, title, message, type, link = null, metadata = {}) => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      title,
      message,
      type,
      link,
      metadata,
      isRead: false
    });
    await notification.save();
    console.log('✅ Notification created for user:', recipientId);
    return notification;
  } catch (error) {
    console.error('❌ Create notification error:', error);
    throw error;
  }
};

// ✅ Notify all admins
const notifyAdmin = async (title, message, type, link = null, metadata = {}) => {
  try {
    const admins = await User.find({ role: 'admin', isActive: true });
    if (!admins.length) {
      console.log('⚠️ No active admins found');
      return;
    }
    
    await Promise.all(
      admins.map(admin => 
        createNotification(admin._id, title, message, type, link, metadata)
      )
    );
    console.log(`✅ Notified ${admins.length} admins`);
  } catch (error) {
    console.error('❌ notifyAdmin error:', error);
    throw error;
  }
};

// ✅ Leave request notification (to admin)
const notifyLeaveRequest = async (leaveRequest, employee) => {
  try {
    await notifyAdmin(
      '🏖️ New Leave Request',
      `${employee.name} has requested ${leaveRequest.numberOfDays} day(s) of ${leaveRequest.leaveType} leave from ${new Date(leaveRequest.fromDate).toLocaleDateString()}.`,
      'leave_request',
      '/admin/leave-requests',
      {
        leaveRequestId: leaveRequest._id,
        employeeName: employee.name,
        employeeEmail: employee.email,
        leaveType: leaveRequest.leaveType,
        numberOfDays: leaveRequest.numberOfDays
      }
    );
  } catch (error) {
    console.error('❌ notifyLeaveRequest error:', error);
  }
};

// ✅ Leave approval notification (to employee + manager if admin approved)
const notifyLeaveApproval = async (leaveRequest, employee, approver) => {
  try {
    // This function is now handled directly in controller
    // Keeping it for backward compatibility but it won't be called
    console.log('⚠️ notifyLeaveApproval called - should use direct createNotification in controller');
  } catch (error) {
    console.error('❌ notifyLeaveApproval error:', error);
  }
};

// ✅ Leave rejection notification (to employee)
const notifyLeaveRejection = async (leaveRequest, employee, approver, reason) => {
  try {
    // This function is now handled directly in controller
    console.log('⚠️ notifyLeaveRejection called - should use direct createNotification in controller');
  } catch (error) {
    console.error('❌ notifyLeaveRejection error:', error);
  }
};

// ✅ Correction request notification (to admin)
const notifyCorrectionRequest = async (correctionRequest, employee) => {
  try {
    await notifyAdmin(
      '⚠️ New Attendance Correction Request',
      `${employee.name} has requested a correction for ${new Date(correctionRequest.attendanceDate).toLocaleDateString()}. Issue: ${correctionRequest.issueType.replace('_', ' ')}`,
      'correction_request',
      '/admin/correction-requests',
      {
        correctionRequestId: correctionRequest._id,
        employeeName: employee.name,
        issueType: correctionRequest.issueType
      }
    );
  } catch (error) {
    console.error('❌ notifyCorrectionRequest error:', error);
  }
};

// ✅ Correction resolution notification (to employee)
const notifyCorrectionResolution = async (correctionRequest, employee, resolver, approved) => {
  try {
    // This function is now handled directly in controller
    console.log('⚠️ notifyCorrectionResolution called - should use direct createNotification in controller');
  } catch (error) {
    console.error('❌ notifyCorrectionResolution error:', error);
  }
};

// ✅ Broadcast announcement
const sendAnnouncement = async (title, message, recipientRole = 'all') => {
  try {
    console.log('📢 Sending announcement to:', recipientRole);
    let users = recipientRole === 'all' 
      ? await User.find({ isActive: true }) 
      : await User.find({ role: recipientRole, isActive: true });
    
    console.log('✅ Found', users.length, 'users');
    if (!users.length) return 0;
    
    await Promise.all(
      users.map(user => 
        createNotification(
          user._id,
          title,
          message,
          'announcement',
          null,
          { broadcastRole: recipientRole }
        )
      )
    );
    
    console.log('✅ Announcement sent to', users.length, 'users');
    return users.length;
  } catch (error) {
    console.error('❌ sendAnnouncement error:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  notifyAdmin,
  notifyLeaveRequest,
  notifyLeaveApproval,
  notifyLeaveRejection,
  notifyCorrectionRequest,
  notifyCorrectionResolution,
  sendAnnouncement
};