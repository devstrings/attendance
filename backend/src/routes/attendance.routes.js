const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const attendanceController = require('../controllers/attendance.controller');
const attendanceValidators = require('../middleware/validators/attendance.validator');

router.use(authenticate);

// ─── Clock In / Out ───────────────────────────────────────────────────────────
router.post('/clock-in',  attendanceValidators.clockIn,  attendanceController.clockIn);
router.post('/clock-out', attendanceValidators.clockOut, attendanceController.clockOut);

// ─── Status & Summary ─────────────────────────────────────────────────────────
router.get('/today/status',  attendanceController.getTodayClockStatus);
router.get('/summary/stats', attendanceController.getAttendanceSummary);

// ─── Overtime Pending Requests ────────────────────────────────────────────────
// ⚠️ MUST be before /:attendanceId routes to avoid conflict
router.get('/overtime/pending', attendanceController.getPendingOvertimeRequests);

// ─── Bulk Mark ────────────────────────────────────────────────────────────────
router.post('/bulk-mark', attendanceValidators.bulkMarkAttendance, attendanceController.bulkMarkAttendance);

// ─── CRUD (list + create) ─────────────────────────────────────────────────────
router.get('/',  attendanceValidators.getAttendance,    attendanceController.getAllAttendance);
router.post('/', attendanceValidators.createAttendance, attendanceController.createAttendance);

// ─── Single record GET ────────────────────────────────────────────────────────
router.get('/:attendanceId', attendanceController.getAttendanceById);

// ─── Specific PUT routes FIRST (before generic /:attendanceId PUT) ────────────
// ⚠️ Order matters — Express matches top to bottom
router.put('/:attendanceId/correct',           attendanceController.adminCorrectAttendance);
router.put('/:attendanceId/overtime',          attendanceController.setOvertime);
router.put('/:attendanceId/overtime-approve',  attendanceController.approveOvertimeRequest);

// ─── Overtime request (POST) ──────────────────────────────────────────────────
router.post('/:attendanceId/overtime-request', attendanceController.requestOvertime);

// ─── Generic update + delete LAST ─────────────────────────────────────────────
router.put('/:attendanceId',    attendanceValidators.updateAttendance, attendanceController.updateAttendance);
router.delete('/:attendanceId', attendanceController.deleteAttendance);

module.exports = router;