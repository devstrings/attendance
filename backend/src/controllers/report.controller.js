const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Manager = require('../models/Manager');
const Leave = require('../models/Leave');
const Salary = require('../models/Salary');
const Holiday = require('../models/Holiday');
const MonthlyConfig = require('../models/MonthlyConfig');

/**
 * Get Daily Attendance Report
 */
const getDailyAttendanceReport = async (req, res) => {
  try {
    const { date, department = '', status = '' } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required.'
      });
    }

    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);

    const query = {
      date: {
        $gte: reportDate,
        $lt: new Date(reportDate.getTime() + 24 * 60 * 60 * 1000)
      }
    };

    // Status filter
    if (status) {
      query.status = status;
    }

    // ✅ NEW — company scoping
    let companyEmployeeIds = null;
    if (req.companyId) {
      companyEmployeeIds = await Employee.find({ companyId: req.companyId }).distinct('_id');
      query.employeeId = { $in: companyEmployeeIds };
    }

    // Department filter
    if (department) {
      const employees = await Employee.find({ department, isActive: true }).select('_id');
      const employeeIds = employees.map(emp => emp._id);
      query.employeeId = { $in: employeeIds };
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('employeeId', 'firstName lastName employeeCode department designation')
      .populate('managerId', 'firstName lastName')
      .sort({ 'employeeId.employeeCode': 1 });

    // Get all active employees to find who didn't mark attendance
    const allEmployees = await Employee.find({ isActive: true }).select('_id firstName lastName employeeCode department');
    
    const markedEmployeeIds = attendanceRecords.map(a => a.employeeId._id.toString());
    const notMarkedEmployees = allEmployees.filter(emp => !markedEmployeeIds.includes(emp._id.toString()));

    // Statistics
    const statistics = {
      total: allEmployees.length,
      present: attendanceRecords.filter(a => a.status === 'present').length,
      absent: attendanceRecords.filter(a => a.status === 'absent').length,
      late: attendanceRecords.filter(a => a.isLate).length,
      halfDay: attendanceRecords.filter(a => a.status === 'half-day').length,
      onLeave: attendanceRecords.filter(a => a.status === 'on-leave').length,
      holiday: attendanceRecords.filter(a => a.status === 'holiday').length,
      notMarked: notMarkedEmployees.length
    };

    res.status(200).json({
      success: true,
      data: {
        date: reportDate,
        statistics,
        attendanceRecords,
        notMarkedEmployees
      }
    });
  } catch (error) {
    console.error('Get daily attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily attendance report.',
      error: error.message
    });
  }
};

/**
 * Get Monthly Attendance Report
 */
