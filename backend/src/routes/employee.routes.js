const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isEmployeeOrAbove } = require('../middleware/role.middleware');
const { attachTenant } = require('../middleware/tenant.middleware');

// All employee routes require authentication
router.use(authenticate, attachTenant, isEmployeeOrAbove);

/**
 * @route   GET /api/employee/dashboard
 * @desc    Get employee dashboard
 * @access  Private/Employee
 */
router.get('/dashboard', employeeController.getDashboard);

/**
 * @route   GET /api/employee/profile
 * @desc    Get employee profile
 * @access  Private/Employee
 */
router.get('/profile', employeeController.getMyProfile);

/**
 * @route   PUT /api/employee/profile
 * @desc    Update employee profile
 * @access  Private/Employee
 */
router.put('/profile', employeeController.updateMyProfile);

/**
 * @route   GET /api/employee/my-attendance
 * @desc    Get employee's attendance records
 * @access  Private/Employee
 */
router.get('/my-attendance', employeeController.getMyAttendance);

/**
 * @route   GET /api/employee/attendance-history
 * @desc    Get attendance history with statistics
 * @access  Private/Employee
 */
router.get('/attendance-history', employeeController.getAttendanceHistory);

/**
 * @route   GET /api/employee/today-attendance
 * @desc    Get today's attendance status
 * @access  Private/Employee
 */
router.get('/today-attendance', employeeController.getTodayAttendance);

/**
 * @route   POST /api/employee/apply-leave
 * @desc    Apply for leave
 * @access  Private/Employee
 */
router.post('/apply-leave', employeeController.applyLeave);

/**
 * @route   GET /api/employee/my-leaves
 * @desc    Get employee's leave requests
 * @access  Private/Employee
 */
router.get('/my-leaves', employeeController.getMyLeaves);

/**
 * @route   GET /api/employee/leave/:leaveId
 * @desc    Get leave details
 * @access  Private/Employee
 */
router.get('/leave/:leaveId', employeeController.getLeaveDetails);

/**
 * @route   PUT /api/employee/leave/:leaveId/cancel
 * @desc    Cancel leave request
 * @access  Private/Employee
 */
router.put('/leave/:leaveId/cancel', employeeController.cancelLeave);

/**
 * @route   GET /api/employee/my-salary
 * @desc    Get employee's salary history
 * @access  Private/Employee
 */
router.get('/my-salary', employeeController.getMySalary);

/**
 * @route   GET /api/employee/salary/:salaryId
 * @desc    Get salary details
 * @access  Private/Employee
 */
router.get('/salary/:salaryId', employeeController.getSalaryDetails);

module.exports = router;