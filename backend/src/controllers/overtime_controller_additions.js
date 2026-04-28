// ============================================================
// ⏰ OVERTIME FEATURE — attendance.controller.js mein ADD karo
// In functions ko existing exports ke saath module.exports mein add karo
// ============================================================

/**
 * Admin/Manager: Employee ka overtime directly set karo (bina request ke)
 * PUT /attendance/:attendanceId/overtime
 */
const setOvertime = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { overtimeMinutes, overtimeNote } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole === 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Employees cannot directly set overtime.'
      });
    }

    if (overtimeMinutes === undefined || overtimeMinutes < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid overtime minutes required (0 ya zyada).'
      });
    }

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found.'
      });
    }

    // Manager check — sirf apne employees ki attendance update kar sakta hai
    if (userRole === 'manager') {
      const manager = await Manager.findOne({ userId });
      if (!manager || attendance.managerId?.toString() !== manager._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Yeh employee aapke under nahi hai.'
        });
      }
    }

    // Overtime hours calculate
    const overtimeHours = parseFloat((overtimeMinutes / 60).toFixed(2));

    attendance.overtimeMinutes = overtimeMinutes;
    attendance.overtimeHours = overtimeHours;
    attendance.overtimeNote = overtimeNote || '';
    attendance.overtimeApprovedBy = userId;
    attendance.overtimeApprovedAt = new Date();
    attendance.overtimeStatus = 'approved'; // Admin/Manager ne direct set kiya
    attendance.overtimeRequestedByEmployee = false; // Employee ne request nahi ki
    await attendance.save();

    // Employee ko notification bhejo
    try {
      const employee = await Employee.findById(attendance.employeeId).populate('userId');
      if (employee && employee.userId) {
        await notificationService.createNotification(
          employee.userId._id,
          '⏰ Overtime Added to Your Record',
          `${overtimeMinutes} minutes (${overtimeHours} hrs) overtime aapki attendance mein add kar diya gaya hai. ${overtimeNote ? 'Note: ' + overtimeNote : ''}`,
          'overtime_added',
          '/employee/my-attendance',
          { attendanceId: attendance._id, overtimeMinutes, overtimeHours }
        );
      }
    } catch (notifErr) {
      console.error('⚠️ Overtime notification error:', notifErr);
    }

    const updatedAttendance = await Attendance.findById(attendanceId)
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('managerId', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: `✅ Overtime successfully set: ${overtimeMinutes} min (${overtimeHours} hrs)`,
      data: { attendance: updatedAttendance }
    });
  } catch (error) {
    console.error('Set overtime error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set overtime.',
      error: error.message
    });
  }
};

/**
 * Employee: Overtime request bhejo
 * POST /attendance/:attendanceId/overtime-request
 */
const requestOvertime = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { overtimeMinutes, overtimeNote } = req.body;
    const userId = req.user.userId;

    if (!overtimeMinutes || overtimeMinutes <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Overtime minutes required aur 0 se zyada hone chahiye.'
      });
    }

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found.'
      });
    }

    // Verify employee apna hi record update kar raha hai
    let employeeProfile = await Employee.findOne({ userId });
    if (!employeeProfile) {
      // Manager bhi employee ki tarah request kar sakta hai
      const managerProfile = await Manager.findOne({ userId });
      if (!managerProfile || managerProfile._id.toString() !== attendance.employeeId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Aap sirf apna overtime request kar sakte hain.'
        });
      }
    } else if (employeeProfile._id.toString() !== attendance.employeeId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Aap sirf apna overtime request kar sakte hain.'
      });
    }

    // Agar pehle se approved overtime hai to request nahi kar sakte
    if (attendance.overtimeStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Is din ka overtime already approved hai.'
      });
    }

    // Agar pehle se pending request hai
    if (attendance.overtimeStatus === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Aapki overtime request pehle se pending hai.'
      });
    }

    const overtimeHours = parseFloat((overtimeMinutes / 60).toFixed(2));

    attendance.overtimeMinutes = overtimeMinutes;
    attendance.overtimeHours = overtimeHours;
    attendance.overtimeNote = overtimeNote || '';
    attendance.overtimeStatus = 'pending';
    attendance.overtimeRequestedByEmployee = true;
    attendance.overtimeRequestedAt = new Date();
    await attendance.save();

    // Admin aur Manager ko notify karo
    try {
      const employee = await Employee.findById(attendance.employeeId);
      const empName = `${employee?.firstName} ${employee?.lastName}`;
      const dateStr = new Date(attendance.date).toLocaleDateString('en-GB');

      // Admin ko notify karo
      const User = require('../models/User');
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await notificationService.createNotification(
          admin._id,
          '⏰ Overtime Request',
          `${empName} ne ${dateStr} ke liye ${overtimeMinutes} min overtime request ki hai. ${overtimeNote ? '"' + overtimeNote + '"' : ''}`,
          'overtime_request',
          '/admin/attendance',
          { attendanceId: attendance._id, employeeName: empName, overtimeMinutes }
        );
      }

      // Manager ko bhi notify karo
      if (attendance.managerId) {
        const managerDoc = await Manager.findById(attendance.managerId).populate('userId');
        if (managerDoc?.userId) {
          await notificationService.createNotification(
            managerDoc.userId._id,
            '⏰ Overtime Request',
            `${empName} ne ${dateStr} ke liye ${overtimeMinutes} min overtime request ki hai.`,
            'overtime_request',
            '/manager/attendance',
            { attendanceId: attendance._id, employeeName: empName, overtimeMinutes }
          );
        }
      }
    } catch (notifErr) {
      console.error('⚠️ Overtime request notification error:', notifErr);
    }

    res.status(200).json({
      success: true,
      message: `✅ Overtime request submit ho gayi: ${overtimeMinutes} min (${overtimeHours} hrs). Admin/Manager review karega.`,
      data: { attendance }
    });
  } catch (error) {
    console.error('Request overtime error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit overtime request.',
      error: error.message
    });
  }
};

