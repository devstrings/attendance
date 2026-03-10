const LeaveRequest = require('../models/LeaveRequest');
const notificationService = require('../utils/notificationService');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Manager = require('../models/Manager');
const MonthlyConfig = require('../models/MonthlyConfig');
const SystemConfig = require('../models/SystemConfig');
const SystemSettings = require('../models/SystemSettings');
const Attendance = require('../models/Attendance');

// ===== HELPER: Get Allowed Leaves =====
const getAllowedLeaves = async () => {
  const sysConfig = await SystemConfig.findOne({}).sort({ updatedAt: -1 });
  const sysSettings = await SystemSettings.findOne({}).sort({ updatedAt: -1 });
  const monthlyConfig = await MonthlyConfig.findOne({}).sort({ updatedAt: -1 });

  return (
    sysConfig?.leavePolicy?.allowedLeaves ||
    sysSettings?.leavePolicy?.allowedLeavesPerMonth ||
    monthlyConfig?.allowedLeavesPerMonth ||
    2
  );
};

// ===== HELPER: Get Auto Mark Absent =====
const getAutoMarkAbsent = async () => {
  const sysConfig = await SystemConfig.findOne({}).sort({ updatedAt: -1 });
  const sysSettings = await SystemSettings.findOne({}).sort({ updatedAt: -1 });
  const monthlyConfig = await MonthlyConfig.findOne({}).sort({ updatedAt: -1 });

  if (sysConfig?.leavePolicy?.autoAbsentOnExceed !== undefined) return sysConfig.leavePolicy.autoAbsentOnExceed;
  if (sysSettings?.leavePolicy?.autoMarkAbsent !== undefined) return sysSettings.leavePolicy.autoMarkAbsent;
  if (monthlyConfig?.autoMarkAbsent !== undefined) return monthlyConfig.autoMarkAbsent;
  return false;
};

// ===== HELPER: Get Employee with User Data =====
const getEmployeeWithUser = async (employeeId) => {
  const employee = await Employee.findById(employeeId).populate('userId');
  if (!employee) throw new Error('Employee not found');
  return {
    _id: employee._id,
    userId: employee.userId?._id,
    name: employee.fullName || `${employee.firstName} ${employee.lastName}`,
    email: employee.userId?.email || 'no-email@example.com',
    employeeCode: employee.employeeCode,
    managerId: employee.managerId
  };
};

// ===== HELPER: Mark Attendance as Leave =====
// ✅ FIX: employeeId field use kiya (employee nahi)
const markAttendanceAsLeave = async (employeeId, managerId, fromDate, toDate, leaveType, reason, markedBy) => {
  const from = new Date(fromDate);
  const to = new Date(toDate);

  for (let date = new Date(from); date <= to; date.setDate(date.getDate() + 1)) {
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // ✅ FIX: employeeId field se dhundho
    let attendance = await Attendance.findOne({
      employeeId: employeeId,
      date: attendanceDate
    });

    if (attendance) {
      // Update existing
      attendance.status = 'leave';
      attendance.leaveType = leaveType;
      attendance.remarks = `Leave approved: ${reason}`;
      await attendance.save();
      console.log(`✅ Updated attendance to LEAVE for ${attendanceDate.toDateString()}`);
    } else {
      // ✅ FIX: Naya record banao - managerId required hai Attendance model mein
      // Agar managerId nahi hai to dummy value use karo
      const attendanceManagerId = managerId || employeeId; // fallback

      attendance = new Attendance({
        employeeId: employeeId,          // ✅ employeeId field
        managerId: attendanceManagerId,   // ✅ required field
        date: attendanceDate,
        clockIn: new Date(attendanceDate.getTime() + 10 * 60 * 60 * 1000), // 10 AM dummy
        status: 'leave',
        leaveType: leaveType,
        remarks: `Leave approved: ${reason}`,
        markedBy: markedBy,
        isApproved: true,
        approvedBy: markedBy
      });
      await attendance.save();
      console.log(`✅ Created LEAVE attendance for ${attendanceDate.toDateString()}`);
    }
  }
};

