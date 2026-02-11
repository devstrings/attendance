const nodemailer = require('nodemailer');
const SmtpSettings = require('../models/SmtpSettings');

class EmailService {
  constructor() {
    this.transporter = null;
  }

  // Initialize transporter with SMTP settings
  async initializeTransporter() {
    try {
      const smtpSettings = await SmtpSettings.getActiveSettings();
      
      if (!smtpSettings) {
        console.warn('⚠️ No active SMTP settings found');
        return false;
      }

      this.transporter = nodemailer.createTransport(smtpSettings.getMailerConfig());
      this.defaultMailOptions = smtpSettings.getDefaultMailOptions();
      this.smtpSettings = smtpSettings;
      
      return true;
    } catch (error) {
      console.error('❌ Email transporter initialization error:', error);
      return false;
    }
  }

  // Test SMTP connection
  async testConnection() {
    try {
      const initialized = await this.initializeTransporter();
      if (!initialized) {
        return { success: false, message: 'SMTP settings not configured' };
      }

      await this.transporter.verify();
      await this.smtpSettings.updateTestStatus(true);
      
      return { success: true, message: 'SMTP connection successful' };
    } catch (error) {
      await this.smtpSettings.updateTestStatus(false, error.message);
      return { success: false, message: error.message };
    }
  }

  // Send test email
  async sendTestEmail(recipientEmail) {
    try {
      const initialized = await this.initializeTransporter();
      if (!initialized) {
        throw new Error('SMTP settings not configured');
      }

      const mailOptions = {
        ...this.defaultMailOptions,
        to: recipientEmail,
        subject: '✅ Test Email - Attendance System',
        html: this.getTestEmailTemplate()
      };

      const info = await this.transporter.sendMail(mailOptions);
      await this.smtpSettings.incrementEmailCount();

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Test email error:', error);
      throw error;
    }
  }

