const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth.middleware');
const { isSuperAdmin } = require('../middleware/superAdmin.middleware');
const superAdminController = require('../controllers/superAdmin.controller');

// ✅ All routes below require: logged in AND role === 'superadmin'
router.use(authenticate, isSuperAdmin);

// Company CRUD
router.post('/companies', superAdminController.createCompany);
router.get('/companies', superAdminController.getAllCompanies);
router.get('/companies/:companyId', superAdminController.getCompanyById);
router.put('/companies/:companyId', superAdminController.updateCompany);
router.delete('/companies/:companyId', superAdminController.deleteCompany);

// Suspend / Activate
router.patch('/companies/:companyId/suspend', superAdminController.suspendCompany);
router.patch('/companies/:companyId/activate', superAdminController.activateCompany);

// Company Admin management
router.post('/companies/:companyId/admin', superAdminController.createCompanyAdmin);
router.patch('/admin/:userId/reset-password', superAdminController.resetCompanyAdminPassword);

// Audit & Monitoring
router.get('/audit-logs', superAdminController.getAuditLogs);
router.get('/platform-usage', superAdminController.getPlatformUsage);


router.get('/audit-logs', superAdminController.getAuditLogs);
router.delete('/audit-logs/clear-all', superAdminController.clearAllAuditLogs);   // ✅ NEW (specific route pehle)
router.delete('/audit-logs/:logId', superAdminController.deleteAuditLog);          // ✅ NEW

module.exports = router;