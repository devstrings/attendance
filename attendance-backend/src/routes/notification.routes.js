const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize, isAdmin } = require('../middleware/role.middleware'); // ✅ CHANGED

// ==================== USER NOTIFICATIONS ====================

// Get my notifications (All authenticated users)
router.get('/my-notifications', 
  authenticate, 
  notificationController.getMyNotifications
);

// Get unread count (All authenticated users)
router.get('/unread-count', 
  authenticate, 
  notificationController.getUnreadCount
);

// Get notification by ID (All authenticated users)
router.get('/:notificationId', 
  authenticate, 
  notificationController.getNotificationById
);

// Mark notification as read (All authenticated users)
router.patch('/:notificationId/read', 
  authenticate, 
  notificationController.markAsRead
);

// Mark all notifications as read (All authenticated users)
router.patch('/mark-all-read', 
  authenticate, 
  notificationController.markAllAsRead
);

// Delete notification (All authenticated users)
router.delete('/:notificationId', 
  authenticate, 
  notificationController.deleteNotification
);

// ==================== ADMIN NOTIFICATIONS ====================

// Get all notifications (Admin only)
router.get('/admin/all', 
  authenticate, 
  authorize('admin'), // ✅ CHANGED: Use authorize instead of authorizeRoles
  notificationController.getAllNotifications
);

// Send broadcast notification (Admin only)
router.post('/admin/broadcast', 
  authenticate, 
  authorize('admin'), // ✅ CHANGED: Use authorize instead of authorizeRoles
  notificationController.sendBroadcast
);

module.exports = router;