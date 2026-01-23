const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Manager = require('../models/Manager');
const Holiday = require('../models/Holiday');

/**
 * Get All Attendance Records (with filters)
 */
const getAllAttendance = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      employeeId = '',
      managerId = '',
      date = '',
      startDate = '',
      endDate = '',
      status = '',
      department = ''
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

    // Single date filter
    if (date) {
      const dateObj = new Date(date);
      dateObj.setHours(0, 0, 0, 0);
      query.date = {
        $gte: dateObj,
        $lt: new Date(dateObj.getTime() + 24 * 60 * 60 * 1000)
      };
    }

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

    // Department filter (requires population)
    let attendanceRecords;
    if (department) {
      const employees = await Employee.find({ department, isActive: true }).select('_id');
      const employeeIds = employees.map(emp => emp._id);
      query.employeeId = { $in: employeeIds };
    }

    attendanceRecords = await Attendance.find(query)
      .populate('employeeId', 'firstName lastName employeeCode department designation')
      .populate('managerId', 'firstName lastName email')
      .populate('markedBy', 'email role')
      .sort({ date: -1, clockIn: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Attendance.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        attendance: attendanceRecords,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalRecords: count
      }
    });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records.',
      error: error.message
    });
  }
};

/**
 * Get Attendance by ID
 */
const getAttendanceById = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    const attendance = await Attendance.findById(attendanceId)
      .populate('employeeId', 'firstName lastName employeeCode department designation phoneNumber')
      .populate('managerId', 'firstName lastName email phoneNumber')
      .populate('markedBy', 'email role')
      .populate('approvedBy', 'email role');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: { attendance }
    });
  } catch (error) {
    console.error('Get attendance by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance record.',
      error: error.message
    });
  }
};

/**
 * Create Attendance Record
 */
const createAttendance = async (req, res) => {
  try {
    const {
      employeeId,
      date,
      clockIn,
      clockOut,
      status,
      remarks,
      location
    } = req.body;

    const userId = req.user.userId;
    const userRole = req.user.role;

    // Validate required fields
    if (!employeeId || !date || !clockIn) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, date, and clock-in time are required.'
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

    // Check authorization
    if (userRole === 'manager') {
      const manager = await Manager.findOne({ userId });
      
      if (!manager) {
        return res.status(404).json({
          success: false,
          message: 'Manager profile not found.'
        });
      }

      const hasAccess = manager.employeesUnder.some(
        emp => emp.toString() === employeeId
      );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. This employee is not under your supervision.'
        });
      }
    } else if (userRole === 'employee') {
      // Employees can only mark their own attendance
      const employeeProfile = await Employee.findOne({ userId });
      
      if (!employeeProfile || employeeProfile._id.toString() !== employeeId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only mark your own attendance.'
        });
      }
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

    // ✅ GRACE PERIOD: 10:00 - 10:30 AM
    const clockInTime = new Date(clockIn);
    const clockInHour = clockInTime.getHours();
    const clockInMinute = clockInTime.getMinutes();
    
    let isLate = false;
    let lateMinutes = 0;

    // Late if after 10:30 AM
    if (clockInHour > 10 || (clockInHour === 10 && clockInMinute > 30)) {
      isLate = true;
      const totalMinutesNow = (clockInHour * 60) + clockInMinute;
      const graceEndMinutes = (10 * 60) + 30; // 10:30 AM
      lateMinutes = totalMinutesNow - graceEndMinutes;
    }

    // Calculate early leave if clockOut is provided
    let earlyLeave = false;
    let earlyLeaveMinutes = 0;

    if (clockOut) {
      const clockOutTime = new Date(clockOut);
      const shiftEndTime = employee.workSchedule?.shiftEndTime || '19:00'; // 7 PM
      const [endHour, endMinute] = shiftEndTime.split(':').map(Number);
      
      const expectedClockOut = new Date(clockOutTime);
      expectedClockOut.setHours(endHour, endMinute, 0, 0);

      if (clockOutTime < expectedClockOut) {
        earlyLeaveMinutes = Math.floor((expectedClockOut - clockOutTime) / (1000 * 60));
        earlyLeave = earlyLeaveMinutes > 15;
      }
    }

    // Create attendance record
    const attendance = new Attendance({
      employeeId,
      managerId: employee.managerId,
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
      isApproved: userRole === 'admin' || userRole === 'manager',
      approvedBy: userRole === 'admin' || userRole === 'manager' ? userId : null
    });

    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('managerId', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully.',
      data: { attendance: populatedAttendance }
    });
  } catch (error) {
    console.error('Create attendance error:', error);
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
    const { attendanceId } = req.params;
    const updateData = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Get attendance record
    const attendance = await Attendance.findById(attendanceId);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found.'
      });
    }

    // Check authorization
    if (userRole === 'manager') {
      const manager = await Manager.findOne({ userId });
      
      if (!manager || attendance.managerId.toString() !== manager._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only update attendance records of your employees.'
        });
      }
    } else if (userRole === 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Employees cannot update attendance records.'
      });
    }

    // Update with clockOut if provided
    if (updateData.clockOut && !attendance.clockOut) {
      updateData.clockOut = new Date(updateData.clockOut);
    }

    // Update attendance
    const updatedAttendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('managerId', 'firstName lastName');

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
 * Delete Attendance Record
 */
const deleteAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const userRole = req.user.role;

    // Only admin can delete
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can delete attendance records.'
      });
    }

    const attendance = await Attendance.findByIdAndDelete(attendanceId);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully.'
    });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendance record.',
      error: error.message
    });
  }
};

/**
 * Clock In - WITH GRACE PERIOD (10:00 - 10:30 AM)
 */
const clockIn = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { location } = req.body;

    // ✅ CHECK OFFICE HOURS: 10:00 AM - 7:00 PM
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

    // ✅ Check if weekend
    if (currentDay === 0 || currentDay === 6) {
      return res.status(400).json({
        success: false,
        message: '🏖️ Today is weekend (Saturday/Sunday). Office is closed!'
      });
    }

    // ✅ Check office opening time (10 AM)
    if (currentHour < 10) {
      return res.status(400).json({
        success: false,
        message: '⏰ Office opens at 10:00 AM. Please clock in after that.'
      });
    }

    // ✅ Check office closing time (7 PM)
    if (currentHour >= 19) {
      return res.status(400).json({
        success: false,
        message: '⏰ Office hours ended at 7:00 PM. Cannot clock in now.'
      });
    }

    // Get employee or manager profile
    let employeeProfile = await Employee.findOne({ userId });
    let managerId = null;

    if (!employeeProfile) {
      const managerProfile = await Manager.findOne({ userId });
      
      if (!managerProfile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found.'
        });
      }

      employeeProfile = { _id: managerProfile._id, managerId: managerProfile._id };
      managerId = managerProfile._id;
    } else {
      managerId = employeeProfile.managerId;
    }

    // Check if already clocked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      employeeId: employeeProfile._id,
      date: { $gte: today }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'You have already clocked in today.'
      });
    }

    // ✅ GRACE PERIOD LOGIC: 10:00 AM - 10:30 AM = ON TIME
    // Late only if time is AFTER 10:30 AM
    let isLate = false;
    let lateMinutes = 0;

    if (currentHour > 10 || (currentHour === 10 && currentMinute > 30)) {
      isLate = true;
      const totalMinutesNow = (currentHour * 60) + currentMinute;
      const graceEndMinutes = (10 * 60) + 30; // 10:30 AM
      lateMinutes = totalMinutesNow - graceEndMinutes;
    }

    // Check if today is a holiday
    const holiday = await Holiday.findOne({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    // Create clock-in record
    const attendance = new Attendance({
      employeeId: employeeProfile._id,
      managerId: managerId,
      date: today,
      clockIn: now,
      status: holiday ? 'holiday' : 'present',
      isLate: isLate,
      lateMinutes: lateMinutes,
      location: {
        clockInLocation: location
      },
      markedBy: userId,
      isApproved: true,
      approvedBy: userId
    });

    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('managerId', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: isLate 
        ? `⚠️ Clocked in late by ${lateMinutes} minutes (Grace period: 10:00-10:30 AM)`
        : '✅ Clocked in successfully - On Time!',
      data: { attendance: populatedAttendance }
    });
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clock in.',
      error: error.message
    });
  }
};

/**
 * Clock Out
 */
