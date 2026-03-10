const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('./emailService'); // ✅ Email service import

// ===================================================================
// HELPER: Send email silently (never crash main flow)
// ===================================================================
const sendEmailSilently = async (recipientEmail, subject, htmlContent) => {
  if (!recipientEmail) return;
  try {
    await emailService.sendNotificationEmail(recipientEmail, subject, htmlContent);
    console.log('📧 Email sent to:', recipientEmail);
  } catch (err) {
    console.error('⚠️ Email send failed (non-fatal):', err.message);
  }
};

// ===================================================================
// HELPER: Get user email by userId
// ===================================================================
const getUserEmail = async (userId) => {
  try {
    const user = await User.findById(userId).select('email');
    return user?.email || null;
  } catch (err) {
    return null;
  }
};

// ===================================================================
// createNotification — DB notification + email
// ===================================================================
const createNotification = async (
  recipientId,
  title,
  message,
  type,
  link = null,
  metadata = {}
) => {
  try {
    // 1. Save to DB
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

    // 2. Send email (async, non-blocking)
    const email = await getUserEmail(recipientId);
    if (email) {
      let subject = title;
      let html = getGenericEmailTemplate({ title, message, type });

      // Use specific templates where available
      if (type === 'leave_approved' && metadata) {
        subject = '✅ Leave Request Approved – Attendance System';
        html = emailService.getLeaveApprovedEmailTemplate({
          employeeName:  metadata.employeeName  || 'Employee',
          leaveType:     metadata.leaveType     || '',
          fromDate:      metadata.fromDate       || new Date(),
          toDate:        metadata.toDate         || new Date(),
          numberOfDays:  metadata.numberOfDays   || 1,
          approverName:  metadata.approverName   || 'Admin'
        });
      } else if (type === 'leave_rejected' && metadata) {
        subject = '❌ Leave Request Not Approved – Attendance System';
        html = emailService.getLeaveRejectedEmailTemplate({
          employeeName:    metadata.employeeName    || 'Employee',
          leaveType:       metadata.leaveType       || '',
          fromDate:        metadata.fromDate         || new Date(),
          toDate:          metadata.toDate           || new Date(),
          rejectionReason: metadata.rejectionReason || 'No reason provided',
          approverName:    metadata.approverName    || 'Admin'
        });
      } else if (type === 'announcement') {
        subject = `📢 Announcement – ${title}`;
        html = emailService.getSystemUpdateEmailTemplate({
          updateType:    title,
          updateDetails: message,
          affectedUsers: metadata.broadcastRole || 'all'
        });
      }

      await sendEmailSilently(email, subject, html);
    }

    return notification;
  } catch (error) {
    console.error('❌ createNotification error:', error);
    throw error;
  }
};

// ===================================================================
// notifyAdmin — notify all admins + email each admin
// ===================================================================
const notifyAdmin = async (title, message, type, link = null, metadata = {}) => {
  try {
    const admins = await User.find({ role: 'admin', isActive: true });
    if (!admins.length) {
      console.log('⚠️ No active admins found');
      return;
    }

    await Promise.all(
      admins.map(admin =>
        createNotification(admin._id, title, message, type, link, {
          ...metadata,
          recipientEmail: admin.email
        })
      )
    );
    console.log(`✅ Notified ${admins.length} admins`);
  } catch (error) {
    console.error('❌ notifyAdmin error:', error);
    throw error;
  }
};

// ===================================================================
// notifyLeaveRequest — employee submits leave → notify + email admin
// ===================================================================
const notifyLeaveRequest = async (leaveRequest, employee) => {
  try {
    // DB notification to admin
    await notifyAdmin(
      '🏖️ New Leave Request',
      `${employee.name} has requested ${leaveRequest.numberOfDays} day(s) of ${leaveRequest.leaveType} leave from ${new Date(leaveRequest.fromDate).toLocaleDateString()}.`,
      'leave_request',
      '/admin/leave-requests',
      {
        leaveRequestId: leaveRequest._id,
        employeeName:   employee.name,
        employeeEmail:  employee.email,
        leaveType:      leaveRequest.leaveType,
        numberOfDays:   leaveRequest.numberOfDays,
        fromDate:       leaveRequest.fromDate,
        toDate:         leaveRequest.toDate,
        reason:         leaveRequest.reason
      }
    );

    // ✅ Also email admin separately with full leave-request template
    const admins = await User.find({ role: 'admin', isActive: true }).select('email');
    await Promise.all(admins.map(admin =>
      sendEmailSilently(
        admin.email,
        `🏖️ New Leave Request from ${employee.name} – Attendance System`,
        emailService.getLeaveRequestEmailTemplate({
          employeeName: employee.name,
          leaveType:    leaveRequest.leaveType,
          fromDate:     leaveRequest.fromDate,
          toDate:       leaveRequest.toDate,
          numberOfDays: leaveRequest.numberOfDays,
          reason:       leaveRequest.reason,
          requestId:    leaveRequest._id
        })
      )
    ));

  } catch (error) {
    console.error('❌ notifyLeaveRequest error:', error);
  }
};

