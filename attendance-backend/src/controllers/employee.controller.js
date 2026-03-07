const User = require('../models/User');
const Employee = require('../models/Employee');
const Manager = require('../models/Manager');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Salary = require('../models/Salary');
const Holiday = require('../models/Holiday');
const SystemConfig = require('../models/SystemConfig');

// ===== HELPER: Calculate Working Days =====
// Joining date se aaj tak, weekends aur holidays minus karke
const calculateWorkingDays = async (joiningDate, endDate, workingDays) => {
  const holidays = await Holiday.find({
    date: { $gte: joiningDate, $lte: endDate }
  });
  const holidayDates = holidays.map(h => new Date(h.date).toDateString());

  let count = 0;
  const current = new Date(joiningDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });
    const isWorkingDay = workingDays.includes(dayName);
    const isHoliday = holidayDates.includes(current.toDateString());
    if (isWorkingDay && !isHoliday) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
};

/**
 * Employee Dashboard - FIXED
 */
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;

    const employee = await Employee.findOne({ userId })
      .populate('managerId', 'firstName lastName email phoneNumber');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    }

    // System config for working days
    const systemConfig = await SystemConfig.findOne({ isActive: true });
    const configWorkingDays = systemConfig?.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Today's attendance
    const todayAttendance = await Attendance.findOne({
      employeeId: employee._id,
      date: { $gte: today, $lt: tomorrow }
    });

    // ✅ Working Days = joining date se aaj tak, weekends + holidays minus
    const joiningDate = employee.joiningDate
      ? new Date(employee.joiningDate)
      : new Date(today.getFullYear(), today.getMonth(), 1);
    joiningDate.setHours(0, 0, 0, 0);

    const totalWorkingDays = await calculateWorkingDays(joiningDate, today, configWorkingDays);

    // This month stats
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const allMonthAttendance = await Attendance.find({
      employeeId: employee._id,
      date: { $gte: monthStart, $lte: monthEnd }
    });

    const presentDays = allMonthAttendance.filter(a =>
      ['present', 'half-day', 'late'].includes(a.status)
    ).length;

    const absentDays = allMonthAttendance.filter(a => a.status === 'absent').length;

    const leaveDays = allMonthAttendance.filter(a =>
      ['leave', 'on-leave'].includes(a.status)
    ).length;

    const lateDays = allMonthAttendance.filter(a => a.isLate === true).length;

    // ✅ Today's status - present/absent/leave mein se ek
    let todayStatus = 'not_marked';
    let todayLateMinutes = 0;
    let isLateToday = false;

    if (todayAttendance) {
      if (['leave', 'on-leave'].includes(todayAttendance.status)) {
        todayStatus = 'leave';
      } else if (todayAttendance.status === 'absent') {
        todayStatus = 'absent';
      } else if (['present', 'half-day', 'late'].includes(todayAttendance.status)) {
        todayStatus = 'present';
      }
      isLateToday = todayAttendance.isLate || false;
      todayLateMinutes = todayAttendance.lateMinutes || 0;
    }

    const monthlyStats = {
      workingDays: totalWorkingDays,  // ✅ Proper working days
      present: presentDays,
      absent: absentDays,
      onLeave: leaveDays,
      late: lateDays
    };

    // Pending leaves
    const LeaveRequest = require('../models/LeaveRequest');
    const pendingLeaves = await LeaveRequest.countDocuments({
      employee: employee._id,
      status: 'pending'
    });

    // Recent attendance
    const recentAttendance = await Attendance.find({ employeeId: employee._id })
      .sort({ date: -1 })
      .limit(5)
      .populate('managerId', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: {
        employee,
        todayAttendance,
        todayStatus,        // ✅ 'present' | 'absent' | 'leave' | 'not_marked'
        isLateToday,        // ✅ true/false
        todayLateMinutes,   // ✅ kitne minutes late
        monthlyStats,
        pendingLeaves,
        recentAttendance
      }
    });
  } catch (error) {
    console.error('❌ Get employee dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data.', error: error.message });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const employee = await Employee.findOne({ userId })
      .populate('userId', 'email isActive lastLogin')
      .populate('managerId', 'firstName lastName email phoneNumber department');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    res.status(200).json({ success: true, data: { employee } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile.', error: error.message });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updateData = req.body;
    delete updateData.employeeCode; delete updateData.managerId; delete updateData.salary;
    delete updateData.department; delete updateData.designation; delete updateData.joiningDate;
    delete updateData.isActive; delete updateData.workSchedule;
    const employee = await Employee.findOneAndUpdate({ userId }, { $set: updateData }, { new: true, runValidators: true })
      .populate('userId', 'email').populate('managerId', 'firstName lastName email');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    res.status(200).json({ success: true, message: 'Profile updated successfully.', data: { employee } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile.', error: error.message });
  }
};

const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, startDate = '', endDate = '', status = '' } = req.query;
    const employee = await Employee.findOne({ userId });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    const query = { employeeId: employee._id };
    if (startDate && endDate) query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    else if (startDate) query.date = { $gte: new Date(startDate) };
    else if (endDate) query.date = { $lte: new Date(endDate) };
    if (status) query.status = status;
    const attendanceRecords = await Attendance.find(query).populate('managerId', 'firstName lastName').sort({ date: -1 }).limit(limit * 1).skip((page - 1) * limit);
    const count = await Attendance.countDocuments(query);
    res.status(200).json({ success: true, data: { attendance: attendanceRecords, totalPages: Math.ceil(count / limit), currentPage: page, totalRecords: count } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance records.', error: error.message });
  }
};

const getAttendanceHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month, year } = req.query;
    const employee = await Employee.findOne({ userId });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    let startDate, endDate;
    if (month && year) {
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      endDate = new Date(parseInt(year), parseInt(month), 0);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    const attendanceRecords = await Attendance.find({ employeeId: employee._id, date: { $gte: startDate, $lte: endDate } }).populate('managerId', 'firstName lastName').sort({ date: 1 });
    const statistics = {
      totalDays: attendanceRecords.length,
      present: attendanceRecords.filter(a => ['present', 'late', 'half-day'].includes(a.status)).length,
      absent: attendanceRecords.filter(a => a.status === 'absent').length,
      late: attendanceRecords.filter(a => a.isLate).length,
      halfDay: attendanceRecords.filter(a => a.status === 'half-day').length,
      // ✅ Both leave statuses
      onLeave: attendanceRecords.filter(a => ['leave', 'on-leave'].includes(a.status)).length,
      totalWorkHours: attendanceRecords.reduce((sum, a) => sum + (a.workHours || 0), 0),
      totalOvertimeHours: attendanceRecords.reduce((sum, a) => sum + (a.overtimeHours || 0), 0)
    };
    res.status(200).json({ success: true, data: { attendance: attendanceRecords, statistics, period: { month: startDate.getMonth() + 1, year: startDate.getFullYear() } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance history.', error: error.message });
  }
};

const getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const employee = await Employee.findOne({ userId });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.findOne({ employeeId: employee._id, date: { $gte: today } }).populate('managerId', 'firstName lastName');
    if (!todayAttendance) return res.status(200).json({ success: true, message: 'No attendance record for today.', data: { hasClocked: false, attendance: null } });
    res.status(200).json({ success: true, data: { hasClocked: true, attendance: todayAttendance } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch today's attendance.", error: error.message });
  }
};

const applyLeave = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { leaveType, startDate, endDate, reason, attachments } = req.body;
    if (!leaveType || !startDate || !endDate || !reason) return res.status(400).json({ success: false, message: 'All fields required.' });
    const employee = await Employee.findOne({ userId });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    const start = new Date(startDate), end = new Date(endDate);
    const numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (numberOfDays <= 0) return res.status(400).json({ success: false, message: 'Invalid date range.' });
    const overlapping = await Leave.findOne({ employeeId: employee._id, status: { $in: ['pending', 'approved'] }, $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }] });
    if (overlapping) return res.status(400).json({ success: false, message: 'You already have a leave for these dates.' });
    const leave = new Leave({ employeeId: employee._id, managerId: employee.managerId, leaveType, startDate: start, endDate: end, numberOfDays, reason, attachments, status: 'pending' });
    await leave.save();
    res.status(201).json({ success: true, message: 'Leave request submitted.', data: { leave } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit leave.', error: error.message });
  }
};

