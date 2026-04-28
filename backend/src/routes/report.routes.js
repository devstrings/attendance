const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isManagerOrAdmin } = require('../middleware/role.middleware');

// All report routes require authentication and manager/admin role
router.use(authenticate, isManagerOrAdmin);

/**
 * @route   GET /api/report/daily-attendance
 * @desc    Get daily attendance report
 * @access  Private/Manager/Admin
 */
router.get('/daily-attendance', reportController.getDailyAttendanceReport);

/**
 * @route   GET /api/report/monthly-attendance
 * @desc    Get monthly attendance report
 * @access  Private/Manager/Admin
 */
router.get('/monthly-attendance', reportController.getMonthlyAttendanceReport);

/**
 * @route   GET /api/report/employee-attendance-summary
 * @desc    Get employee attendance summary
 * @access  Private/Manager/Admin
 */
router.get('/employee-attendance-summary', reportController.getEmployeeAttendanceSummary);

/**
 * @route   GET /api/report/department-wise
 * @desc    Get department-wise report
 * @access  Private/Manager/Admin
 */
router.get('/department-wise', reportController.getDepartmentWiseReport);

/**
 * @route   GET /api/report/leave
 * @desc    Get leave report
 * @access  Private/Manager/Admin
 */
router.get('/leave', reportController.getLeaveReport);

/**
 * @route   GET /api/report/salary
 * @desc    Get salary report
 * @access  Private/Manager/Admin
 */
router.get('/salary', reportController.getSalaryReport);

/**
 * @route   GET /api/report/late-arrival
 * @desc    Get late arrival report
 * @access  Private/Manager/Admin
 */
router.get('/late-arrival', reportController.getLateArrivalReport);

/**
 * @route   GET /api/report/overtime
 * @desc    Get overtime report
 * @access  Private/Manager/Admin
 */
router.get('/overtime', reportController.getOvertimeReport);

/**
 * @route   GET /api/report/comprehensive-monthly
 * @desc    Get comprehensive monthly report
 * @access  Private/Manager/Admin
 */
router.get('/comprehensive-monthly', reportController.getComprehensiveMonthlyReport);

/**
 * @route   GET /api/report/manager-performance
 * @desc    Get manager performance report
 * @access  Private/Admin
 */
router.get('/manager-performance', reportController.getManagerPerformanceReport);

module.exports = router;