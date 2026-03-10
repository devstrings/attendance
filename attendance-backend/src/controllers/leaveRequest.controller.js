const LeaveRequest = require('../models/LeaveRequest');
const notificationService = require('../utils/notificationService');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Manager = require('../models/Manager');
const MonthlyConfig = require('../models/MonthlyConfig');
const SystemConfig = require('../models/SystemConfig');
const SystemSettings = require('../models/SystemSettings');
const Attendance = require('../models/Attendance');
const emailService = require('../utils/emailService'); // ✅ ADD EMAIL

// ===== HELPERS =====
const getAllowedLeaves = async () => {
  const sysConfig = await SystemConfig.findOne({}).sort({ updatedAt: -1 });
  const sysSettings = await SystemSettings.findOne({}).sort({ updatedAt: -1 });
  const monthlyConfig = await MonthlyConfig.findOne({}).sort({ updatedAt: -1 });
  return sysConfig?.leavePolicy?.allowedLeaves || sysSettings?.leavePolicy?.allowedLeavesPerMonth || monthlyConfig?.allowedLeavesPerMonth || 2;
};

const getAutoMarkAbsent = async () => {
  const sysConfig = await SystemConfig.findOne({}).sort({ updatedAt: -1 });
  const sysSettings = await SystemSettings.findOne({}).sort({ updatedAt: -1 });
  const monthlyConfig = await MonthlyConfig.findOne({}).sort({ updatedAt: -1 });
  if (sysConfig?.leavePolicy?.autoAbsentOnExceed !== undefined) return sysConfig.leavePolicy.autoAbsentOnExceed;
  if (sysSettings?.leavePolicy?.autoMarkAbsent !== undefined) return sysSettings.leavePolicy.autoMarkAbsent;
  if (monthlyConfig?.autoMarkAbsent !== undefined) return monthlyConfig.autoMarkAbsent;
  return false;
};

const markAttendanceAsLeave = async (employeeId, managerId, fromDate, toDate, leaveType, reason, markedBy) => {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  for (let date = new Date(from); date <= to; date.setDate(date.getDate() + 1)) {
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    let attendance = await Attendance.findOne({ employeeId, date: attendanceDate });
    if (attendance) {
      attendance.status = 'leave';
      attendance.leaveType = leaveType;
      attendance.remarks = `Leave approved: ${reason}`;
      await attendance.save();
    } else {
      attendance = new Attendance({
        employeeId, managerId: managerId || employeeId,
        date: attendanceDate,
        clockIn: new Date(attendanceDate.getTime() + 10 * 60 * 60 * 1000),
        status: 'leave', leaveType,
        remarks: `Leave approved: ${reason}`,
        markedBy, isApproved: true, approvedBy: markedBy
      });
      await attendance.save();
    }
  }
};

