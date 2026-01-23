const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  getAllAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  clockIn,
  clockOut,
  getTodayClockStatus,
  getAttendanceSummary,
  bulkMarkAttendance
} = require('../controllers/attendance.controller');

// All routes require authentication
router.use(authenticate);

// ✅ IMPORTANT: Specific routes BEFORE parameterized routes
router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.get('/today/status', getTodayClockStatus);
router.get('/summary/stats', getAttendanceSummary);
router.post('/bulk-mark', bulkMarkAttendance);

// ✅ General routes
router.get('/', getAllAttendance);
router.post('/', createAttendance);

// ✅ Parameterized routes at the end
router.get('/:attendanceId', getAttendanceById);
router.put('/:attendanceId', updateAttendance);
router.delete('/:attendanceId', deleteAttendance);

module.exports = router;