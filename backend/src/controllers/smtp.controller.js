const SmtpSettings = require('../models/SmtpSettings');
const emailService = require('../utils/emailService');

// Get SMTP settings (Admin only)
exports.getSmtpSettings = async (req, res) => {
  try {
    const settings = await SmtpSettings.getActiveSettings();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'SMTP settings not configured yet'
      });
    }

    // Don't send password to frontend
    const settingsData = settings.toObject();
    delete settingsData.password;

    res.status(200).json({
      success: true,
      data: settingsData
    });

  } catch (error) {
    console.error('❌ Get SMTP settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SMTP settings',
      error: error.message
    });
  }
};

// Create or Update SMTP settings (Admin only)
exports.saveSmtpSettings = async (req, res) => {
  try {
    const {
      host,
      port,
      secure,
      encryption,
      username,
      password,
      fromAddress,
      fromName,
      replyTo,
      notificationEmail,
      enableLeaveNotifications,
      enableCorrectionNotifications,
      enableSystemNotifications,
      enableAttendanceNotifications
    } = req.body;

    // Validation
    if (!host || !port || !username || !password || !fromAddress || !fromName || !notificationEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required SMTP settings'
      });
    }

    // Check if settings already exist
    let settings = await SmtpSettings.getActiveSettings();

    if (settings) {
      // Update existing settings
      settings.host = host;
      settings.port = port;
      settings.secure = secure || false;
      settings.encryption = encryption || 'TLS';
      settings.username = username;
      
      // Only update password if provided (don't override with empty)
      if (password && password !== '********') {
        settings.password = password;
      }
      
      settings.fromAddress = fromAddress;
      settings.fromName = fromName;
      settings.replyTo = replyTo || fromAddress;
      settings.notificationEmail = notificationEmail;
      settings.enableLeaveNotifications = enableLeaveNotifications !== undefined ? enableLeaveNotifications : true;
      settings.enableCorrectionNotifications = enableCorrectionNotifications !== undefined ? enableCorrectionNotifications : true;
      settings.enableSystemNotifications = enableSystemNotifications !== undefined ? enableSystemNotifications : true;
      settings.enableAttendanceNotifications = enableAttendanceNotifications !== undefined ? enableAttendanceNotifications : false;
      settings.updatedBy = req.user._id;

      await settings.save();

    } else {
      // Create new settings
      settings = new SmtpSettings({
        isActive: true,
        host,
        port,
        secure: secure || false,
        encryption: encryption || 'TLS',
        username,
        password,
        fromAddress,
        fromName,
        replyTo: replyTo || fromAddress,
        notificationEmail,
        enableLeaveNotifications: enableLeaveNotifications !== undefined ? enableLeaveNotifications : true,
        enableCorrectionNotifications: enableCorrectionNotifications !== undefined ? enableCorrectionNotifications : true,
        enableSystemNotifications: enableSystemNotifications !== undefined ? enableSystemNotifications : true,
        enableAttendanceNotifications: enableAttendanceNotifications !== undefined ? enableAttendanceNotifications : false,
        updatedBy: req.user._id
      });

      await settings.save();
    }

    // Don't send password back
    const settingsData = settings.toObject();
    delete settingsData.password;

    res.status(200).json({
      success: true,
      message: 'SMTP settings saved successfully',
      data: settingsData
    });

  } catch (error) {
    console.error('❌ Save SMTP settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save SMTP settings',
      error: error.message
    });
  }
};

// Test SMTP connection (Admin only)
exports.testSmtpConnection = async (req, res) => {
  try {
    const result = await emailService.testConnection();

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    console.error('❌ Test SMTP connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test SMTP connection',
      error: error.message
    });
  }
};

// Send test email (Admin only)
exports.sendTestEmail = async (req, res) => {
  try {
    const { recipientEmail } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email is required'
      });
    }

    const result = await emailService.sendTestEmail(recipientEmail);

    res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      data: { messageId: result.messageId }
    });

  } catch (error) {
    console.error('❌ Send test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
};

// Get SMTP status and statistics (Admin only)
exports.getSmtpStatus = async (req, res) => {
  try {
    const settings = await SmtpSettings.getActiveSettings();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'SMTP settings not configured'
      });
    }

    const status = {
      configured: true,
      host: settings.host,
      port: settings.port,
      fromAddress: settings.fromAddress,
      fromName: settings.fromName,
      lastTested: settings.lastTestedAt,
      lastTestStatus: settings.lastTestStatus,
      lastTestError: settings.lastTestError,
      totalEmailsSent: settings.totalEmailsSent,
      lastEmailSent: settings.lastEmailSentAt,
      notifications: {
        leave: settings.enableLeaveNotifications,
        correction: settings.enableCorrectionNotifications,
        system: settings.enableSystemNotifications,
        attendance: settings.enableAttendanceNotifications
      }
    };

    res.status(200).json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('❌ Get SMTP status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SMTP status',
      error: error.message
    });
  }
};

// Toggle notification type (Admin only)
exports.toggleNotificationType = async (req, res) => {
  try {
    const { notificationType, enabled } = req.body;

    if (!notificationType) {
      return res.status(400).json({
        success: false,
        message: 'Notification type is required'
      });
    }

    const settings = await SmtpSettings.getActiveSettings();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'SMTP settings not configured'
      });
    }

    // Update the specific notification type
    switch (notificationType) {
      case 'leave':
        settings.enableLeaveNotifications = enabled;
        break;
      case 'correction':
        settings.enableCorrectionNotifications = enabled;
        break;
      case 'system':
        settings.enableSystemNotifications = enabled;
        break;
      case 'attendance':
        settings.enableAttendanceNotifications = enabled;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid notification type'
        });
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: `${notificationType} notifications ${enabled ? 'enabled' : 'disabled'}`,
      data: {
        notificationType,
        enabled
      }
    });

  } catch (error) {
    console.error('❌ Toggle notification type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle notification type',
      error: error.message
    });
  }
};

// Delete SMTP settings (Admin only)
exports.deleteSmtpSettings = async (req, res) => {
  try {
    const settings = await SmtpSettings.getActiveSettings();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'SMTP settings not found'
      });
    }

    await SmtpSettings.findByIdAndDelete(settings._id);

    res.status(200).json({
      success: true,
      message: 'SMTP settings deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete SMTP settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete SMTP settings',
      error: error.message
    });
  }
};