const Salary = require('../models/Salary');
const Employee = require('../models/Employee');
const Manager = require('../models/Manager');
const Attendance = require('../models/Attendance');
const MonthlyConfig = require('../models/MonthlyConfig');
const { sendEmail } = require('../utils/emailService');

/**
 * Get All Salary Records (with filters)
 */
const getAllSalaries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      employeeId = '',
      month = '',
      year = '',
      status = '',
      department = ''
    } = req.query;

    const query = {};

    // ✅ NEW — company scoping
    if (req.companyId) {
      const companyEmployeeIds = await Employee.find({ companyId: req.companyId }).distinct('_id');
      query.employeeId = { $in: companyEmployeeIds };
    }


    // Employee filter
    if (employeeId) {
      query.employeeId = employeeId;
    }

    // Month filter
    if (month) {
      query.month = parseInt(month);
    }

    // Year filter
    if (year) {
      query.year = parseInt(year);
    }

    // Payment status filter
    if (status) {
      query.paymentStatus = status;
    }

    // Department filter (requires population)
    if (department) {
      const employees = await Employee.find({ 
        department, 
        isActive: true,
        ...(req.companyId ? { companyId: req.companyId } : {})   // ✅ NEW
      }).select('_id');
      const employeeIds = employees.map(emp => emp._id);
      query.employeeId = { $in: employeeIds };
    }

    const salaries = await Salary.find(query)
      .populate('employeeId', 'firstName lastName employeeCode department designation')
      .populate('generatedBy', 'email role')
      .populate('approvedBy', 'email role')
      .sort({ year: -1, month: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Salary.countDocuments(query);

    // Calculate totals
    const totals = await Salary.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalGross: { $sum: '$grossSalary' },
          totalDeductions: { $sum: '$totalDeductions' },
          totalNet: { $sum: '$netSalary' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        salaries,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalRecords: count,
        totals: totals[0] || { totalGross: 0, totalDeductions: 0, totalNet: 0 }
      }
    });
  } catch (error) {
    console.error('Get all salaries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salary records.',
      error: error.message
    });
  }
};

/**
 * Get Salary by ID
 */
const getSalaryById = async (req, res) => {
  try {
    const { salaryId } = req.params;

    const salary = await Salary.findById(salaryId)
      .populate('employeeId', 'firstName lastName employeeCode department designation phoneNumber email userId')
      .populate('generatedBy', 'email role')
      .populate('approvedBy', 'email role');

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found.'
      });
    }

    // ✅ NEW — company access check
    if (req.companyId && salary.companyId && salary.companyId.toString() !== req.companyId.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({
      success: true,
      data: { salary }
    });
  } catch (error) {
    console.error('Get salary by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salary record.',
      error: error.message
    });
  }
};

/**
 * Generate Salary for Employee
 */
