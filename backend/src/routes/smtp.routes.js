const express = require('express');
const router = express.Router();
const smtpController = require('../controllers/smtp.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const { attachTenant } = require('../middleware/tenant.middleware'); // ✅ NEW

router.get('/', authenticate, attachTenant, authorizeRoles('admin'), smtpController.getSmtpSettings);
router.post('/', authenticate, attachTenant, authorizeRoles('admin'), smtpController.saveSmtpSettings);
router.post('/test-connection', authenticate, attachTenant, authorizeRoles('admin'), smtpController.testSmtpConnection);
router.post('/send-test', authenticate, attachTenant, authorizeRoles('admin'), smtpController.sendTestEmail);
router.get('/status', authenticate, attachTenant, authorizeRoles('admin'), smtpController.getSmtpStatus);
router.patch('/toggle-notification', authenticate, attachTenant, authorizeRoles('admin'), smtpController.toggleNotificationType);
router.delete('/', authenticate, attachTenant, authorizeRoles('admin'), smtpController.deleteSmtpSettings);

module.exports = router;