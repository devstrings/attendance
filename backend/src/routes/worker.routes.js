const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/permission.middleware');
const ctrl = require('../controllers/worker.controller');

// Ye saare routes sirf superadmin ke liye
router.use(authenticate, allowRoles('superadmin'));

router.post('/', ctrl.createWorker);
router.get('/', ctrl.listWorkers);
router.put('/:id/permissions', ctrl.updateWorkerPermissions);
router.patch('/:id/toggle-active', ctrl.toggleWorkerActive);

module.exports = router;