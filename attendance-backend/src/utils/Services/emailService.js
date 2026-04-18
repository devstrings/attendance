const nodemailer = require('nodemailer');
const SmtpSettings = require('../../models/SmtpSettings');

class EmailService {
  constructor() {
    this.transporter = null;
  }

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

  async testConnection() {
    try {
      const initialized = await this.initializeTransporter();
      if (!initialized) return { success: false, message: 'SMTP settings not configured' };
      await this.transporter.verify();
      await this.smtpSettings.updateTestStatus(true);
      return { success: true, message: 'SMTP connection successful' };
    } catch (error) {
      await this.smtpSettings.updateTestStatus(false, error.message);
      return { success: false, message: error.message };
    }
  }

  async sendTestEmail(recipientEmail) {
    try {
      const initialized = await this.initializeTransporter();
      if (!initialized) throw new Error('SMTP settings not configured');
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

  // ✅ Monthly Summary Email — with proper invoice + joining date logic
  async sendMonthlySummaryEmail({ toEmail, toName, monthLabel, summary, employeeName, role, joiningDate }) {
    try {
      const initialized = await this.initializeTransporter();
      if (!initialized) {
        console.warn('⚠️ Monthly summary email not sent - SMTP not configured');
        return { success: false, reason: 'SMTP not configured' };
      }

      const subject = '📊 ' + monthLabel + ' Salary Slip & Attendance Summary';
      const name    = role === 'manager' ? toName + ' (Manager)' : toName;
      const empName = role === 'manager' ? employeeName : toName;

      const now = new Date();
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const parts = monthLabel.split(' ');
      const mLabel = parts[0];
      const yLabel = parts[1];
      const monthIndex = monthNames.indexOf(mLabel);
      const isCurrentMonth = now.getMonth() === monthIndex && now.getFullYear() === parseInt(yLabel);

      let periodLabel = 'Full month of ' + monthLabel;
      let periodNote  = '';

      if (joiningDate) {
        const jDate  = new Date(joiningDate);
        const jMonth = jDate.getMonth();
        const jYear  = jDate.getFullYear();
        if (jMonth === monthIndex && jYear === parseInt(yLabel)) {
          const joinDay = jDate.getDate();
          const suffix  = joinDay === 1 ? 'st' : joinDay === 2 ? 'nd' : joinDay === 3 ? 'rd' : 'th';
          periodLabel   = monthLabel + ' (from ' + joinDay + suffix + ')';
          periodNote    = '<p style="background:#fff3cd;border-left:4px solid #f59e0b;padding:10px 14px;border-radius:6px;font-size:13px;color:#92400e;margin-bottom:16px;">'
            + 'This employee joined on <strong>' + jDate.toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' }) + '</strong>. Summary covers from joining date only.'
            + '</p>';
        }
      }

      if (isCurrentMonth) {
        periodLabel += ' (1st to ' + now.getDate() + 'th — month in progress)';
      }

      const baseSalary     = (summary.baseSalary     || 0).toLocaleString();
      const totalDeduction = (summary.totalDeduction || 0).toLocaleString();
      const netSalary      = (summary.netSalary      || 0).toLocaleString();
      const overtimeHours  = (summary.totalOvertimeHours || 0).toFixed(1);
      const currentYear    = new Date().getFullYear();

      const html = '<!DOCTYPE html>'
        + '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>'
        + '<body style="margin:0;padding:0;background:#f0f4f8;font-family:\'Segoe UI\',Arial,sans-serif;">'
        + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 0;">'
        + '<tr><td align="center">'
        + '<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">'

        // Header
        + '<tr><td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:36px 30px;text-align:center;">'
        + '<div style="font-size:44px;margin-bottom:8px;">📊</div>'
        + '<h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Salary Slip &amp; Attendance Summary</h1>'
        + '<p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:15px;">' + periodLabel + '</p>'
        + '</td></tr>'

        // Body
        + '<tr><td style="padding:32px 36px;">'
        + '<p style="color:#374151;font-size:16px;margin:0 0 6px;">Dear <strong>' + name + '</strong>,</p>'
        + '<p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 20px;">Please find below the attendance summary and salary slip for <strong>' + empName + '</strong>.</p>'
        + periodNote

        // Stats
        + '<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">'
        + '<tr>'
        + '<td width="22%" style="text-align:center;padding:14px 8px;background:#f0f9ff;border-radius:10px;">'
        + '<div style="font-size:22px;font-weight:800;color:#0ea5e9;">' + summary.totalWorkingDays + '</div>'
        + '<div style="font-size:11px;color:#6b7280;margin-top:4px;">Working Days</div></td>'
        + '<td width="4%"></td>'
        + '<td width="22%" style="text-align:center;padding:14px 8px;background:#f0fdf4;border-radius:10px;">'
        + '<div style="font-size:22px;font-weight:800;color:#10b981;">' + summary.totalPresent + '</div>'
        + '<div style="font-size:11px;color:#6b7280;margin-top:4px;">Present</div></td>'
        + '<td width="4%"></td>'
        + '<td width="22%" style="text-align:center;padding:14px 8px;background:#fff7ed;border-radius:10px;">'
        + '<div style="font-size:22px;font-weight:800;color:#f59e0b;">' + summary.totalApprovedLeaves + '</div>'
        + '<div style="font-size:11px;color:#6b7280;margin-top:4px;">Leaves</div></td>'
        + '<td width="4%"></td>'
        + '<td width="22%" style="text-align:center;padding:14px 8px;background:#fff5f5;border-radius:10px;">'
        + '<div style="font-size:22px;font-weight:800;color:#ef4444;">' + summary.totalUnauthorizedAbsences + '</div>'
        + '<div style="font-size:11px;color:#6b7280;margin-top:4px;">Absences</div></td>'
        + '</tr></table>'

        // Salary Table
        + '<h3 style="color:#374151;font-size:15px;margin:24px 0 12px;border-bottom:2px solid #e5e7eb;padding-bottom:8px;">💰 Salary Breakdown</h3>'
        + '<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">'
        + '<thead><tr style="background:#f9fafb;">'
        + '<th style="padding:12px 16px;text-align:left;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Description</th>'
        + '<th style="padding:12px 16px;text-align:right;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Value</th>'
        + '</tr></thead><tbody>'
        + '<tr><td style="padding:11px 16px;font-size:14px;color:#374151;border-bottom:1px solid #f3f4f6;">Base Salary</td>'
        + '<td style="padding:11px 16px;font-size:14px;color:#374151;text-align:right;border-bottom:1px solid #f3f4f6;">Rs. ' + baseSalary + '</td></tr>'
        + '<tr><td style="padding:11px 16px;font-size:14px;color:#374151;border-bottom:1px solid #f3f4f6;">Deduction per Absence</td>'
        + '<td style="padding:11px 16px;font-size:14px;color:#374151;text-align:right;border-bottom:1px solid #f3f4f6;">Rs. ' + summary.deductionPerAbsence + '</td></tr>'
        + '<tr><td style="padding:11px 16px;font-size:14px;color:#374151;border-bottom:1px solid #f3f4f6;">Unauthorized Absences</td>'
        + '<td style="padding:11px 16px;font-size:14px;color:#374151;text-align:right;border-bottom:1px solid #f3f4f6;">' + summary.totalUnauthorizedAbsences + ' days</td></tr>'
        + '<tr><td style="padding:11px 16px;font-size:14px;color:#374151;border-bottom:1px solid #f3f4f6;">Overtime Hours</td>'
        + '<td style="padding:11px 16px;font-size:14px;color:#374151;text-align:right;border-bottom:1px solid #f3f4f6;">' + overtimeHours + ' hrs</td></tr>'
        + '<tr style="background:#fff5f5;"><td style="padding:12px 16px;font-size:14px;font-weight:700;color:#dc2626;border-bottom:1px solid #f3f4f6;">Total Deduction</td>'
        + '<td style="padding:12px 16px;font-size:14px;font-weight:700;color:#dc2626;text-align:right;border-bottom:1px solid #f3f4f6;">- Rs. ' + totalDeduction + '</td></tr>'
        + '<tr style="background:#f0fdf4;"><td style="padding:14px 16px;font-size:16px;font-weight:700;color:#059669;">Net Salary Payable</td>'
        + '<td style="padding:14px 16px;font-size:18px;font-weight:800;color:#059669;text-align:right;">Rs. ' + netSalary + '</td></tr>'
        + '</tbody></table>'

        + '<p style="color:#9ca3af;font-size:12px;margin-top:20px;text-align:center;">Login to your dashboard to view and print your full salary slip.</p>'
        + '</td></tr>'

        // Footer
        + '<tr><td style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">'
        + '<p style="margin:0;color:#9ca3af;font-size:12px;">© ' + currentYear + ' Devstrings Attendance System — Automated Salary Slip</p>'
        + '</td></tr>'
        + '</table></td></tr></table></body></html>';

      const mailOptions = {
        ...this.defaultMailOptions,
        to: toEmail,
        subject,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      await this.smtpSettings.incrementEmailCount();
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Monthly summary email error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== EMAIL TEMPLATES ====================

  getTestEmailTemplate() {
    return '<html><body style="font-family:Arial,sans-serif;">'
      + '<div style="max-width:600px;margin:0 auto;padding:20px;">'
      + '<div style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0;">'
      + '<div style="font-size:48px;margin-bottom:10px;">✅</div>'
      + '<h1>SMTP Test Successful!</h1></div>'
      + '<div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px;">'
      + '<p>Congratulations! Your SMTP configuration is working correctly.</p>'
      + '<p>The Attendance System is now ready to send email notifications.</p>'
      + '<p><strong>Test Date:</strong> ' + new Date().toLocaleString() + '</p></div>'
      + '<div style="text-align:center;margin-top:20px;color:#777;font-size:12px;">'
      + '<p>This is an automated test email from Devstrings Attendance System</p></div>'
      + '</div></body></html>';
  }

  getLeaveRequestEmailTemplate(data) {
    const { employeeName, leaveType, fromDate, toDate, numberOfDays, reason } = data;
    return '<html><body style="font-family:Arial,sans-serif;">'
      + '<div style="max-width:600px;margin:0 auto;padding:20px;">'
      + '<div style="background:#3b82f6;color:white;padding:20px;text-align:center;border-radius:10px 10px 0 0;"><h2>🏖️ New Leave Request</h2></div>'
      + '<div style="background:#f9f9f9;padding:30px;">'
      + '<p>A new leave request has been submitted and requires your attention.</p>'
      + '<div style="background:white;padding:15px;border-left:4px solid #3b82f6;border-radius:4px;">'
      + '<p><strong>Employee:</strong> ' + employeeName + '</p>'
      + '<p><strong>Leave Type:</strong> ' + leaveType + '</p>'
      + '<p><strong>Duration:</strong> ' + numberOfDays + ' day(s)</p>'
      + '<p><strong>From:</strong> ' + new Date(fromDate).toLocaleDateString() + '</p>'
      + '<p><strong>To:</strong> ' + new Date(toDate).toLocaleDateString() + '</p>'
      + '<p><strong>Reason:</strong> ' + reason + '</p></div></div>'
      + '<div style="text-align:center;padding:12px;color:#777;font-size:12px;"><p>Devstrings Attendance System</p></div>'
      + '</div></body></html>';
  }

  getLeaveApprovedEmailTemplate(data) {
    const { employeeName, leaveType, fromDate, toDate, numberOfDays, approverName } = data;
    return '<html><body style="font-family:Arial,sans-serif;">'
      + '<div style="max-width:600px;margin:0 auto;padding:20px;">'
      + '<div style="background:#10b981;color:white;padding:20px;text-align:center;border-radius:10px 10px 0 0;"><h2>✅ Leave Request Approved</h2></div>'
      + '<div style="background:#f9f9f9;padding:30px;">'
      + '<div style="background:#d1fae5;padding:15px;border-left:4px solid #10b981;border-radius:4px;margin:15px 0;">'
      + '<p><strong>Good news ' + employeeName + '!</strong> Your leave request has been approved.</p></div>'
      + '<div style="background:white;padding:15px;border-radius:4px;">'
      + '<p><strong>Leave Type:</strong> ' + leaveType + '</p>'
      + '<p><strong>Duration:</strong> ' + numberOfDays + ' day(s)</p>'
      + '<p><strong>From:</strong> ' + new Date(fromDate).toLocaleDateString() + '</p>'
      + '<p><strong>To:</strong> ' + new Date(toDate).toLocaleDateString() + '</p>'
      + '<p><strong>Approved By:</strong> ' + approverName + '</p></div></div>'
      + '<div style="text-align:center;padding:12px;color:#777;font-size:12px;"><p>Devstrings Attendance System</p></div>'
      + '</div></body></html>';
  }

  getLeaveRejectedEmailTemplate(data) {
    const { employeeName, leaveType, fromDate, toDate, rejectionReason, approverName } = data;
    return '<html><body style="font-family:Arial,sans-serif;">'
      + '<div style="max-width:600px;margin:0 auto;padding:20px;">'
      + '<div style="background:#ef4444;color:white;padding:20px;text-align:center;border-radius:10px 10px 0 0;"><h2>❌ Leave Request Not Approved</h2></div>'
      + '<div style="background:#f9f9f9;padding:30px;">'
      + '<p>Dear ' + employeeName + ',</p>'
      + '<p>Your leave request has been reviewed and unfortunately cannot be approved at this time.</p>'
      + '<div style="background:white;padding:15px;border-radius:4px;">'
      + '<p><strong>Leave Type:</strong> ' + leaveType + '</p>'
      + '<p><strong>Dates:</strong> ' + new Date(fromDate).toLocaleDateString() + ' - ' + new Date(toDate).toLocaleDateString() + '</p>'
      + '<p><strong>Reviewed By:</strong> ' + approverName + '</p></div>'
      + (rejectionReason ? '<div style="background:#fee2e2;padding:15px;border-left:4px solid #ef4444;border-radius:4px;margin:15px 0;"><p><strong>Reason:</strong> ' + rejectionReason + '</p></div>' : '')
      + '</div>'
      + '<div style="text-align:center;padding:12px;color:#777;font-size:12px;"><p>Devstrings Attendance System</p></div>'
      + '</div></body></html>';
  }

  getCorrectionRequestEmailTemplate(data) {
    const { employeeName, attendanceDate, currentStatus, requestedStatus, reason, issueType } = data;
    return '<html><body style="font-family:Arial,sans-serif;">'
      + '<div style="max-width:600px;margin:0 auto;padding:20px;">'
      + '<div style="background:#f59e0b;color:white;padding:20px;text-align:center;border-radius:10px 10px 0 0;"><h2>⚠️ Attendance Correction Request</h2></div>'
      + '<div style="background:#f9f9f9;padding:30px;">'
      + '<div style="background:white;padding:15px;border-left:4px solid #f59e0b;border-radius:4px;">'
      + '<p><strong>Employee:</strong> ' + employeeName + '</p>'
      + '<p><strong>Date:</strong> ' + new Date(attendanceDate).toLocaleDateString() + '</p>'
      + '<p><strong>Issue Type:</strong> ' + issueType + '</p>'
      + '<p><strong>Status Change:</strong> ' + currentStatus + ' → ' + requestedStatus + '</p>'
      + '<p><strong>Reason:</strong> ' + reason + '</p></div></div>'
      + '<div style="text-align:center;padding:12px;color:#777;font-size:12px;"><p>Devstrings Attendance System</p></div>'
      + '</div></body></html>';
  }

  getSystemUpdateEmailTemplate(data) {
    const { updateType, updateDetails, affectedUsers } = data;
    return '<html><body style="font-family:Arial,sans-serif;">'
      + '<div style="max-width:600px;margin:0 auto;padding:20px;">'
      + '<div style="background:#8b5cf6;color:white;padding:20px;text-align:center;border-radius:10px 10px 0 0;"><h2>📢 System Update Notification</h2></div>'
      + '<div style="background:#f9f9f9;padding:30px;">'
      + '<div style="background:white;padding:20px;border-left:4px solid #8b5cf6;border-radius:4px;">'
      + '<h3>' + updateType + '</h3>'
      + '<p>' + updateDetails + '</p>'
      + '<p><small>This update affects: ' + affectedUsers + '</small></p></div></div>'
      + '<div style="text-align:center;padding:12px;color:#777;font-size:12px;"><p>Devstrings Attendance System — ' + new Date().toLocaleDateString() + '</p></div>'
      + '</div></body></html>';
  }
}

module.exports = new EmailService();