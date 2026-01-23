const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salary.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

// All salary routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/salary
 * @desc    Get all salary records
 * @access  Private
 */
router.get('/', salaryController.getAllSalaries);

/**
 * @route   GET /api/salary/:salaryId
 * @desc    Get salary by ID
 * @access  Private
 */
router.get('/:salaryId', salaryController.getSalaryById);

/**
 * @route   POST /api/salary/generate
 * @desc    Generate salary for employee
 * @access  Private/Admin
 */
router.post('/generate', isAdmin, salaryController.generateSalary);

/**
 * @route   PUT /api/salary/:salaryId
 * @desc    Update salary record
 * @access  Private/Admin
 */
router.put('/:salaryId', isAdmin, salaryController.updateSalary);

/**
 * @route   PUT /api/salary/:salaryId/payment-status
 * @desc    Update payment status
 * @access  Private/Admin
 */
router.put('/:salaryId/payment-status', isAdmin, salaryController.updatePaymentStatus);

/**
 * @route   DELETE /api/salary/:salaryId
 * @desc    Delete salary record
 * @access  Private/Admin
 */
router.delete('/:salaryId', isAdmin, salaryController.deleteSalary);

/**
 * @route   POST /api/salary/bulk-generate
 * @desc    Bulk generate salaries
 * @access  Private/Admin
 */
router.post('/bulk-generate', isAdmin, salaryController.bulkGenerateSalaries);

/**
 * @route   GET /api/salary/summary/monthly
 * @desc    Get salary summary
 * @access  Private/Admin
 */
router.get('/summary/monthly', isAdmin, salaryController.getSalarySummary);

module.exports = router;