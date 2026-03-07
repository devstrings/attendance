import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const NotificationCenter = ({ userType = 'employee' }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

  // ── Routes per userType ──
  const viewAllPath = userType === 'admin'
    ? '/admin/notifications'
    : userType === 'manager'
    ? '/manager/notifications'
    : '/employee/notifications';

  // ✅ FIXED: Correct API base URL
  const getApiBase = () => `${API_URL}/notifications`;

  // ✅ FIXED: Get correct token
  const getToken = () => {
    return localStorage.getItem(`${userType}_token`) || localStorage.getItem('token');
  };

  // ── Fetch notifications ──
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      if (!token) {
        console.error('❌ No token found for', userType);
        return;
      }

      const res = await fetch(`${getApiBase()}/my-notifications?limit=10`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        console.log('✅ Notifications fetched:', data);
        const notifs = data.data?.notifications || data.notifications || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.isRead).length);
      } else {
        console.error('❌ Fetch failed:', res.status, await res.text());
      }
    } catch (err) {
      console.error('❌ Notification fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Mark one as read ──
  const markAsRead = async (id) => {
    try {
      const token = getToken();
      const res = await fetch(`${getApiBase()}/${id}/read`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('❌ Mark read error:', err);
    }
  };

  // ── Mark all as read ──
  const markAllRead = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${getApiBase()}/mark-all-read`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('❌ Mark all read error:', err);
    }
  };

  // ── Close on outside click ──
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Auto fetch ──
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [userType]);

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen]);

  const displayed = showUnreadOnly
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const getTimeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getIcon = (type) => {
    if (!type) return '🔔';
    if (type.includes('leave'))       return '🏖️';
    if (type.includes('attendance'))  return '✅';
    if (type.includes('broadcast'))   return '📢';
    if (type.includes('correction'))  return '⚠️';
    return '🔔';
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>

      {/* ── Bell Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={S.bellBtn}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={S.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {isOpen && (
        <div style={S.dropdown}>

          {/* Header */}
          <div style={S.dropHeader}>
            <span style={S.dropTitle}>Notifications</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                style={{
                  ...S.filterBtn,
                  background: showUnreadOnly ? '#667eea' : 'white',
                  color: showUnreadOnly ? 'white' : '#6b7280',
                }}
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              >
                Unread
              </button>
              {unreadCount > 0 && (
                <button style={S.markAllBtn} onClick={markAllRead}>
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div style={S.listBox}>
            {loading ? (
              <div style={S.emptyBox}>
                <div style={S.spinner}></div>
              </div>
            ) : displayed.length === 0 ? (
              <div style={S.emptyBox}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>📭</div>
                <p style={{ color: '#9ca3af', fontSize: 14, margin: 0 }}>No notifications</p>
              </div>
            ) : displayed.map(notif => (
              <div
                key={notif._id}
                style={{
                  ...S.notifItem,
                  background: notif.isRead ? 'white' : '#f0f4ff',
                  borderLeft: notif.isRead ? '3px solid transparent' : '3px solid #667eea',
                }}
                onClick={() => {
                  if (!notif.isRead) markAsRead(notif._id);
                }}
              >
                <div style={S.notifIcon}>{getIcon(notif.type)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.notifTitle}>{notif.title || 'Notification'}</div>
                  {notif.message && (
                    <div style={S.notifMsg}>{notif.message}</div>
                  )}
                  <div style={S.notifTime}>{getTimeAgo(notif.createdAt)}</div>
                </div>
                {!notif.isRead && <div style={S.unreadDot}></div>}
              </div>
            ))}
          </div>

          {/* ── View All Button ── */}
          <button
            style={S.viewAllBtn}
            onClick={() => { setIsOpen(false); navigate(viewAllPath); }}
          >
            View All Notifications
          </button>

        </div>
      )}

      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

const S = {
  bellBtn: {
    position: 'relative', background: 'none', border: 'none',
    fontSize: 22, cursor: 'pointer', padding: '4px 8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    background: '#ef4444', color: 'white',
    fontSize: 10, fontWeight: 700,
    minWidth: 18, height: 18, borderRadius: 9,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 4px', lineHeight: 1,
    border: '2px solid white'
  },
  dropdown: {
    position: 'absolute', top: '100%', right: 0,
    width: 360, background: 'white',
    borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    border: '1px solid #e5e7eb', zIndex: 9999,
    overflow: 'hidden', marginTop: 8
  },
  dropHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid #f3f4f6'
  },
  dropTitle: { fontSize: 16, fontWeight: 700, color: '#111827' },
  filterBtn: {
    padding: '4px 12px', border: '1px solid #e5e7eb',
    borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer'
  },
  markAllBtn: {
    padding: '4px 12px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: 'white', border: 'none',
    borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer'
  },
  listBox: { maxHeight: 320, overflowY: 'auto' },
  emptyBox: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '40px 20px'
  },
  spinner: {
    width: 36, height: 36, border: '3px solid #f3f3f3',
    borderTop: '3px solid #667eea', borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  notifItem: {
    display: 'flex', alignItems: 'flex-start', gap: 12,
    padding: '14px 20px', cursor: 'pointer',
    borderBottom: '1px solid #f9fafb', transition: 'background 0.2s'
  },
  notifIcon: {
    fontSize: 20, flexShrink: 0,
    width: 36, height: 36, borderRadius: '50%',
    background: '#f3f4f6', display: 'flex',
    alignItems: 'center', justifyContent: 'center'
  },
  notifTitle: { fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 },
  notifMsg:   { fontSize: 12, color: '#6b7280', marginBottom: 4, lineHeight: 1.4,
    overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
  notifTime:  { fontSize: 11, color: '#9ca3af' },
  unreadDot:  {
    width: 8, height: 8, borderRadius: '50%',
    background: '#667eea', flexShrink: 0, marginTop: 4
  },
  viewAllBtn: {
    width: '100%', padding: '14px', background: '#f9fafb',
    color: '#374151', border: 'none', borderTop: '1px solid #f3f4f6',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    transition: 'background 0.2s'
  },
};

export default NotificationCenter;