const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const attendanceController = require('../controllers/attendance.controller');
const attendanceValidators = require('../middleware/validators/attendance.validator'); // ✅ NEW

router.use(authenticate);

// ✅ Validators applied
router.post('/clock-in', attendanceValidators.clockIn, attendanceController.clockIn);
router.post('/clock-out', attendanceValidators.clockOut, attendanceController.clockOut);
router.get('/today/status', attendanceController.getTodayClockStatus);
router.get('/summary/stats', attendanceController.getAttendanceSummary);
router.post('/bulk-mark', attendanceValidators.bulkMarkAttendance, attendanceController.bulkMarkAttendance);

router.get('/', attendanceValidators.getAttendance, attendanceController.getAllAttendance);
router.post('/', attendanceValidators.createAttendance, attendanceController.createAttendance);

router.get('/:attendanceId', attendanceController.getAttendanceById);
router.put('/:attendanceId', attendanceValidators.updateAttendance, attendanceController.updateAttendance);
router.delete('/:attendanceId', attendanceController.deleteAttendance);

module.exports = router;