const generateSalary = async (req, res) => {
  try {
    const {
      employeeId,
      month,
      year,
      allowances,
      deductions,
      remarks
    } = req.body;

    const userId = req.user.userId;
    const userRole = req.user.role;

    // Only admin can generate salary
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can generate salary.'
      });
    }

    // Validate required fields
    if (!employeeId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, month, and year are required.'
      });
    }

    // Check if salary already exists
    const existingSalary = await Salary.findOne({
      employeeId,
      month: parseInt(month),
      year: parseInt(year)
    });

    if (existingSalary) {
      return res.status(400).json({
        success: false,
        message: 'Salary for this month already exists.'
      });
    }

    // Get employee details
    const employee = await Employee.findById(employeeId)
      .populate('userId', 'email');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.'
      });
    }

    // Get monthly config
    const monthlyConfig = await MonthlyConfig.findOne({
      month: parseInt(month),
      year: parseInt(year)
    });

    const workingDays = monthlyConfig?.workingDays || 22;

    // Get attendance data for the month
    const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthEnd = new Date(parseInt(year), parseInt(month), 0);

    const attendanceRecords = await Attendance.find({
      employeeId,
      date: { $gte: monthStart, $lte: monthEnd }
    });

    // Calculate attendance statistics
    const presentDays = attendanceRecords.filter(a => 
      a.status === 'present' || a.status === 'on-leave' || a.status === 'holiday'
    ).length;
    
    const absentDays = attendanceRecords.filter(a => a.status === 'absent').length;
    const lateDays = attendanceRecords.filter(a => a.isLate).length;
    const halfDays = attendanceRecords.filter(a => a.status === 'half-day').length;
    const leaveDays = attendanceRecords.filter(a => a.status === 'on-leave').length;

    // Calculate overtime
    const totalOvertimeHours = attendanceRecords.reduce(
      (sum, a) => sum + (a.overtimeHours || 0), 
      0
    );

    const overtimeRate = monthlyConfig?.overtimeRate || 1.5;
    const hourlyRate = employee.salary / (workingDays * 8); // Assuming 8 hours per day
    const overtimeAmount = totalOvertimeHours * hourlyRate * overtimeRate;

    // Calculate deductions for absents
    const perDayRate = employee.salary / workingDays;
    const absentDeduction = absentDays * perDayRate;
    const halfDayDeduction = halfDays * (perDayRate / 2);

    // Late deduction (example: 100 per late day)
    const lateDeduction = lateDays * 100;

    // Calculate salary
    const basicSalary = employee.salary;

    const totalAllowances = 
      (allowances?.houseRent || 0) +
      (allowances?.transport || 0) +
      (allowances?.medical || 0) +
      (allowances?.other || 0);

    const grossSalary = basicSalary + totalAllowances + overtimeAmount;

    const totalDeductions = 
      (deductions?.tax || 0) +
      (deductions?.insurance || 0) +
      (deductions?.providentFund || 0) +
      absentDeduction +
      halfDayDeduction +
      lateDeduction +
      (deductions?.other || 0);

    const netSalary = grossSalary - totalDeductions;

    // Create salary record
    const salary = new Salary({
      employeeId,
      companyId: req.companyId,   // ✅ NEW
      month: parseInt(month),
      year: parseInt(year),
      basicSalary,
      allowances: {
        houseRent: allowances?.houseRent || 0,
        transport: allowances?.transport || 0,
        medical: allowances?.medical || 0,
        other: allowances?.other || 0
      },
      deductions: {
        tax: deductions?.tax || 0,
        insurance: deductions?.insurance || 0,
        providentFund: deductions?.providentFund || 0,
        lateDeductions: lateDeduction,
        absentDeductions: absentDeduction + halfDayDeduction,
        other: deductions?.other || 0
      },
      overtime: {
        hours: totalOvertimeHours,
        amount: overtimeAmount
      },
      attendance: {
        totalDays: workingDays,
        presentDays,
        absentDays,
        lateDays,
        halfDays,
        leaves: leaveDays
      },
      grossSalary,
      totalDeductions,
      netSalary,
      paymentStatus: 'pending',
      remarks,
      generatedBy: userId
    });

    await salary.save();

    // Send email notification to employee
    try {
      const user = employee.userId;

      await sendEmail({
        to: user.email,
        subject: `Salary Generated for ${monthStart.toLocaleString('default', { month: 'long' })} ${year}`,
        html: `
          <h2>Salary Statement</h2>
          <p>Dear ${employee.firstName} ${employee.lastName},</p>
          <p>Your salary for <strong>${monthStart.toLocaleString('default', { month: 'long' })} ${year}</strong> has been generated.</p>
          
          <h3>Salary Details:</h3>
          <table border="1" cellpadding="10" cellspacing="0">
            <tr><td>Basic Salary</td><td>Rs. ${basicSalary.toLocaleString()}</td></tr>
            <tr><td>Allowances</td><td>Rs. ${totalAllowances.toLocaleString()}</td></tr>
            <tr><td>Overtime</td><td>Rs. ${overtimeAmount.toFixed(2)}</td></tr>
            <tr><td><strong>Gross Salary</strong></td><td><strong>Rs. ${grossSalary.toLocaleString()}</strong></td></tr>
            <tr><td>Deductions</td><td>Rs. ${totalDeductions.toLocaleString()}</td></tr>
            <tr><td><strong>Net Salary</strong></td><td><strong>Rs. ${netSalary.toLocaleString()}</strong></td></tr>
          </table>
          
          <h3>Attendance Summary:</h3>
          <ul>
            <li>Present Days: ${presentDays}</li>
            <li>Absent Days: ${absentDays}</li>
            <li>Late Days: ${lateDays}</li>
            <li>Half Days: ${halfDays}</li>
            <li>Leaves: ${leaveDays}</li>
          </ul>
          
          <p>Please login to view detailed salary slip.</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send salary notification email:', emailError);
    }

    const populatedSalary = await Salary.findById(salary._id)
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('generatedBy', 'email');

    res.status(201).json({
      success: true,
      message: 'Salary generated successfully.',
      data: { salary: populatedSalary }
    });
  } catch (error) {
    console.error('Generate salary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate salary.',
      error: error.message
    });
  }
};

/**
 * Update Salary Record
 */
const updateSalary = async (req, res) => {
  try {
    const { salaryId } = req.params;
    const updateData = req.body;
    const userRole = req.user.role;

    // Only admin can update salary
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can update salary records.'
      });
    }

    const salary = await Salary.findById(salaryId);

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found.'
      });
    }

    // ✅ NEW — company access check
    if (req.companyId && salary.companyId && salary.companyId.toString() !== req.companyId.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Cannot update if already paid
    if (salary.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a salary that has already been paid.'
      });
    }

    // Update salary
    const updatedSalary = await Salary.findByIdAndUpdate(
      salaryId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('generatedBy', 'email')
      .populate('approvedBy', 'email');

    res.status(200).json({
      success: true,
      message: 'Salary updated successfully.',
      data: { salary: updatedSalary }
    });
  } catch (error) {
    console.error('Update salary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update salary.',
      error: error.message
    });
  }
};

/**
 * Update Salary Payment Status
 */
const updatePaymentStatus = async (req, res) => {
  try {
    const { salaryId } = req.params;
    const { paymentStatus, paymentMethod, paymentDate } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Only admin can update payment status
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can update payment status.'
      });
    }

    if (!['pending', 'processed', 'paid', 'on-hold'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status.'
      });
    }

    const salary = await Salary.findById(salaryId)
      .populate('employeeId', 'firstName lastName email userId');

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found.'
      });
    }

    // ✅ NEW — company access check
    if (req.companyId && salary.companyId && salary.companyId.toString() !== req.companyId.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Update payment status
    salary.paymentStatus = paymentStatus;
    
    if (paymentMethod) {
      salary.paymentMethod = paymentMethod;
    }

    if (paymentDate) {
      salary.paymentDate = new Date(paymentDate);
    } else if (paymentStatus === 'paid') {
      salary.paymentDate = new Date();
    }

    if (paymentStatus === 'processed' || paymentStatus === 'paid') {
      salary.approvedBy = userId;
    }

    await salary.save();

    // Send email notification if paid
    if (paymentStatus === 'paid') {
      try {
        const employee = salary.employeeId;
        const user = await require('../models/User').findById(employee.userId);

        await sendEmail({
          to: user.email,
          subject: 'Salary Payment Processed',
          html: `
            <h2>Salary Payment Processed</h2>
            <p>Dear ${employee.firstName} ${employee.lastName},</p>
            <p>Your salary for <strong>${new Date(salary.year, salary.month - 1).toLocaleString('default', { month: 'long' })} ${salary.year}</strong> has been paid.</p>
            <p><strong>Net Amount:</strong> Rs. ${salary.netSalary.toLocaleString()}</p>
            <p><strong>Payment Method:</strong> ${salary.paymentMethod}</p>
            <p><strong>Payment Date:</strong> ${salary.paymentDate.toDateString()}</p>
            <p>Thank you!</p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send payment notification email:', emailError);
      }
    }

    const updatedSalary = await Salary.findById(salary._id)
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('generatedBy', 'email')
      .populate('approvedBy', 'email');

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully.',
      data: { salary: updatedSalary }
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status.',
      error: error.message
    });
  }
};

