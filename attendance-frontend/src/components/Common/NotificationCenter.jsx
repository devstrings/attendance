import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { markAsRead, markAllAsRead, deleteNotification } from '../../services/notificationService';
import { useNavigate } from 'react-router-dom';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
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

  // Close on outside click
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

  const getNotificationIcon = (type) => {
    const icons = {
      leave_request:      '🏖️',
      leave_approved:     '✅',
      leave_rejected:     '❌',
      correction_request: '⚠️',
      correction_resolved:'✅',
      system_update:      '📢',
      attendance_marked:  '✓',
      warning:            '⚡',
      announcement:       '📣'
    };
    return icons[type] || '🔔';
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = {
      year: 31536000, month: 2592000, week: 604800,
      day: 86400, hour: 3600, minute: 60
    };
    for (const [unit, value] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / value);
      if (interval >= 1) return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
    return 'Just now';
  };

  return (
    <div style={styles.wrapper} ref={dropdownRef}>
      {/* ===== BELL BUTTON ===== */}
      <button
        style={styles.bellBtn}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <span style={styles.bellIcon}>🔔</span>
        {unreadCount > 0 && (
          <span style={styles.badge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ===== DROPDOWN ===== */}
      {isOpen && (
        <div style={styles.dropdown}>
          {/* Header */}
          <div style={styles.dropHeader}>
            <span style={styles.dropTitle}>Notifications</span>
            <div style={styles.dropActions}>
              <button
                style={styles.filterBtn}
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              >
                {showUnreadOnly ? 'All' : 'Unread'}
              </button>
              {unreadCount > 0 && (
                <button style={styles.markAllBtn} onClick={handleMarkAllRead}>
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={styles.list}>
            {loading ? (
              <div style={styles.center}>Loading...</div>
            ) : notifications.length === 0 ? (
              <div style={styles.empty}>
                <div style={styles.emptyIcon}>📭</div>
                <p style={styles.emptyText}>No notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  style={{
                    ...styles.item,
                    ...(n.isRead ? {} : styles.itemUnread)
                  }}
                  onClick={() => handleNotificationClick(n)}
                >
                  {/* Unread dot */}
                  {!n.isRead && <span style={styles.unreadDot} />}

                  <div style={styles.itemIcon}>{getNotificationIcon(n.type)}</div>

                  <div style={styles.itemBody}>
                    <div style={styles.itemTitle}>{n.title}</div>
                    <div style={styles.itemMsg}>{n.message}</div>
                    <div style={styles.itemTime}>{getTimeAgo(n.createdAt)}</div>
                  </div>

                  <button
                    style={styles.deleteBtn}
                    onClick={(e) => handleDelete(e, n._id)}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={styles.dropFooter}>
            <button
              style={styles.viewAllBtn}
              onClick={() => {
                navigate('/employee/my-requests');
                setIsOpen(false);
              }}
            >
              View My Requests
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== STYLES =====
const styles = {
  wrapper: {
    position: 'relative',
    display: 'inline-block'
  },
  bellBtn: {
    position: 'relative',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
  bellIcon: {
    fontSize: '22px',
    lineHeight: 1
  },
  badge: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    background: '#ef4444',
    color: 'white',
    fontSize: '10px',
    fontWeight: '700',
    borderRadius: '10px',
    minWidth: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
    lineHeight: 1,
    boxShadow: '0 0 0 2px white'
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: '0',
    width: '360px',
    maxHeight: '480px',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 20px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
    zIndex: 9999,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  dropHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #f3f4f6',
    background: '#fafafa'
  },
  dropTitle: {
    fontWeight: '700',
    fontSize: '15px',
    color: '#111827'
  },
  dropActions: {
    display: 'flex',
    gap: '8px'
  },
  filterBtn: {
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '600',
    border: '1px solid #d1d5db',
    borderRadius: '20px',
    background: 'white',
    cursor: 'pointer',
    color: '#374151',
    transition: 'all 0.2s'
  },
  markAllBtn: {
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '20px',
    background: '#667eea',
    cursor: 'pointer',
    color: 'white',
    transition: 'all 0.2s'
  },
  list: {
    overflowY: 'auto',
    flex: 1,
    maxHeight: '360px'
  },
  center: {
    padding: '40px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '14px'
  },
  empty: {
    padding: '40px 20px',
    textAlign: 'center'
  },
  emptyIcon: {
    fontSize: '40px',
    marginBottom: '8px'
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: '14px',
    margin: 0
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '14px 20px',
    cursor: 'pointer',
    borderBottom: '1px solid #f9fafb',
    transition: 'background 0.15s',
    position: 'relative',
    background: 'white',
  },
  itemUnread: {
    background: '#f0f4ff'
  },
  unreadDot: {
    position: 'absolute',
    left: '8px',
    top: '18px',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#667eea',
    flexShrink: 0
  },
  itemIcon: {
    fontSize: '22px',
    marginLeft: '4px',
    flexShrink: 0,
    lineHeight: 1.4
  },
  itemBody: {
    flex: 1,
    minWidth: 0
  },
  itemTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '3px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  itemMsg: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px',
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  itemTime: {
    fontSize: '11px',
    color: '#9ca3af',
    fontWeight: '500'
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#d1d5db',
    fontSize: '18px',
    lineHeight: 1,
    padding: '2px 4px',
    borderRadius: '4px',
    flexShrink: 0,
    transition: 'color 0.2s',
    fontWeight: '300'
  },
  dropFooter: {
    padding: '12px 20px',
    borderTop: '1px solid #f3f4f6',
    background: '#fafafa'
  },
  viewAllBtn: {
    width: '100%',
    padding: '10px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  }
};

export default NotificationCenter;