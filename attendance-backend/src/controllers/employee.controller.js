const User = require('../models/User');
const Employee = require('../models/Employee');
const Manager = require('../models/Manager');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Salary = require('../models/Salary');

/**
 * Employee Dashboard - Get Overview
 */
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get employee profile
    const employee = await Employee.findOne({ userId })
      .populate('managerId', 'firstName lastName email phoneNumber');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found.'
      });
    }

    // Today's attendance status
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttendance = await Attendance.findOne({
      employeeId: employee._id,
      date: { $gte: today }
    });

    // This month's statistics
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);

    const monthlyStats = {
      present: await Attendance.countDocuments({
        employeeId: employee._id,
        date: { $gte: monthStart, $lte: monthEnd },
        status: 'present'
      }),
      absent: await Attendance.countDocuments({
        employeeId: employee._id,
        date: { $gte: monthStart, $lte: monthEnd },
        status: 'absent'
      }),
      late: await Attendance.countDocuments({
        employeeId: employee._id,
        date: { $gte: monthStart, $lte: monthEnd },
        isLate: true
      }),
      onLeave: await Attendance.countDocuments({
        employeeId: employee._id,
        date: { $gte: monthStart, $lte: monthEnd },
        status: 'on-leave'
      })
    };

    // Pending leave requests
    const pendingLeaves = await Leave.countDocuments({
      employeeId: employee._id,
      status: 'pending'
    });

    // Recent attendance records
    const recentAttendance = await Attendance.find({
      employeeId: employee._id
    })
      .sort({ date: -1 })
      .limit(5)
      .populate('managerId', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: {
        employee,
        todayAttendance,
        monthlyStats,
        pendingLeaves,
        recentAttendance
      }
    });
  } catch (error) {
    console.error('Get employee dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data.',
      error: error.message
    });
  }
};

/**
 * Get Employee Profile
 */
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const employee = await Employee.findOne({ userId })
      .populate('userId', 'email isActive lastLogin')
      .populate('managerId', 'firstName lastName email phoneNumber department');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: { employee }
    });
  } catch (error) {
    console.error('Get my profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile.',
      error: error.message
    });
  }
};

/**
 * Update Employee Profile
 */
const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updateData = req.body;

    // Remove fields that shouldn't be updated by employee
    delete updateData.employeeCode;
    delete updateData.managerId;
    delete updateData.salary;
    delete updateData.department;
    delete updateData.designation;
    delete updateData.joiningDate;
    delete updateData.isActive;
    delete updateData.workSchedule;

    const employee = await Employee.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('userId', 'email')
      .populate('managerId', 'firstName lastName email');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { employee }
    });
  } catch (error) {
    console.error('Update my profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
      error: error.message
    });
  }
};

/**
 * Get My Attendance Records
 */
const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      page = 1, 
      limit = 10, 
      startDate = '', 
      endDate = '',
      status = ''
    } = req.query;

    // Get employee profile
    const employee = await Employee.findOne({ userId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found.'
      });
    }

    const query = { employeeId: employee._id };

    // Date range filter
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('managerId', 'firstName lastName')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Attendance.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        attendance: attendanceRecords,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalRecords: count
      }
    });
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records.',
      error: error.message
    });
  }
};

/**
 * Get Attendance History with Statistics
 */
const getAttendanceHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month, year } = req.query;

    // Get employee profile
    const employee = await Employee.findOne({ userId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found.'
      });
    }

    // Set date range
    let startDate, endDate;
    if (month && year) {
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      endDate = new Date(parseInt(year), parseInt(month), 0);
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find({
      employeeId: employee._id,
      date: { $gte: startDate, $lte: endDate }
    })
      .populate('managerId', 'firstName lastName')
      .sort({ date: 1 });

    // Calculate statistics
    const statistics = {
      totalDays: attendanceRecords.length,
      present: attendanceRecords.filter(a => a.status === 'present').length,
      absent: attendanceRecords.filter(a => a.status === 'absent').length,
      late: attendanceRecords.filter(a => a.isLate).length,
      halfDay: attendanceRecords.filter(a => a.status === 'half-day').length,
      onLeave: attendanceRecords.filter(a => a.status === 'on-leave').length,
      totalWorkHours: attendanceRecords.reduce((sum, a) => sum + (a.workHours || 0), 0),
      totalOvertimeHours: attendanceRecords.reduce((sum, a) => sum + (a.overtimeHours || 0), 0)
    };

    res.status(200).json({
      success: true,
      data: {
        attendance: attendanceRecords,
        statistics,
        period: {
          month: startDate.getMonth() + 1,
          year: startDate.getFullYear()
        }
      }
    });
  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance history.',
      error: error.message
    });
  }
};

/**
 * Check Today's Attendance Status
 */
const getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get employee profile
    const employee = await Employee.findOne({ userId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found.'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttendance = await Attendance.findOne({
      employeeId: employee._id,
      date: { $gte: today }
    }).populate('managerId', 'firstName lastName');

    if (!todayAttendance) {
      return res.status(200).json({
        success: true,
        message: 'No attendance record for today.',
        data: {
          hasClocked: false,
          attendance: null
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        hasClocked: true,
        attendance: todayAttendance
      }
    });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s attendance.',
      error: error.message
    });
  }
};

