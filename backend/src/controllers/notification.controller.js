const Notification = require('../models/Notification');



// ===== Get my notifications =====
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20, unreadOnly = false } = req.query;

    console.log('📡 Fetching notifications for user:', userId);
    console.log('   Unread only:', unreadOnly); 

    const query = { recipient: userId };
    if (unreadOnly === 'true' || unreadOnly === true) {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    console.log(`✅ Found ${notifications.length} notifications`);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        count: notifications.length
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

// ===== Get unread count =====
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });

    console.log(`🔔 Unread notifications for ${userId}: ${count}`);

    res.status(200).json({
      success: true,
      data: {
        unreadCount: count
      }
    });

  } catch (error) {
    console.error('❌ Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
};

// ===== Mark as read =====
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
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

// ===== Mark all as read =====
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { 
        $set: { 
          isRead: true, 
          readAt: new Date() 
        } 
      }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('❌ Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read',
      error: error.message
    });
  }
};

// ===== Delete notification =====
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
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

// ===== Get all notifications (Admin only) =====
exports.getAllNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, isRead } = req.query;

    const query = {};
    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead === 'true';

    // ✅ NEW — company scoping (via recipient's companyId)
    if (req.companyId) {
      const User = require('../models/User');
      const companyUserIds = await User.find({ companyId: req.companyId }).distinct('_id');
      query.recipient = { $in: companyUserIds };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('recipient', 'email role name firstName lastName');

    const total = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// ===== Send broadcast (Admin only) =====
// ===== Send broadcast (Admin only) =====
exports.sendBroadcast = async (req, res) => {
  try {
    const { updateType, updateDetails, affectedUsers = 'all' } = req.body;

    if (!updateType || !updateDetails) {
      return res.status(400).json({
        success: false,
        message: 'Update type and details are required'
      });
    }

    const notificationService = require('../utils/notificationService');
    
    const count = await notificationService.sendAnnouncement(
      `📢 ${updateType}`,
      updateDetails,
      affectedUsers,
      req.companyId   // ✅ NEW — tenant scoping
    );

    res.status(200).json({
      success: true,
      message: 'Broadcast sent successfully',
      data: {
        count: count || 0
      }
    });

  } catch (error) {
    console.error('❌ Send broadcast error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send broadcast',
      error: error.message
    });
  }
};

// ===== Delete broadcast (Admin only) - deletes all notifications with given IDs =====
exports.deleteBroadcast = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Notification IDs required' });
    }

    const result = await Notification.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} notifications`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('❌ Delete broadcast error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete broadcast', error: error.message });
  }
};

module.exports = {
  getMyNotifications: exports.getMyNotifications,
  getUnreadCount: exports.getUnreadCount,
  markAsRead: exports.markAsRead,
  markAllAsRead: exports.markAllAsRead,
  deleteNotification: exports.deleteNotification,
  getAllNotifications: exports.getAllNotifications,
  sendBroadcast: exports.sendBroadcast,
  deleteBroadcast: exports.deleteBroadcast
};