const User = require('../models/User');
const Employee = require('../models/Employee');
const Manager = require('../models/Manager');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Holiday = require('../models/Holiday');
const SystemConfig = require('../models/SystemConfig');
const { validateEmail } = require('../utils/validators');

// ===== HELPER: Working Days Calculate =====
const calculateWorkingDays = async (startDate, endDate, workingDayNames) => {
  const holidays = await Holiday.find({
    date: { $gte: startDate, $lte: endDate }
  });
  const holidaySet = new Set(holidays.map(h => new Date(h.date).toDateString()));

  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });
    const isWorkingDay = workingDayNames.includes(dayName);
    const isHoliday = holidaySet.has(current.toDateString());
    if (isWorkingDay && !isHoliday) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
};

/**
 * ✅ Manager Dashboard - FIXED & EXPORTED
 * - Leave: both 'leave' AND 'on-leave'
 * - Absent = Total - Present - Leave
 * - Pending from LeaveRequest model
 */
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;

    const manager = await Manager.findOne({ userId })
      .populate('employeesUnder', 'firstName lastName employeeCode isActive');

    if (!manager) {
      return res.status(404).json({ success: false, message: 'Manager profile not found.' });
    }

    const activeEmployees = manager.employeesUnder.filter(emp => emp.isActive);
    const totalEmployees = activeEmployees.length;
    const employeeIds = activeEmployees.map(emp => emp._id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // ✅ Present count
    const todayAttendance = await Attendance.countDocuments({
      employeeId: { $in: employeeIds },
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['present', 'half-day', 'late'] }
    });

    // ✅ Leave count - BOTH 'leave' AND 'on-leave'
    const leaveToday = await Attendance.countDocuments({
      employeeId: { $in: employeeIds },
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['leave', 'on-leave'] }
    });

    // ✅ Absent = Total - Present - Leave
    const absentToday = Math.max(0, totalEmployees - todayAttendance - leaveToday);

    // ✅ Pending leaves from LeaveRequest model
    const LeaveRequest = require('../models/LeaveRequest');
    const pendingLeaves = await LeaveRequest.countDocuments({
      employee: { $in: employeeIds },
      status: 'pending'
    });

    // ✅ Recent attendance
    const recentAttendance = await Attendance.find({
      employeeId: { $in: employeeIds }
    })
      .sort({ date: -1, createdAt: -1 })
      .limit(10)
      .populate('employeeId', 'firstName lastName employeeCode');

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalEmployees,
          todayAttendance,
          leaveToday,
          pendingLeaves,
          absentToday
        },
        recentAttendance
      }
    });
  } catch (error) {
    console.error('❌ Get manager dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data.', error: error.message });
  }
};

/**
 * Get All Employees Under Manager
 */
const getMyEmployees = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, search = '', department = '' } = req.query;

    const manager = await Manager.findOne({ userId });
    if (!manager) return res.status(404).json({ success: false, message: 'Manager profile not found.' });

    const query = { _id: { $in: manager.employeesUnder }, isActive: true };
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } }
      ];
    }
    if (department) query.department = department;

    const employees = await Employee.find(query)
      .populate('userId', 'email isActive lastLogin')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Employee.countDocuments(query);

    res.status(200).json({
      success: true,
      data: { employees, totalPages: Math.ceil(count / limit), currentPage: page, totalEmployees: count }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch employees.', error: error.message });
  }
};

/**
 * Get Employee Details
 */
const getEmployeeDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { employeeId } = req.params;

    const manager = await Manager.findOne({ userId });
    if (!manager) return res.status(404).json({ success: false, message: 'Manager profile not found.' });

    const hasAccess = manager.employeesUnder.some(emp => emp.toString() === employeeId);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });

    const employee = await Employee.findById(employeeId)
      .populate('userId', 'email isActive lastLogin')
      .populate('managerId', 'firstName lastName email');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    res.status(200).json({ success: true, data: { employee } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch employee details.', error: error.message });
  }
};

/**
 * Mark Attendance for Employee
 */