// ===== Get Leave Policy =====
exports.getLeavePolicy = async (req, res) => {
  try {
    const userId = req.user._id;
    const employee = await Employee.findOne({ userId }).populate('userId');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    const allowedLeavesPerMonth = await getAllowedLeaves();
    const autoMarkAbsent = await getAutoMarkAbsent();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const currentMonthLeaves = await LeaveRequest.find({ employee: employee._id, status: { $in: ['approved', 'pending'] }, fromDate: { $gte: startOfMonth, $lte: endOfMonth } });
    const usedLeaves = currentMonthLeaves.reduce((sum, l) => sum + l.numberOfDays, 0);
    res.status(200).json({ success: true, data: { policy: { allowedLeavesPerMonth, autoMarkAbsent }, balance: { allowed: allowedLeavesPerMonth, used: usedLeaves, remaining: Math.max(0, allowedLeavesPerMonth - usedLeaves), currentMonth: now.toLocaleString('default', { month: 'long', year: 'numeric' }) } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch leave policy', error: error.message });
  }
};

// ===== Employee: Create Leave Request =====
exports.createLeaveRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { leaveType, fromDate, toDate, numberOfDays, reason, attachments } = req.body;
    if (!leaveType || !fromDate || !toDate || !reason) return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    if (new Date(fromDate) > new Date(toDate)) return res.status(400).json({ success: false, message: 'From date cannot be after to date' });
    const employee = await Employee.findOne({ userId }).populate('userId');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    const employeeName = employee.fullName || `${employee.firstName} ${employee.lastName}`;
    const employeeEmail = employee.userId?.email || '';
    const allowedLeavesPerMonth = await getAllowedLeaves();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const currentMonthLeaves = await LeaveRequest.find({ employee: employee._id, status: { $in: ['approved', 'pending'] }, fromDate: { $gte: startOfMonth, $lte: endOfMonth } });
    const usedLeaves = currentMonthLeaves.reduce((sum, l) => sum + l.numberOfDays, 0);
    const requestedDays = numberOfDays || 1;
    if (usedLeaves + requestedDays > allowedLeavesPerMonth) return res.status(400).json({ success: false, message: `Leave limit exceeded! You have ${allowedLeavesPerMonth - usedLeaves} days remaining.` });
    const leaveRequest = new LeaveRequest({ employee: employee._id, employeeName, employeeEmail, leaveType, fromDate: new Date(fromDate), toDate: new Date(toDate), numberOfDays: requestedDays, reason, attachments: attachments || [], status: 'pending' });
    await leaveRequest.save();
    try { await notificationService.notifyLeaveRequest(leaveRequest, { name: employeeName, email: employeeEmail }); } catch (e) { console.error('⚠️ Notification error:', e); }
    res.status(201).json({ success: true, message: 'Leave request submitted successfully', data: leaveRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create leave request', error: error.message });
  }
};

// ===== Employee: Get My Leave Requests =====
exports.getMyLeaveRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, year } = req.query;
    const employee = await Employee.findOne({ userId });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });
    const query = { employee: employee._id };
    if (status) query.status = status;
    if (year) query.fromDate = { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31, 23, 59, 59) };
    const leaveRequests = await LeaveRequest.find(query).sort({ createdAt: -1 }).populate('approvedBy', 'firstName lastName');
    let stats = { totalApproved: 0, totalDays: 0, pending: 0, rejected: 0 };
    try { stats = await LeaveRequest.getEmployeeLeaveStats(employee._id, year || new Date().getFullYear()); } catch (e) {}
    res.status(200).json({ success: true, data: { leaveRequests, stats } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch leave requests', error: error.message });
  }
};

// ===== Admin/Manager: Get All Leave Requests =====
exports.getAllLeaveRequests = async (req, res) => {
  try {
    const { status, employeeId, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (employeeId) query.employee = employeeId;
    const leaveRequests = await LeaveRequest.find(query).sort({ createdAt: -1 }).limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit)).populate('employee', 'firstName lastName employeeCode').populate('approvedBy');
    const total = await LeaveRequest.countDocuments(query);
    const pendingCount = await LeaveRequest.getPendingCount();
    res.status(200).json({ success: true, data: { leaveRequests, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / limit), total, limit: parseInt(limit) }, pendingCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch leave requests', error: error.message });
  }
};

exports.getLeaveRequestById = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.requestId).populate('employee', 'firstName lastName employeeCode phoneNumber').populate('approvedBy');
    if (!leaveRequest) return res.status(404).json({ success: false, message: 'Leave request not found' });
    res.status(200).json({ success: true, data: leaveRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch leave request', error: error.message });
  }
};

