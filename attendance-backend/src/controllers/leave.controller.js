const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const Manager = require('../models/Manager');
const Attendance = require('../models/Attendance');
const { sendEmail } = require('../utils/emailService');

/**
 * Get All Leave Requests (with filters)
 */
const getAllLeaves = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      employeeId = '',
      managerId = '',
      status = '',
      leaveType = '',
      startDate = '',
      endDate = ''
    } = req.query;

    const query = {};

    // Employee filter
    if (employeeId) {
      query.employeeId = employeeId;
    }

    // Manager filter
    if (managerId) {
      query.managerId = managerId;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Leave type filter
    if (leaveType) {
      query.leaveType = leaveType;
    }

    // Date range filter
    if (startDate && endDate) {
      query.$or = [
        {
          startDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
        },
        {
          endDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
        },
        {
          startDate: { $lte: new Date(startDate) },
          endDate: { $gte: new Date(endDate) }
        }
      ];
    }

    const leaves = await Leave.find(query)
      .populate('employeeId', 'firstName lastName employeeCode department designation')
      .populate('managerId', 'firstName lastName email')
      .populate('approvedBy', 'email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Leave.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        leaves,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalLeaves: count
      }
    });
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave requests.',
      error: error.message
    });
  }
};

/**
 * Get Leave by ID
 */
const getLeaveById = async (req, res) => {
  try {
    const { leaveId } = req.params;

    const leave = await Leave.findById(leaveId)
      .populate('employeeId', 'firstName lastName employeeCode department designation phoneNumber email')
      .populate('managerId', 'firstName lastName email phoneNumber')
      .populate('approvedBy', 'email role');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: { leave }
    });
  } catch (error) {
    console.error('Get leave by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave request.',
      error: error.message
    });
  }
};

/**
 * Create Leave Request
 */
