const express = require('express');
const router = express.Router();
const managerController = require('../controllers/manager.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isManagerOrAdmin } = require('../middleware/role.middleware');

// All manager routes require authentication and manager/admin role
router.use(authenticate, isManagerOrAdmin);

/**
 * @route   GET /api/manager/dashboard
 * @desc    Get manager dashboard
 * @access  Private/Manager
 */
router.get('/dashboard', managerController.getDashboard);

/**
 * @route   GET /api/manager/my-employees
 * @desc    Get all employees under manager
 * @access  Private/Manager
 */
router.get('/my-employees', managerController.getMyEmployees);

/**
 * @route   GET /api/manager/employee/:employeeId
 * @desc    Get employee details
 * @access  Private/Manager
 */
router.get('/employee/:employeeId', managerController.getEmployeeDetails);

/**
 * @route   POST /api/manager/mark-attendance
 * @desc    Mark attendance for employee
 * @access  Private/Manager
 */
router.post('/mark-attendance', managerController.markAttendance);

/**
 * @route   PUT /api/manager/attendance/:attendanceId
 * @desc    Update attendance record
 * @access  Private/Manager
 */
router.put('/attendance/:attendanceId', managerController.updateAttendance);

/**
 * @route   GET /api/manager/attendance-history/:employeeId
 * @desc    Get employee attendance history
 * @access  Private/Manager
 */
router.get('/attendance-history/:employeeId', managerController.getEmployeeAttendanceHistory);

/**
 * @route   POST /api/manager/clock-in-out
 * @desc    Manager clock in/out
 * @access  Private/Manager
 */
router.post('/clock-in-out', managerController.clockInOut);

/**
 * @route   GET /api/manager/my-attendance
 * @desc    Get manager's own attendance
 * @access  Private/Manager
 */
router.get('/my-attendance', managerController.getMyAttendance);

/**
 * @route   GET /api/manager/leave-requests
 * @desc    Get leave requests from employees
 * @access  Private/Manager
 */
router.get('/leave-requests', managerController.getLeaveRequests);

/**
 * @route   PUT /api/manager/leave/:leaveId/status
 * @desc    Approve/Reject leave request
 * @access  Private/Manager
 */
router.put('/leave/:leaveId/status', managerController.updateLeaveStatus);

/**
 * @route   GET /api/manager/profile
 * @desc    Get manager profile
 * @access  Private/Manager
 */
router.get('/profile', managerController.getMyProfile);

/**
 * @route   PUT /api/manager/profile
 * @desc    Update manager profile
 * @access  Private/Manager
 */
router.put('/profile', managerController.updateMyProfile);

module.exports = router;