// ===== Get Leave Policy =====
exports.getLeavePolicy = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('📋 Getting leave policy for user:', userId);

    const employee = await Employee.findOne({ userId }).populate('userId');
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    }

    const allowedLeavesPerMonth = await getAllowedLeaves();
    const autoMarkAbsent = await getAutoMarkAbsent();
    console.log('✅ Leave policy:', allowedLeavesPerMonth, 'leaves/month');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const currentMonthLeaves = await LeaveRequest.find({
      employee: employee._id,
      status: { $in: ['approved', 'pending'] },
      fromDate: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const usedLeaves = currentMonthLeaves.reduce((sum, l) => sum + l.numberOfDays, 0);

    res.status(200).json({
      success: true,
      data: {
        policy: { allowedLeavesPerMonth, autoMarkAbsent },
        balance: {
          allowed: allowedLeavesPerMonth,
          used: usedLeaves,
          remaining: Math.max(0, allowedLeavesPerMonth - usedLeaves),
          currentMonth: now.toLocaleString('default', { month: 'long', year: 'numeric' })
        }
      }
    });
  } catch (error) {
    console.error('❌ Get leave policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leave policy', error: error.message });
  }
};

// ===== Employee: Create Leave Request =====
exports.createLeaveRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { leaveType, fromDate, toDate, numberOfDays, reason, attachments } = req.body;

    if (!leaveType || !fromDate || !toDate || !reason) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (new Date(fromDate) > new Date(toDate)) {
      return res.status(400).json({ success: false, message: 'From date cannot be after to date' });
    }

    const employee = await Employee.findOne({ userId }).populate('userId');
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    }

    const employeeName = employee.fullName || `${employee.firstName} ${employee.lastName}`;
    const employeeEmail = employee.userId?.email || '';

    const allowedLeavesPerMonth = await getAllowedLeaves();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const currentMonthLeaves = await LeaveRequest.find({
      employee: employee._id,
      status: { $in: ['approved', 'pending'] },
      fromDate: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const usedLeaves = currentMonthLeaves.reduce((sum, l) => sum + l.numberOfDays, 0);
    const requestedDays = numberOfDays || 1;

    if (usedLeaves + requestedDays > allowedLeavesPerMonth) {
      return res.status(400).json({
        success: false,
        message: `Leave limit exceeded! You have ${allowedLeavesPerMonth - usedLeaves} days remaining.`
      });
    }

    const leaveRequest = new LeaveRequest({
      employee: employee._id,
      employeeName,
      employeeEmail,
      leaveType,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      numberOfDays: requestedDays,
      reason,
      attachments: attachments || [],
      status: 'pending'
    });

    await leaveRequest.save();
    console.log('✅ Leave request created:', leaveRequest._id);

    // Notify admin
    try {
      await notificationService.notifyLeaveRequest(leaveRequest, { name: employeeName, email: employeeEmail });
    } catch (e) { console.error('⚠️ Notification error:', e); }

    res.status(201).json({ success: true, message: 'Leave request submitted successfully', data: leaveRequest });
  } catch (error) {
    console.error('❌ Create leave request error:', error);
    res.status(500).json({ success: false, message: 'Failed to create leave request', error: error.message });
  }
};

// ===== Employee: Get My Leave Requests =====
exports.getMyLeaveRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, year } = req.query;

    const employee = await Employee.findOne({ userId });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    const query = { employee: employee._id };
    if (status) query.status = status;
    if (year) {
      query.fromDate = {
        $gte: new Date(year, 0, 1),
        $lte: new Date(year, 11, 31, 23, 59, 59)
      };
    }

    const leaveRequests = await LeaveRequest.find(query)
      .sort({ createdAt: -1 })
      .populate('approvedBy', 'firstName lastName');

    const currentYear = new Date().getFullYear();
    const stats = await LeaveRequest.getEmployeeLeaveStats(employee._id, year || currentYear);

    res.status(200).json({ success: true, data: { leaveRequests, stats } });
  } catch (error) {
    console.error('❌ Get my leave requests error:', error);
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

    const leaveRequests = await LeaveRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('employee', 'firstName lastName employeeCode')
      .populate('approvedBy');

    const total = await LeaveRequest.countDocuments(query);
    const pendingCount = await LeaveRequest.getPendingCount();

    res.status(200).json({
      success: true,
      data: {
        leaveRequests,
        pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / limit), total, limit: parseInt(limit) },
        pendingCount
      }
    });
  } catch (error) {
    console.error('❌ Get all leave requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leave requests', error: error.message });
  }
};

// ===== Admin/Manager: Get Leave Request By ID =====
exports.getLeaveRequestById = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.requestId)
      .populate('employee', 'firstName lastName employeeCode phoneNumber')
      .populate('approvedBy');

    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    res.status(200).json({ success: true, data: leaveRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch leave request', error: error.message });
  }
};

