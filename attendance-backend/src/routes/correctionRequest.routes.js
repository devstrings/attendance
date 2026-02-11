const express = require('express');
const router = express.Router();
const leaveRequestController = require('../controllers/leaveRequest.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// ==================== EMPLOYEE ROUTES ====================

// Create leave request (Employee only)
router.post('/', 
  authenticate, 
  authorizeRoles('employee'), 
  leaveRequestController.createLeaveRequest
);

// Get my leave requests (Employee only)
router.get('/my-requests', 
  authenticate, 
  authorizeRoles('employee'), 
  leaveRequestController.getMyLeaveRequests
);

// Cancel leave request (Employee only)
router.patch('/:requestId/cancel', 
  authenticate, 
  authorizeRoles('employee'), 
  leaveRequestController.cancelLeaveRequest
);

// ==================== ADMIN/MANAGER ROUTES ====================

// Get all leave requests (Admin & Manager)
router.get('/', 
  authenticate, 
  authorizeRoles('admin', 'manager'), 
  leaveRequestController.getAllLeaveRequests
);

// Get leave request by ID (Admin & Manager)
router.get('/:requestId', 
  authenticate, 
  authorizeRoles('admin', 'manager', 'employee'), 
  leaveRequestController.getLeaveRequestById
);

// Approve leave request (Admin & Manager)
router.patch('/:requestId/approve', 
  authenticate, 
  authorizeRoles('admin', 'manager'), 
  leaveRequestController.approveLeaveRequest
);

// Reject leave request (Admin & Manager)
router.patch('/:requestId/reject', 
  authenticate, 
  authorizeRoles('admin', 'manager'), 
  leaveRequestController.rejectLeaveRequest
);

// Add comment to leave request (Admin, Manager, Employee)
router.post('/:requestId/comment', 
  authenticate, 
  authorizeRoles('admin', 'manager', 'employee'), 
  leaveRequestController.addComment
);

module.exports = router;