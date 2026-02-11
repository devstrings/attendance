const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isManagerOrAdmin, isAdmin } = require('../middleware/role.middleware');

// All routes require authentication
router.use(authenticate);

// ==================== EMPLOYEE ROUTES ====================
// Get leave policy and balance
router.get('/policy', leaveController.getLeavePolicy);

// Get my leave requests
router.get('/my-requests', leaveController.getMyLeaveRequests);

// Create new leave request (Employee)
router.post('/', leaveController.createLeaveRequest);  // ✅ This handles POST /api/v1/leave-requests

// Cancel leave request (Employee - own requests only)
router.put('/cancel/:requestId', leaveController.cancelLeaveRequest);

// ==================== ADMIN/MANAGER ROUTES ====================
// Get all leave requests (Admin/Manager)
router.get('/all', isManagerOrAdmin, leaveController.getAllLeaveRequests);

// Get leave request by ID (Admin/Manager)
router.get('/:requestId', isManagerOrAdmin, leaveController.getLeaveRequestById);

// Approve leave request (Admin/Manager)
router.put('/approve/:requestId', isManagerOrAdmin, leaveController.approveLeaveRequest);

// Reject leave request (Admin/Manager)
router.put('/reject/:requestId', isManagerOrAdmin, leaveController.rejectLeaveRequest);

// Add comment to leave request (Admin/Manager)
router.post('/comment/:requestId', isManagerOrAdmin, leaveController.addComment);

module.exports = router;