/**
 * Apply for Leave
 */
const applyLeave = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      leaveType,
      startDate,
      endDate,
      reason,
      attachments
    } = req.body;

    // Validate required fields
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Leave type, start date, end date, and reason are required.'
      });
    }

    // Get employee profile
    const employee = await Employee.findOne({ userId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found.'
      });
    }

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (numberOfDays <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date range.'
      });
    }

    // Check for overlapping leave requests
    const overlappingLeave = await Leave.findOne({
      employeeId: employee._id,
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
      employeeId: employee._id,
      managerId: employee.managerId,
      leaveType,
      startDate: start,
      endDate: end,
      numberOfDays,
      reason,
      attachments,
      status: 'pending'
    });

    await leave.save();

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully.',
      data: { leave }
    });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit leave request.',
      error: error.message
    });
  }
};

/**
 * Get My Leave Requests
 */
const getMyLeaves = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status = '' } = req.query;

    // Get employee profile
    const employee = await Employee.findOne({ userId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found.'
      });
    }

    const query = { employeeId: employee._id };

    if (status) {
      query.status = status;
    }

    const leaves = await Leave.find(query)
      .populate('managerId', 'firstName lastName email')
      .populate('approvedBy', 'email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Leave.countDocuments(query);

    // Calculate leave statistics
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);

    const leaveStats = {
      totalApproved: await Leave.aggregate([
        {
          $match: {
            employeeId: employee._id,
            status: 'approved',
            startDate: { $gte: yearStart, $lte: yearEnd }
          }
        },
        {
          $group: {
            _id: null,
            totalDays: { $sum: '$numberOfDays' }
          }
        }
      ]),
      pending: await Leave.countDocuments({
        employeeId: employee._id,
        status: 'pending'
      }),
      rejected: await Leave.countDocuments({
        employeeId: employee._id,
        status: 'rejected'
      })
    };

    res.status(200).json({
      success: true,
      data: {
        leaves,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalLeaves: count,
        statistics: {
          approvedDaysThisYear: leaveStats.totalApproved[0]?.totalDays || 0,
          pendingRequests: leaveStats.pending,
          rejectedRequests: leaveStats.rejected
        }
      }
    });
  } catch (error) {
    console.error('Get my leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave requests.',
      error: error.message
    });
  }
};

/**
 * Get Leave Details
 */
const getLeaveDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { leaveId } = req.params;

    // Get employee profile
    const employee = await Employee.findOne({ userId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found.'
      });
    }

    const leave = await Leave.findById(leaveId)
      .populate('managerId', 'firstName lastName email phoneNumber')
      .populate('approvedBy', 'email');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.'
      });
    }

    // Check if leave belongs to this employee
    if (leave.employeeId.toString() !== employee._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own leave requests.'
      });
    }

    res.status(200).json({
      success: true,
      data: { leave }
    });
  } catch (error) {
    console.error('Get leave details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave details.',
      error: error.message
    });
  }
};

/**
 * Cancel Leave Request
 */
const cancelLeave = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { leaveId } = req.params;

    // Get employee profile
    const employee = await Employee.findOne({ userId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found.'
      });
    }

    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.'
      });
    }

    // Check if leave belongs to this employee
    if (leave.employeeId.toString() !== employee._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only cancel your own leave requests.'
      });
    }

    // Check if leave can be cancelled
    if (leave.status !== 'pending' && leave.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a leave request that is ${leave.status}.`
      });
    }

    // Update leave status
    leave.status = 'cancelled';
    await leave.save();

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
 * Get My Salary History
 */
const getMySalary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, year = '' } = req.query;

    // Get employee profile
    const employee = await Employee.findOne({ userId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found.'
      });
    }

    const query = { employeeId: employee._id };

    if (year) {
      query.year = parseInt(year);
    }

    const salaries = await Salary.find(query)
      .populate('generatedBy', 'email')
      .populate('approvedBy', 'email')
      .sort({ year: -1, month: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Salary.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        salaries,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalRecords: count
      }
    });
  } catch (error) {
    console.error('Get my salary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salary history.',
      error: error.message
    });
  }
};

/**
 * Get Salary Details
 */
const getSalaryDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { salaryId } = req.params;

    // Get employee profile
    const employee = await Employee.findOne({ userId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found.'
      });
    }

    const salary = await Salary.findById(salaryId)
      .populate('generatedBy', 'email')
      .populate('approvedBy', 'email');

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found.'
      });
    }

    // Check if salary belongs to this employee
    if (salary.employeeId.toString() !== employee._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own salary records.'
      });
    }

    res.status(200).json({
      success: true,
      data: { salary }
    });
  } catch (error) {
    console.error('Get salary details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salary details.',
      error: error.message
    });
  }
};

module.exports = {
  getDashboard,
  getMyProfile,
  updateMyProfile,
  getMyAttendance,
  getAttendanceHistory,
  getTodayAttendance,
  applyLeave,
  getMyLeaves,
  getLeaveDetails,
  cancelLeave,
  getMySalary,
  getSalaryDetails
};