const getMonthlyAttendanceReport = async (req, res) => {
  try {
    const { month, year, employeeId = '', department = '' } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required.'
      });
    }

    const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthEnd = new Date(parseInt(year), parseInt(month), 0);

    const query = {
      date: { $gte: monthStart, $lte: monthEnd }
    };

    // ✅ NEW — company scoping (fallback jab department filter na diya ho)
    if (req.companyId && !department) {
      const companyEmployeeIds = await Employee.find({ companyId: req.companyId }).distinct('_id');
      query.employeeId = { $in: companyEmployeeIds };
    }

    // Employee filter
    if (employeeId) {
      query.employeeId = employeeId;
    }

    // Department filter
    if (department) {
      const employees = await Employee.find({ 
        department, 
        isActive: true,
        ...(req.companyId ? { companyId: req.companyId } : {})
      }).select('_id');
      const employeeIds = employees.map(emp => emp._id);
      query.employeeId = { $in: employeeIds };
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('employeeId', 'firstName lastName employeeCode department designation')
      .sort({ employeeId: 1, date: 1 });

    // Group by employee
    const employeeWiseData = {};

    attendanceRecords.forEach(record => {
      const empId = record.employeeId._id.toString();
      
      if (!employeeWiseData[empId]) {
        employeeWiseData[empId] = {
          employee: record.employeeId,
          attendance: [],
          statistics: {
            totalDays: 0,
            present: 0,
            absent: 0,
            late: 0,
            halfDay: 0,
            onLeave: 0,
            holiday: 0,
            totalWorkHours: 0,
            totalOvertimeHours: 0
          }
        };
      }

      employeeWiseData[empId].attendance.push(record);
      employeeWiseData[empId].statistics.totalDays++;
      
      if (record.status === 'present') employeeWiseData[empId].statistics.present++;
      if (record.status === 'absent') employeeWiseData[empId].statistics.absent++;
      if (record.isLate) employeeWiseData[empId].statistics.late++;
      if (record.status === 'half-day') employeeWiseData[empId].statistics.halfDay++;
      if (record.status === 'on-leave') employeeWiseData[empId].statistics.onLeave++;
      if (record.status === 'holiday') employeeWiseData[empId].statistics.holiday++;
      
      employeeWiseData[empId].statistics.totalWorkHours += record.workHours || 0;
      employeeWiseData[empId].statistics.totalOvertimeHours += record.overtimeHours || 0;
    });

    // Get monthly config
    const monthlyConfig = await MonthlyConfig.findOne({
      month: parseInt(month),
      year: parseInt(year)
    });

    res.status(200).json({
      success: true,
      data: {
        period: {
          month: parseInt(month),
          year: parseInt(year),
          workingDays: monthlyConfig?.workingDays || 0
        },
        employees: Object.values(employeeWiseData)
      }
    });
  } catch (error) {
    console.error('Get monthly attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly attendance report.',
      error: error.message
    });
  }
};

/**
 * Get Employee Attendance Summary Report
 */
const getEmployeeAttendanceSummary = async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    if (!employeeId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, start date, and end date are required.'
      });
    }

    const employee = await Employee.findById(employeeId)
      .populate('userId', 'email')
      .populate('managerId', 'firstName lastName');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.'
      });
    }

    // ✅ NEW — company access check
    if (req.companyId && employee.companyId && employee.companyId.toString() !== req.companyId.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const attendanceRecords = await Attendance.find({
      employeeId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ date: 1 });

    // Calculate detailed statistics
    const statistics = {
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
      earlyLeaveCount: attendanceRecords.filter(a => a.earlyLeave).length,
      totalEarlyLeaveMinutes: attendanceRecords.reduce((sum, a) => sum + (a.earlyLeaveMinutes || 0), 0),
      averageWorkHours: 0,
      attendancePercentage: 0
    };

    if (statistics.totalDays > 0) {
      statistics.averageWorkHours = (statistics.totalWorkHours / statistics.totalDays).toFixed(2);
      statistics.attendancePercentage = ((statistics.present / statistics.totalDays) * 100).toFixed(2);
    }

    // Get leave requests in this period
    const leaves = await Leave.find({
      employeeId,
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) },
      status: 'approved'
    });

    res.status(200).json({
      success: true,
      data: {
        employee,
        period: {
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        },
        statistics,
        attendanceRecords,
        leaves
      }
    });
  } catch (error) {
    console.error('Get employee attendance summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee attendance summary.',
      error: error.message
    });
  }
};

/**
 * Get Department-wise Attendance Report
 */
const getDepartmentWiseReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required.'
      });
    }

    const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthEnd = new Date(parseInt(year), parseInt(month), 0);

    // Get all departments
    // Get all departments
    const departments = await Employee.distinct('department', { 
      isActive: true,
      ...(req.companyId ? { companyId: req.companyId } : {})   // ✅ NEW
    });

    const departmentReports = [];

    for (const department of departments) {
      const employees = await Employee.find({ 
        department, 
        isActive: true,
        ...(req.companyId ? { companyId: req.companyId } : {})   // ✅ NEW
      }).select('_id');

      const employeeIds = employees.map(emp => emp._id);

      const attendanceRecords = await Attendance.find({
        employeeId: { $in: employeeIds },
        date: { $gte: monthStart, $lte: monthEnd }
      });

      const statistics = {
        totalEmployees: employees.length,
        totalDays: attendanceRecords.length,
        present: attendanceRecords.filter(a => a.status === 'present').length,
        absent: attendanceRecords.filter(a => a.status === 'absent').length,
        late: attendanceRecords.filter(a => a.isLate).length,
        halfDay: attendanceRecords.filter(a => a.status === 'half-day').length,
        onLeave: attendanceRecords.filter(a => a.status === 'on-leave').length,
        totalWorkHours: attendanceRecords.reduce((sum, a) => sum + (a.workHours || 0), 0),
        totalOvertimeHours: attendanceRecords.reduce((sum, a) => sum + (a.overtimeHours || 0), 0),
        attendancePercentage: 0
      };

      if (statistics.totalDays > 0) {
        statistics.attendancePercentage = ((statistics.present / statistics.totalDays) * 100).toFixed(2);
      }

      departmentReports.push({
        department,
        statistics
      });
    }

    res.status(200).json({
      success: true,
      data: {
        period: {
          month: parseInt(month),
          year: parseInt(year)
        },
        departments: departmentReports
      }
    });
  } catch (error) {
    console.error('Get department-wise report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department-wise report.',
      error: error.message
    });
  }
};

/**
 * Get Leave Report
 */
const getLeaveReport = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      department = '', 
      leaveType = '',
      status = 'approved'
    } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required.'
      });
    }

    const query = {
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) }
    };

    // ✅ NEW — company scoping (fallback jab department filter na diya ho)
    if (req.companyId && !department) {
      const companyEmployeeIds = await Employee.find({ companyId: req.companyId }).distinct('_id');
      query.employeeId = { $in: companyEmployeeIds };
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Leave type filter
    if (leaveType) {
      query.leaveType = leaveType;
    }

    // Department filter
    if (department) {
      const employees = await Employee.find({ 
        department, 
        isActive: true,
        ...(req.companyId ? { companyId: req.companyId } : {})
      }).select('_id');

      const employeeIds = employees.map(emp => emp._id);
      query.employeeId = { $in: employeeIds };
    }

    const leaves = await Leave.find(query)
      .populate('employeeId', 'firstName lastName employeeCode department designation')
      .populate('managerId', 'firstName lastName')
      .populate('approvedBy', 'email')
      .sort({ startDate: -1 });

    // Statistics by leave type
    const leaveTypeStats = {
      sick: { count: 0, days: 0 },
      casual: { count: 0, days: 0 },
      annual: { count: 0, days: 0 },
      unpaid: { count: 0, days: 0 },
      emergency: { count: 0, days: 0 },
      maternity: { count: 0, days: 0 },
      paternity: { count: 0, days: 0 }
    };

    leaves.forEach(leave => {
      if (leaveTypeStats[leave.leaveType]) {
        leaveTypeStats[leave.leaveType].count++;
        leaveTypeStats[leave.leaveType].days += leave.numberOfDays;
      }
    });

    const totalLeaveDays = leaves.reduce((sum, leave) => sum + leave.numberOfDays, 0);

    res.status(200).json({
      success: true,
      data: {
        period: {
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        },
        statistics: {
          totalLeaves: leaves.length,
          totalLeaveDays,
          byType: leaveTypeStats
        },
        leaves
      }
    });
  } catch (error) {
    console.error('Get leave report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave report.',
      error: error.message
    });
  }
};

/**
 * Get Salary Report
 */
