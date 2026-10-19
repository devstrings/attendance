const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth.middleware');
const { allowRoles, requirePermission } = require('../middleware/permission.middleware');
const superAdminController = require('../controllers/superAdmin.controller');

// ✅ Sab routes ke liye login zaroori hai. Aage har route apna guard khud lagata hai.
router.use(authenticate);

// ================================
// WORKER + SUPERADMIN (permission ke saath)
// ================================
router.get('/companies', requirePermission('companies:view'), superAdminController.getAllCompanies);
router.get('/companies/:companyId', requirePermission('companies:view'), superAdminController.getCompanyById);
router.get('/companies/:companyId/admins', requirePermission('companies:view'), superAdminController.getCompanyAdmins);

router.patch('/companies/:companyId/suspend', requirePermission('companies:suspend'), superAdminController.suspendCompany);
router.patch('/companies/:companyId/activate', requirePermission('companies:suspend'), superAdminController.activateCompany);

router.get('/platform-usage', requirePermission('usage:view'), superAdminController.getPlatformUsage);
router.get('/audit-logs', requirePermission('auditlogs:view'), superAdminController.getAuditLogs);

// ================================
// SIRF SUPERADMIN
// ================================
router.post('/companies', allowRoles('superadmin'), superAdminController.createCompany);
router.put('/companies/:companyId', allowRoles('superadmin'), superAdminController.updateCompany);
router.delete('/companies/:companyId', allowRoles('superadmin'), superAdminController.deleteCompany);

router.post('/companies/:companyId/admin', allowRoles('superadmin'), superAdminController.createCompanyAdmin);
router.patch('/admin/:userId/reset-password', allowRoles('superadmin'), superAdminController.resetCompanyAdminPassword);

// Specific route pehle, phir :logId wala
router.delete('/audit-logs/clear-all', allowRoles('superadmin'), superAdminController.clearAllAuditLogs);
router.delete('/audit-logs/:logId', allowRoles('superadmin'), superAdminController.deleteAuditLog);

module.exports = router;