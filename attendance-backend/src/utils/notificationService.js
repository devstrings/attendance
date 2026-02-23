const Notification = require('../models/Notification');
const User = require('../models/User');

// ===== Helper: Create Notification =====
const createNotification = async (recipientId, title, message, type, link = null, metadata = {}) => {
  try {
    console.log('📢 Creating notification for:', recipientId);
    console.log('   Title:', title);
    console.log('   Type:', type);
    
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
    console.log('✅ Notification created successfully:', notification._id);
    return notification;
  } catch (error) {
    console.error('❌ Create notification error:', error);
    throw error;
  }
};

// ===== Send Notification to Admin =====
const notifyAdmin = async (title, message, type, link = null, metadata = {}) => {
  try {
    console.log('📢 Finding admins...');
    
    const admins = await User.find({ 
      role: 'admin', 
      isActive: true 
    });
    
    console.log(`✅ Found ${admins.length} admin(s)`);
    
    if (admins.length === 0) {
      console.warn('⚠️  No active admins found!');
      return;
    }
    
    const promises = admins.map(admin => {
      console.log(`   Creating notification for admin: ${admin.email}`);
      return createNotification(admin._id, title, message, type, link, metadata);
    });
    
    await Promise.all(promises);
    console.log(`✅ Successfully sent notifications to ${admins.length} admin(s)`);
  } catch (error) {
    console.error('❌ Notify admin error:', error);
    throw error;
  }
};

// ===== LEAVE REQUEST: Notify Admin =====
const notifyLeaveRequest = async (leaveRequest, employee) => {
  try {
    console.log('');
    console.log('='.repeat(60));
    console.log('📢 NOTIFYING ADMIN ABOUT LEAVE REQUEST');
    console.log('='.repeat(60));
    console.log('Employee Name:', employee.name);
    console.log('Employee Email:', employee.email);
    console.log('Leave Type:', leaveRequest.leaveType);
    console.log('Number of Days:', leaveRequest.numberOfDays);
    console.log('From Date:', leaveRequest.fromDate);
    console.log('='.repeat(60));
    
    const title = `🏖️ New Leave Request`;
    const message = `${employee.name} has requested ${leaveRequest.numberOfDays} day(s) of ${leaveRequest.leaveType} leave from ${new Date(leaveRequest.fromDate).toLocaleDateString()}.`;
    const link = `/admin/leave-requests`;
    
    await notifyAdmin(title, message, 'leave_request', link, {
      leaveRequestId: leaveRequest._id,
      employeeName: employee.name,
      employeeEmail: employee.email,
      leaveType: leaveRequest.leaveType,
      numberOfDays: leaveRequest.numberOfDays
    });
    
    console.log('✅ Leave request notification sent to admin!');
    console.log('='.repeat(60));
    console.log('');
  } catch (error) {
    console.error('❌ Notify leave request error:', error);
    console.error('   Stack:', error.stack);
  }
};

// ===== LEAVE APPROVED: Notify Employee =====
const notifyLeaveApproval = async (leaveRequest, employee, approver) => {
  try {
    console.log('📢 Notifying employee about leave approval');
    
    const Employee = require('../models/Employee');
    const employeeDoc = await Employee.findById(leaveRequest.employee).populate('userId');
    
    if (!employeeDoc || !employeeDoc.userId) {
      console.error('❌ Employee userId not found');
      return;
    }
    
    const title = `✅ Leave Request Approved`;
    const message = `Your ${leaveRequest.leaveType} leave request for ${leaveRequest.numberOfDays} day(s) has been approved by ${approver.name}.`;
    const link = `/employee/my-requests`;
    
    await createNotification(
      employeeDoc.userId._id,
      title,
      message,
      'leave_approved',
      link,
      {
        leaveRequestId: leaveRequest._id,
        approverName: approver.name
      }
    );
    
    console.log('✅ Leave approval notification sent to employee');
  } catch (error) {
    console.error('❌ Notify leave approval error:', error);
  }
};