/**
 * Admin/Manager: Pending overtime request approve karo
 * PUT /attendance/:attendanceId/overtime-approve
 */
const approveOvertimeRequest = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { approved, overtimeMinutes, rejectionNote } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole === 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Sirf Admin ya Manager approve kar sakte hain.'
      });
    }

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    if (attendance.overtimeStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Overtime request already ${attendance.overtimeStatus} hai.`
      });
    }

    if (approved) {
      // Agar admin/manager alag minutes specify kare to update karo
      if (overtimeMinutes && overtimeMinutes > 0) {
        attendance.overtimeMinutes = overtimeMinutes;
        attendance.overtimeHours = parseFloat((overtimeMinutes / 60).toFixed(2));
      }
      attendance.overtimeStatus = 'approved';
      attendance.overtimeApprovedBy = userId;
      attendance.overtimeApprovedAt = new Date();
    } else {
      attendance.overtimeStatus = 'rejected';
      attendance.overtimeMinutes = 0;
      attendance.overtimeHours = 0;
      attendance.overtimeRejectionNote = rejectionNote || 'Request rejected';
    }

    await attendance.save();

    // Employee ko result notify karo
    try {
      const employee = await Employee.findById(attendance.employeeId).populate('userId');
      if (employee && employee.userId) {
        const isApproved = approved;
        await notificationService.createNotification(
          employee.userId._id,
          isApproved ? '✅ Overtime Request Approved' : '❌ Overtime Request Rejected',
          isApproved
            ? `Aapki ${attendance.overtimeMinutes} min overtime request approve ho gayi!`
            : `Aapki overtime request reject ho gayi. ${rejectionNote ? 'Reason: ' + rejectionNote : ''}`,
          isApproved ? 'overtime_approved' : 'overtime_rejected',
          '/employee/my-attendance',
          { attendanceId: attendance._id }
        );
      }
    } catch (notifErr) {
      console.error('⚠️ Notification error:', notifErr);
    }

    res.status(200).json({
      success: true,
      message: approved
        ? `✅ Overtime approved: ${attendance.overtimeMinutes} min`
        : '❌ Overtime request rejected.',
      data: { attendance }
    });
  } catch (error) {
    console.error('Approve overtime error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process overtime request.',
      error: error.message
    });
  }
};

/**
 * Get pending overtime requests (Admin/Manager ke liye)
 * GET /attendance/overtime/pending
 */
const getPendingOvertimeRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    const query = { overtimeStatus: 'pending', overtimeRequestedByEmployee: true };

    // Manager sirf apne employees ke requests dekhe
    if (userRole === 'manager') {
      const manager = await Manager.findOne({ userId });
      if (manager) {
        query.managerId = manager._id;
      }
    }

    const pendingRequests = await Attendance.find(query)
      .populate('employeeId', 'firstName lastName employeeCode department')
      .populate('managerId', 'firstName lastName')
      .sort({ overtimeRequestedAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        requests: pendingRequests,
        count: pendingRequests.length
      }
    });
  } catch (error) {
    console.error('Get pending overtime error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending overtime requests.',
      error: error.message
    });
  }
};

// ============================================================
// module.exports mein ye 4 functions ADD karo existing ke saath:
// setOvertime,
// requestOvertime,
// approveOvertimeRequest,
// getPendingOvertimeRequests
// ============================================================