const getSalaryReport = async (req, res) => {
  try {
    const { month, year, department = '', paymentStatus = '' } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required.'
      });
    }

    const query = {
      month: parseInt(month),
      year: parseInt(year)
    };

    // ✅ NEW — company scoping (fallback jab department filter na diya ho)
    if (req.companyId && !department) {
      const companyEmployeeIds = await Employee.find({ companyId: req.companyId }).distinct('_id');
      query.employeeId = { $in: companyEmployeeIds };
    }

    // Payment status filter
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Department filter
    if (department) {
      const employees = await Employee.find({ 
        department, 
        isActive: true,
        ...(req.companyId ? { companyId: req.companyId } : {})
      }).select('_id');
      const employeeIds = employees.map(emp => emp._id);
      query.employeeId = { $in: employeeIds };
    }

    const salaries = await Salary.find(query)
      .populate('employeeId', 'firstName lastName employeeCode department designation')
      .sort({ 'employeeId.employeeCode': 1 });

    // Calculate statistics
    const statistics = {
      totalEmployees: salaries.length,
      totalBasicSalary: salaries.reduce((sum, s) => sum + s.basicSalary, 0),
      totalAllowances: salaries.reduce((sum, s) => 
        sum + (s.allowances.houseRent + s.allowances.transport + s.allowances.medical + s.allowances.other), 0
      ),
      totalOvertimeAmount: salaries.reduce((sum, s) => sum + (s.overtime?.amount || 0), 0),
      totalGrossSalary: salaries.reduce((sum, s) => sum + s.grossSalary, 0),
      totalDeductions: salaries.reduce((sum, s) => sum + s.totalDeductions, 0),
      totalNetSalary: salaries.reduce((sum, s) => sum + s.netSalary, 0),
      paymentStatusBreakdown: {
        pending: salaries.filter(s => s.paymentStatus === 'pending').length,
        processed: salaries.filter(s => s.paymentStatus === 'processed').length,
        paid: salaries.filter(s => s.paymentStatus === 'paid').length,
        onHold: salaries.filter(s => s.paymentStatus === 'on-hold').length
      }
    };

    res.status(200).json({
      success: true,
      data: {
        period: {
          month: parseInt(month),
          year: parseInt(year)
        },
        statistics,
        salaries
      }
    });
  } catch (error) {
    console.error('Get salary report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salary report.',
      error: error.message
    });
  }
};

/**
 * Get Late Arrival Report
 */
const getLateArrivalReport = async (req, res) => {
  try {
    const { startDate, endDate, department = '' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required.'
      });
    }

    const query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      isLate: true
    };

    // ✅ NEW — company scoping (fallback jab department filter na diya ho)
    if (req.companyId && !department) {
      const companyEmployeeIds = await Employee.find({ companyId: req.companyId }).distinct('_id');
      query.employeeId = { $in: companyEmployeeIds };
    }

    // Department filter
    if (department) {
      const employees = await Employee.find({ 
        department, 
        isActive: true,
        ...(req.companyId ? { companyId: req.companyId } : {})
      }).select('_id');
      const employeeIds = employees.map(emp => emp._id);
      query.employeeId = { $in: employeeIds };
    }

    const lateRecords = await Attendance.find(query)
      .populate('employeeId', 'firstName lastName employeeCode department designation')
      .populate('managerId', 'firstName lastName')
      .sort({ date: -1 });

    // Group by employee
    const employeeWiseStats = {};

    lateRecords.forEach(record => {
      const empId = record.employeeId._id.toString();
      
      if (!employeeWiseStats[empId]) {
        employeeWiseStats[empId] = {
          employee: record.employeeId,
          lateCount: 0,
          totalLateMinutes: 0,
          records: []
        };
      }

      employeeWiseStats[empId].lateCount++;
      employeeWiseStats[empId].totalLateMinutes += record.lateMinutes || 0;
      employeeWiseStats[empId].records.push(record);
    });

    // Sort by late count
    const sortedEmployees = Object.values(employeeWiseStats).sort((a, b) => b.lateCount - a.lateCount);

    res.status(200).json({
      success: true,
      data: {
        period: {
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        },
        totalLateRecords: lateRecords.length,
        employees: sortedEmployees
      }
    });
  } catch (error) {
    console.error('Get late arrival report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch late arrival report.',
      error: error.message
    });
  }
};