// ===== APPROVE Leave Request =====
exports.approveLeaveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const leaveRequest = await LeaveRequest.findById(requestId).populate('employee');
    if (!leaveRequest) return res.status(404).json({ success: false, message: 'Leave request not found' });
    if (leaveRequest.status !== 'pending') return res.status(400).json({ success: false, message: `Leave request is already ${leaveRequest.status}` });

    let approverName = 'Admin';
    if (userRole === 'manager') {
      const mgr = await Manager.findOne({ userId });
      approverName = mgr ? `${mgr.firstName} ${mgr.lastName}` : 'Manager';
    }

    leaveRequest.status = 'approved';
    leaveRequest.approvedBy = userId;
    leaveRequest.approverModel = 'User';
    leaveRequest.approverName = approverName;
    leaveRequest.approvedAt = new Date();
    await leaveRequest.save();

    // Mark attendance
    try {
      const empDoc = leaveRequest.employee;
      await markAttendanceAsLeave(empDoc._id, empDoc.managerId || userId, leaveRequest.fromDate, leaveRequest.toDate, leaveRequest.leaveType, leaveRequest.reason, userId);
    } catch (e) { console.error('⚠️ Attendance error:', e.message); }

    // ✅ Employee notification + email
    try {
      const empWithUser = await Employee.findById(leaveRequest.employee._id).populate('userId');
      if (empWithUser?.userId) {
        const empName = empWithUser.fullName || `${empWithUser.firstName} ${empWithUser.lastName}`;
        const empEmail = empWithUser.userId.email;

        // DB notification
        await notificationService.createNotification(
          empWithUser.userId._id,
          '✅ Leave Request Approved',
          `Your ${leaveRequest.leaveType} leave for ${leaveRequest.numberOfDays} day(s) from ${new Date(leaveRequest.fromDate).toLocaleDateString()} has been approved by ${approverName}.`,
          'leave_approved', '/employee/notifications',
          { leaveRequestId: leaveRequest._id, approverName, leaveType: leaveRequest.leaveType, numberOfDays: leaveRequest.numberOfDays, fromDate: leaveRequest.fromDate, toDate: leaveRequest.toDate }
        );

        // ✅ Email
        if (empEmail) {
          try {
            await emailService.sendNotificationEmail(
              empEmail,
              '✅ Leave Request Approved – Attendance System',
              emailService.getLeaveApprovedEmailTemplate({ employeeName: empName, leaveType: leaveRequest.leaveType, fromDate: leaveRequest.fromDate, toDate: leaveRequest.toDate, numberOfDays: leaveRequest.numberOfDays, approverName })
            );
            console.log('📧 Approval email sent to:', empEmail);
          } catch (e) { console.error('⚠️ Approval email failed:', e.message); }
        }
      }
    } catch (e) { console.error('⚠️ Employee notification error:', e.message); }

    // ✅ Manager notification + email (if admin approved)
    if (userRole === 'admin') {
      try {
        const empDoc = await Employee.findById(leaveRequest.employee._id);
        if (empDoc?.managerId) {
          const mgrDoc = await Manager.findById(empDoc.managerId).populate('userId');
          if (mgrDoc?.userId) {
            const empName = empDoc.fullName || `${empDoc.firstName} ${empDoc.lastName}`;
            await notificationService.createNotification(
              mgrDoc.userId._id,
              '📋 Leave Approved by Admin',
              `Admin approved ${empName}'s ${leaveRequest.leaveType} leave from ${new Date(leaveRequest.fromDate).toLocaleDateString()} to ${new Date(leaveRequest.toDate).toLocaleDateString()}.`,
              'leave_approved', '/manager/notifications',
              { leaveRequestId: leaveRequest._id, employeeName: empName }
            );
            if (mgrDoc.userId.email) {
              try {
                await emailService.sendNotificationEmail(
                  mgrDoc.userId.email,
                  `📋 Leave Approved – ${empName}`,
                  emailService.getLeaveApprovedEmailTemplate({ employeeName: empName, leaveType: leaveRequest.leaveType, fromDate: leaveRequest.fromDate, toDate: leaveRequest.toDate, numberOfDays: leaveRequest.numberOfDays, approverName: 'Admin' })
                );
              } catch (e) { console.error('⚠️ Manager email failed:', e.message); }
            }
          }
        }
      } catch (e) { console.error('⚠️ Manager notification error:', e.message); }
    }

    res.status(200).json({ success: true, message: 'Leave approved, attendance marked, notifications and emails sent', data: leaveRequest });
  } catch (error) {
    console.error('❌ Approve leave error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve leave request', error: error.message });
  }
};

