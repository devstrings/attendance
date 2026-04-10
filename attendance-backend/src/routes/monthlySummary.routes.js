const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/monthlySummaryController');

// ✅ Tera project 'authenticate' use karta hai — auth.middleware se
const { authenticate } = require('../middleware/auth.middleware');

// ================================
// EMPLOYEE ROUTES
// ================================
// Apni saari summaries dekho (history)
router.get('/my', authenticate, ctrl.getMyMonthlySummaries);

// Specific month ki summary
router.get('/my/:month/:year', authenticate, ctrl.getMyMonthlySummaryByMonth);

// ================================
// MANAGER ROUTES
// ================================
// Team ki summaries (manager + admin dono dekh sakte hain)
router.get('/team/:month/:year', authenticate, ctrl.getTeamMonthlySummaries);

// ================================
// ADMIN ROUTES
// ================================
// Sab employees ki summaries
router.get('/admin/preview/:month/:year', authenticate, ctrl.adminPreviewSummaries);
router.get('/admin/:month/:year', authenticate, ctrl.adminGetAllSummaries);



// Manual trigger (testing + emergency)
router.post('/admin/trigger', authenticate, ctrl.adminTriggerSummary);

module.exports = router;