/**
 * Get Overtime Report
 */
const getOvertimeReport = async (req, res) => {
  try {
    const { month, year, department = '' } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required.'
      });
    }

    const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthEnd = new Date(parseInt(year), parseInt(month), 0);

    const query = {
      date: { $gte: monthStart, $lte: monthEnd },
      overtimeHours: { $gt: 0 }
    };

    // ✅ NEW — company scoping (fallback jab department filter na diya ho)
    if (req.companyId && !department) {
      const companyEmployeeIds = await Employee.find({ companyId: req.companyId }).distinct('_id');
      query.employeeId = { $in: companyEmployeeIds };
    }

    // Department filter
    if (department) {
      const employees = await Employee.find({ 
        department, 
        isActive: true,
        ...(req.companyId ? { companyId: req.companyId } : {})
      }).select('_id');
      const employeeIds = employees.map(emp => emp._id);
      query.employeeId = { $in: employeeIds };
    }

    const overtimeRecords = await Attendance.find(query)
      .populate('employeeId', 'firstName lastName employeeCode department designation')
      .sort({ date: 1 });

    // Group by employee
    const employeeWiseStats = {};

    overtimeRecords.forEach(record => {
      const empId = record.employeeId._id.toString();
      
      if (!employeeWiseStats[empId]) {
        employeeWiseStats[empId] = {
          employee: record.employeeId,
          totalOvertimeHours: 0,
          totalDays: 0,
          records: []
        };
      }

      employeeWiseStats[empId].totalOvertimeHours += record.overtimeHours || 0;
      employeeWiseStats[empId].totalDays++;
      employeeWiseStats[empId].records.push(record);
    });

    const totalOvertimeHours = Object.values(employeeWiseStats).reduce(
      (sum, emp) => sum + emp.totalOvertimeHours, 0
    );

    res.status(200).json({
      success: true,
      data: {
        period: {
          month: parseInt(month),
          year: parseInt(year)
        },
        totalOvertimeHours,
        totalEmployees: Object.keys(employeeWiseStats).length,
        employees: Object.values(employeeWiseStats).sort((a, b) => b.totalOvertimeHours - a.totalOvertimeHours)
      }
    });
  } catch (error) {
    console.error('Get overtime report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overtime report.',
      error: error.message
    });
  }
};

/**
 * Get Comprehensive Monthly Report (All in One)
 */
const getComprehensiveMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required.'
      });
    }

    const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthEnd = new Date(parseInt(year), parseInt(month), 0);

    // ✅ NEW — company scoping
    const companyFilter = req.companyId ? { companyId: req.companyId } : {};
    const companyEmployeeIds = req.companyId
      ? await Employee.find({ companyId: req.companyId }).distinct('_id')
      : null;

    // Get all data
    const [
      attendanceRecords,
      leaves,
      salaries,
      employees,
      monthlyConfig,
      holidays
    ] = await Promise.all([
      Attendance.find({
        date: { $gte: monthStart, $lte: monthEnd },
        ...(companyEmployeeIds ? { employeeId: { $in: companyEmployeeIds } } : {})
      }).populate('employeeId', 'firstName lastName employeeCode department'),
      Leave.find({
        startDate: { $lte: monthEnd },
        endDate: { $gte: monthStart },
        status: 'approved',
        ...companyFilter
      }),
      Salary.find({
        month: parseInt(month),
        year: parseInt(year),
        ...companyFilter
      }),
      Employee.find({ isActive: true, ...companyFilter }),
      MonthlyConfig.findOne({
        month: parseInt(month),
        year: parseInt(year)
      }),
      Holiday.find({
        date: { $gte: monthStart, $lte: monthEnd },
        ...companyFilter
      })
    ]);

    // Attendance statistics
    const attendanceStats = {
      totalRecords: attendanceRecords.length,
      present: attendanceRecords.filter(a => a.status === 'present').length,
      absent: attendanceRecords.filter(a => a.status === 'absent').length,
      late: attendanceRecords.filter(a => a.isLate).length,
      halfDay: attendanceRecords.filter(a => a.status === 'half-day').length,
      onLeave: attendanceRecords.filter(a => a.status === 'on-leave').length,
      totalWorkHours: attendanceRecords.reduce((sum, a) => sum + (a.workHours || 0), 0),
      totalOvertimeHours: attendanceRecords.reduce((sum, a) => sum + (a.overtimeHours || 0), 0)
    };

    // Leave statistics
    const leaveStats = {
      totalLeaves: leaves.length,
      totalLeaveDays: leaves.reduce((sum, l) => sum + l.numberOfDays, 0)
    };

    // Salary statistics
    const salaryStats = {
      totalEmployeesPaid: salaries.length,
      totalGrossSalary: salaries.reduce((sum, s) => sum + s.grossSalary, 0),
      totalNetSalary: salaries.reduce((sum, s) => sum + s.netSalary, 0),
      totalDeductions: salaries.reduce((sum, s) => sum + s.totalDeductions, 0)
    };

    res.status(200).json({
      success: true,
      data: {
        period: {
          month: parseInt(month),
          year: parseInt(year),
          workingDays: monthlyConfig?.workingDays || 0,
          totalHolidays: holidays.length
        },
        overview: {
          totalEmployees: employees.length,
          attendanceStats,
          leaveStats,
          salaryStats
        },
        holidays
      }
    });
  } catch (error) {
    console.error('Get comprehensive monthly report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comprehensive monthly report.',
      error: error.message
    });
  }
};

