const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salary.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');
const salaryValidators = require('../middleware/validators/salary.validator'); // ✅ NEW
const { attachTenant } = require('../middleware/tenant.middleware');

router.use(authenticate, attachTenant);

router.get('/', salaryValidators.getSalaries, salaryController.getAllSalaries);
router.get('/:salaryId', salaryController.getSalaryById);
router.post('/generate', isAdmin, salaryValidators.generateSalary, salaryController.generateSalary);
router.put('/:salaryId', isAdmin, salaryController.updateSalary);
router.put('/:salaryId/payment-status', isAdmin, salaryValidators.updatePaymentStatus, salaryController.updatePaymentStatus);
router.delete('/:salaryId', isAdmin, salaryController.deleteSalary);
router.post('/bulk-generate', isAdmin, salaryValidators.bulkGenerateSalaries, salaryController.bulkGenerateSalaries);
router.get('/summary/monthly', isAdmin, salaryController.getSalarySummary);

module.exports = router;