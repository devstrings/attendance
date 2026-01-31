const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');
const adminValidators = require('../middleware/validators/admin.validator'); // ✅ NEW

router.use(authenticate, isAdmin);

// ✅ Validators added
router.get('/dashboard', adminController.getDashboard);
router.get('/user/:userId/:userType', adminValidators.getUserDetails, adminController.getUserDetails);
router.put('/user/:userId/:userType', adminValidators.updateUser, adminController.updateUser);
router.delete('/user/:userId/:userType', adminValidators.getUserDetails, adminController.deleteUser);

router.post('/create-manager', adminValidators.createUser, adminController.createManager);
router.get('/managers', adminController.getAllManagers);

router.post('/create-employee', adminValidators.createUser, adminController.createEmployee);
router.get('/employees', adminController.getAllEmployees);

router.get('/attendance', adminValidators.attendanceFilters, adminController.getAllAttendance);

router.post('/holiday', adminValidators.manageHoliday, adminController.manageHoliday);
router.put('/holiday/:holidayId', adminValidators.manageHoliday, adminController.manageHoliday);
router.get('/holidays', adminController.getAllHolidays);
router.delete('/holiday/:holidayId', adminController.deleteHoliday);

router.get('/monthly-config', adminController.getMonthlyConfig);
router.post('/monthly-config', adminValidators.monthlyConfig, adminController.updateMonthlyConfig);
router.put('/monthly-config/:configId', adminValidators.monthlyConfig, adminController.updateMonthlyConfig);

router.get('/leaves', adminController.getAllLeaves);
router.get('/settings', adminController.getSettings);
router.get('/summary-report', adminController.getSummaryReport);

module.exports = router;