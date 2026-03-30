const CorrectionRequest = require('../models/CorrectionRequest');
const notificationService = require('../utils/notificationService');
const Employee = require('../models/Employee');
const Manager = require('../models/Manager');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

// ─── Employee: Create correction request ──────────────────────────────────────
exports.createCorrectionRequest = async (req, res) => {
  try {
    const userId = req.user.userId; // ✅ fixed — matches your auth middleware

    const {
      attendanceId,
      attendanceDate,
      currentStatus,
      requestedStatus,
      currentClockIn,
      currentClockOut,
      requestedClockIn,
      requestedClockOut,
      reason,
      issueType,
      priority
    } = req.body;

    if (!attendanceDate || !currentStatus || !requestedStatus || !reason || !issueType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Get employee by userId
    const employee = await Employee.findOne({ userId });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Get user email
    const user = await User.findById(userId);

    const correctionRequest = new CorrectionRequest({
      employee: employee._id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      employeeEmail: user?.email || '',
      attendanceId: attendanceId || null,
      attendanceDate: new Date(attendanceDate),
      currentStatus,
      requestedStatus,
      currentClockIn: currentClockIn || '',
      currentClockOut: currentClockOut || '',
      requestedClockIn: requestedClockIn || '',
      requestedClockOut: requestedClockOut || '',
      reason,
      issueType,
      priority: priority || 'medium',
      status: 'pending'
    });

    await correctionRequest.save();

    // Notify all admins
    try {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await notificationService.createNotification(
          admin._id,
          '📝 Attendance Correction Request',
          `${correctionRequest.employeeName} has submitted a correction request for ${new Date(attendanceDate).toLocaleDateString('en-GB')}. Issue: ${issueType.replace('_', ' ')}`,
          'correction_request',
          '/admin/correction-requests',
          { correctionRequestId: correctionRequest._id }
        );
      }

      // Notify manager too
      if (employee.managerId) {
        const managerDoc = await Manager.findById(employee.managerId).populate('userId');
        if (managerDoc?.userId) {
          await notificationService.createNotification(
            managerDoc.userId._id,
            '📝 Attendance Correction Request',
            `${correctionRequest.employeeName} has submitted a correction request for ${new Date(attendanceDate).toLocaleDateString('en-GB')}.`,
            'correction_request',
            '/manager/correction-requests',
            { correctionRequestId: correctionRequest._id }
          );
        }
      }
    } catch (notifErr) {
      console.error('⚠️ Correction request notification error:', notifErr);
    }

    res.status(201).json({
      success: true,
      message: 'Correction request submitted successfully',
      data: correctionRequest
    });

  } catch (error) {
    console.error('❌ Create correction request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create correction request',
      error: error.message
    });
  }
};

// ─── Employee: Get my correction requests ─────────────────────────────────────
exports.getMyCorrectionRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    const employee = await Employee.findOne({ userId });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const query = { employee: employee._id };
    if (status) query.status = status;

    const correctionRequests = await CorrectionRequest.find(query)
      .sort({ createdAt: -1 })
      .populate('resolvedBy', 'email role');

    const stats = await CorrectionRequest.getEmployeeCorrectionStats(employee._id);

    res.status(200).json({
      success: true,
      data: { correctionRequests, stats }
    });

  } catch (error) {
    console.error('❌ Get my correction requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch correction requests',
      error: error.message
    });
  }
};

// ─── Admin/Manager: Get all correction requests ───────────────────────────────
exports.getAllCorrectionRequests = async (req, res) => {
  try {
    const { status, employeeId, priority, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (employeeId) query.employee = employeeId;
    if (priority) query.priority = priority;

    const correctionRequests = await CorrectionRequest.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('employee', 'firstName lastName employeeCode')
      .populate('resolvedBy', 'email role');

    const total = await CorrectionRequest.countDocuments(query);
    const pendingCount = await CorrectionRequest.getPendingCount();

    res.status(200).json({
      success: true,
      data: {
        correctionRequests,
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
    console.error('❌ Get all correction requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch correction requests',
      error: error.message
    });
  }
};

// ─── Admin/Manager: Get correction request by ID ──────────────────────────────
exports.getCorrectionRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;

    const correctionRequest = await CorrectionRequest.findById(requestId)
      .populate('employee', 'firstName lastName employeeCode')
      .populate('resolvedBy', 'email role')
      .populate('attendanceId');

    if (!correctionRequest) {
      return res.status(404).json({ success: false, message: 'Correction request not found' });
    }

    res.status(200).json({ success: true, data: correctionRequest });

  } catch (error) {
    console.error('❌ Get correction request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch correction request',
      error: error.message
    });
  }
};

