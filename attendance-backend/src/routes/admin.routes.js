const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

// All admin routes require authentication and admin role
router.use(authenticate, isAdmin);

/**
 * Dashboard
 */
router.get('/dashboard', adminController.getDashboard);

/**
 * ✅ CRITICAL: Generic user routes MUST come FIRST
 * These handle BOTH Employee._id and User._id automatically
 */
router.get('/user/:userId/:userType', adminController.getUserDetails);
router.put('/user/:userId/:userType', adminController.updateUser);
router.delete('/user/:userId/:userType', adminController.deleteUser);

/**
 * Manager Management
 */
router.post('/create-manager', adminController.createManager);
router.get('/managers', adminController.getAllManagers);

/**
 * Employee Management
 */
router.post('/create-employee', adminController.createEmployee);
router.get('/employees', adminController.getAllEmployees);

/**
 * Attendance Management
 */
router.get('/attendance', adminController.getAllAttendance);

/**
 * Holiday Management
 */
router.post('/holiday', adminController.manageHoliday);
router.put('/holiday/:holidayId', adminController.manageHoliday);
router.get('/holidays', adminController.getAllHolidays);
router.delete('/holiday/:holidayId', adminController.deleteHoliday);

/**
 * Monthly Config
 */
router.get('/monthly-config', adminController.getMonthlyConfig);
router.post('/monthly-config', adminController.updateMonthlyConfig);
router.put('/monthly-config/:configId', adminController.updateMonthlyConfig);

/**
 * Leave Management
 */
router.get('/leaves', adminController.getAllLeaves);

/**
 * Settings
 */
router.get('/settings', adminController.getSettings);

/**
 * Summary Report
 */
router.get('/summary-report', adminController.getSummaryReport);

module.exports = router;