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
 * ============================================
 * USER MANAGEMENT - GENERIC ROUTES (MUST BE FIRST)
 * These routes handle both manager and employee
 * ============================================
 */
// ✅ IMPORTANT: These must be defined BEFORE specific routes
router.get('/user/:userId/:userType', (req, res, next) => {
  console.log('🔍 Generic user route hit:', req.params);
  adminController.getUserDetails(req, res, next);
});

router.put('/user/:userId/:userType', (req, res, next) => {
  console.log('📝 Generic update route hit:', req.params);
  adminController.updateUser(req, res, next);
});

router.delete('/user/:userId/:userType', (req, res, next) => {
  console.log('🗑️ Generic delete route hit:', req.params);
  adminController.deleteUser(req, res, next);
});

/**
 * ============================================
 * MANAGER MANAGEMENT - SPECIFIC ROUTES
 * ============================================
 */
router.post('/create-manager', adminController.createManager);
router.get('/managers', adminController.getAllManagers);

// ✅ Manager specific routes (for backwards compatibility)
router.get('/manager/:userId', (req, res, next) => {
  req.params.userType = 'manager';
  adminController.getUserDetails(req, res, next);
});

router.put('/manager/:userId', (req, res, next) => {
  req.params.userType = 'manager';
  adminController.updateUser(req, res, next);
});

router.delete('/manager/:userId', (req, res, next) => {
  req.params.userType = 'manager';
  adminController.deleteUser(req, res, next);
});

/**
 * ============================================
 * EMPLOYEE MANAGEMENT - SPECIFIC ROUTES
 * ============================================
 */
router.post('/create-employee', adminController.createEmployee);
router.get('/employees', adminController.getAllEmployees);

// ✅ Employee specific routes (for backwards compatibility)
router.get('/employee/:userId', (req, res, next) => {
  req.params.userType = 'employee';
  adminController.getUserDetails(req, res, next);
});

router.put('/employee/:userId', (req, res, next) => {
  req.params.userType = 'employee';
  adminController.updateUser(req, res, next);
});

router.delete('/employee/:userId', (req, res, next) => {
  req.params.userType = 'employee';
  adminController.deleteUser(req, res, next);
});

/**
 * ============================================
 * ATTENDANCE MANAGEMENT
 * ============================================
 */
router.get('/attendance', adminController.getAllAttendance);

/**
 * ============================================
 * HOLIDAY MANAGEMENT
 * ============================================
 */
router.post('/holiday', adminController.manageHoliday);
router.put('/holiday/:holidayId', adminController.manageHoliday);
router.get('/holidays', adminController.getAllHolidays);
router.delete('/holiday/:holidayId', adminController.deleteHoliday);

/**
 * ============================================
 * MONTHLY CONFIG
 * ============================================
 */
router.get('/monthly-config', adminController.getMonthlyConfig);
router.post('/monthly-config', adminController.updateMonthlyConfig);
router.put('/monthly-config/:configId', adminController.updateMonthlyConfig);

/**
 * ============================================
 * LEAVE MANAGEMENT
 * ============================================
 */
router.get('/leaves', adminController.getAllLeaves);

/**
 * ============================================
 * SETTINGS
 * ============================================
 */
router.get('/settings', adminController.getSettings);

/**
 * ============================================
 * REPORTS
 * ============================================
 */
router.get('/summary-report', adminController.getSummaryReport);

module.exports = router;