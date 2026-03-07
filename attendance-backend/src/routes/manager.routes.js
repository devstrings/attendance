const express = require('express');
const router = express.Router();
const managerController = require('../controllers/manager.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isManagerOrAdmin } = require('../middleware/role.middleware');


// ✅ ALL ROUTES REQUIRE AUTHENTICATION + MANAGER ROLE
router.use(authenticate, isManagerOrAdmin);
// ===== DASHBOARD =====
router.get('/dashboard', managerController.getDashboard);

// ===== PROFILE =====
router.get('/profile', managerController.getMyProfile);
router.put('/profile', managerController.updateMyProfile);

// ===== MY EMPLOYEES =====
router.get('/my-employees', managerController.getMyEmployees);
router.get('/employee/:employeeId', managerController.getEmployeeDetails);

// ===== ATTENDANCE =====
router.post('/mark-attendance', managerController.markAttendance);
router.put('/attendance/:attendanceId', managerController.updateAttendance);
router.get('/attendance-history/:employeeId', managerController.getEmployeeAttendanceHistory);
router.get('/attendance-history', managerController.getEmployeeAttendanceHistory);
router.get('/my-attendance', managerController.getMyAttendance);

// ===== CLOCK IN/OUT =====
router.post('/clock-in-out', managerController.clockInOut);

// ===== LEAVE MANAGEMENT =====
router.get('/leave-requests', managerController.getLeaveRequests);
router.put('/leave/:leaveId/status', managerController.updateLeaveStatus);

module.exports = router;