// ===================================================================
// notifyLeaveApproval — kept for backward compat
// ===================================================================
const notifyLeaveApproval = async (leaveRequest, employee, approver) => {
  console.log('⚠️ notifyLeaveApproval called – handled in controller now');
};

// ===================================================================
// notifyLeaveRejection — kept for backward compat
// ===================================================================
const notifyLeaveRejection = async (leaveRequest, employee, approver, reason) => {
  console.log('⚠️ notifyLeaveRejection called – handled in controller now');
};

// ===================================================================
// notifyCorrectionRequest — employee reports issue → admin notif + email
// ===================================================================
const notifyCorrectionRequest = async (correctionRequest, employee) => {
  try {
    await notifyAdmin(
      '⚠️ New Attendance Correction Request',
      `${employee.name} has requested a correction for ${new Date(correctionRequest.attendanceDate).toLocaleDateString()}. Issue: ${correctionRequest.issueType.replace('_', ' ')}`,
      'correction_request',
      '/admin/correction-requests',
      {
        correctionRequestId: correctionRequest._id,
        employeeName:        employee.name,
        issueType:           correctionRequest.issueType
      }
    );

    // ✅ Also email admin with correction template
    const admins = await User.find({ role: 'admin', isActive: true }).select('email');
    await Promise.all(admins.map(admin =>
      sendEmailSilently(
        admin.email,
        `⚠️ Correction Request from ${employee.name} – Attendance System`,
        emailService.getCorrectionRequestEmailTemplate({
          employeeName:    employee.name,
          attendanceDate:  correctionRequest.attendanceDate,
          currentStatus:   correctionRequest.currentStatus  || 'Unknown',
          requestedStatus: correctionRequest.requestedStatus || 'Unknown',
          reason:          correctionRequest.reason || correctionRequest.description || '',
          issueType:       correctionRequest.issueType || ''
        })
      )
    ));

  } catch (error) {
    console.error('❌ notifyCorrectionRequest error:', error);
  }
};

// ===================================================================
// notifyCorrectionResolution — kept for backward compat
// ===================================================================
const notifyCorrectionResolution = async (correctionRequest, employee, resolver, approved) => {
  console.log('⚠️ notifyCorrectionResolution called – handled in controller now');
};

// ===================================================================
// sendAnnouncement — broadcast to all users → notif + email
// ===================================================================
const sendAnnouncement = async (title, message, recipientRole = 'all') => {
  try {
    console.log('📢 Sending announcement to:', recipientRole);

    const query = recipientRole === 'all'
      ? { isActive: true }
      : { role: recipientRole, isActive: true };

    const users = await User.find(query);
    console.log(`✅ Found ${users.length} users`);
    if (!users.length) return 0;

    // DB notification + email for each user (via createNotification)
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

    console.log(`✅ Announcement sent to ${users.length} users`);
    return users.length;
  } catch (error) {
    console.error('❌ sendAnnouncement error:', error);
    throw error;
  }
};

// ===================================================================
// GENERIC EMAIL TEMPLATE — fallback for other notification types
// ===================================================================
const getGenericEmailTemplate = ({ title, message, type }) => {
  const colorMap = {
    leave_approved:    '#10b981',
    leave_rejected:    '#ef4444',
    leave_request:     '#3b82f6',
    correction_request:'#f59e0b',
    announcement:      '#8b5cf6',
    attendance_marked: '#667eea',
  };
  const color = colorMap[type] || '#667eea';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${color}; color: white; padding: 24px 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h2 { margin: 0; font-size: 22px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; }
        .msg-box { background: white; padding: 20px; border-left: 4px solid ${color}; border-radius: 4px; margin: 16px 0; }
        .footer { text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h2>${title}</h2></div>
        <div class="content">
          <div class="msg-box"><p style="margin:0">${message}</p></div>
          <p style="color:#6b7280; font-size:13px;">
            This is an automated notification from the Devstrings Attendance System.
          </p>
        </div>
        <div class="footer">
          <p>© Devstrings Attendance System &nbsp;|&nbsp; ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
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