const getMyLeaves = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status = '' } = req.query;
    const employee = await Employee.findOne({ userId });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    const query = { employeeId: employee._id };
    if (status) query.status = status;
    const leaves = await Leave.find(query).populate('managerId', 'firstName lastName email').populate('approvedBy', 'email').sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit);
    const count = await Leave.countDocuments(query);
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1), yearEnd = new Date(currentYear, 11, 31);
    const leaveStats = { totalApproved: await Leave.aggregate([{ $match: { employeeId: employee._id, status: 'approved', startDate: { $gte: yearStart, $lte: yearEnd } } }, { $group: { _id: null, totalDays: { $sum: '$numberOfDays' } } }]), pending: await Leave.countDocuments({ employeeId: employee._id, status: 'pending' }), rejected: await Leave.countDocuments({ employeeId: employee._id, status: 'rejected' }) };
    res.status(200).json({ success: true, data: { leaves, totalPages: Math.ceil(count / limit), currentPage: page, totalLeaves: count, statistics: { approvedDaysThisYear: leaveStats.totalApproved[0]?.totalDays || 0, pendingRequests: leaveStats.pending, rejectedRequests: leaveStats.rejected } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch leave requests.', error: error.message });
  }
};

const getLeaveDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { leaveId } = req.params;
    const employee = await Employee.findOne({ userId });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    const leave = await Leave.findById(leaveId).populate('managerId', 'firstName lastName email phoneNumber').populate('approvedBy', 'email');
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found.' });
    if (leave.employeeId.toString() !== employee._id.toString()) return res.status(403).json({ success: false, message: 'Access denied.' });
    res.status(200).json({ success: true, data: { leave } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch leave details.', error: error.message });
  }
};

const cancelLeave = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { leaveId } = req.params;
    const employee = await Employee.findOne({ userId });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    const leave = await Leave.findById(leaveId);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found.' });
    if (leave.employeeId.toString() !== employee._id.toString()) return res.status(403).json({ success: false, message: 'Access denied.' });
    if (!['pending', 'approved'].includes(leave.status)) return res.status(400).json({ success: false, message: `Cannot cancel ${leave.status} leave.` });
    leave.status = 'cancelled';
    await leave.save();
    res.status(200).json({ success: true, message: 'Leave cancelled.', data: { leave } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel leave.', error: error.message });
  }
};

const getMySalary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, year = '' } = req.query;
    const employee = await Employee.findOne({ userId });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    const query = { employeeId: employee._id };
    if (year) query.year = parseInt(year);
    const salaries = await Salary.find(query).populate('generatedBy', 'email').populate('approvedBy', 'email').sort({ year: -1, month: -1 }).limit(limit * 1).skip((page - 1) * limit);
    const count = await Salary.countDocuments(query);
    res.status(200).json({ success: true, data: { salaries, totalPages: Math.ceil(count / limit), currentPage: page, totalRecords: count } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch salary.', error: error.message });
  }
};

const getSalaryDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { salaryId } = req.params;
    const employee = await Employee.findOne({ userId });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    const salary = await Salary.findById(salaryId).populate('generatedBy', 'email').populate('approvedBy', 'email');
    if (!salary) return res.status(404).json({ success: false, message: 'Salary not found.' });
    if (salary.employeeId.toString() !== employee._id.toString()) return res.status(403).json({ success: false, message: 'Access denied.' });
    res.status(200).json({ success: true, data: { salary } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch salary details.', error: error.message });
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