// ===== Admin/Manager: Approve Leave Request =====
// ✅ FIX: Sab jagah update hota hai - Attendance, Employee Notification, Dashboard
exports.approveLeaveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    // ✅ employee populate karo taake managerId mile
    const leaveRequest = await LeaveRequest.findById(requestId).populate('employee');
    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Leave request is already ${leaveRequest.status}` });
    }

    // Approver details
    let approver;
    if (userRole === 'admin') {
      approver = await User.findById(userId);
    } else if (userRole === 'manager') {
      const mp = await Manager.findOne({ userId });
      approver = { _id: userId, name: mp?.fullName || `${mp?.firstName} ${mp?.lastName}` || 'Manager' };
    }

    const approverName = approver?.name || approver?.email || 'Admin';

    // ✅ STEP 1: LeaveRequest update karo
    leaveRequest.status = 'approved';
    leaveRequest.approvedBy = userId;
    leaveRequest.approverModel = userRole === 'admin' ? 'Admin' : 'Manager';
    leaveRequest.approverName = approverName;
    leaveRequest.approvedAt = new Date();
    await leaveRequest.save();
    console.log('✅ LeaveRequest approved');

    // ✅ STEP 2: Attendance model update karo (employeeId field use karo)
    try {
      const employeeDoc = leaveRequest.employee; // already populated
      const managerId = employeeDoc?.managerId || userId; // fallback to approver

      await markAttendanceAsLeave(
        employeeDoc._id,
        managerId,
        leaveRequest.fromDate,
        leaveRequest.toDate,
        leaveRequest.leaveType,
        leaveRequest.reason,
        userId
      );
      console.log('✅ Attendance marked as leave');
    } catch (attErr) {
      console.error('⚠️ Attendance mark error:', attErr);
      // Continue - attendance error se approval fail nahi hona chahiye
    }

    // ✅ STEP 3: Employee ko notification bhejo (userId se)
    try {
      // Employee ka userId find karo
      const employeeWithUser = await Employee.findById(leaveRequest.employee._id).populate('userId');

      if (employeeWithUser && employeeWithUser.userId) {
        await notificationService.createNotification(
          employeeWithUser.userId._id,        // ✅ Employee ka User._id
          '✅ Leave Request Approved',
          `Your ${leaveRequest.leaveType} leave request for ${leaveRequest.numberOfDays} day(s) from ${new Date(leaveRequest.fromDate).toLocaleDateString()} has been approved by ${approverName}.`,
          'leave_approved',
          '/employee/my-requests',
          {
            leaveRequestId: leaveRequest._id,
            approverName: approverName,
            leaveType: leaveRequest.leaveType,
            numberOfDays: leaveRequest.numberOfDays,
            fromDate: leaveRequest.fromDate,
            toDate: leaveRequest.toDate
          }
        );
        console.log('✅ Employee notification sent to userId:', employeeWithUser.userId._id);
      } else {
        console.error('❌ Employee userId not found for notification');
      }
    } catch (notifErr) {
      console.error('⚠️ Notification error:', notifErr);
    }

    // ✅ STEP 4: Manager ko bhi notify karo (agar admin ne approve kiya)
    if (userRole === 'admin') {
      try {
        const employeeDoc = await Employee.findById(leaveRequest.employee._id);
        if (employeeDoc?.managerId) {
          const managerDoc = await Manager.findById(employeeDoc.managerId).populate('userId');
          if (managerDoc?.userId) {
            const empName = employeeDoc.fullName || `${employeeDoc.firstName} ${employeeDoc.lastName}`;
            await notificationService.createNotification(
              managerDoc.userId._id,
              '📋 Leave Approved by Admin',
              `Admin approved ${empName}'s ${leaveRequest.leaveType} leave from ${new Date(leaveRequest.fromDate).toLocaleDateString()} to ${new Date(leaveRequest.toDate).toLocaleDateString()}.`,
              'leave_approved',
              '/manager/dashboard',
              { leaveRequestId: leaveRequest._id, employeeName: empName }
            );
            console.log('✅ Manager notification sent');
          }
        }
      } catch (mgrNotifErr) {
        console.error('⚠️ Manager notification error:', mgrNotifErr);
      }
    }

    // ✅ NEW: Manager ne khud approve kiya to manager ko bhi notification
    if (userRole === 'manager') {
      try {
        const employeeDoc = await Employee.findById(leaveRequest.employee._id);
        const empName = employeeDoc?.fullName || `${employeeDoc?.firstName} ${employeeDoc?.lastName}`;
        const mgrDoc = await Manager.findOne({ userId }).populate('userId');
        if (mgrDoc?.userId) {
          await notificationService.createNotification(
            mgrDoc.userId._id,
            '✅ Leave Approved – Confirmation',
            `You approved ${empName}'s ${leaveRequest.leaveType} leave (${leaveRequest.numberOfDays} day(s)) from ${new Date(leaveRequest.fromDate).toLocaleDateString()} to ${new Date(leaveRequest.toDate).toLocaleDateString()}. Attendance updated automatically.`,
            'leave_approved',
            '/manager/notifications',
            { leaveRequestId: leaveRequest._id, employeeName: empName, action: 'self_approved' }
          );
          console.log('✅ Manager self-approval notification sent');
        }
      } catch (e) { console.error('⚠️ Manager self notification error:', e.message); }
    }

    res.status(200).json({
      success: true,
      message: 'Leave request approved, attendance marked, and notifications sent',
      data: leaveRequest
    });

  } catch (error) {
    console.error('❌ Approve leave request error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve leave request', error: error.message });
  }
};