// ─── Admin/Manager: Approve correction request ────────────────────────────────
exports.approveCorrectionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { resolution, adminNotes, updateAttendance = true } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (!resolution || !resolution.trim()) {
      return res.status(400).json({ success: false, message: 'Resolution note is required' });
    }

    const correctionRequest = await CorrectionRequest.findById(requestId);
    if (!correctionRequest) {
      return res.status(404).json({ success: false, message: 'Correction request not found' });
    }

    if (correctionRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${correctionRequest.status}`
      });
    }

    // Update correction request
    correctionRequest.status = 'approved';
    correctionRequest.resolvedBy = userId;
    correctionRequest.resolverModel = userRole === 'admin' ? 'Admin' : 'Manager';
    correctionRequest.resolverName = userRole;
    correctionRequest.resolvedAt = new Date();
    correctionRequest.resolution = resolution;
    correctionRequest.adminNotes = adminNotes || '';
    await correctionRequest.save();

    // ✅ Update attendance record if attendanceId exists
    if (updateAttendance && correctionRequest.attendanceId) {
      try {
        const attendance = await Attendance.findById(correctionRequest.attendanceId);
        if (attendance) {
          attendance.status = correctionRequest.requestedStatus;

          if (correctionRequest.requestedClockIn) {
            const dateStr = new Date(correctionRequest.attendanceDate).toISOString().split('T')[0];
            attendance.clockIn = new Date(`${dateStr}T${correctionRequest.requestedClockIn}:00`);
          }
          if (correctionRequest.requestedClockOut) {
            const dateStr = new Date(correctionRequest.attendanceDate).toISOString().split('T')[0];
            attendance.clockOut = new Date(`${dateStr}T${correctionRequest.requestedClockOut}:00`);
          }

          attendance.correctionReason = `Approved correction request: ${resolution}`;
          attendance.correctedBy = userId;
          attendance.correctedAt = new Date();
          await attendance.save();
        }
      } catch (attErr) {
        console.error('⚠️ Attendance update error:', attErr);
      }
    }

    // Notify employee
    try {
      const employee = await Employee.findById(correctionRequest.employee).populate('userId');
      if (employee?.userId) {
        const dateStr = new Date(correctionRequest.attendanceDate).toLocaleDateString('en-GB');
        await notificationService.createNotification(
          employee.userId._id,
          '✅ Correction Request Approved',
          `Your correction request for ${dateStr} has been approved. ${resolution}`,
          'correction_approved',
          '/employee/my-requests',
          { correctionRequestId: correctionRequest._id }
        );
      }
    } catch (notifErr) {
      console.error('⚠️ Notification error:', notifErr);
    }

    res.status(200).json({
      success: true,
      message: 'Correction request approved and attendance updated',
      data: correctionRequest
    });

  } catch (error) {
    console.error('❌ Approve correction request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve correction request',
      error: error.message
    });
  }
};

// ─── Admin/Manager: Reject correction request ─────────────────────────────────
exports.rejectCorrectionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { resolution, adminNotes } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (!resolution || !resolution.trim()) {
      return res.status(400).json({ success: false, message: 'Resolution note is required' });
    }

    const correctionRequest = await CorrectionRequest.findById(requestId);
    if (!correctionRequest) {
      return res.status(404).json({ success: false, message: 'Correction request not found' });
    }

    if (correctionRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${correctionRequest.status}`
      });
    }

    correctionRequest.status = 'rejected';
    correctionRequest.resolvedBy = userId;
    correctionRequest.resolverModel = userRole === 'admin' ? 'Admin' : 'Manager';
    correctionRequest.resolverName = userRole;
    correctionRequest.resolvedAt = new Date();
    correctionRequest.resolution = resolution;
    correctionRequest.adminNotes = adminNotes || '';
    await correctionRequest.save();

    // Notify employee
    try {
      const employee = await Employee.findById(correctionRequest.employee).populate('userId');
      if (employee?.userId) {
        const dateStr = new Date(correctionRequest.attendanceDate).toLocaleDateString('en-GB');
        await notificationService.createNotification(
          employee.userId._id,
          '❌ Correction Request Rejected',
          `Your correction request for ${dateStr} has been rejected. Reason: ${resolution}`,
          'correction_rejected',
          '/employee/my-requests',
          { correctionRequestId: correctionRequest._id }
        );
      }
    } catch (notifErr) {
      console.error('⚠️ Notification error:', notifErr);
    }

    res.status(200).json({
      success: true,
      message: 'Correction request rejected',
      data: correctionRequest
    });

  } catch (error) {
    console.error('❌ Reject correction request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject correction request',
      error: error.message
    });
  }
};

// ─── Admin: Get overdue correction requests ───────────────────────────────────
exports.getOverdueRequests = async (req, res) => {
  try {
    const overdueRequests = await CorrectionRequest.getOverdueRequests();
    res.status(200).json({
      success: true,
      data: { overdueRequests, count: overdueRequests.length }
    });
  } catch (error) {
    console.error('❌ Get overdue requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue requests',
      error: error.message
    });
  }
};

// ─── Admin: Update request priority ──────────────────────────────────────────
exports.updatePriority = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { priority } = req.body;

    if (!['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ success: false, message: 'Invalid priority value' });
    }

    const correctionRequest = await CorrectionRequest.findById(requestId);
    if (!correctionRequest) {
      return res.status(404).json({ success: false, message: 'Correction request not found' });
    }

    correctionRequest.priority = priority;
    await correctionRequest.save();

    res.status(200).json({
      success: true,
      message: 'Priority updated successfully',
      data: correctionRequest
    });

  } catch (error) {
    console.error('❌ Update priority error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update priority',
      error: error.message
    });
  }
};