const clockOut = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { location } = req.body;

    // Get employee or manager profile
    let employeeProfile = await Employee.findOne({ userId });

    if (!employeeProfile) {
      const managerProfile = await Manager.findOne({ userId });
      
      if (!managerProfile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found.'
        });
      }

      employeeProfile = { _id: managerProfile._id };
    }

    // Find today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId: employeeProfile._id,
      date: { $gte: today }
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No clock-in record found for today. Please clock in first.'
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

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('managerId', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Clocked out successfully.',
      data: { attendance: populatedAttendance }
    });
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clock out.',
      error: error.message
    });
  }
};

/**
 * Get Today's Clock Status
 */
const getTodayClockStatus = async (req, res) => {
  try {
    const userId = req.user.userId;

    let employeeProfile = await Employee.findOne({ userId });

    if (!employeeProfile) {
      const managerProfile = await Manager.findOne({ userId });
      
      if (!managerProfile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found.'
        });
      }

      employeeProfile = { _id: managerProfile._id };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId: employeeProfile._id,
      date: { $gte: today }
    });

    if (!attendance) {
      return res.status(200).json({
        success: true,
        data: {
          hasClockedIn: false,
          hasClockedOut: false,
          attendance: null
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        hasClockedIn: true,
        hasClockedOut: !!attendance.clockOut,
        attendance
      }
    });
  } catch (error) {
    console.error('Get today clock status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clock status.',
      error: error.message
    });
  }
};

/**
 * Get Attendance Summary
 */
const getAttendanceSummary = async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    if (!employeeId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, start date, and end date are required.'
      });
    }

    const query = {
      employeeId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const attendanceRecords = await Attendance.find(query).sort({ date: 1 });

    const summary = {
      totalDays: attendanceRecords.length,
      present: attendanceRecords.filter(a => a.status === 'present').length,
      absent: attendanceRecords.filter(a => a.status === 'absent').length,
      late: attendanceRecords.filter(a => a.isLate).length,
      halfDay: attendanceRecords.filter(a => a.status === 'half-day').length,
      onLeave: attendanceRecords.filter(a => a.status === 'on-leave').length,
      holiday: attendanceRecords.filter(a => a.status === 'holiday').length,
      totalWorkHours: attendanceRecords.reduce((sum, a) => sum + (a.workHours || 0), 0),
      totalOvertimeHours: attendanceRecords.reduce((sum, a) => sum + (a.overtimeHours || 0), 0),
      totalLateMinutes: attendanceRecords.reduce((sum, a) => sum + (a.lateMinutes || 0), 0),
      averageWorkHours: 0
    };

    if (summary.totalDays > 0) {
      summary.averageWorkHours = (summary.totalWorkHours / summary.totalDays).toFixed(2);
    }

    res.status(200).json({
      success: true,
      data: {
        summary,
        attendance: attendanceRecords
      }
    });
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance summary.',
      error: error.message
    });
  }
};

/**
 * Bulk Mark Attendance
 */
const bulkMarkAttendance = async (req, res) => {
  try {
    const { attendanceData } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (!attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance data format.'
      });
    }

    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins and managers can bulk mark attendance.'
      });
    }

    const results = {
      success: [],
      failed: []
    };

    for (const data of attendanceData) {
      try {
        const { employeeId, date, status, remarks } = data;

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
          results.failed.push({
            employeeId,
            date,
            reason: 'Attendance already exists'
          });
          continue;
        }

        const employee = await Employee.findById(employeeId);
        
        if (!employee) {
          results.failed.push({
            employeeId,
            date,
            reason: 'Employee not found'
          });
          continue;
        }

        const attendance = new Attendance({
          employeeId,
          managerId: employee.managerId,
          date: attendanceDate,
          clockIn: new Date(attendanceDate.getTime() + 10 * 60 * 60 * 1000), // Default 10 AM
          status: status || 'present',
          remarks,
          markedBy: userId,
          isApproved: true,
          approvedBy: userId
        });

        await attendance.save();

        results.success.push({
          employeeId,
          date,
          attendanceId: attendance._id
        });
      } catch (err) {
        results.failed.push({
          employeeId: data.employeeId,
          date: data.date,
          reason: err.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk attendance marked. Success: ${results.success.length}, Failed: ${results.failed.length}`,
      data: results
    });
  } catch (error) {
    console.error('Bulk mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk mark attendance.',
      error: error.message
    });
  }
};

module.exports = {
  getAllAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  clockIn,
  clockOut,
  getTodayClockStatus,
  getAttendanceSummary,
  bulkMarkAttendance
};