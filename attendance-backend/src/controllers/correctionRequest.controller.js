const CorrectionRequest = require('../models/CorrectionRequest');
const notificationService = require('../utils/notificationService');
const Employee = require('../models/Employee');
const Admin = require('../models/Admin');
const Manager = require('../models/Manager');
const Attendance = require('../models/Attendance');

// Employee: Create correction request
exports.createCorrectionRequest = async (req, res) => {
  try {
    const employeeId = req.user._id;
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
      evidence,
      priority
    } = req.body;

    // Validation
    if (!attendanceDate || !currentStatus || !requestedStatus || !reason || !issueType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Get employee details
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Create correction request
    const correctionRequest = new CorrectionRequest({
      employee: employeeId,
      employeeName: employee.name,
      employeeEmail: employee.email,
      attendanceId: attendanceId || null,
      attendanceDate: new Date(attendanceDate),
      currentStatus,
      requestedStatus,
      currentClockIn,
      currentClockOut,
      requestedClockIn,
      requestedClockOut,
      reason,
      issueType,
      evidence: evidence || [],
      priority: priority || 'medium',
      status: 'pending'
    });

    await correctionRequest.save();

    // Send notification to admin
    await notificationService.notifyCorrectionRequest(correctionRequest, {
      name: employee.name,
      email: employee.email
    });

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

// Employee: Get my correction requests
exports.getMyCorrectionRequests = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const { status } = req.query;

    const query = { employee: employeeId };
    
    if (status) {
      query.status = status;
    }

    const correctionRequests = await CorrectionRequest.find(query)
      .sort({ createdAt: -1 })
      .populate('resolvedBy', 'name');

    // Get employee stats
    const stats = await CorrectionRequest.getEmployeeCorrectionStats(employeeId);

    res.status(200).json({
      success: true,
      data: {
        correctionRequests,
        stats
      }
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

// Admin/Manager: Get all correction requests
exports.getAllCorrectionRequests = async (req, res) => {
  try {
    const { status, employeeId, priority, page = 1, limit = 20 } = req.query;

    const query = {};
    
    if (status) {
      query.status = status;
    }

    if (employeeId) {
      query.employee = employeeId;
    }

    if (priority) {
      query.priority = priority;
    }

    const correctionRequests = await CorrectionRequest.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('employee', 'name email employeeId')
      .populate('resolvedBy', 'name');

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

// Admin/Manager: Get correction request by ID
exports.getCorrectionRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;

    const correctionRequest = await CorrectionRequest.findById(requestId)
      .populate('employee', 'name email employeeId phone')
      .populate('resolvedBy', 'name role')
      .populate('attendanceId');

    if (!correctionRequest) {
      return res.status(404).json({
        success: false,
        message: 'Correction request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: correctionRequest
    });

  } catch (error) {
    console.error('❌ Get correction request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch correction request',
      error: error.message
    });
  }
};

// Admin/Manager: Approve and resolve correction request
exports.approveCorrectionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { resolution, adminNotes, updateAttendance = true } = req.body;
    const resolverId = req.user._id;
    const resolverRole = req.user.role;

    const correctionRequest = await CorrectionRequest.findById(requestId);

    if (!correctionRequest) {
      return res.status(404).json({
        success: false,
        message: 'Correction request not found'
      });
    }

    if (correctionRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${correctionRequest.status}`
      });
    }

    // Get resolver details
    const ResolverModel = resolverRole === 'admin' ? Admin : Manager;
    const resolver = await ResolverModel.findById(resolverId);

    // Update correction request
    correctionRequest.status = 'approved';
    correctionRequest.resolvedBy = resolverId;
    correctionRequest.resolverModel = resolverRole === 'admin' ? 'Admin' : 'Manager';
    correctionRequest.resolverName = resolver.name;
    correctionRequest.resolvedAt = new Date();
    correctionRequest.resolution = resolution || 'Request approved and attendance updated';
    correctionRequest.adminNotes = adminNotes || '';

    await correctionRequest.save();

    // Update attendance if requested
    if (updateAttendance && correctionRequest.attendanceId) {
      const attendance = await Attendance.findById(correctionRequest.attendanceId);
      
      if (attendance) {
        attendance.status = correctionRequest.requestedStatus;
        
        if (correctionRequest.requestedClockIn) {
          attendance.clockIn = correctionRequest.requestedClockIn;
        }
        
        if (correctionRequest.requestedClockOut) {
          attendance.clockOut = correctionRequest.requestedClockOut;
        }
        
        await attendance.save();
      }
    }

    // Get employee details
    const employee = await Employee.findById(correctionRequest.employee);

    // Send notification to employee
    await notificationService.notifyCorrectionResolution(
      correctionRequest,
      { name: employee.name, email: employee.email },
      { _id: resolverId, name: resolver.name, role: resolverRole },
      true
    );

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

// Admin/Manager: Reject correction request
exports.rejectCorrectionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { resolution, adminNotes } = req.body;
    const resolverId = req.user._id;
    const resolverRole = req.user.role;

    const correctionRequest = await CorrectionRequest.findById(requestId);

    if (!correctionRequest) {
      return res.status(404).json({
        success: false,
        message: 'Correction request not found'
      });
    }

    if (correctionRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${correctionRequest.status}`
      });
    }

    // Get resolver details
    const ResolverModel = resolverRole === 'admin' ? Admin : Manager;
    const resolver = await ResolverModel.findById(resolverId);

    // Update correction request
    correctionRequest.status = 'rejected';
    correctionRequest.resolvedBy = resolverId;
    correctionRequest.resolverModel = resolverRole === 'admin' ? 'Admin' : 'Manager';
    correctionRequest.resolverName = resolver.name;
    correctionRequest.resolvedAt = new Date();
    correctionRequest.resolution = resolution || 'Request rejected - attendance is correct';
    correctionRequest.adminNotes = adminNotes || '';

    await correctionRequest.save();

    // Get employee details
    const employee = await Employee.findById(correctionRequest.employee);

    // Send notification to employee
    await notificationService.notifyCorrectionResolution(
      correctionRequest,
      { name: employee.name, email: employee.email },
      { _id: resolverId, name: resolver.name, role: resolverRole },
      false
    );

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

// Admin: Get overdue correction requests
exports.getOverdueRequests = async (req, res) => {
  try {
    const overdueRequests = await CorrectionRequest.getOverdueRequests();

    res.status(200).json({
      success: true,
      data: {
        overdueRequests,
        count: overdueRequests.length
      }
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

// Admin: Update request priority
exports.updatePriority = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { priority } = req.body;

    if (!['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority value'
      });
    }

    const correctionRequest = await CorrectionRequest.findById(requestId);

    if (!correctionRequest) {
      return res.status(404).json({
        success: false,
        message: 'Correction request not found'
      });
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