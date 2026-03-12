const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('./Services/emailService');

// ===== Helper: Create Notification + Email =====
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

    // ===== AUTO EMAIL: Har notification ke saath email bhi =====
    try {
      const user = await User.findById(recipientId).select('email');
      if (user?.email) {
        const emailHtml = getNotificationEmailTemplate({ title, message, type, link });
        await emailService.sendNotificationEmail(
          user.email,
          title,
          emailHtml
        );
        console.log(`✅ Email sent to ${user.email} for notification type: ${type}`);
      }
    } catch (emailErr) {
      console.warn('⚠️ Email send failed (non-fatal):', emailErr.message);
    }

    return notification;
  } catch (error) {
    console.error('❌ Create notification error:', error);
    throw error;
  }
};

// ===== Generic Notification Email Template =====
const getNotificationEmailTemplate = ({ title, message, type, link }) => {
  // Type ke hisaab se color aur icon
  const typeConfig = {
    leave_request:      { color: '#3b82f6', icon: '🏖️', label: 'Leave Request' },
    leave_approved:     { color: '#10b981', icon: '✅', label: 'Leave Approved' },
    leave_rejected:     { color: '#ef4444', icon: '❌', label: 'Leave Rejected' },
    correction_request: { color: '#f59e0b', icon: '⚠️', label: 'Correction Request' },
    correction_resolved:{ color: '#8b5cf6', icon: '🔧', label: 'Correction Resolved' },
    announcement:       { color: '#6366f1', icon: '📢', label: 'Announcement' },
    system:             { color: '#0ea5e9', icon: '⚙️', label: 'System Notification' },
  };

  const cfg = typeConfig[type] || { color: '#6b7280', icon: '🔔', label: 'Notification' };

  const actionButton = link
    ? `<div style="text-align:center;margin-top:24px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}${link}"
           style="display:inline-block;background:${cfg.color};color:#fff;text-decoration:none;
                  padding:13px 36px;border-radius:50px;font-size:15px;font-weight:600;">
          View Details →
        </a>
       </div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:${cfg.color};padding:32px 30px;text-align:center;">
            <div style="font-size:44px;margin-bottom:8px;">${cfg.icon}</div>
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">${cfg.label}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 36px;">
            <h2 style="color:#1f2937;font-size:18px;margin:0 0 12px;">${title}</h2>
            <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 20px;">
              ${message}
            </p>

            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                🕐 ${new Date().toLocaleString('en-PK', { dateStyle: 'full', timeStyle: 'short' })}
              </p>
            </div>

            ${actionButton}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              © ${new Date().getFullYear()} Attendance System — Automated Notification
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

// ===== Send Notification to Admin =====
const notifyAdmin = async (title, message, type, link = null, metadata = {}) => {
  try {
    console.log('📢 Finding admins...');

    const admins = await User.find({ role: 'admin', isActive: true });
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
    console.log(`✅ Successfully sent notifications + emails to ${admins.length} admin(s)`);
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

    console.log('✅ Leave request notification + email sent to admin!');
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

    // createNotification ke andar ab automatic email bhi jaayega
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

    console.log('✅ Leave approval notification + email sent to employee');
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

    console.log('✅ Leave rejection notification + email sent to employee');
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

    console.log('✅ Correction request notification + email sent to admin');
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

    const title = status === 'approved'
      ? `✅ Correction Request Approved`
      : `❌ Correction Request Rejected`;
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

    console.log('✅ Correction resolution notification + email sent to employee');
  } catch (error) {
    console.error('❌ Notify correction resolution error:', error);
  }
};

// ===== System Announcement — Sab users ko notification + email =====
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

    // createNotification ke andar email bhi jaayega automatically
    const promises = users.map(user =>
      createNotification(user._id, title, message, 'announcement', null, {
        broadcastRole: recipientRole
      })
    );

    await Promise.all(promises);
    console.log(`✅ Announcement notification + email sent to ${users.length} users`);

    return users.length;
  } catch (error) {
    console.error('❌ Send announcement error:', error);
    throw error;
  }
};

// ===== EXPORTS =====
module.exports = {
  createNotification,
  notifyLeaveRequest,
  notifyLeaveApproval,
  notifyLeaveRejection,
  notifyCorrectionRequest,
  notifyCorrectionResolution,
  sendAnnouncement
};