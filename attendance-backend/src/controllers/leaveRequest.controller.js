const LeaveRequest = require('../models/LeaveRequest');
const notificationService = require('../utils/notificationService');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Manager = require('../models/Manager');
const MonthlyConfig = require('../models/MonthlyConfig');

// ===== HELPER: Get Employee with User Data =====
const getEmployeeWithUser = async (employeeId) => {
  const employee = await Employee.findById(employeeId).populate('userId');
  if (!employee) {
    throw new Error('Employee not found');
  }
  return {
    _id: employee._id,
    name: employee.fullName || `${employee.firstName} ${employee.lastName}`,
    email: employee.userId?.email || 'no-email@example.com',
    employeeCode: employee.employeeCode
  };
};

// ===== Get Leave Policy and Employee Balance =====
exports.getLeavePolicy = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('📋 Getting leave policy for user:', userId);
    
    // Find employee by userId
    const employee = await Employee.findOne({ userId }).populate('userId');
    
    if (!employee) {
      console.error('❌ Employee profile not found for userId:', userId);
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found. Please contact admin.'
      });
    }

    console.log('✅ Employee found:', employee._id);

    // Get leave policy from MonthlyConfig
    const config = await MonthlyConfig.findOne({}).sort({ updatedAt: -1 });
    const allowedLeavesPerMonth = config?.allowedLeavesPerMonth || 2;
    const autoMarkAbsent = config?.autoMarkAbsent || false;

    // Get current month's leave usage
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const currentMonthLeaves = await LeaveRequest.find({
      employee: employee._id,
      status: { $in: ['approved', 'pending'] },
      fromDate: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const usedLeaves = currentMonthLeaves.reduce((sum, leave) => sum + leave.numberOfDays, 0);
    const remainingLeaves = allowedLeavesPerMonth - usedLeaves;

    res.status(200).json({
      success: true,
      data: {
        policy: {
          allowedLeavesPerMonth,
          autoMarkAbsent
        },
        balance: {
          allowed: allowedLeavesPerMonth,
          used: usedLeaves,
          remaining: Math.max(0, remainingLeaves),
          currentMonth: now.toLocaleString('default', { month: 'long', year: 'numeric' })
        }
      }
    });

  } catch (error) {
    console.error('❌ Get leave policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave policy',
      error: error.message
    });
  }
};

// ===== Employee: Create leave request =====
exports.createLeaveRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { leaveType, fromDate, toDate, numberOfDays, reason, attachments } = req.body;

    console.log('📝 Creating leave request for user:', userId);

    // Validation
    if (!leaveType || !fromDate || !toDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if fromDate is before toDate
    if (new Date(fromDate) > new Date(toDate)) {
      return res.status(400).json({
        success: false,
        message: 'From date cannot be after to date'
      });
    }

    // Get employee details with user
    const employee = await Employee.findOne({ userId }).populate('userId');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found. Please contact admin.'
      });
    }

    const employeeName = employee.fullName || `${employee.firstName} ${employee.lastName}`;
    const employeeEmail = employee.userId?.email || '';

    console.log('✅ Employee:', employeeName, employeeEmail);

    // Check leave balance
    const config = await MonthlyConfig.findOne({}).sort({ updatedAt: -1 });
    const allowedLeavesPerMonth = config?.allowedLeavesPerMonth || 2;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const currentMonthLeaves = await LeaveRequest.find({
      employee: employee._id,
      status: { $in: ['approved', 'pending'] },
      fromDate: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const usedLeaves = currentMonthLeaves.reduce((sum, leave) => sum + leave.numberOfDays, 0);
    const requestedDays = numberOfDays || 1;

    if (usedLeaves + requestedDays > allowedLeavesPerMonth) {
      return res.status(400).json({
        success: false,
        message: `Leave limit exceeded! You have ${allowedLeavesPerMonth - usedLeaves} days remaining this month.`
      });
    }

    // Create leave request
    const leaveRequest = new LeaveRequest({
      employee: employee._id,
      employeeName: employeeName,
      employeeEmail: employeeEmail,
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

    // Send notification to admin
    try {
      await notificationService.notifyLeaveRequest(leaveRequest, {
        name: employeeName,
        email: employeeEmail
      });
      console.log('✅ Notification sent to admin');
    } catch (notifError) {
      console.error('⚠️ Notification error:', notifError);
      // Continue even if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: leaveRequest
    });

  } catch (error) {
    console.error('❌ Create leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create leave request',
      error: error.message
    });
  }
};

// ===== Employee: Get my leave requests =====
exports.getMyLeaveRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, year } = req.query;

    console.log('📋 Getting leave requests for user:', userId);

    // Find employee
    const employee = await Employee.findOne({ userId });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    const query = { employee: employee._id };
    
    if (status) {
      query.status = status;
    }

    if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59);
      query.fromDate = { $gte: startOfYear, $lte: endOfYear };
    }

    const leaveRequests = await LeaveRequest.find(query)
      .sort({ createdAt: -1 })
      .populate('approvedBy', 'firstName lastName');

    // Get leave stats
    const currentYear = new Date().getFullYear();
    const stats = await LeaveRequest.getEmployeeLeaveStats(employee._id, year || currentYear);

    res.status(200).json({
      success: true,
      data: {
        leaveRequests,
        stats
      }
    });

  } catch (error) {
    console.error('❌ Get my leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave requests',
      error: error.message
    });
  }
};

// ===== Admin/Manager: Get all leave requests =====
exports.getAllLeaveRequests = async (req, res) => {
  try {
    const { status, employeeId, page = 1, limit = 20 } = req.query;

    const query = {};
    
    if (status) {
      query.status = status;
    }

    if (employeeId) {
      query.employee = employeeId;
    }

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
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        },
        pendingCount
      }
    });

  } catch (error) {
    console.error('❌ Get all leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave requests',
      error: error.message
    });
  }
};

// ===== Admin/Manager: Get leave request by ID =====
exports.getLeaveRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;

    const leaveRequest = await LeaveRequest.findById(requestId)
      .populate('employee', 'firstName lastName employeeCode phoneNumber')
      .populate('approvedBy');

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: leaveRequest
    });

  } catch (error) {
    console.error('❌ Get leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave request',
      error: error.message
    });
  }
};

// ===== Admin/Manager: Approve leave request =====
exports.approveLeaveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const leaveRequest = await LeaveRequest.findById(requestId).populate('employee');

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Leave request is already ${leaveRequest.status}`
      });
    }

    // Get approver details
    let approver;
    if (userRole === 'admin') {
      approver = await User.findById(userId);
    } else if (userRole === 'manager') {
      const managerProfile = await Manager.findOne({ userId });
      approver = {
        _id: userId,
        name: managerProfile?.fullName || 'Manager'
      };
    }

    // Update leave request
    leaveRequest.status = 'approved';
    leaveRequest.approvedBy = userId;
    leaveRequest.approverModel = userRole === 'admin' ? 'Admin' : 'Manager';
    leaveRequest.approverName = approver?.name || approver?.email || 'Admin';
    leaveRequest.approvedAt = new Date();

    await leaveRequest.save();

    // ✅ NEW: Mark attendance as "leave" for the leave dates
    try {
      const Attendance = require('../models/Attendance');
      
      const fromDate = new Date(leaveRequest.fromDate);
      const toDate = new Date(leaveRequest.toDate);
      
      // Loop through each date in the leave range
      for (let date = new Date(fromDate); date <= toDate; date.setDate(date.getDate() + 1)) {
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);
        
        // Check if attendance already exists for this date
        let attendance = await Attendance.findOne({
          employeeId: leaveRequest.employee._id,
          date: attendanceDate
        });

        if (attendance) {
          // Update existing attendance to "leave"
          attendance.status = 'leave';
          attendance.leaveType = leaveRequest.leaveType;
          attendance.remarks = `Leave approved: ${leaveRequest.reason}`;
          await attendance.save();
          console.log(`✅ Updated attendance to leave for ${attendanceDate.toDateString()}`);
        } else {
          // Create new attendance record with "leave" status
          attendance = new Attendance({
            employeeId: leaveRequest.employee._id,
            date: attendanceDate,
            status: 'leave',
            leaveType: leaveRequest.leaveType,
            remarks: `Leave approved: ${leaveRequest.reason}`,
            clockIn: null,
            clockOut: null
          });
          await attendance.save();
          console.log(`✅ Created leave attendance for ${attendanceDate.toDateString()}`);
        }
      }
    } catch (attendanceError) {
      console.error('⚠️ Error marking attendance as leave:', attendanceError);
      // Continue even if attendance marking fails
    }

    // Get employee details with user
    const employee = await getEmployeeWithUser(leaveRequest.employee._id);

    // Send notification to employee
    try {
      await notificationService.notifyLeaveApproval(leaveRequest, employee, {
        _id: userId,
        name: approver?.name || approver?.email,
        role: userRole
      });
      console.log('✅ Notification sent to employee');
    } catch (notifError) {
      console.error('⚠️ Notification error:', notifError);
    }

    res.status(200).json({
      success: true,
      message: 'Leave request approved and attendance marked',
      data: leaveRequest
    });

  } catch (error) {
    console.error('❌ Approve leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve leave request',
      error: error.message
    });
  }
};

// ===== Admin/Manager: Reject leave request =====
exports.rejectLeaveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const leaveRequest = await LeaveRequest.findById(requestId).populate('employee');

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Leave request is already ${leaveRequest.status}`
      });
    }

    // Get approver details
    let approver;
    if (userRole === 'admin') {
      approver = await User.findById(userId);
    } else if (userRole === 'manager') {
      const managerProfile = await Manager.findOne({ userId });
      approver = {
        _id: userId,
        name: managerProfile?.fullName || 'Manager'
      };
    }

    // Update leave request
    leaveRequest.status = 'rejected';
    leaveRequest.approvedBy = userId;
    leaveRequest.approverModel = userRole === 'admin' ? 'Admin' : 'Manager';
    leaveRequest.approverName = approver?.name || approver?.email || 'Admin';
    leaveRequest.approvedAt = new Date();
    leaveRequest.rejectionReason = rejectionReason || 'No reason provided';

    await leaveRequest.save();

    // Get employee details with user
    const employee = await getEmployeeWithUser(leaveRequest.employee._id);

    // Send notification to employee
    try {
      await notificationService.notifyLeaveRejection(leaveRequest, employee, {
        _id: userId,
        name: approver?.name || approver?.email,
        role: userRole
      }, rejectionReason);
    } catch (notifError) {
      console.error('⚠️ Notification error:', notifError);
    }

    res.status(200).json({
      success: true,
      message: 'Leave request rejected',
      data: leaveRequest
    });

  } catch (error) {
    console.error('❌ Reject leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject leave request',
      error: error.message
    });
  }
};

// ===== Employee: Cancel leave request =====
exports.cancelLeaveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    // Find employee
    const employee = await Employee.findOne({ userId });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    const leaveRequest = await LeaveRequest.findById(requestId);

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check if request belongs to this employee
    if (leaveRequest.employee.toString() !== employee._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this request'
      });
    }

    // Can only cancel pending requests
    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending requests'
      });
    }

    leaveRequest.status = 'cancelled';
    await leaveRequest.save();

    res.status(200).json({
      success: true,
      message: 'Leave request cancelled successfully',
      data: leaveRequest
    });

  } catch (error) {
    console.error('❌ Cancel leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel leave request',
      error: error.message
    });
  }
};

// ===== Admin/Manager: Add comment to leave request =====
exports.addComment = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const leaveRequest = await LeaveRequest.findById(requestId);

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Get user details
    let user;
    if (userRole === 'admin') {
      user = await User.findById(userId);
    } else if (userRole === 'manager') {
      const manager = await Manager.findOne({ userId });
      user = { name: manager?.fullName || 'Manager' };
    } else if (userRole === 'employee') {
      const employee = await Employee.findOne({ userId });
      user = { name: employee?.fullName || 'Employee' };
    }

    leaveRequest.comments.push({
      by: userId,
      byModel: userRole === 'admin' ? 'Admin' : 
              userRole === 'manager' ? 'Manager' : 'Employee',
      byName: user?.name || user?.email || 'User',
      text: text,
      createdAt: new Date()
    });

    await leaveRequest.save();

    res.status(200).json({
      success: true,
      message: 'Comment added successfully',
      data: leaveRequest
    });

  } catch (error) {
    console.error('❌ Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
};