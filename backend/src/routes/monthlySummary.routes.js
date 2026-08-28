const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/monthlySummaryController');
const { authenticate } = require('../middleware/auth.middleware');
const { attachTenant } = require('../middleware/tenant.middleware'); // ✅ NEW

router.get('/my', authenticate, attachTenant, ctrl.getMyMonthlySummaries);
router.get('/my/:month/:year', authenticate, attachTenant, ctrl.getMyMonthlySummaryByMonth);
router.get('/team/:month/:year', authenticate, attachTenant, ctrl.getTeamMonthlySummaries);
router.get('/admin/preview/:month/:year', authenticate, attachTenant, ctrl.adminPreviewSummaries);
router.get('/admin/:month/:year', authenticate, attachTenant, ctrl.adminGetAllSummaries);
router.post('/admin/trigger', authenticate, attachTenant, ctrl.adminTriggerSummary);

module.exports = router;