/**
 * Get Manager Performance Report
 */
const getManagerPerformanceReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required.'
      });
    }

    const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthEnd = new Date(parseInt(year), parseInt(month), 0);

    const managers = await Manager.find({ 
      isActive: true,
      ...(req.companyId ? { companyId: req.companyId } : {})   // ✅ NEW
    })
      .populate('employeesUnder', 'firstName lastName employeeCode');

    const managerReports = [];

    for (const manager of managers) {
      const employeeIds = manager.employeesUnder.map(emp => emp._id);

      if (employeeIds.length === 0) {
        continue;
      }

      const attendanceRecords = await Attendance.find({
        employeeId: { $in: employeeIds },
        date: { $gte: monthStart, $lte: monthEnd }
      });

      const leaves = await Leave.find({
        managerId: manager._id,
        startDate: { $lte: monthEnd },
        endDate: { $gte: monthStart }
      });

      const statistics = {
        totalEmployees: manager.employeesUnder.length,
        totalAttendanceRecords: attendanceRecords.length,
        presentCount: attendanceRecords.filter(a => a.status === 'present').length,
        absentCount: attendanceRecords.filter(a => a.status === 'absent').length,
        lateCount: attendanceRecords.filter(a => a.isLate).length,
        totalLeaveRequests: leaves.length,
        pendingLeaves: leaves.filter(l => l.status === 'pending').length,
        approvedLeaves: leaves.filter(l => l.status === 'approved').length,
        rejectedLeaves: leaves.filter(l => l.status === 'rejected').length
      };

      managerReports.push({
        manager: {
          _id: manager._id,
          firstName: manager.firstName,
          lastName: manager.lastName,
          department: manager.department
        },
        statistics
      });
    }

    res.status(200).json({
      success: true,
      data: {
        period: {
          month: parseInt(month),
          year: parseInt(year)
        },
        managers: managerReports
      }
    });
  } catch (error) {
    console.error('Get manager performance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch manager performance report.',
      error: error.message
    });
  }
};

module.exports = {
  getDailyAttendanceReport,
  getMonthlyAttendanceReport,
  getEmployeeAttendanceSummary,
  getDepartmentWiseReport,
  getLeaveReport,
  getSalaryReport,
  getLateArrivalReport,
  getOvertimeReport,
  getComprehensiveMonthlyReport,
  getManagerPerformanceReport
};