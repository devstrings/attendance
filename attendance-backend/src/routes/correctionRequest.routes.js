const express = require('express');
const router = express.Router();
const correctionRequestController = require('../controllers/correctionRequest.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// ==================== EMPLOYEE ROUTES ====================

// Create correction request (Employee only)
router.post('/',
  authenticate,
  authorizeRoles('employee'),
  correctionRequestController.createCorrectionRequest
);

// Get my correction requests (Employee only)
router.get('/my-requests',
  authenticate,
  authorizeRoles('employee'),
  correctionRequestController.getMyCorrectionRequests
);

// ==================== ADMIN/MANAGER ROUTES ====================

// Get overdue requests — MUST be before /:requestId
router.get('/admin/overdue',
  authenticate,
  authorizeRoles('admin', 'manager'),
  correctionRequestController.getOverdueRequests
);

// Get all correction requests (Admin & Manager)
router.get('/',
  authenticate,
  authorizeRoles('admin', 'manager'),
  correctionRequestController.getAllCorrectionRequests
);

// Get correction request by ID
router.get('/:requestId',
  authenticate,
  authorizeRoles('admin', 'manager', 'employee'),
  correctionRequestController.getCorrectionRequestById
);

// Approve correction request (Admin & Manager)
router.patch('/:requestId/approve',
  authenticate,
  authorizeRoles('admin', 'manager'),
  correctionRequestController.approveCorrectionRequest
);

// Reject correction request (Admin & Manager)
router.patch('/:requestId/reject',
  authenticate,
  authorizeRoles('admin', 'manager'),
  correctionRequestController.rejectCorrectionRequest
);

// Update priority (Admin & Manager)
router.patch('/:requestId/priority',
  authenticate,
  authorizeRoles('admin', 'manager'),
  correctionRequestController.updatePriority
);

module.exports = router;