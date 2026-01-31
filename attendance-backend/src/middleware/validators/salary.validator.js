const { body, param, query } = require('express-validator');
const { commonValidations, validate } = require('./common.validator');

const salaryValidators = {
  // Generate salary
  generateSalary: [
    body('employeeId').isMongoId().withMessage('Invalid employee ID'),
    body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be 1-12'),
    body('year').isInt({ min: 2020 }).withMessage('Invalid year'),
    body('basicSalary').isNumeric().withMessage('Basic salary must be numeric'),
    body('allowances').optional().isNumeric(),
    body('deductions').optional().isNumeric(),
    body('bonus').optional().isNumeric(),
    body('overtimePay').optional().isNumeric(),
    validate,
  ],

  // Update payment status
  updatePaymentStatus: [
    param('salaryId').isMongoId().withMessage('Invalid salary ID'),
    body('paymentStatus').isIn(['pending', 'paid', 'cancelled'])
      .withMessage('Invalid payment status'),
    body('paymentDate').optional().isISO8601(),
    body('paymentMethod').optional().isIn(['cash', 'bank_transfer', 'cheque']),
    validate,
  ],

  // Bulk generate
  bulkGenerateSalaries: [
    body('month').isInt({ min: 1, max: 12 }),
    body('year').isInt({ min: 2020 }),
    body('employeeIds').optional().isArray(),
    body('employeeIds.*').isMongoId(),
    validate,
  ],

  // Salary filters
  getSalaries: [
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2020 }),
    query('employeeId').optional().isMongoId(),
    query('paymentStatus').optional().isIn(['pending', 'paid', 'cancelled']),
    ...commonValidations.pagination,
    validate,
  ],
};

module.exports = salaryValidators;