  // Send notification email
  async sendNotificationEmail(recipientEmail, subject, htmlContent) {
    try {
      const initialized = await this.initializeTransporter();
      if (!initialized) {
        console.warn('⚠️ Email not sent - SMTP not configured');
        return { success: false, reason: 'SMTP not configured' };
      }

      const mailOptions = {
        ...this.defaultMailOptions,
        to: recipientEmail,
        subject: subject,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      await this.smtpSettings.incrementEmailCount();

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== EMAIL TEMPLATES ====================

  getTestEmailTemplate() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-icon { font-size: 48px; margin-bottom: 10px; }
          .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✅</div>
            <h1>SMTP Test Successful!</h1>
          </div>
          <div class="content">
            <p>Congratulations! Your SMTP configuration is working correctly.</p>
            <p>The Attendance System is now ready to send email notifications.</p>
            <p><strong>Test Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div class="footer">
            <p>This is an automated test email from Devstrings Attendance System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getLeaveRequestEmailTemplate(data) {
    const { employeeName, leaveType, fromDate, toDate, numberOfDays, reason, requestId } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .info-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #3b82f6; border-radius: 4px; }
          .label { font-weight: bold; color: #555; }
          .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🏖️ New Leave Request</h2>
          </div>
          <div class="content">
            <p>A new leave request has been submitted and requires your attention.</p>
            
            <div class="info-box">
              <p><span class="label">Employee:</span> ${employeeName}</p>
              <p><span class="label">Leave Type:</span> ${leaveType}</p>
              <p><span class="label">Duration:</span> ${numberOfDays} day(s)</p>
              <p><span class="label">From:</span> ${new Date(fromDate).toLocaleDateString()}</p>
              <p><span class="label">To:</span> ${new Date(toDate).toLocaleDateString()}</p>
              <p><span class="label">Reason:</span> ${reason}</p>
            </div>

            <p style="text-align: center; margin-top: 20px;">
              <a href="${process.env.ADMIN_FRONTEND_URL}/admin/leave-requests" class="button">Review Request</a>
            </p>
          </div>
          <div class="footer">
            <p>Devstrings Attendance System - Automated Notification</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getLeaveApprovedEmailTemplate(data) {
    const { employeeName, leaveType, fromDate, toDate, numberOfDays, approverName } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .success { background: #d1fae5; padding: 15px; border-left: 4px solid #10b981; border-radius: 4px; margin: 15px 0; }
          .info-box { background: white; padding: 15px; margin: 10px 0; border-radius: 4px; }
          .label { font-weight: bold; color: #555; }
          .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>✅ Leave Request Approved</h2>
          </div>
          <div class="content">
            <div class="success">
              <p><strong>Good news ${employeeName}!</strong> Your leave request has been approved.</p>
            </div>
            
            <div class="info-box">
              <p><span class="label">Leave Type:</span> ${leaveType}</p>
              <p><span class="label">Duration:</span> ${numberOfDays} day(s)</p>
              <p><span class="label">From:</span> ${new Date(fromDate).toLocaleDateString()}</p>
              <p><span class="label">To:</span> ${new Date(toDate).toLocaleDateString()}</p>
              <p><span class="label">Approved By:</span> ${approverName}</p>
            </div>

            <p>Your attendance will be automatically marked as "Leave" for the approved dates.</p>
          </div>
          <div class="footer">
            <p>Devstrings Attendance System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getLeaveRejectedEmailTemplate(data) {
    const { employeeName, leaveType, fromDate, toDate, rejectionReason, approverName } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .warning { background: #fee2e2; padding: 15px; border-left: 4px solid #ef4444; border-radius: 4px; margin: 15px 0; }
          .info-box { background: white; padding: 15px; margin: 10px 0; border-radius: 4px; }
          .label { font-weight: bold; color: #555; }
          .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>❌ Leave Request Not Approved</h2>
          </div>
          <div class="content">
            <p>Dear ${employeeName},</p>
            <p>Your leave request has been reviewed and unfortunately cannot be approved at this time.</p>
            
            <div class="info-box">
              <p><span class="label">Leave Type:</span> ${leaveType}</p>
              <p><span class="label">Dates:</span> ${new Date(fromDate).toLocaleDateString()} - ${new Date(toDate).toLocaleDateString()}</p>
              <p><span class="label">Reviewed By:</span> ${approverName}</p>
            </div>

            ${rejectionReason ? `
              <div class="warning">
                <p><strong>Reason:</strong> ${rejectionReason}</p>
              </div>
            ` : ''}

            <p>If you have questions, please contact your manager or HR department.</p>
          </div>
          <div class="footer">
            <p>Devstrings Attendance System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getCorrectionRequestEmailTemplate(data) {
    const { employeeName, attendanceDate, currentStatus, requestedStatus, reason, issueType } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .info-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #f59e0b; border-radius: 4px; }
          .label { font-weight: bold; color: #555; }
          .status-change { display: flex; align-items: center; margin: 15px 0; }
          .status { padding: 8px 15px; border-radius: 20px; margin: 0 10px; }
          .current { background: #fee2e2; color: #991b1b; }
          .requested { background: #dcfce7; color: #166534; }
          .button { display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⚠️ Attendance Correction Request</h2>
          </div>
          <div class="content">
            <p>An employee has reported an attendance discrepancy that needs your review.</p>
            
            <div class="info-box">
              <p><span class="label">Employee:</span> ${employeeName}</p>
              <p><span class="label">Date:</span> ${new Date(attendanceDate).toLocaleDateString()}</p>
              <p><span class="label">Issue Type:</span> ${issueType}</p>
              
              <div class="status-change">
                <span class="status current">Current: ${currentStatus}</span>
                <span>→</span>
                <span class="status requested">Requested: ${requestedStatus}</span>
              </div>
              
              <p><span class="label">Reason:</span> ${reason}</p>
            </div>

            <p style="text-align: center; margin-top: 20px;">
              <a href="${process.env.ADMIN_FRONTEND_URL}/admin/correction-requests" class="button">Review Request</a>
            </p>
          </div>
          <div class="footer">
            <p>Devstrings Attendance System - Automated Notification</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getSystemUpdateEmailTemplate(data) {
    const { updateType, updateDetails, affectedUsers } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .announcement { background: white; padding: 20px; margin: 15px 0; border-left: 4px solid #8b5cf6; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📢 System Update Notification</h2>
          </div>
          <div class="content">
            <div class="announcement">
              <h3>${updateType}</h3>
              <p>${updateDetails}</p>
              <p><small>This update affects: ${affectedUsers}</small></p>
            </div>
            <p>For questions or concerns, please contact your system administrator.</p>
          </div>
          <div class="footer">
            <p>Devstrings Attendance System</p>
            <p>${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();