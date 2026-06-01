const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');
const adminValidators = require('../middleware/validators/admin.validator');
const authController = require('../controllers/auth.controller');


// ✅ PUBLIC ROUTE - System Config (accessible to all authenticated users)
router.get('/system-config/public', authenticate, adminController.getSystemConfig);

// ✅ ADMIN ONLY ROUTES
router.use(authenticate, isAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);


// Admin Profile Update
router.get('/profile', adminController.getAdminProfile);
router.put('/profile', adminController.updateAdminProfile);
router.get('/profile-picture', adminController.getProfilePicture);
router.put('/profile-picture', adminController.updateProfilePicture);
router.put('/change-password', authController.changePassword);


// User Management
router.get('/user/:userId/:userType', adminValidators.getUserDetails, adminController.getUserDetails);
router.put('/user/:userId/:userType', adminValidators.updateUser, adminController.updateUser);
router.delete('/user/:userId/:userType', adminValidators.getUserDetails, adminController.deleteUser);

// Manager Management
router.post('/create-manager', adminValidators.createUser, adminController.createManager);
router.get('/managers', adminController.getAllManagers);

// Employee Management
router.post('/create-employee', adminValidators.createUser, adminController.createEmployee);
router.get('/employees', adminController.getAllEmployees);
router.get('/employees/:id', adminController.getEmployeeById);

// Attendance
router.get('/attendance', adminValidators.attendanceFilters, adminController.getAllAttendance);

// Holiday Management
router.post('/holiday', adminValidators.manageHoliday, adminController.manageHoliday);
router.put('/holiday/:holidayId', adminValidators.manageHoliday, adminController.manageHoliday);
router.get('/holidays', adminController.getAllHolidays);
router.delete('/holiday/:holidayId', adminController.deleteHoliday);

// System Configuration Routes (Admin only)
router.get('/system-config', adminController.getSystemConfig);
router.post('/system-config', adminController.createSystemConfig);
router.put('/system-config/:configId', adminController.updateSystemConfig);

// Monthly Config (Legacy)
router.get('/monthly-config', adminController.getMonthlyConfig);
router.post('/monthly-config', adminValidators.monthlyConfig, adminController.updateMonthlyConfig);
router.put('/monthly-config/:configId', adminValidators.monthlyConfig, adminController.updateMonthlyConfig);

// Leaves & Reports
router.get('/leaves', adminController.getAllLeaves);
router.get('/settings', adminController.getSettings);
router.get('/summary-report', adminController.getSummaryReport);

router.post('/fix-employee-links', adminController.fixEmployeeManagerLinks);

module.exports = router;