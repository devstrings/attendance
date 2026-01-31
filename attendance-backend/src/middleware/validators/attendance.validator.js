const { body, param, query } = require('express-validator');
const { commonValidations, validate } = require('./common.validator');

const attendanceValidators = {
  // Clock in
  clockIn: [
    body('location').optional().isObject().withMessage('Location must be an object'),
    body('location.latitude').optional().isFloat({ min: -90, max: 90 }),
    body('location.longitude').optional().isFloat({ min: -180, max: 180 }),
    validate,
  ],

  // Clock out
  clockOut: [
    body('location').optional().isObject(),
    body('location.latitude').optional().isFloat({ min: -90, max: 90 }),
    body('location.longitude').optional().isFloat({ min: -180, max: 180 }),
    validate,
  ],

  // Create attendance
  createAttendance: [
    body('employeeId').isMongoId().withMessage('Invalid employee ID'),
    body('date').isISO8601().withMessage('Invalid date'),
    body('status').isIn(['present', 'absent', 'late', 'half-day', 'leave'])
      .withMessage('Invalid status'),
    body('checkInTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('Invalid time format (HH:MM)'),
    body('checkOutTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    body('remarks').optional().trim().isLength({ max: 500 }),
    validate,
  ],

  // Update attendance
  updateAttendance: [
    param('attendanceId').isMongoId().withMessage('Invalid attendance ID'),
    body('status').optional().isIn(['present', 'absent', 'late', 'half-day', 'leave']),
    body('checkInTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    body('checkOutTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    body('remarks').optional().trim().isLength({ max: 500 }),
    validate,
  ],

  // Bulk mark attendance
  bulkMarkAttendance: [
    body('attendanceData').isArray({ min: 1 }).withMessage('Attendance data must be an array'),
    body('attendanceData.*.employeeId').isMongoId(),
    body('attendanceData.*.date').isISO8601(),
    body('attendanceData.*.status').isIn(['present', 'absent', 'late', 'half-day']),
    validate,
  ],

  // Get attendance filters
  getAttendance: [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('employeeId').optional().isMongoId(),
    query('status').optional().isIn(['present', 'absent', 'late', 'half-day', 'leave']),
    ...commonValidations.pagination,
    validate,
  ],
};

module.exports = attendanceValidators;