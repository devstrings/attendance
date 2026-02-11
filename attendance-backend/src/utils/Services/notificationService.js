const Notification = require('../models/Notification');
const emailService = require('./emailService');

class NotificationService {
  
  // Create a notification (in-app)
  async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      await notification.save();
      return { success: true, notification };
    } catch (error) {
      console.error('❌ Create notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Create notification and send email
  async createAndSendNotification(notificationData, emailData = null) {
    try {
      // Create in-app notification
      const notification = new Notification(notificationData);
      await notification.save();

      // Send email if email data provided
      if (emailData && emailData.recipientEmail && emailData.subject && emailData.htmlContent) {
        const emailResult = await emailService.sendNotificationEmail(
          emailData.recipientEmail,
          emailData.subject,
          emailData.htmlContent
        );

        if (emailResult.success) {
          notification.emailSent = true;
          notification.emailSentAt = new Date();
          await notification.save();
        }
      }

      return { success: true, notification };
    } catch (error) {
      console.error('❌ Create and send notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send leave request notification to admin/manager
  async notifyLeaveRequest(leaveRequest, employeeData) {
    const notificationData = {
      recipient: null, // Will be set to admin ID
      recipientModel: 'Admin',
      sender: leaveRequest.employee,
      senderModel: 'Employee',
      type: 'leave_request',
      title: '🏖️ New Leave Request',
      message: `${employeeData.name} has requested ${leaveRequest.numberOfDays} day(s) leave from ${new Date(leaveRequest.fromDate).toLocaleDateString()} to ${new Date(leaveRequest.toDate).toLocaleDateString()}`,
      link: `/admin/leave-requests`,
      metadata: {
        leaveRequestId: leaveRequest._id,
        leaveType: leaveRequest.leaveType,
        fromDate: leaveRequest.fromDate,
        toDate: leaveRequest.toDate
      },
      priority: 'high'
    };

    // Get admin user (you'll need to fetch this from your Admin model)
    const Admin = require('../models/Admin');
    const admin = await Admin.findOne({ role: 'admin' });
    
    if (admin) {
      notificationData.recipient = admin._id;

      const emailData = {
        recipientEmail: admin.email,
        subject: '🏖️ New Leave Request - Attendance System',
        htmlContent: emailService.getLeaveRequestEmailTemplate({
          employeeName: employeeData.name,
          leaveType: leaveRequest.leaveType,
          fromDate: leaveRequest.fromDate,
          toDate: leaveRequest.toDate,
          numberOfDays: leaveRequest.numberOfDays,
          reason: leaveRequest.reason,
          requestId: leaveRequest._id
        })
      };

      return await this.createAndSendNotification(notificationData, emailData);
    }

    return await this.createNotification(notificationData);
  }

  // Notify employee about leave approval
  async notifyLeaveApproval(leaveRequest, employeeData, approverData) {
    const notificationData = {
      recipient: leaveRequest.employee,
      recipientModel: 'Employee',
      sender: approverData._id,
      senderModel: approverData.role === 'admin' ? 'Admin' : 'Manager',
      type: 'leave_approved',
      title: '✅ Leave Request Approved',
      message: `Your leave request for ${leaveRequest.numberOfDays} day(s) has been approved by ${approverData.name}`,
      link: `/employee/my-requests`,
      metadata: {
        leaveRequestId: leaveRequest._id,
        approvedBy: approverData.name,
        approvedAt: new Date()
      },
      priority: 'high'
    };

    const emailData = {
      recipientEmail: employeeData.email,
      subject: '✅ Leave Request Approved - Attendance System',
      htmlContent: emailService.getLeaveApprovedEmailTemplate({
        employeeName: employeeData.name,
        leaveType: leaveRequest.leaveType,
        fromDate: leaveRequest.fromDate,
        toDate: leaveRequest.toDate,
        numberOfDays: leaveRequest.numberOfDays,
        approverName: approverData.name
      })
    };

    return await this.createAndSendNotification(notificationData, emailData);
  }

  // Notify employee about leave rejection
  async notifyLeaveRejection(leaveRequest, employeeData, approverData, rejectionReason) {
    const notificationData = {
      recipient: leaveRequest.employee,
      recipientModel: 'Employee',
      sender: approverData._id,
      senderModel: approverData.role === 'admin' ? 'Admin' : 'Manager',
      type: 'leave_rejected',
      title: '❌ Leave Request Not Approved',
      message: `Your leave request has been reviewed and not approved. ${rejectionReason ? 'Reason: ' + rejectionReason : ''}`,
      link: `/employee/my-requests`,
      metadata: {
        leaveRequestId: leaveRequest._id,
        rejectedBy: approverData.name,
        rejectionReason: rejectionReason
      },
      priority: 'high'
    };

    const emailData = {
      recipientEmail: employeeData.email,
      subject: '❌ Leave Request Update - Attendance System',
      htmlContent: emailService.getLeaveRejectedEmailTemplate({
        employeeName: employeeData.name,
        leaveType: leaveRequest.leaveType,
        fromDate: leaveRequest.fromDate,
        toDate: leaveRequest.toDate,
        rejectionReason: rejectionReason,
        approverName: approverData.name
      })
    };

    return await this.createAndSendNotification(notificationData, emailData);
  }

  // Send correction request notification to admin
  async notifyCorrectionRequest(correctionRequest, employeeData) {
    const Admin = require('../models/Admin');
    const admin = await Admin.findOne({ role: 'admin' });

    const notificationData = {
      recipient: admin ? admin._id : null,
      recipientModel: 'Admin',
      sender: correctionRequest.employee,
      senderModel: 'Employee',
      type: 'correction_request',
      title: '⚠️ Attendance Correction Request',
      message: `${employeeData.name} has reported an attendance issue for ${new Date(correctionRequest.attendanceDate).toLocaleDateString()}`,
      link: `/admin/correction-requests`,
      metadata: {
        correctionRequestId: correctionRequest._id,
        attendanceDate: correctionRequest.attendanceDate,
        currentStatus: correctionRequest.currentStatus,
        requestedStatus: correctionRequest.requestedStatus
      },
      priority: correctionRequest.priority || 'medium'
    };

    if (admin) {
      const emailData = {
        recipientEmail: admin.email,
        subject: '⚠️ Attendance Correction Request - Attendance System',
        htmlContent: emailService.getCorrectionRequestEmailTemplate({
          employeeName: employeeData.name,
          attendanceDate: correctionRequest.attendanceDate,
          currentStatus: correctionRequest.currentStatus,
          requestedStatus: correctionRequest.requestedStatus,
          reason: correctionRequest.reason,
          issueType: correctionRequest.issueType
        })
      };

      return await this.createAndSendNotification(notificationData, emailData);
    }

    return await this.createNotification(notificationData);
  }

  // Notify employee about correction resolution
  async notifyCorrectionResolution(correctionRequest, employeeData, resolverData, approved) {
    const notificationData = {
      recipient: correctionRequest.employee,
      recipientModel: 'Employee',
      sender: resolverData._id,
      senderModel: resolverData.role === 'admin' ? 'Admin' : 'Manager',
      type: 'correction_resolved',
      title: approved ? '✅ Attendance Corrected' : '❌ Correction Request Declined',
      message: approved 
        ? `Your attendance correction request for ${new Date(correctionRequest.attendanceDate).toLocaleDateString()} has been approved and updated.`
        : `Your attendance correction request has been reviewed. ${correctionRequest.resolution || ''}`,
      link: `/employee/my-requests`,
      metadata: {
        correctionRequestId: correctionRequest._id,
        resolvedBy: resolverData.name,
        approved: approved
      },
      priority: 'medium'
    };

    // You can add email template for correction resolution if needed
    return await this.createNotification(notificationData);
  }

  // Send system update notification to all users
  async notifySystemUpdate(updateType, updateDetails, affectedUsers = 'all') {
    try {
      const Admin = require('../models/Admin');
      const Manager = require('../models/Manager');
      const Employee = require('../models/Employee');

      const notifications = [];

      // Determine which users to notify
      let usersToNotify = [];

      if (affectedUsers === 'all' || affectedUsers.includes('admin')) {
        const admins = await Admin.find({});
        usersToNotify.push(...admins.map(admin => ({
          id: admin._id,
          model: 'Admin',
          email: admin.email,
          name: admin.name
        })));
      }

      if (affectedUsers === 'all' || affectedUsers.includes('manager')) {
        const managers = await Manager.find({});
        usersToNotify.push(...managers.map(manager => ({
          id: manager._id,
          model: 'Manager',
          email: manager.email,
          name: manager.name
        })));
      }

      if (affectedUsers === 'all' || affectedUsers.includes('employee')) {
        const employees = await Employee.find({});
        usersToNotify.push(...employees.map(employee => ({
          id: employee._id,
          model: 'Employee',
          email: employee.email,
          name: employee.name
        })));
      }

      // Create notifications for all users
      for (const user of usersToNotify) {
        const notificationData = {
          recipient: user.id,
          recipientModel: user.model,
          senderModel: 'System',
          type: 'system_update',
          title: `📢 ${updateType}`,
          message: updateDetails,
          metadata: {
            updateType: updateType,
            timestamp: new Date()
          },
          priority: 'medium'
        };

        const emailData = {
          recipientEmail: user.email,
          subject: `📢 System Update - ${updateType}`,
          htmlContent: emailService.getSystemUpdateEmailTemplate({
            updateType: updateType,
            updateDetails: updateDetails,
            affectedUsers: affectedUsers === 'all' ? 'All Users' : affectedUsers
          })
        };

        const result = await this.createAndSendNotification(notificationData, emailData);
        notifications.push(result);
      }

      return { 
        success: true, 
        message: `Notifications sent to ${usersToNotify.length} users`,
        count: usersToNotify.length 
      };

    } catch (error) {
      console.error('❌ System update notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user notifications
  async getUserNotifications(userId, userModel, limit = 20, unreadOnly = false) {
    try {
      const query = {
        recipient: userId,
        recipientModel: userModel
      };

      if (unreadOnly) {
        query.isRead = false;
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit);

      const unreadCount = await Notification.getUnreadCount(userId, userModel);

      return {
        success: true,
        notifications,
        unreadCount
      };
    } catch (error) {
      console.error('❌ Get notifications error:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        return { success: false, message: 'Notification not found' };
      }

      await notification.markAsRead();
      return { success: true, notification };
    } catch (error) {
      console.error('❌ Mark as read error:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark all as read for a user
  async markAllAsRead(userId, userModel) {
    try {
      await Notification.markAllAsRead(userId, userModel);
      return { success: true, message: 'All notifications marked as read' };
    } catch (error) {
      console.error('❌ Mark all as read error:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      await Notification.findByIdAndDelete(notificationId);
      return { success: true, message: 'Notification deleted' };
    } catch (error) {
      console.error('❌ Delete notification error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new NotificationService();