const { body, param, query } = require('express-validator');
const { commonValidations, validate } = require('./common.validator');

const leaveValidators = {
  // Create leave
  createLeave: [
    body('leaveType').isIn(['casual', 'sick', 'annual', 'unpaid'])
      .withMessage('Invalid leave type'),
    body('startDate').isISO8601().withMessage('Invalid start date'),
    body('endDate').isISO8601().withMessage('Invalid end date')
      .custom((value, { req }) => new Date(value) >= new Date(req.body.startDate))
      .withMessage('End date must be after start date'),
    body('reason').trim().notEmpty().withMessage('Reason is required')
      .isLength({ min: 10, max: 500 }).withMessage('Reason must be 10-500 characters'),
    body('isHalfDay').optional().isBoolean(),
    validate,
  ],

  // Update leave status
  updateLeaveStatus: [
    param('leaveId').isMongoId().withMessage('Invalid leave ID'),
    body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved/rejected'),
    body('remarks').optional().trim().isLength({ max: 500 }),
    validate,
  ],

  // Update leave
  updateLeave: [
    param('leaveId').isMongoId(),
    body('leaveType').optional().isIn(['casual', 'sick', 'annual', 'unpaid']),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('reason').optional().trim().isLength({ min: 10, max: 500 }),
    validate,
  ],

  // Get leaves filters
  getLeaves: [
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'cancelled']),
    query('leaveType').optional().isIn(['casual', 'sick', 'annual', 'unpaid']),
    query('employeeId').optional().isMongoId(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    ...commonValidations.pagination,
    validate,
  ],
};

module.exports = leaveValidators;