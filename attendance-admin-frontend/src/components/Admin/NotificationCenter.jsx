import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} from '../../services/notificationService';
import { 
  approveLeaveRequest, 
  rejectLeaveRequest 
} from '../../services/leaveRequestService';
import { useNavigate } from 'react-router-dom';
import '../../styles/NotificationStyles.css';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { 
    notifications, 
    unreadCount, 
    loading, 
    fetchNotifications, 
    refreshNotifications 
  } = useNotifications();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(20, showUnreadOnly);
    }
  }, [isOpen, showUnreadOnly]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await markAsRead(notification._id);
        await refreshNotifications();
      }

      if (notification.link) {
        navigate(notification.link);
      }

      setIsOpen(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      await refreshNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
      await refreshNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // ===== QUICK ACTIONS =====
  const handleQuickApprove = async (e, notification) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to approve this leave request?')) {
      return;
    }

    setActionLoading(notification._id);
    try {
      const leaveRequestId = notification.metadata?.leaveRequestId;
      
      if (!leaveRequestId) {
        alert('Leave request ID not found');
        return;
      }

      // ✅ Step 1: Approve leave request
      const response = await approveLeaveRequest(leaveRequestId);
      
      if (response.success) {
        // ✅ Step 2: Notification ko database se delete karo
        try {
          await deleteNotification(notification._id);
        } catch (delErr) {
          console.error('⚠️ Could not delete notification:', delErr);
        }

        // ✅ Step 3: Bell refresh karo taake notification hat jaye
        await refreshNotifications();
        
        alert('✅ Leave request approved successfully!');
      }
    } catch (error) {
      alert(error.message || 'Failed to approve leave request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleQuickReject = async (e, notification) => {
    e.stopPropagation();
    
    const reason = prompt('Please enter rejection reason:');
    if (!reason || !reason.trim()) {
      return;
    }

    setActionLoading(notification._id);
    try {
      const leaveRequestId = notification.metadata?.leaveRequestId;
      
      if (!leaveRequestId) {
        alert('Leave request ID not found');
        return;
      }

      // ✅ Step 1: Reject leave request
      const response = await rejectLeaveRequest(leaveRequestId, reason);
      
      if (response.success) {
        // ✅ Step 2: Notification ko database se delete karo
        try {
          await deleteNotification(notification._id);
        } catch (delErr) {
          console.error('⚠️ Could not delete notification:', delErr);
        }

        // ✅ Step 3: Bell refresh karo taake notification hat jaye
        await refreshNotifications();

        alert('❌ Leave request rejected');
      }
    } catch (error) {
      alert(error.message || 'Failed to reject leave request');
    } finally {
      setActionLoading(null);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      leave_request: '🏖️',
      leave_approved: '✅',
      leave_rejected: '❌',
      correction_request: '⚠️',
      correction_resolved: '✅',
      system_update: '📢',
      attendance_marked: '✓',
      warning: '⚡',
      announcement: '📣'
    };
    return icons[type] || '🔔';
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, value] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / value);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }
    return 'Just now';
  };

  // ===== Check if notification has quick actions =====
  const hasQuickActions = (notification) => {
    // ✅ Sirf pending leave/correction requests par buttons dikhao
    return (notification.type === 'leave_request' || 
            notification.type === 'correction_request') &&
            !notification.isProcessed; // processed ho to buttons mat dikhao
  };

  return (
    <div className="notification-center" ref={dropdownRef}>
      <button 
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              <button
                className="filter-btn"
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              >
                {showUnreadOnly ? 'All' : 'Unread'}
              </button>
              {unreadCount > 0 && (
                <button
                  className="mark-all-btn"
                  onClick={handleMarkAllRead}
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <span className="empty-icon">📭</span>
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="notification-time">
                      {getTimeAgo(notification.createdAt)}
                    </span>
                    
                    {/* ===== QUICK ACTIONS ===== */}
                    {hasQuickActions(notification) && (
                      <div className="notification-quick-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="quick-action-btn approve"
                          onClick={(e) => handleQuickApprove(e, notification)}
                          disabled={actionLoading === notification._id}
                        >
                          {actionLoading === notification._id ? '⏳' : '✅'} Approve
                        </button>
                        <button
                          className="quick-action-btn reject"
                          onClick={(e) => handleQuickReject(e, notification)}
                          disabled={actionLoading === notification._id}
                        >
                          {actionLoading === notification._id ? '⏳' : '❌'} Reject
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    className="notification-delete"
                    onClick={(e) => handleDelete(e, notification._id)}
                    aria-label="Delete notification"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="notification-footer">
            <button
              className="view-all-btn"
              onClick={() => {
                navigate('/admin/notifications');
                setIsOpen(false);
              }}
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;