const markAttendance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { employeeId, date, clockIn, clockOut, status, remarks, location } = req.body;

    if (!employeeId || !date || !clockIn) {
      return res.status(400).json({ success: false, message: 'Employee ID, date, and clock-in time are required.' });
    }

    const manager = await Manager.findOne({ userId });
    if (!manager) return res.status(404).json({ success: false, message: 'Manager profile not found.' });

    const hasAccess = manager.employeesUnder.some(emp => emp.toString() === employeeId);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      employeeId,
      date: { $gte: attendanceDate, $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000) }
    });
    if (existingAttendance) return res.status(400).json({ success: false, message: 'Attendance already marked for this date.' });

    const clockInTime = new Date(clockIn);
    const shiftStartTime = employee.workSchedule?.shiftStartTime || '09:00';
    const [startHour, startMinute] = shiftStartTime.split(':').map(Number);
    const expectedClockIn = new Date(clockInTime);
    expectedClockIn.setHours(startHour, startMinute, 0, 0);

    const lateMinutes = Math.max(0, Math.floor((clockInTime - expectedClockIn) / (1000 * 60)));
    const isLate = lateMinutes > 15;

    let earlyLeave = false, earlyLeaveMinutes = 0;
    if (clockOut) {
      const clockOutTime = new Date(clockOut);
      const shiftEndTime = employee.workSchedule?.shiftEndTime || '17:00';
      const [endHour, endMinute] = shiftEndTime.split(':').map(Number);
      const expectedClockOut = new Date(clockOutTime);
      expectedClockOut.setHours(endHour, endMinute, 0, 0);
      if (clockOutTime < expectedClockOut) {
        earlyLeaveMinutes = Math.floor((expectedClockOut - clockOutTime) / (1000 * 60));
        earlyLeave = earlyLeaveMinutes > 15;
      }
    }

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
    res.status(201).json({ success: true, message: 'Attendance marked successfully.', data: { attendance } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark attendance.', error: error.message });
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

    const manager = await Manager.findOne({ userId });
    if (!manager) return res.status(404).json({ success: false, message: 'Manager profile not found.' });

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) return res.status(404).json({ success: false, message: 'Attendance record not found.' });

    if (attendance.managerId.toString() !== manager._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      attendanceId, { $set: updateData }, { new: true, runValidators: true }
    ).populate('employeeId', 'firstName lastName employeeCode');

    res.status(200).json({ success: true, message: 'Attendance updated successfully.', data: { attendance: updatedAttendance } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update attendance.', error: error.message });
  }
};

/**
 * Get Employee Attendance History
 */
const getEmployeeAttendanceHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { employeeId } = req.params;
    const { page = 1, limit = 10, startDate = '', endDate = '', status = '' } = req.query;

    const manager = await Manager.findOne({ userId });
    if (!manager) return res.status(404).json({ success: false, message: 'Manager profile not found.' });

    const hasAccess = manager.employeesUnder.some(emp => emp.toString() === employeeId);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied.' });

    const query = { employeeId };
    if (startDate && endDate) query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    else if (startDate) query.date = { $gte: new Date(startDate) };
    else if (endDate) query.date = { $lte: new Date(endDate) };
    if (status) query.status = status;

    const attendanceRecords = await Attendance.find(query)
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('managerId', 'firstName lastName')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Attendance.countDocuments(query);

    // ✅ Stats with both leave statuses
    const allRecords = await Attendance.find({ employeeId });
    const statistics = {
      totalPresent: allRecords.filter(a => ['present', 'half-day', 'late'].includes(a.status)).length,
      totalAbsent: allRecords.filter(a => a.status === 'absent').length,
      totalLate: allRecords.filter(a => a.isLate === true).length,
      totalLeave: allRecords.filter(a => ['leave', 'on-leave'].includes(a.status)).length
    };

    res.status(200).json({
      success: true,
      data: { attendance: attendanceRecords, totalPages: Math.ceil(count / limit), currentPage: page, totalRecords: count, statistics }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance history.', error: error.message });
  }
};

/**
 * ✅ Manager Attendance History - with working days calculation
 */
const getManagerAttendanceHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month, year } = req.query;

    const manager = await Manager.findOne({ userId })
      .populate('employeesUnder', 'firstName lastName employeeCode isActive joiningDate department');

    if (!manager) return res.status(404).json({ success: false, message: 'Manager profile not found.' });

    const systemConfig = await SystemConfig.findOne({ isActive: true });
    const configWorkingDays = systemConfig?.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    let startDate, endDate;
    if (month && year) {
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    } else {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    }

    // Cap at today
    const effectiveEnd = endDate > today ? today : endDate;

    const activeEmployees = manager.employeesUnder.filter(emp => emp.isActive);
    const employeeIds = activeEmployees.map(emp => emp._id);

    const allAttendance = await Attendance.find({
      employeeId: { $in: employeeIds },
      date: { $gte: startDate, $lte: effectiveEnd }
    }).populate('employeeId', 'firstName lastName employeeCode joiningDate department');

    // Per-employee stats with joining date consideration
    const employeeStats = await Promise.all(activeEmployees.map(async emp => {
      const joiningDate = emp.joiningDate ? new Date(emp.joiningDate) : startDate;
      joiningDate.setHours(0, 0, 0, 0);

      const empStart = joiningDate > startDate ? joiningDate : startDate;
      const workingDays = await calculateWorkingDays(empStart, effectiveEnd, configWorkingDays);

      const empAtt = allAttendance.filter(a => a.employeeId?._id?.toString() === emp._id.toString());

      return {
        employeeId: emp._id,
        name: `${emp.firstName} ${emp.lastName}`,
        employeeCode: emp.employeeCode,
        department: emp.department,
        joiningDate: emp.joiningDate,
        workingDays,
        present: empAtt.filter(a => ['present', 'half-day', 'late'].includes(a.status)).length,
        absent: empAtt.filter(a => a.status === 'absent').length,
        leave: empAtt.filter(a => ['leave', 'on-leave'].includes(a.status)).length,
        late: empAtt.filter(a => a.isLate === true).length
      };
    }));

    res.status(200).json({
      success: true,
      data: {
        employeeStats,
        period: { startDate, endDate: effectiveEnd }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance history.', error: error.message });
  }
};

/**
 * Clock In/Out (Manager's own attendance)
 */
const clockInOut = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { action, location } = req.body;

    if (!action || !['clock-in', 'clock-out'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action.' });
    }

    const manager = await Manager.findOne({ userId });
    if (!manager) return res.status(404).json({ success: false, message: 'Manager profile not found.' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (action === 'clock-in') {
      const existingAttendance = await Attendance.findOne({ employeeId: manager._id, date: { $gte: today } });
      if (existingAttendance) return res.status(400).json({ success: false, message: 'Already clocked in today.' });

      const attendance = new Attendance({
        employeeId: manager._id, managerId: manager._id, date: today,
        clockIn: new Date(), status: 'present',
        location: { clockInLocation: location },
        markedBy: userId, isApproved: true, approvedBy: userId
      });
      await attendance.save();
      return res.status(201).json({ success: true, message: 'Clocked in successfully.', data: { attendance } });
    } else {
      const attendance = await Attendance.findOne({ employeeId: manager._id, date: { $gte: today } });
      if (!attendance) return res.status(400).json({ success: false, message: 'No clock-in record found for today.' });
      if (attendance.clockOut) return res.status(400).json({ success: false, message: 'Already clocked out today.' });

      attendance.clockOut = new Date();
      if (location) attendance.location.clockOutLocation = location;
      await attendance.save();
      return res.status(200).json({ success: true, message: 'Clocked out successfully.', data: { attendance } });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to process clock in/out.', error: error.message });
  }
};

/**
 * Get Manager's Own Attendance
 */
const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, startDate = '', endDate = '' } = req.query;

    const manager = await Manager.findOne({ userId });
    if (!manager) return res.status(404).json({ success: false, message: 'Manager profile not found.' });

    const query = { employeeId: manager._id };
    if (startDate && endDate) query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };

    const attendanceRecords = await Attendance.find(query).sort({ date: -1 }).limit(limit * 1).skip((page - 1) * limit);
    const count = await Attendance.countDocuments(query);

    res.status(200).json({ success: true, data: { attendance: attendanceRecords, totalPages: Math.ceil(count / limit), currentPage: page, totalRecords: count } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance history.', error: error.message });
  }
};

/**
 * Get Leave Requests from Employees
 */
const getLeaveRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status = '' } = req.query;

    const manager = await Manager.findOne({ userId });
    if (!manager) return res.status(404).json({ success: false, message: 'Manager profile not found.' });

    const query = { managerId: manager._id };
    if (status) query.status = status;

    const leaves = await Leave.find(query)
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('approvedBy', 'email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Leave.countDocuments(query);

    res.status(200).json({ success: true, data: { leaves, totalPages: Math.ceil(count / limit), currentPage: page, totalLeaves: count } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch leave requests.', error: error.message });
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
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const manager = await Manager.findOne({ userId });
    if (!manager) return res.status(404).json({ success: false, message: 'Manager profile not found.' });

    const leave = await Leave.findById(leaveId);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found.' });

    if (leave.managerId.toString() !== manager._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Leave is already ${leave.status}.` });
    }

    leave.status = status;
    leave.approvedBy = userId;
    leave.approvedAt = new Date();
    if (status === 'rejected' && rejectionReason) leave.rejectionReason = rejectionReason;
    await leave.save();

    res.status(200).json({ success: true, message: `Leave ${status} successfully.`, data: { leave } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update leave status.', error: error.message });
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
    if (!manager) return res.status(404).json({ success: false, message: 'Manager profile not found.' });
    res.status(200).json({ success: true, data: { manager } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile.', error: error.message });
  }
};

/**
 * Update Manager Profile
 */
const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updateData = req.body;
    delete updateData.salary;
    delete updateData.employeesUnder;
    delete updateData.isActive;

    const manager = await Manager.findOneAndUpdate({ userId }, { $set: updateData }, { new: true, runValidators: true })
      .populate('userId', 'email')
      .populate('employeesUnder', 'firstName lastName employeeCode');
    if (!manager) return res.status(404).json({ success: false, message: 'Manager profile not found.' });

    res.status(200).json({ success: true, message: 'Profile updated successfully.', data: { manager } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile.', error: error.message });
  }
};

module.exports = {
  getDashboard,           // ✅ FIXED - leave + absent calculation correct
  getMyEmployees,
  getEmployeeDetails,
  markAttendance,
  updateAttendance,
  getEmployeeAttendanceHistory,
  getManagerAttendanceHistory,
  clockInOut,
  getMyAttendance,
  getLeaveRequests,
  updateLeaveStatus,
  getMyProfile,
  updateMyProfile
};