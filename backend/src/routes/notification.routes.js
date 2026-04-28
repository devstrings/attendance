const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

// ===== ALL ROUTES REQUIRE AUTHENTICATION =====
router.use(authenticate);

// ===== USER ROUTES =====
router.get('/my-notifications', notificationController.getMyNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:notificationId/read', notificationController.markAsRead);
router.patch('/mark-all-read', notificationController.markAllAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);

// ===== ADMIN ROUTES =====
router.get('/admin/all', isAdmin, notificationController.getAllNotifications);
router.post('/admin/broadcast', isAdmin, notificationController.sendBroadcast);
router.delete('/admin/broadcast/bulk', isAdmin, notificationController.deleteBroadcast); // ✅ NEW

module.exports = router;