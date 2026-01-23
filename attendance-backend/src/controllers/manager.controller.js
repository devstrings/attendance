const User = require('../models/User');
const Employee = require('../models/Employee');
const Manager = require('../models/Manager');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const { validateEmail } = require('../utils/validators');

/**
 * Manager Dashboard - Get Overview
 */
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get manager profile
    const manager = await Manager.findOne({ userId })
      .populate('employeesUnder', 'firstName lastName employeeCode isActive');

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager profile not found.'
      });
    }

    // Count active employees under this manager
    const totalEmployees = manager.employeesUnder.filter(emp => emp.isActive).length;

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttendance = await Attendance.countDocuments({
      managerId: manager._id,
      date: { $gte: today },
      status: 'present'
    });

    // Pending leaves under this manager
    const pendingLeaves = await Leave.countDocuments({
      managerId: manager._id,
      status: 'pending'
    });

    // Employees absent today
    const employeeIds = manager.employeesUnder.map(emp => emp._id);
    
    const presentToday = await Attendance.find({
      employeeId: { $in: employeeIds },
      date: { $gte: today }
    }).distinct('employeeId');

    const absentToday = totalEmployees - presentToday.length;

    // Recent attendance records
    const recentAttendance = await Attendance.find({
      managerId: manager._id
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('employeeId', 'firstName lastName employeeCode');

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalEmployees,
          todayAttendance,
          pendingLeaves,
          absentToday
        },
        recentAttendance
      }
    });
  } catch (error) {
    console.error('Get manager dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data.',
      error: error.message
    });
  }
};

/**
 * Get All Employees Under Manager
 */
const getMyEmployees = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, search = '', department = '' } = req.query;

    // Get manager profile
    const manager = await Manager.findOne({ userId });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager profile not found.'
      });
    }

    const query = {
  _id: { $in: manager.employeesUnder },  // Sirf manager ke employees
  isActive: true
};

    // Search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } }
      ];
    }

    // Department filter
    if (department) {
      query.department = department;
    }

    const employees = await Employee.find(query)
      .populate('userId', 'email isActive lastLogin')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Employee.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        employees,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalEmployees: count
      }
    });
  } catch (error) {
    console.error('Get my employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees.',
      error: error.message
    });
  }
};

/**
 * Get Employee Details
 */
const getEmployeeDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { employeeId } = req.params;

    // Get manager profile
    const manager = await Manager.findOne({ userId });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager profile not found.'
      });
    }

    // Check if employee is under this manager
    const hasAccess = manager.employeesUnder.some(
      emp => emp.toString() === employeeId
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This employee is not under your supervision.'
      });
    }

    // Get employee details
    const employee = await Employee.findById(employeeId)
      .populate('userId', 'email isActive lastLogin')
      .populate('managerId', 'firstName lastName email');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: { employee }
    });
  } catch (error) {
    console.error('Get employee details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee details.',
      error: error.message
    });
  }
};

/**
 * Mark Attendance for Employee
 */
