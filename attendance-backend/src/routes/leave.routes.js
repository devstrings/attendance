const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isManagerOrAdmin } = require('../middleware/role.middleware');

// All leave routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/leave
 * @desc    Get all leave requests
 * @access  Private
 */
router.get('/', leaveController.getAllLeaves);

/**
 * @route   GET /api/leave/:leaveId
 * @desc    Get leave by ID
 * @access  Private
 */
router.get('/:leaveId', leaveController.getLeaveById);

/**
 * @route   POST /api/leave
 * @desc    Create leave request
 * @access  Private
 */
router.post('/', leaveController.createLeave);

/**
 * @route   PUT /api/leave/:leaveId/status
 * @desc    Update leave status (approve/reject)
 * @access  Private/Manager/Admin
 */
router.put('/:leaveId/status', isManagerOrAdmin, leaveController.updateLeaveStatus);

/**
 * @route   PUT /api/leave/:leaveId
 * @desc    Update leave request
 * @access  Private
 */
router.put('/:leaveId', leaveController.updateLeave);

/**
 * @route   PUT /api/leave/:leaveId/cancel
 * @desc    Cancel leave request
 * @access  Private
 */
router.put('/:leaveId/cancel', leaveController.cancelLeave);

/**
 * @route   DELETE /api/leave/:leaveId
 * @desc    Delete leave request
 * @access  Private/Admin
 */
router.delete('/:leaveId', leaveController.deleteLeave);

/**
 * @route   GET /api/leave/statistics
 * @desc    Get leave statistics
 * @access  Private
 */
router.get('/statistics/employee', leaveController.getLeaveStatistics);

/**
 * @route   GET /api/leave/balance
 * @desc    Get leave balance
 * @access  Private
 */
router.get('/balance/employee', leaveController.getLeaveBalance);

module.exports = router;