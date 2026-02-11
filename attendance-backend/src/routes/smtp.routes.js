const express = require('express');
const router = express.Router();
const smtpController = require('../controllers/smtp.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// ==================== ADMIN ONLY ROUTES ====================

// Get SMTP settings
router.get('/', 
  authenticate, 
  authorizeRoles('admin'), 
  smtpController.getSmtpSettings
);

// Save/Update SMTP settings
router.post('/', 
  authenticate, 
  authorizeRoles('admin'), 
  smtpController.saveSmtpSettings
);

// Test SMTP connection
router.post('/test-connection', 
  authenticate, 
  authorizeRoles('admin'), 
  smtpController.testSmtpConnection
);

// Send test email
router.post('/send-test', 
  authenticate, 
  authorizeRoles('admin'), 
  smtpController.sendTestEmail
);

// Get SMTP status and statistics
router.get('/status', 
  authenticate, 
  authorizeRoles('admin'), 
  smtpController.getSmtpStatus
);

// Toggle notification type
router.patch('/toggle-notification', 
  authenticate, 
  authorizeRoles('admin'), 
  smtpController.toggleNotificationType
);

// Delete SMTP settings
router.delete('/', 
  authenticate, 
  authorizeRoles('admin'), 
  smtpController.deleteSmtpSettings
);

module.exports = router;