const markAttendance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      employeeId,
      date,
      clockIn,
      clockOut,
      status,
      remarks,
      location
    } = req.body;

    // Validate required fields
    if (!employeeId || !date || !clockIn) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, date, and clock-in time are required.'
      });
    }

    // Get manager profile
    const manager = await Manager.findOne({ userId });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager profile not found.'
      });
    }

    // Check if employee is under this manager
    const hasAccess = manager.employeesUnder.some(
      emp => emp.toString() === employeeId
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This employee is not under your supervision.'
      });
    }

    // Get employee details
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.'
      });
    }

    // Check if attendance already exists for this date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      employeeId,
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this date.'
      });
    }

    // Calculate if employee is late
    const clockInTime = new Date(clockIn);
    const shiftStartTime = employee.workSchedule.shiftStartTime || '09:00';
    const [startHour, startMinute] = shiftStartTime.split(':').map(Number);
    
    const expectedClockIn = new Date(clockInTime);
    expectedClockIn.setHours(startHour, startMinute, 0, 0);

    const lateMinutes = Math.max(0, Math.floor((clockInTime - expectedClockIn) / (1000 * 60)));
    const isLate = lateMinutes > 15; // Grace period of 15 minutes

    // Calculate early leave if clockOut is provided
    let earlyLeave = false;
    let earlyLeaveMinutes = 0;

    if (clockOut) {
      const clockOutTime = new Date(clockOut);
      const shiftEndTime = employee.workSchedule.shiftEndTime || '17:00';
      const [endHour, endMinute] = shiftEndTime.split(':').map(Number);
      
      const expectedClockOut = new Date(clockOutTime);
      expectedClockOut.setHours(endHour, endMinute, 0, 0);

      if (clockOutTime < expectedClockOut) {
        earlyLeaveMinutes = Math.floor((expectedClockOut - clockOutTime) / (1000 * 60));
        earlyLeave = earlyLeaveMinutes > 15; // Grace period of 15 minutes
      }
    }

    // Create attendance record
    const attendance = new Attendance({
      employeeId,
      managerId: manager._id,
      date: attendanceDate,
      clockIn: clockInTime,
      clockOut: clockOut ? new Date(clockOut) : null,
      status: status || 'present',
      isLate,
      lateMinutes,
      earlyLeave,
      earlyLeaveMinutes,
      location,
      remarks,
      markedBy: userId,
      isApproved: true,
      approvedBy: userId
    });

    await attendance.save();

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully.',
      data: { attendance }
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance.',
      error: error.message
    });
  }
};

/**
 * Update Attendance Record
 */
const updateAttendance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { attendanceId } = req.params;
    const updateData = req.body;

    // Get manager profile
    const manager = await Manager.findOne({ userId });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager profile not found.'
      });
    }

    // Get attendance record
    const attendance = await Attendance.findById(attendanceId);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found.'
      });
    }

    // Check if manager has access to this attendance record
    if (attendance.managerId.toString() !== manager._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update attendance records of your employees.'
      });
    }

    // Update attendance
    const updatedAttendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('employeeId', 'firstName lastName employeeCode');

    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully.',
      data: { attendance: updatedAttendance }
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance.',
      error: error.message
    });
  }
};

/**
 * Get Employee Attendance History
 */
const getEmployeeAttendanceHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { employeeId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      startDate = '', 
      endDate = '', 
      status = '' 
    } = req.query;

    // Get manager profile
    const manager = await Manager.findOne({ userId });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager profile not found.'
      });
    }

    // Check if employee is under this manager
    const hasAccess = manager.employeesUnder.some(
      emp => emp.toString() === employeeId
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This employee is not under your supervision.'
      });
    }

    const query = { employeeId };

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
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('managerId', 'firstName lastName')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Attendance.countDocuments(query);

    // Calculate statistics
    const totalPresent = await Attendance.countDocuments({
      employeeId,
      status: 'present'
    });

    const totalAbsent = await Attendance.countDocuments({
      employeeId,
      status: 'absent'
    });

    const totalLate = await Attendance.countDocuments({
      employeeId,
      isLate: true
    });

    res.status(200).json({
      success: true,
      data: {
        attendance: attendanceRecords,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalRecords: count,
        statistics: {
          totalPresent,
          totalAbsent,
          totalLate
        }
      }
    });
  } catch (error) {
    console.error('Get employee attendance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance history.',
      error: error.message
    });
  }
};

/**
 * Manager Clock In/Out (Manager's own attendance)
 */
