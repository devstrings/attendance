const LeaveRequest = require('../models/LeaveRequest');
const notificationService = require('../utils/notificationService');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Manager = require('../models/Manager');
const MonthlyConfig = require('../models/MonthlyConfig');
const SystemConfig = require('../models/SystemConfig');
const SystemSettings = require('../models/SystemSettings');
const Attendance = require('../models/Attendance');

// ===== HELPER: Get Allowed Leaves (Admin policy priority) =====
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

// ===== Get Leave Policy =====
exports.getLeavePolicy = async (req, res) => {
  try {
    const userId = req.user._id;

    const employee = await Employee.findOne({ userId });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found. Please contact admin.' });
    }

    const allowedLeavesPerMonth = await getAllowedLeaves();
    const autoMarkAbsent = await getAutoMarkAbsent();

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

    const employee = await Employee.findOne({ userId });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found. Please contact admin.' });
    }

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
        message: `Leave limit exceeded! You have ${allowedLeavesPerMonth - usedLeaves} days remaining this month.`
      });
    }

    const leaveRequest = new LeaveRequest({
      employee: employee._id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      employeeEmail: employee.email || employee.phoneNumber,
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

    try {
      await notificationService.notifyLeaveRequest(leaveRequest, {
        _id: employee._id,
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email || employee.phoneNumber
      });
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
      .populate('approvedBy', 'name');

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
      .populate('approvedBy', 'name');

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
      .populate('approvedBy', 'name role');

    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    res.status(200).json({ success: true, data: leaveRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch leave request', error: error.message });
  }
};

// ===== Admin/Manager: APPROVE Leave Request =====
// ✅ FIXED: Attendance (employeeId field) + Employee Notification (userId) + Manager Notification
exports.approveLeaveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const approverId = req.user._id;
    const approverRole = req.user.role;

    // ✅ employee populate karo
    const leaveRequest = await LeaveRequest.findById(requestId).populate('employee');
    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Leave request is already ${leaveRequest.status}` });
    }

    // Approver name
    let approverName = 'Admin';
    if (approverRole === 'manager') {
      const managerDetails = await Manager.findOne({ userId: approverId });
      approverName = managerDetails
        ? (managerDetails.fullName || `${managerDetails.firstName} ${managerDetails.lastName}`)
        : 'Manager';
    }

    // ✅ STEP 1: LeaveRequest status update
    leaveRequest.status = 'approved';
    leaveRequest.approvedBy = approverId;
    leaveRequest.approverModel = 'User';
    leaveRequest.approverName = approverName;
    leaveRequest.approvedAt = new Date();
    await leaveRequest.save();
    console.log('✅ STEP 1: LeaveRequest approved');

    // ✅ STEP 2: Attendance mark as LEAVE (employeeId field use karo)
    try {
      const employeeDoc = leaveRequest.employee; // already populated
      const managerId = employeeDoc.managerId || approverId; // fallback

      const fromDate = new Date(leaveRequest.fromDate);
      const toDate = new Date(leaveRequest.toDate);

      for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
        const attendanceDate = new Date(d);
        attendanceDate.setHours(0, 0, 0, 0);

        // ✅ employeeId field use karo (Attendance model mein yahi field hai)
        let attendance = await Attendance.findOne({
          employeeId: employeeDoc._id,
          date: attendanceDate
        });

        if (attendance) {
          attendance.status = 'leave';
          attendance.leaveType = leaveRequest.leaveType;
          attendance.remarks = `Leave approved: ${leaveRequest.reason}`;
          await attendance.save();
          console.log(`✅ STEP 2: Updated attendance to LEAVE: ${attendanceDate.toDateString()}`);
        } else {
          // ✅ Naya record - managerId required hai
          attendance = new Attendance({
            employeeId: employeeDoc._id,
            managerId: managerId,
            date: attendanceDate,
            clockIn: new Date(attendanceDate.getTime() + 10 * 60 * 60 * 1000), // 10 AM
            status: 'leave',
            leaveType: leaveRequest.leaveType,
            remarks: `Leave approved: ${leaveRequest.reason}`,
            markedBy: approverId,
            isApproved: true,
            approvedBy: approverId
          });
          await attendance.save();
          console.log(`✅ STEP 2: Created LEAVE attendance: ${attendanceDate.toDateString()}`);
        }
      }
    } catch (attErr) {
      console.error('⚠️ STEP 2 Attendance error (non-fatal):', attErr.message);
    }

    // ✅ STEP 3: Employee ko notification bhejo (userId dhundh ke)
    try {
      const employeeWithUser = await Employee.findById(leaveRequest.employee._id).populate('userId');

      if (employeeWithUser && employeeWithUser.userId) {
        await notificationService.createNotification(
          employeeWithUser.userId._id,  // ✅ Employee ka User._id
          '✅ Leave Request Approved',
          `Your ${leaveRequest.leaveType} leave request for ${leaveRequest.numberOfDays} day(s) starting ${new Date(leaveRequest.fromDate).toLocaleDateString()} has been approved by ${approverName}.`,
          'leave_approved',
          '/employee/my-requests',
          {
            leaveRequestId: leaveRequest._id,
            approverName,
            leaveType: leaveRequest.leaveType,
            numberOfDays: leaveRequest.numberOfDays,
            fromDate: leaveRequest.fromDate,
            toDate: leaveRequest.toDate
          }
        );
        console.log('✅ STEP 3: Employee notification sent to userId:', employeeWithUser.userId._id);
      } else {
        console.error('❌ STEP 3: Employee userId not found!');
      }
    } catch (notifErr) {
      console.error('⚠️ STEP 3 Notification error (non-fatal):', notifErr.message);
    }

    // ✅ STEP 4: Manager ko notify karo (agar admin ne approve kiya)
    if (approverRole === 'admin') {
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
            console.log('✅ STEP 4: Manager notification sent');
          }
        }
      } catch (mgrErr) {
        console.error('⚠️ STEP 4 Manager notification error (non-fatal):', mgrErr.message);
      }
    }

    console.log('🎉 Leave approval complete - all steps done!');

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
    const approverId = req.user._id;
    const approverRole = req.user.role;

    const leaveRequest = await LeaveRequest.findById(requestId).populate('employee');
    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Leave request is already ${leaveRequest.status}` });
    }

    let approverName = 'Admin';
    if (approverRole === 'manager') {
      const managerDetails = await Manager.findOne({ userId: approverId });
      approverName = managerDetails
        ? (managerDetails.fullName || `${managerDetails.firstName} ${managerDetails.lastName}`)
        : 'Manager';
    }

    leaveRequest.status = 'rejected';
    leaveRequest.approvedBy = approverId;
    leaveRequest.approverModel = 'User';
    leaveRequest.approverName = approverName;
    leaveRequest.approvedAt = new Date();
    leaveRequest.rejectionReason = rejectionReason || 'No reason provided';
    await leaveRequest.save();
    console.log('✅ LeaveRequest rejected');

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
            approverName,
            rejectionReason
          }
        );
        console.log('✅ Employee rejection notification sent');
      }
    } catch (notifErr) {
      console.error('⚠️ Notification error (non-fatal):', notifErr.message);
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

    const user = await User.findById(userId);
    let userName = user.email;

    if (userRole === 'employee') {
      const emp = await Employee.findOne({ userId });
      userName = emp ? `${emp.firstName} ${emp.lastName}` : user.email;
    } else if (userRole === 'manager') {
      const mgr = await Manager.findOne({ userId });
      userName = mgr ? (mgr.fullName || `${mgr.firstName} ${mgr.lastName}`) : user.email;
    } else if (userRole === 'admin') {
      userName = 'Admin';
    }

    leaveRequest.comments.push({
      by: userId,
      byModel: 'User',
      byName: userName,
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