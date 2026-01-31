const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isManagerOrAdmin } = require('../middleware/role.middleware');
const leaveValidators = require('../middleware/validators/leave.validator'); // ✅ NEW

router.use(authenticate);

router.get('/', leaveValidators.getLeaves, leaveController.getAllLeaves);
router.get('/:leaveId', leaveController.getLeaveById);
router.post('/', leaveValidators.createLeave, leaveController.createLeave);
router.put('/:leaveId/status', isManagerOrAdmin, leaveValidators.updateLeaveStatus, leaveController.updateLeaveStatus);
router.put('/:leaveId', leaveValidators.updateLeave, leaveController.updateLeave);
router.put('/:leaveId/cancel', leaveController.cancelLeave);
router.delete('/:leaveId', leaveController.deleteLeave);
router.get('/statistics/employee', leaveController.getLeaveStatistics);
router.get('/balance/employee', leaveController.getLeaveBalance);

module.exports = router;