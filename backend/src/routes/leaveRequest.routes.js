const express = require('express');
const router = express.Router();
const leaveRequestController = require('../controllers/leaveRequest.controller'); // ✅ Make sure controller name is correct
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin, isManagerOrAdmin } = require('../middleware/role.middleware');

// ===== MIDDLEWARE =====
router.use(authenticate); // All routes need authentication

// ===== EMPLOYEE ROUTES =====
router.get('/policy', leaveRequestController.getLeavePolicy); // ✅ CRITICAL
router.get('/my-requests', leaveRequestController.getMyLeaveRequests);
router.post('/', leaveRequestController.createLeaveRequest);
router.patch('/:requestId/cancel', leaveRequestController.cancelLeaveRequest);

// ===== ADMIN/MANAGER ROUTES =====
router.get('/', isManagerOrAdmin, leaveRequestController.getAllLeaveRequests);
router.get('/:requestId', leaveRequestController.getLeaveRequestById);
router.patch('/:requestId/approve', isManagerOrAdmin, leaveRequestController.approveLeaveRequest);
router.patch('/:requestId/reject', isManagerOrAdmin, leaveRequestController.rejectLeaveRequest);
router.post('/:requestId/comment', leaveRequestController.addComment);

module.exports = router;