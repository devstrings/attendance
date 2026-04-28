const nodemailer = require('nodemailer');

/**
 * Create Email Transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Send Email
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email
 * @param {String} options.subject - Email subject
 * @param {String} options.text - Plain text content
 * @param {String} options.html - HTML content
 * @returns {Promise} Email info
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Attendance System'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Send email error:', error);
    throw new Error('Failed to send email');
  }
};

/**
 * Send Welcome Email
 * @param {Object} data - Email data
 */
const sendWelcomeEmail = async ({ to, name, email, password, role }) => {
  const subject = 'Welcome to Attendance Management System';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .credentials { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #4CAF50; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Attendance System</h1>
        </div>
        <div class="content">
          <h2>Hello ${name}!</h2>
          <p>Your ${role} account has been created successfully.</p>
          
          <div class="credentials">
            <h3>Login Credentials:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${password}</p>
          </div>
          
          <p>Please login and change your password immediately for security purposes.</p>
          
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login Now</a>
          
          <p style="margin-top: 20px;">If you didn't expect this email, please contact the administrator.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Attendance Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to, subject, html });
};

/**
 * Send OTP Email
 * @param {Object} data - Email data
 */
const sendOTPEmail = async ({ to, otp, name }) => {
  const subject = 'Password Reset OTP';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .otp-box { background: white; padding: 20px; margin: 20px 0; text-align: center; border: 2px dashed #2196F3; }
        .otp { font-size: 32px; font-weight: bold; color: #2196F3; letter-spacing: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${name || 'User'}!</h2>
          <p>You requested to reset your password. Use the OTP below to proceed:</p>
          
          <div class="otp-box">
            <p>Your OTP is:</p>
            <div class="otp">${otp}</div>
          </div>
          
          <p><strong>This OTP will expire in 10 minutes.</strong></p>
          
          <p>If you didn't request this, please ignore this email and ensure your account is secure.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Attendance Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to, subject, html });
};

/**
 * Send Password Changed Email
 * @param {Object} data - Email data
 */
const sendPasswordChangedEmail = async ({ to, name }) => {
  const subject = 'Password Changed Successfully';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Changed</h1>
        </div>
        <div class="content">
          <h2>Hello ${name || 'User'}!</h2>
          <p>Your password has been changed successfully.</p>
          <p>If you didn't make this change, please contact the administrator immediately.</p>
          <p>Date: ${new Date().toLocaleString()}</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Attendance Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to, subject, html });
};

/**
 * Send Leave Request Email (to Manager)
 * @param {Object} data - Email data
 */
const sendLeaveRequestEmail = async ({ to, employeeName, leaveType, startDate, endDate, numberOfDays, reason }) => {
  const subject = 'New Leave Request';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .details { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #FF9800; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Leave Request</h1>
        </div>
        <div class="content">
          <p>A new leave request has been submitted:</p>
          
          <div class="details">
            <p><strong>Employee:</strong> ${employeeName}</p>
            <p><strong>Leave Type:</strong> ${leaveType}</p>
            <p><strong>Duration:</strong> ${startDate} to ${endDate}</p>
            <p><strong>Number of Days:</strong> ${numberOfDays}</p>
            <p><strong>Reason:</strong> ${reason}</p>
          </div>
          
          <p>Please login to the system to approve or reject this request.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Attendance Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to, subject, html });
};

/**
 * Send Leave Status Update Email
 * @param {Object} data - Email data
 */
const sendLeaveStatusEmail = async ({ to, employeeName, status, leaveType, startDate, endDate, rejectionReason }) => {
  const subject = `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`;
  const statusColor = status === 'approved' ? '#4CAF50' : '#F44336';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${statusColor}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .details { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid ${statusColor}; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}</h1>
        </div>
        <div class="content">
          <h2>Hello ${employeeName}!</h2>
          <p>Your leave request has been <strong>${status}</strong>.</p>
          
          <div class="details">
            <p><strong>Leave Type:</strong> ${leaveType}</p>
            <p><strong>Duration:</strong> ${startDate} to ${endDate}</p>
            ${status === 'rejected' && rejectionReason ? `<p><strong>Reason for Rejection:</strong> ${rejectionReason}</p>` : ''}
          </div>
          
          ${status === 'approved' ? '<p>Enjoy your leave!</p>' : '<p>If you have any questions, please contact your manager.</p>'}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Attendance Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to, subject, html });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOTPEmail,
  sendPasswordChangedEmail,
  sendLeaveRequestEmail,
  sendLeaveStatusEmail
};