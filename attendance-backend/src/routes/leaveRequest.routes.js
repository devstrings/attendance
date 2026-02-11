const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin, isManagerOrAdmin } = require('../middleware/role.middleware');

// ===== MIDDLEWARE =====
// All routes require authentication
router.use(authenticate);

// ===== EMPLOYEE ROUTES =====

// Get leave policy and balance
router.get('/policy', leaveController.getLeavePolicy);

// Get my leave requests
router.get('/my-requests', leaveController.getMyLeaveRequests);

// Create leave request
router.post('/', leaveController.createLeaveRequest);

// Cancel leave request (employee only)
router.patch('/:requestId/cancel', leaveController.cancelLeaveRequest);

// ===== ADMIN/MANAGER ROUTES =====

// Get all leave requests (Admin/Manager)
router.get('/', isManagerOrAdmin, leaveController.getAllLeaveRequests);

// Get leave request by ID
router.get('/:requestId', leaveController.getLeaveRequestById);

// Approve leave request (Admin/Manager)
router.patch('/:requestId/approve', isManagerOrAdmin, leaveController.approveLeaveRequest);

// Reject leave request (Admin/Manager)
router.patch('/:requestId/reject', isManagerOrAdmin, leaveController.rejectLeaveRequest);

// Add comment to leave request
router.post('/:requestId/comment', leaveController.addComment);

module.exports = router;