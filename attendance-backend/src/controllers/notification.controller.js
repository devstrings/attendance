const notificationService = require('../utils/notificationService');
const Notification = require('../models/Notification');

// Get user's notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const userModel = req.user.role === 'admin' ? 'Admin' : 
                      req.user.role === 'manager' ? 'Manager' : 'Employee';
    
    const { limit = 20, unreadOnly = false } = req.query;

    const result = await notificationService.getUserNotifications(
      userId, 
      userModel, 
      parseInt(limit), 
      unreadOnly === 'true'
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: {
        notifications: result.notifications,
        unreadCount: result.unreadCount,
        total: result.notifications.length
      }
    });

  } catch (error) {
    console.error('❌ Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const userModel = req.user.role === 'admin' ? 'Admin' : 
                      req.user.role === 'manager' ? 'Manager' : 'Employee';

    const count = await Notification.getUnreadCount(userId, userModel);

    res.status(200).json({
      success: true,
      data: { unreadCount: count }
    });

  } catch (error) {
    console.error('❌ Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const result = await notificationService.markAsRead(notificationId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message || 'Failed to mark as read'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: result.notification
    });

  } catch (error) {
    console.error('❌ Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const userModel = req.user.role === 'admin' ? 'Admin' : 
                      req.user.role === 'manager' ? 'Manager' : 'Employee';

    const result = await notificationService.markAllAsRead(userId, userModel);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to mark all as read'
      });
    }

    res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('❌ Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const result = await notificationService.deleteNotification(notificationId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete notification'
      });
    }

    res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('❌ Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

// Get notification by ID
exports.getNotificationById = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Auto mark as read when viewed
    if (!notification.isRead) {
      await notification.markAsRead();
    }

    res.status(200).json({
      success: true,
      data: notification
    });

  } catch (error) {
    console.error('❌ Get notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification',
      error: error.message
    });
  }
};

// Admin: Send broadcast notification
exports.sendBroadcast = async (req, res) => {
  try {
    const { updateType, updateDetails, affectedUsers } = req.body;

    if (!updateType || !updateDetails) {
      return res.status(400).json({
        success: false,
        message: 'Update type and details are required'
      });
    }

    const result = await notificationService.notifySystemUpdate(
      updateType, 
      updateDetails, 
      affectedUsers || 'all'
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send broadcast',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: { count: result.count }
    });

  } catch (error) {
    console.error('❌ Send broadcast error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send broadcast notification',
      error: error.message
    });
  }
};

// Get all notifications (Admin only)
exports.getAllNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, isRead } = req.query;

    const query = {};
    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead === 'true';

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('recipient', 'name email')
      .populate('sender', 'name email');

    const total = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalNotifications: total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all notifications',
      error: error.message
    });
  }
};