const clockInOut = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { action, location } = req.body; // action: 'clock-in' or 'clock-out'

    if (!action || !['clock-in', 'clock-out'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "clock-in" or "clock-out".'
      });
    }

    // Get manager profile
    const manager = await Manager.findOne({ userId });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager profile not found.'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (action === 'clock-in') {
      // Check if already clocked in today
      const existingAttendance = await Attendance.findOne({
        employeeId: manager._id, // Using manager._id as employeeId
        date: { $gte: today }
      });

      if (existingAttendance) {
        return res.status(400).json({
          success: false,
          message: 'You have already clocked in today.'
        });
      }

      // Create clock-in record
      const attendance = new Attendance({
        employeeId: manager._id,
        managerId: manager._id,
        date: today,
        clockIn: new Date(),
        status: 'present',
        location: {
          clockInLocation: location
        },
        markedBy: userId,
        isApproved: true,
        approvedBy: userId
      });

      await attendance.save();

      return res.status(201).json({
        success: true,
        message: 'Clocked in successfully.',
        data: { attendance }
      });
    } else {
      // Clock-out
      const attendance = await Attendance.findOne({
        employeeId: manager._id,
        date: { $gte: today }
      });

      if (!attendance) {
        return res.status(400).json({
          success: false,
          message: 'No clock-in record found for today.'
        });
      }

      if (attendance.clockOut) {
        return res.status(400).json({
          success: false,
          message: 'You have already clocked out today.'
        });
      }

      // Update with clock-out
      attendance.clockOut = new Date();
      if (location) {
        attendance.location.clockOutLocation = location;
      }

      await attendance.save();

      return res.status(200).json({
        success: true,
        message: 'Clocked out successfully.',
        data: { attendance }
      });
    }
  } catch (error) {
    console.error('Clock in/out error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process clock in/out.',
      error: error.message
    });
  }
};

/**
 * Get Manager's Own Attendance History
 */
const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, startDate = '', endDate = '' } = req.query;

    // Get manager profile
    const manager = await Manager.findOne({ userId });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager profile not found.'
      });
    }

    const query = { employeeId: manager._id };

    // Date range filter
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendanceRecords = await Attendance.find(query)
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
      message: 'Failed to fetch attendance history.',
      error: error.message
    });
  }
};

/**
 * Get Leave Requests from Employees
 */
const getLeaveRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status = '' } = req.query;

    // Get manager profile
    const manager = await Manager.findOne({ userId });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager profile not found.'
      });
    }

    const query = { managerId: manager._id };

    if (status) {
      query.status = status;
    }

    const leaves = await Leave.find(query)
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('approvedBy', 'email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Leave.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        leaves,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalLeaves: count
      }
    });
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave requests.',
      error: error.message
    });
  }
};

/**
 * Approve/Reject Leave Request
 */
const updateLeaveStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { leaveId } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Use "approved" or "rejected".'
      });
    }

    // Get manager profile
    const manager = await Manager.findOne({ userId });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager profile not found.'
      });
    }

    // Get leave request
    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.'
      });
    }

    // Check if manager has access
    if (leave.managerId.toString() !== manager._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only manage leave requests from your employees.'
      });
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

    await leave.save();

    res.status(200).json({
      success: true,
      message: `Leave request ${status} successfully.`,
      data: { leave }
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
 * Get Manager Profile
 */
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const manager = await Manager.findOne({ userId })
      .populate('userId', 'email isActive lastLogin')
      .populate('employeesUnder', 'firstName lastName employeeCode');

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager profile not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: { manager }
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
 * Update Manager Profile
 */
const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updateData = req.body;

    // Remove fields that shouldn't be updated by manager
    delete updateData.salary;
    delete updateData.employeesUnder;
    delete updateData.isActive;

    const manager = await Manager.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('userId', 'email').populate('employeesUnder', 'firstName lastName employeeCode');

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager profile not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { manager }
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

module.exports = {
  getDashboard,
  getMyEmployees,
  getEmployeeDetails,
  markAttendance,
  updateAttendance,
  getEmployeeAttendanceHistory,
  clockInOut,
  getMyAttendance,
  getLeaveRequests,
  updateLeaveStatus,
  getMyProfile,
  updateMyProfile
};