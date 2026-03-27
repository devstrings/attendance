// ============================================================
// 🛣️ ATTENDANCE ROUTES — attendance.routes.js
// Poori file replace karo isse
// ============================================================

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
router.get('/today/status',    attendanceController.getTodayClockStatus);
router.get('/summary/stats',   attendanceController.getAttendanceSummary);

// ─── Overtime: Pending Requests (Admin/Manager) ───────────────────────────────
// ⚠️ IMPORTANT: Yeh route /:attendanceId se PEHLE hona chahiye warna conflict hoga
router.get('/overtime/pending', attendanceController.getPendingOvertimeRequests);

// ─── Bulk Mark ────────────────────────────────────────────────────────────────
router.post('/bulk-mark', attendanceValidators.bulkMarkAttendance, attendanceController.bulkMarkAttendance);

// ─── CRUD ─────────────────────────────────────────────────────────────────────
router.get('/',  attendanceValidators.getAttendance,    attendanceController.getAllAttendance);
router.post('/', attendanceValidators.createAttendance, attendanceController.createAttendance);

router.get('/:attendanceId',    attendanceController.getAttendanceById);
router.put('/:attendanceId',    attendanceValidators.updateAttendance, attendanceController.updateAttendance);
router.delete('/:attendanceId', attendanceController.deleteAttendance);

// ─── Overtime Routes ──────────────────────────────────────────────────────────
// Admin/Manager: directly overtime set karo (bina request ke)
router.put('/:attendanceId/overtime', attendanceController.setOvertime);

// Employee: overtime request bhejo
router.post('/:attendanceId/overtime-request', attendanceController.requestOvertime);

// Admin/Manager: employee ki overtime request approve/reject karo
router.put('/:attendanceId/overtime-approve', attendanceController.approveOvertimeRequest);

module.exports = router;