/**
 * Delete Salary Record
 */
const deleteSalary = async (req, res) => {
  try {
    const { salaryId } = req.params;
    const userRole = req.user.role;

    // Only admin can delete
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can delete salary records.'
      });
    }

    const salary = await Salary.findById(salaryId);

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found.'
      });
    }

    // ✅ NEW — company access check
    if (req.companyId && salary.companyId && salary.companyId.toString() !== req.companyId.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Cannot delete if already paid
    if (salary.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a salary that has already been paid.'
      });
    }

    await Salary.findByIdAndDelete(salaryId);

    res.status(200).json({
      success: true,
      message: 'Salary record deleted successfully.'
    });
  } catch (error) {
    console.error('Delete salary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete salary record.',
      error: error.message
    });
  }
};

/**
 * Bulk Generate Salaries
 */
const bulkGenerateSalaries = async (req, res) => {
  try {
    const { month, year, employeeIds, allowances, deductions } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Only admin can bulk generate
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can bulk generate salaries.'
      });
    }

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required.'
      });
    }

    // If no specific employees, get all active employees
   // If no specific employees, get all active employees
    let employees;
    const companyFilter = req.companyId ? { companyId: req.companyId } : {};   // ✅ NEW
    if (employeeIds && employeeIds.length > 0) {
      employees = await Employee.find({ 
        _id: { $in: employeeIds },
        isActive: true,
        ...companyFilter   // ✅ NEW
      }).populate('userId', 'email');
    } else {
      employees = await Employee.find({ isActive: true, ...companyFilter }).populate('userId', 'email');
    }

    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    for (const employee of employees) {
      try {
        // Check if salary already exists
        const existingSalary = await Salary.findOne({
          employeeId: employee._id,
          month: parseInt(month),
          year: parseInt(year)
        });

        if (existingSalary) {
          results.skipped.push({
            employeeId: employee._id,
            name: `${employee.firstName} ${employee.lastName}`,
            reason: 'Salary already exists'
          });
          continue;
        }

        // Get monthly config
        const monthlyConfig = await MonthlyConfig.findOne({
          month: parseInt(month),
          year: parseInt(year)
        });

        const workingDays = monthlyConfig?.workingDays || 22;

        // Get attendance data
        const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthEnd = new Date(parseInt(year), parseInt(month), 0);

        const attendanceRecords = await Attendance.find({
          employeeId: employee._id,
          date: { $gte: monthStart, $lte: monthEnd }
        });

        const presentDays = attendanceRecords.filter(a => 
          a.status === 'present' || a.status === 'on-leave' || a.status === 'holiday'
        ).length;
        
        const absentDays = attendanceRecords.filter(a => a.status === 'absent').length;
        const lateDays = attendanceRecords.filter(a => a.isLate).length;
        const halfDays = attendanceRecords.filter(a => a.status === 'half-day').length;
        const leaveDays = attendanceRecords.filter(a => a.status === 'on-leave').length;

        const totalOvertimeHours = attendanceRecords.reduce(
          (sum, a) => sum + (a.overtimeHours || 0), 
          0
        );

        const overtimeRate = monthlyConfig?.overtimeRate || 1.5;
        const hourlyRate = employee.salary / (workingDays * 8);
        const overtimeAmount = totalOvertimeHours * hourlyRate * overtimeRate;

        const perDayRate = employee.salary / workingDays;
        const absentDeduction = absentDays * perDayRate;
        const halfDayDeduction = halfDays * (perDayRate / 2);
        const lateDeduction = lateDays * 100;

        const basicSalary = employee.salary;

        const totalAllowances = 
          (allowances?.houseRent || 0) +
          (allowances?.transport || 0) +
          (allowances?.medical || 0) +
          (allowances?.other || 0);

        const grossSalary = basicSalary + totalAllowances + overtimeAmount;

        const totalDeductions = 
          (deductions?.tax || 0) +
          (deductions?.insurance || 0) +
          (deductions?.providentFund || 0) +
          absentDeduction +
          halfDayDeduction +
          lateDeduction +
          (deductions?.other || 0);

        const netSalary = grossSalary - totalDeductions;

        const salary = new Salary({
          employeeId: employee._id,
          companyId: req.companyId,   // ✅ NEW
          month: parseInt(month),
          year: parseInt(year),
          basicSalary,
          allowances: {
            houseRent: allowances?.houseRent || 0,
            transport: allowances?.transport || 0,
            medical: allowances?.medical || 0,
            other: allowances?.other || 0
          },
          deductions: {
            tax: deductions?.tax || 0,
            insurance: deductions?.insurance || 0,
            providentFund: deductions?.providentFund || 0,
            lateDeductions: lateDeduction,
            absentDeductions: absentDeduction + halfDayDeduction,
            other: deductions?.other || 0
          },
          overtime: {
            hours: totalOvertimeHours,
            amount: overtimeAmount
          },
          attendance: {
            totalDays: workingDays,
            presentDays,
            absentDays,
            lateDays,
            halfDays,
            leaves: leaveDays
          },
          grossSalary,
          totalDeductions,
          netSalary,
          paymentStatus: 'pending',
          generatedBy: userId
        });

        await salary.save();

        results.success.push({
          employeeId: employee._id,
          name: `${employee.firstName} ${employee.lastName}`,
          salaryId: salary._id
        });
      } catch (err) {
        results.failed.push({
          employeeId: employee._id,
          name: `${employee.firstName} ${employee.lastName}`,
          reason: err.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk salary generation completed. Success: ${results.success.length}, Failed: ${results.failed.length}, Skipped: ${results.skipped.length}`,
      data: results
    });
  } catch (error) {
    console.error('Bulk generate salaries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk generate salaries.',
      error: error.message
    });
  }
};

/**
 * Get Salary Summary
 */
const getSalarySummary = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required.'
      });
    }

    const salaries = await Salary.find({
      month: parseInt(month),
      year: parseInt(year),
      ...(req.companyId ? { companyId: req.companyId } : {})   // ✅ NEW
    }).populate('employeeId', 'firstName lastName department');

    const summary = {
      totalEmployees: salaries.length,
      totalGrossSalary: salaries.reduce((sum, s) => sum + s.grossSalary, 0),
      totalDeductions: salaries.reduce((sum, s) => sum + s.totalDeductions, 0),
      totalNetSalary: salaries.reduce((sum, s) => sum + s.netSalary, 0),
      totalOvertime: salaries.reduce((sum, s) => sum + (s.overtime?.amount || 0), 0),
      paymentStatus: {
        pending: salaries.filter(s => s.paymentStatus === 'pending').length,
        processed: salaries.filter(s => s.paymentStatus === 'processed').length,
        paid: salaries.filter(s => s.paymentStatus === 'paid').length,
        onHold: salaries.filter(s => s.paymentStatus === 'on-hold').length
      }
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
        salaries
      }
    });
  } catch (error) {
    console.error('Get salary summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salary summary.',
      error: error.message
    });
  }
};

module.exports = {
  getAllSalaries,
  getSalaryById,
  generateSalary,
  updateSalary,
  updatePaymentStatus,
  deleteSalary,
  bulkGenerateSalaries,
  getSalarySummary
};