// ===== Admin/Manager: Reject Leave Request =====
exports.rejectLeaveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const leaveRequest = await LeaveRequest.findById(requestId).populate('employee');
    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Leave request is already ${leaveRequest.status}` });
    }

    let approver;
    if (userRole === 'admin') {
      approver = await User.findById(userId);
    } else if (userRole === 'manager') {
      const mp = await Manager.findOne({ userId });
      approver = { _id: userId, name: mp?.fullName || `${mp?.firstName} ${mp?.lastName}` || 'Manager' };
    }

    const approverName = approver?.name || approver?.email || 'Admin';

    leaveRequest.status = 'rejected';
    leaveRequest.approvedBy = userId;
    leaveRequest.approverModel = userRole === 'admin' ? 'Admin' : 'Manager';
    leaveRequest.approverName = approverName;
    leaveRequest.approvedAt = new Date();
    leaveRequest.rejectionReason = rejectionReason || 'No reason provided';
    await leaveRequest.save();

    // ✅ Employee ko rejection notification bhejo
    try {
      const employeeWithUser = await Employee.findById(leaveRequest.employee._id).populate('userId');
      if (employeeWithUser && employeeWithUser.userId) {
        await notificationService.createNotification(
          employeeWithUser.userId._id,
          '❌ Leave Request Rejected',
          `Your ${leaveRequest.leaveType} leave request has been rejected by ${approverName}. Reason: ${rejectionReason || 'No reason provided'}`,
          'leave_rejected',
          '/employee/my-requests',
          {
            leaveRequestId: leaveRequest._id,
            approverName: approverName,
            rejectionReason: rejectionReason
          }
        );
        console.log('✅ Employee rejection notification sent');
      }
    } catch (notifErr) {
      console.error('⚠️ Notification error:', notifErr);
    }

    res.status(200).json({ success: true, message: 'Leave request rejected', data: leaveRequest });
  } catch (error) {
    console.error('❌ Reject leave request error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject leave request', error: error.message });
  }
};

// ===== Employee: Cancel Leave Request =====
exports.cancelLeaveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const employee = await Employee.findOne({ userId });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    const leaveRequest = await LeaveRequest.findById(requestId);
    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leaveRequest.employee.toString() !== employee._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this request' });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Can only cancel pending requests' });
    }

    leaveRequest.status = 'cancelled';
    await leaveRequest.save();

    res.status(200).json({ success: true, message: 'Leave request cancelled successfully', data: leaveRequest });
  } catch (error) {
    console.error('❌ Cancel leave request error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel leave request', error: error.message });
  }
};

// ===== Admin/Manager: Add Comment =====
exports.addComment = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const leaveRequest = await LeaveRequest.findById(requestId);
    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    let user;
    if (userRole === 'admin') user = await User.findById(userId);
    else if (userRole === 'manager') {
      const m = await Manager.findOne({ userId });
      user = { name: m?.fullName || 'Manager' };
    } else if (userRole === 'employee') {
      const e = await Employee.findOne({ userId });
      user = { name: e?.fullName || 'Employee' };
    }

    leaveRequest.comments.push({
      by: userId,
      byModel: userRole === 'admin' ? 'Admin' : userRole === 'manager' ? 'Manager' : 'Employee',
      byName: user?.name || user?.email || 'User',
      text,
      createdAt: new Date()
    });

    await leaveRequest.save();

    res.status(200).json({ success: true, message: 'Comment added successfully', data: leaveRequest });
  } catch (error) {
    console.error('❌ Add comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment', error: error.message });
  }
};