const createLeave = async (req, res) => {
  try {
    const {
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason,
      attachments
    } = req.body;

    const userId = req.user.userId;
    const userRole = req.user.role;

    // Validate required fields
    if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided.'
      });
    }

    // Get employee details
    const employee = await Employee.findById(employeeId)
      .populate('userId', 'email')
      .populate('managerId', 'firstName lastName email');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.'
      });
    }

    // Check authorization
    if (userRole === 'employee') {
      const employeeProfile = await Employee.findOne({ userId });
      
      if (!employeeProfile || employeeProfile._id.toString() !== employeeId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only apply for your own leave.'
        });
      }
    }

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (numberOfDays <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date range. End date must be after or equal to start date.'
      });
    }

    // Check for overlapping leave requests
    const overlappingLeave = await Leave.findOne({
      employeeId,
      status: { $in: ['pending', 'approved'] },
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start }
        }
      ]
    });

    if (overlappingLeave) {
      return res.status(400).json({
        success: false,
        message: 'You already have a leave request for these dates.'
      });
    }

    // Create leave request
    const leave = new Leave({
      employeeId,
      managerId: employee.managerId._id,
      leaveType,
      startDate: start,
      endDate: end,
      numberOfDays,
      reason,
      attachments,
      status: 'pending'
    });

    await leave.save();

    // Send email notification to manager
    try {
      await sendEmail({
        to: employee.managerId.email,
        subject: 'New Leave Request',
        html: `
          <h2>New Leave Request</h2>
          <p><strong>Employee:</strong> ${employee.firstName} ${employee.lastName}</p>
          <p><strong>Leave Type:</strong> ${leaveType}</p>
          <p><strong>Duration:</strong> ${start.toDateString()} to ${end.toDateString()}</p>
          <p><strong>Number of Days:</strong> ${numberOfDays}</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>Please review and approve/reject this request.</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
    }

    const populatedLeave = await Leave.findById(leave._id)
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('managerId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully.',
      data: { leave: populatedLeave }
    });
  } catch (error) {
    console.error('Create leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit leave request.',
      error: error.message
    });
  }
};

/**
 * Update Leave Status (Approve/Reject)
 */
const updateLeaveStatus = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status, rejectionReason, remarks } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Use "approved" or "rejected".'
      });
    }

    // Only managers and admins can update leave status
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only managers and admins can update leave status.'
      });
    }

    // Get leave request
    const leave = await Leave.findById(leaveId)
      .populate('employeeId', 'firstName lastName email userId')
      .populate('managerId', 'firstName lastName email');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.'
      });
    }

    // Check if manager has access
    if (userRole === 'manager') {
      const manager = await Manager.findOne({ userId });
      
      if (!manager || leave.managerId._id.toString() !== manager._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only manage leave requests from your employees.'
        });
      }
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Leave request is already ${leave.status}.`
      });
    }

    // Update leave status
    leave.status = status;
    leave.approvedBy = userId;
    leave.approvedAt = new Date();

    if (status === 'rejected' && rejectionReason) {
      leave.rejectionReason = rejectionReason;
    }

    if (remarks) {
      leave.remarks = remarks;
    }

    await leave.save();

    // If approved, mark attendance as on-leave for the leave period
    if (status === 'approved') {
      const attendancePromises = [];
      const currentDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);

      while (currentDate <= endDate) {
        const dateToMark = new Date(currentDate);
        dateToMark.setHours(0, 0, 0, 0);

        // Check if attendance already exists
        const existingAttendance = await Attendance.findOne({
          employeeId: leave.employeeId._id,
          date: {
            $gte: dateToMark,
            $lt: new Date(dateToMark.getTime() + 24 * 60 * 60 * 1000)
          }
        });

        if (!existingAttendance) {
          const attendance = new Attendance({
            employeeId: leave.employeeId._id,
            managerId: leave.managerId._id,
            date: dateToMark,
            clockIn: new Date(dateToMark.getTime() + 9 * 60 * 60 * 1000), // Default 9 AM
            status: 'on-leave',
            remarks: `Leave: ${leave.leaveType}`,
            markedBy: userId,
            isApproved: true,
            approvedBy: userId
          });

          attendancePromises.push(attendance.save());
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      await Promise.all(attendancePromises);
    }

    // Send email notification to employee
    try {
      const employee = leave.employeeId;
      const user = await require('../models/User').findById(employee.userId);

      await sendEmail({
        to: user.email,
        subject: `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        html: `
          <h2>Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}</h2>
          <p>Dear ${employee.firstName} ${employee.lastName},</p>
          <p>Your leave request has been <strong>${status}</strong>.</p>
          <p><strong>Leave Type:</strong> ${leave.leaveType}</p>
          <p><strong>Duration:</strong> ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()}</p>
          <p><strong>Number of Days:</strong> ${leave.numberOfDays}</p>
          ${status === 'rejected' && rejectionReason ? `<p><strong>Reason for Rejection:</strong> ${rejectionReason}</p>` : ''}
          ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
        `
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
    }

    const updatedLeave = await Leave.findById(leave._id)
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('managerId', 'firstName lastName email')
      .populate('approvedBy', 'email role');

    res.status(200).json({
      success: true,
      message: `Leave request ${status} successfully.`,
      data: { leave: updatedLeave }
    });
  } catch (error) {
    console.error('Update leave status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update leave status.',
      error: error.message
    });
  }
};

/**
 * Update Leave Request (Edit before approval)
 */
const updateLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const updateData = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Get leave request
    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.'
      });
    }

    // Only employee who created it or admin can update
    if (userRole === 'employee') {
      const employee = await Employee.findOne({ userId });
      
      if (!employee || leave.employeeId.toString() !== employee._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only update your own leave requests.'
        });
      }
    }

    // Can only update pending leaves
    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot update a leave request that is ${leave.status}.`
      });
    }

    // Recalculate number of days if dates are updated
    if (updateData.startDate || updateData.endDate) {
      const start = new Date(updateData.startDate || leave.startDate);
      const end = new Date(updateData.endDate || leave.endDate);
      updateData.numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      if (updateData.numberOfDays <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date range.'
        });
      }
    }

    // Update leave
    const updatedLeave = await Leave.findByIdAndUpdate(
      leaveId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('managerId', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Leave request updated successfully.',
      data: { leave: updatedLeave }
    });
  } catch (error) {
    console.error('Update leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update leave request.',
      error: error.message
    });
  }
};

/**
 * Cancel Leave Request
 */
const cancelLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Get leave request
    const leave = await Leave.findById(leaveId)
      .populate('employeeId', 'firstName lastName email');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.'
      });
    }

    // Check authorization
    if (userRole === 'employee') {
      const employee = await Employee.findOne({ userId });
      
      if (!employee || leave.employeeId._id.toString() !== employee._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only cancel your own leave requests.'
        });
      }
    }

    // Can only cancel pending or approved leaves
    if (leave.status !== 'pending' && leave.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a leave request that is ${leave.status}.`
      });
    }

    // Update status to cancelled
    leave.status = 'cancelled';
    await leave.save();

    // If it was approved, remove attendance records marked as on-leave
    if (leave.status === 'approved') {
      await Attendance.deleteMany({
        employeeId: leave.employeeId._id,
        date: {
          $gte: leave.startDate,
          $lte: leave.endDate
        },
        status: 'on-leave'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Leave request cancelled successfully.',
      data: { leave }
    });
  } catch (error) {
    console.error('Cancel leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel leave request.',
      error: error.message
    });
  }
};

/**
 * Delete Leave Request
 */
const deleteLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const userRole = req.user.role;

    // Only admin can delete
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can delete leave requests.'
      });
    }

    const leave = await Leave.findByIdAndDelete(leaveId);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Leave request deleted successfully.'
    });
  } catch (error) {
    console.error('Delete leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete leave request.',
      error: error.message
    });
  }
};

/**
 * Get Leave Statistics
 */
const getLeaveStatistics = async (req, res) => {
  try {
    const { employeeId, year } = req.query;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required.'
      });
    }

    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);

    // Get all leaves for the year
    const leaves = await Leave.find({
      employeeId,
      startDate: { $gte: yearStart, $lte: yearEnd }
    });

    // Calculate statistics by leave type
    const statistics = {
      sick: { count: 0, days: 0 },
      casual: { count: 0, days: 0 },
      annual: { count: 0, days: 0 },
      unpaid: { count: 0, days: 0 },
      emergency: { count: 0, days: 0 },
      maternity: { count: 0, days: 0 },
      paternity: { count: 0, days: 0 },
      total: { count: 0, days: 0 }
    };

    leaves.forEach(leave => {
      if (leave.status === 'approved') {
        if (statistics[leave.leaveType]) {
          statistics[leave.leaveType].count++;
          statistics[leave.leaveType].days += leave.numberOfDays;
        }
        statistics.total.count++;
        statistics.total.days += leave.numberOfDays;
      }
    });

    // Status-wise count
    const statusCount = {
      pending: leaves.filter(l => l.status === 'pending').length,
      approved: leaves.filter(l => l.status === 'approved').length,
      rejected: leaves.filter(l => l.status === 'rejected').length,
      cancelled: leaves.filter(l => l.status === 'cancelled').length
    };

    res.status(200).json({
      success: true,
      data: {
        year: currentYear,
        statistics,
        statusCount,
        recentLeaves: leaves.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Get leave statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave statistics.',
      error: error.message
    });
  }
};

/**
 * Get Leave Balance
 */
const getLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.query;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required.'
      });
    }

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);

    // Calculate approved leaves
    const approvedLeaves = await Leave.aggregate([
      {
        $match: {
          employeeId: require('mongoose').Types.ObjectId(employeeId),
          status: 'approved',
          startDate: { $gte: yearStart, $lte: yearEnd }
        }
      },
      {
        $group: {
          _id: '$leaveType',
          totalDays: { $sum: '$numberOfDays' }
        }
      }
    ]);

    // Define leave entitlements (this can be from a config or employee profile)
    const leaveEntitlements = {
      sick: 10,
      casual: 10,
      annual: 21,
      emergency: 5
    };

    const leaveBalance = {};

    Object.keys(leaveEntitlements).forEach(type => {
      const used = approvedLeaves.find(l => l._id === type)?.totalDays || 0;
      leaveBalance[type] = {
        entitled: leaveEntitlements[type],
        used,
        remaining: leaveEntitlements[type] - used
      };
    });

    res.status(200).json({
      success: true,
      data: {
        year: currentYear,
        leaveBalance
      }
    });
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave balance.',
      error: error.message
    });
  }
};

module.exports = {
  getAllLeaves,
  getLeaveById,
  createLeave,
  updateLeaveStatus,
  updateLeave,
  cancelLeave,
  deleteLeave,
  getLeaveStatistics,
  getLeaveBalance
};