// ===== REJECT Leave Request =====
exports.rejectLeaveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const leaveRequest = await LeaveRequest.findById(requestId).populate('employee');
    if (!leaveRequest) return res.status(404).json({ success: false, message: 'Leave request not found' });
    if (leaveRequest.status !== 'pending') return res.status(400).json({ success: false, message: `Leave request is already ${leaveRequest.status}` });

    let approverName = 'Admin';
    if (userRole === 'manager') {
      const mgr = await Manager.findOne({ userId });
      approverName = mgr ? `${mgr.firstName} ${mgr.lastName}` : 'Manager';
    }

    leaveRequest.status = 'rejected';
    leaveRequest.approvedBy = userId;
    leaveRequest.approverModel = 'User';
    leaveRequest.approverName = approverName;
    leaveRequest.approvedAt = new Date();
    leaveRequest.rejectionReason = rejectionReason || 'No reason provided';
    await leaveRequest.save();

    // ✅ Employee notification + email
    try {
      const empWithUser = await Employee.findById(leaveRequest.employee._id).populate('userId');
      if (empWithUser?.userId) {
        const empName = empWithUser.fullName || `${empWithUser.firstName} ${empWithUser.lastName}`;
        const empEmail = empWithUser.userId.email;

        // DB notification
        await notificationService.createNotification(
          empWithUser.userId._id,
          '❌ Leave Request Rejected',
          `Your ${leaveRequest.leaveType} leave request has been rejected by ${approverName}. Reason: ${rejectionReason || 'No reason provided'}`,
          'leave_rejected', '/employee/notifications',
          { leaveRequestId: leaveRequest._id, approverName, rejectionReason: rejectionReason || 'No reason provided', leaveType: leaveRequest.leaveType, fromDate: leaveRequest.fromDate, toDate: leaveRequest.toDate }
        );

        // ✅ Email to employee
        if (empEmail) {
          try {
            await emailService.sendNotificationEmail(
              empEmail,
              '❌ Leave Request Not Approved – Attendance System',
              emailService.getLeaveRejectedEmailTemplate({
                employeeName: empName,
                leaveType: leaveRequest.leaveType,
                fromDate: leaveRequest.fromDate,
                toDate: leaveRequest.toDate,
                rejectionReason: rejectionReason || 'No reason provided',
                approverName
              })
            );
            console.log('📧 Rejection email sent to:', empEmail);
          } catch (emailErr) {
            console.error('⚠️ Rejection email failed (non-fatal):', emailErr.message);
          }
        }
      }
    } catch (e) { console.error('⚠️ Rejection notification error:', e.message); }

    res.status(200).json({ success: true, message: 'Leave rejected, notification and email sent', data: leaveRequest });
  } catch (error) {
    console.error('❌ Reject leave error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject leave request', error: error.message });
  }
};

// ===== Cancel Leave Request =====
exports.cancelLeaveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;
    const employee = await Employee.findOne({ userId });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });
    const leaveRequest = await LeaveRequest.findById(requestId);
    if (!leaveRequest) return res.status(404).json({ success: false, message: 'Leave request not found' });
    if (leaveRequest.employee.toString() !== employee._id.toString()) return res.status(403).json({ success: false, message: 'Unauthorized' });
    if (leaveRequest.status !== 'pending') return res.status(400).json({ success: false, message: 'Can only cancel pending requests' });
    leaveRequest.status = 'cancelled';
    await leaveRequest.save();
    res.status(200).json({ success: true, message: 'Leave request cancelled successfully', data: leaveRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel leave request', error: error.message });
  }
};

// ===== Add Comment =====
exports.addComment = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;
    if (!text) return res.status(400).json({ success: false, message: 'Comment text is required' });
    const leaveRequest = await LeaveRequest.findById(requestId);
    if (!leaveRequest) return res.status(404).json({ success: false, message: 'Leave request not found' });
    let userName = 'User';
    if (userRole === 'employee') { const e = await Employee.findOne({ userId }); userName = e ? `${e.firstName} ${e.lastName}` : 'Employee'; }
    else if (userRole === 'manager') { const m = await Manager.findOne({ userId }); userName = m ? `${m.firstName} ${m.lastName}` : 'Manager'; }
    else if (userRole === 'admin') userName = 'Admin';
    leaveRequest.comments.push({ by: userId, byModel: 'User', byName: userName, text, createdAt: new Date() });
    await leaveRequest.save();
    res.status(200).json({ success: true, message: 'Comment added successfully', data: leaveRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add comment', error: error.message });
  }
};