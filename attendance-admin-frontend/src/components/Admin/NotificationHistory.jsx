import React, { useState, useEffect } from 'react';
import { getAllNotifications, sendBroadcast } from '../../services/notificationService';
import './../../styles/NotificationStyles.css';

const NotificationHistory = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({ type: null, isRead: null });
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastData, setBroadcastData] = useState({
    updateType: '',
    updateDetails: '',
    affectedUsers: 'all'
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await getAllNotifications(
        currentPage,
        50,
        filter.type,
        filter.isRead
      );
      if (response.success) {
        setNotifications(response.data.notifications);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastData.updateType || !broadcastData.updateDetails) {
      alert('Please fill in all broadcast fields');
      return;
    }

    setSending(true);
    try {
      const response = await sendBroadcast(
        broadcastData.updateType,
        broadcastData.updateDetails,
        broadcastData.affectedUsers
      );
      if (response.success) {
        alert(`Broadcast sent to ${response.data.count} users`);
        setBroadcastData({ updateType: '', updateDetails: '', affectedUsers: 'all' });
        setShowBroadcastModal(false);
        fetchNotifications();
      }
    } catch (error) {
      alert(error.message || 'Failed to send broadcast');
    } finally {
      setSending(false);
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

  return (
    <div className="notification-history-container">
      <div className="page-header">
        <h1>🔔 Notification History</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowBroadcastModal(true)}
        >
          📢 Send Broadcast
        </button>
      </div>

      <div className="filter-section">
        <div className="filter-group">
          <label>Type:</label>
          <select
            value={filter.type || ''}
            onChange={(e) => setFilter({ ...filter, type: e.target.value || null })}
          >
            <option value="">All Types</option>
            <option value="leave_request">Leave Requests</option>
            <option value="leave_approved">Leave Approved</option>
            <option value="leave_rejected">Leave Rejected</option>
            <option value="correction_request">Correction Requests</option>
            <option value="correction_resolved">Correction Resolved</option>
            <option value="system_update">System Updates</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filter.isRead === null ? '' : filter.isRead}
            onChange={(e) => setFilter({ 
              ...filter, 
              isRead: e.target.value === '' ? null : e.target.value === 'true' 
            })}
          >
            <option value="">All</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <h3>No notifications found</h3>
        </div>
      ) : (
        <>
          <div className="notifications-table">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Recipient</th>
                  <th>Title</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Email Sent</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notification) => (
                  <tr key={notification._id} className={!notification.isRead ? 'unread' : ''}>
                    <td>
                      <span className="notification-type-icon">
                        {getNotificationIcon(notification.type)}
                      </span>
                    </td>
                    <td>
                      <div className="recipient-info">
                        <span className="recipient-name">
                          {notification.recipient?.name || 'N/A'}
                        </span>
                        <span className="recipient-model">{notification.recipientModel}</span>
                      </div>
                    </td>
                    <td className="notification-title">{notification.title}</td>
                    <td className="notification-message">{notification.message}</td>
                    <td>
                      <span className={`read-badge ${notification.isRead ? 'read' : 'unread'}`}>
                        {notification.isRead ? 'Read' : 'Unread'}
                      </span>
                    </td>
                    <td>
                      <span className={`email-badge ${notification.emailSent ? 'sent' : 'not-sent'}`}>
                        {notification.emailSent ? '✅' : '❌'}
                      </span>
                    </td>
                    <td className="notification-time">
                      {getTimeAgo(notification.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="modal-overlay" onClick={() => setShowBroadcastModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📢 Send Broadcast Notification</h2>
              <button className="modal-close" onClick={() => setShowBroadcastModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Update Type *</label>
                <input
                  type="text"
                  value={broadcastData.updateType}
                  onChange={(e) => setBroadcastData({ ...broadcastData, updateType: e.target.value })}
                  placeholder="e.g., Working Hours Change, Holiday Announcement"
                  required
                />
              </div>

              <div className="form-group">
                <label>Update Details *</label>
                <textarea
                  value={broadcastData.updateDetails}
                  onChange={(e) => setBroadcastData({ ...broadcastData, updateDetails: e.target.value })}
                  placeholder="Enter detailed message..."
                  rows="5"
                  required
                />
              </div>

              <div className="form-group">
                <label>Send To</label>
                <select
                  value={broadcastData.affectedUsers}
                  onChange={(e) => setBroadcastData({ ...broadcastData, affectedUsers: e.target.value })}
                >
                  <option value="all">All Users</option>
                  <option value="employee">Employees Only</option>
                  <option value="manager">Managers Only</option>
                  <option value="admin">Admins Only</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleSendBroadcast}
                  disabled={sending || !broadcastData.updateType || !broadcastData.updateDetails}
                >
                  {sending ? 'Sending...' : '📢 Send Broadcast'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowBroadcastModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationHistory;