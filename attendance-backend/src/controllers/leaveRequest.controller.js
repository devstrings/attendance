const LeaveRequest = require('../models/LeaveRequest');
const notificationService = require('../utils/notificationService');
const Employee = require('../models/Employee');
const Admin = require('../models/Admin');
const Manager = require('../models/Manager');
const MonthlyConfig = require('../models/MonthlyConfig');

// Get Leave Policy and Employee Balance
exports.getLeavePolicy = async (req, res) => {
  try {
    const employeeId = req.user._id;
    
    // Get leave policy from MonthlyConfig
    const config = await MonthlyConfig.findOne({}).sort({ updatedAt: -1 });
    const allowedLeavesPerMonth = config?.allowedLeavesPerMonth || 2;
    const autoMarkAbsent = config?.autoMarkAbsent || false;

    // Get current month's leave usage
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const currentMonthLeaves = await LeaveRequest.find({
      employee: employeeId,
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

// Employee: Create leave request
exports.createLeaveRequest = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const { leaveType, fromDate, toDate, numberOfDays, reason, attachments } = req.body;

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

    // Get employee details
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check leave balance
    const config = await MonthlyConfig.findOne({}).sort({ updatedAt: -1 });
    const allowedLeavesPerMonth = config?.allowedLeavesPerMonth || 2;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const currentMonthLeaves = await LeaveRequest.find({
      employee: employeeId,
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
      employee: employeeId,
      employeeName: employee.name,
      employeeEmail: employee.email,
      leaveType,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      numberOfDays: requestedDays,
      reason,
      attachments: attachments || [],
      status: 'pending'
    });

    await leaveRequest.save();

    // Send notification to admin
    try {
      await notificationService.notifyLeaveRequest(leaveRequest, {
        name: employee.name,
        email: employee.email
      });
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

// Employee: Get my leave requests
exports.getMyLeaveRequests = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const { status, year } = req.query;

    const query = { employee: employeeId };
    
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
      .populate('approvedBy', 'name');

    // Get leave stats
    const currentYear = new Date().getFullYear();
    const stats = await LeaveRequest.getEmployeeLeaveStats(employeeId, year || currentYear);

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

// Admin/Manager: Get all leave requests
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
      .populate('employee', 'name email employeeId')
      .populate('approvedBy', 'name');

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

// Admin/Manager: Get leave request by ID
exports.getLeaveRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;

    const leaveRequest = await LeaveRequest.findById(requestId)
      .populate('employee', 'name email employeeId phone')
      .populate('approvedBy', 'name role');

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

// Admin/Manager: Approve leave request
exports.approveLeaveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const approverId = req.user._id;
    const approverRole = req.user.role;

    const leaveRequest = await LeaveRequest.findById(requestId);

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
    const ApproverModel = approverRole === 'admin' ? Admin : Manager;
    const approver = await ApproverModel.findById(approverId);

    // Update leave request
    leaveRequest.status = 'approved';
    leaveRequest.approvedBy = approverId;
    leaveRequest.approverModel = approverRole === 'admin' ? 'Admin' : 'Manager';
    leaveRequest.approverName = approver.name;
    leaveRequest.approvedAt = new Date();

    await leaveRequest.save();

    // Get employee details
    const employee = await Employee.findById(leaveRequest.employee);

    // Send notification to employee
    try {
      await notificationService.notifyLeaveApproval(leaveRequest, {
        name: employee.name,
        email: employee.email
      }, {
        _id: approverId,
        name: approver.name,
        role: approverRole
      });
    } catch (notifError) {
      console.error('⚠️ Notification error:', notifError);
    }

    res.status(200).json({
      success: true,
      message: 'Leave request approved successfully',
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

// Admin/Manager: Reject leave request
exports.rejectLeaveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;
    const approverId = req.user._id;
    const approverRole = req.user.role;

    const leaveRequest = await LeaveRequest.findById(requestId);

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
    const ApproverModel = approverRole === 'admin' ? Admin : Manager;
    const approver = await ApproverModel.findById(approverId);

    // Update leave request
    leaveRequest.status = 'rejected';
    leaveRequest.approvedBy = approverId;
    leaveRequest.approverModel = approverRole === 'admin' ? 'Admin' : 'Manager';
    leaveRequest.approverName = approver.name;
    leaveRequest.approvedAt = new Date();
    leaveRequest.rejectionReason = rejectionReason || 'No reason provided';

    await leaveRequest.save();

    // Get employee details
    const employee = await Employee.findById(leaveRequest.employee);

    // Send notification to employee
    try {
      await notificationService.notifyLeaveRejection(leaveRequest, {
        name: employee.name,
        email: employee.email
      }, {
        _id: approverId,
        name: approver.name,
        role: approverRole
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

// Employee: Cancel leave request
exports.cancelLeaveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const employeeId = req.user._id;

    const leaveRequest = await LeaveRequest.findById(requestId);

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check if request belongs to this employee
    if (leaveRequest.employee.toString() !== employeeId.toString()) {
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

// Admin/Manager: Add comment to leave request
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

    const UserModel = userRole === 'admin' ? Admin : 
                     userRole === 'manager' ? Manager : Employee;
    const user = await UserModel.findById(userId);

    leaveRequest.comments.push({
      by: userId,
      byModel: userRole === 'admin' ? 'Admin' : 
              userRole === 'manager' ? 'Manager' : 'Employee',
      byName: user.name,
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