// ===== LEAVE REJECTED: Notify Employee =====
const notifyLeaveRejection = async (leaveRequest, employee, approver, reason) => {
  try {
    console.log('📢 Notifying employee about leave rejection');
    
    const Employee = require('../models/Employee');
    const employeeDoc = await Employee.findById(leaveRequest.employee).populate('userId');
    
    if (!employeeDoc || !employeeDoc.userId) {
      console.error('❌ Employee userId not found');
      return;
    }
    
    const title = `❌ Leave Request Rejected`;
    const message = `Your ${leaveRequest.leaveType} leave request has been rejected by ${approver.name}. Reason: ${reason}`;
    const link = `/employee/my-requests`;
    
    await createNotification(
      employeeDoc.userId._id,
      title,
      message,
      'leave_rejected',
      link,
      {
        leaveRequestId: leaveRequest._id,
        approverName: approver.name,
        rejectionReason: reason
      }
    );
    
    console.log('✅ Leave rejection notification sent to employee');
  } catch (error) {
    console.error('❌ Notify leave rejection error:', error);
  }
};

// ===== CORRECTION REQUEST: Notify Admin =====
const notifyCorrectionRequest = async (correctionRequest, employee) => {
  try {
    console.log('📢 Notifying admin about correction request');
    
    const title = `⚠️ New Attendance Correction Request`;
    const message = `${employee.name} has requested a correction for ${new Date(correctionRequest.attendanceDate).toLocaleDateString()}. Issue: ${correctionRequest.issueType.replace('_', ' ')}`;
    const link = `/admin/correction-requests`;
    
    await notifyAdmin(title, message, 'correction_request', link, {
      correctionRequestId: correctionRequest._id,
      employeeName: employee.name,
      issueType: correctionRequest.issueType
    });
    
    console.log('✅ Correction request notification sent to admin');
  } catch (error) {
    console.error('❌ Notify correction request error:', error);
  }
};

// ===== CORRECTION RESOLVED: Notify Employee =====
const notifyCorrectionResolution = async (correctionRequest, employee, resolver, status) => {
  try {
    console.log('📢 Notifying employee about correction resolution');
    
    const Employee = require('../models/Employee');
    const employeeDoc = await Employee.findById(correctionRequest.employee).populate('userId');
    
    if (!employeeDoc || !employeeDoc.userId) {
      console.error('❌ Employee userId not found');
      return;
    }
    
    const title = status === 'approved' ? `✅ Correction Request Approved` : `❌ Correction Request Rejected`;
    const message = `Your attendance correction request for ${new Date(correctionRequest.attendanceDate).toLocaleDateString()} has been ${status} by ${resolver.name}.`;
    const link = `/employee/my-requests`;
    
    await createNotification(
      employeeDoc.userId._id,
      title,
      message,
      'correction_resolved',
      link,
      {
        correctionRequestId: correctionRequest._id,
        resolverName: resolver.name,
        status
      }
    );
    
    console.log('✅ Correction resolution notification sent to employee');
  } catch (error) {
    console.error('❌ Notify correction resolution error:', error);
  }
};

// ===== System Announcement =====
// ✅ FIX: Returns count so controller can include it in response
const sendAnnouncement = async (title, message, recipientRole = 'all') => {
  try {
    console.log(`📢 Sending announcement to: ${recipientRole}`);
    
    let users = [];
    
    if (recipientRole === 'all') {
      users = await User.find({ isActive: true });
    } else {
      users = await User.find({ role: recipientRole, isActive: true });
    }
    
    console.log(`✅ Found ${users.length} users`);

    if (users.length === 0) {
      console.warn('⚠️  No users found for announcement');
      return 0;
    }
    
    const promises = users.map(user => 
      createNotification(user._id, title, message, 'announcement', null, {
        broadcastRole: recipientRole
      })
    );
    
    await Promise.all(promises);
    console.log(`✅ Announcement sent to ${users.length} users`);

    // ✅ FIX: Return count so controller includes it in response
    return users.length;

  } catch (error) {
    console.error('❌ Send announcement error:', error);
    throw error;
  }
};

// ===== EXPORTS =====
module.exports = {
  createNotification, // ✅ ADDED - for direct use in controllers
  notifyLeaveRequest,
  notifyLeaveApproval,
  notifyLeaveRejection,
  notifyCorrectionRequest,
  notifyCorrectionResolution,
  sendAnnouncement
};