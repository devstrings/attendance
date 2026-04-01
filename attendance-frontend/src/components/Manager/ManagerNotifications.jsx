import React, { useState, useEffect } from 'react';
import ManagerNavbar from './ManagerNavbar';
import ManagerSidebar from './ManagerSidebar';
import '../../styles/Manager.css';

const ManagerNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState(null); // Track which notification is being deleted
  const [selectedNotif, setSelectedNotif] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('manager_token') || localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/notifications/my-notifications?limit=50`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Manager notifications:', data);
        setNotifications(data.data?.notifications || data.notifications || []);
      } else {
        console.error('❌ Fetch failed:', res.status);
        setNotifications([]);
      }
    } catch (err) {
      console.error('❌ Notifications error:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('manager_token') || localStorage.getItem('token');
      
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) { 
      console.error('❌ Mark as read error:', err); 
    }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('manager_token') || localStorage.getItem('token');
      
      await fetch(`${API_URL}/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) { 
      console.error('❌ Mark all read error:', err); 
    }
  };

  // ✅ NEW: Delete notification function
  const deleteNotification = async (id, e) => {
    e.stopPropagation(); // Prevent marking as read when clicking delete
    
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      setDeleting(id);
      const token = localStorage.getItem('manager_token') || localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        // Remove notification from state
        setNotifications(prev => prev.filter(n => n._id !== id));
        console.log('✅ Notification deleted');
      } else {
        console.error('❌ Delete failed:', res.status);
        alert('Failed to delete notification');
      }
    } catch (err) {
      console.error('❌ Delete notification error:', err);
      alert('Failed to delete notification');
    } finally {
      setDeleting(null);
    }
  };

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

  const getNotifIcon = (type) => {
    if (!type) return '🔔';
    if (type.includes('leave'))       return '🏖️';
    if (type.includes('attendance'))  return '✅';
    if (type.includes('broadcast') || type.includes('announce')) return '📢';
    if (type.includes('correction'))  return '⚠️';
    if (type.includes('approve'))     return '✅';
    if (type.includes('reject'))      return '❌';
    return '🔔';
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const displayed = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;


    // Modal
if (selectedNotif) {
  return (
    <div className="manager-container">
      <ManagerNavbar />
      <div className="manager-layout">
        <ManagerSidebar />
      </div>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        onClick={() => setSelectedNotif(null)}
      >
        <div
          style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                {getNotifIcon(selectedNotif.type)}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>Notification Detail</div>
            </div>
            <button
              onClick={() => setSelectedNotif(null)}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: 20, width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >✕</button>
          </div>
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 12 }}>{selectedNotif.title}</div>
            {selectedNotif.message && (
              <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, background: '#f9fafb', padding: '14px 16px', borderRadius: 10, border: '1px solid #e5e7eb', marginBottom: 16 }}>
                {selectedNotif.message}
              </div>
            )}
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>🕐 {getTimeAgo(selectedNotif.createdAt)}</div>
            <div style={{ marginBottom: 20 }}>
              <span style={{ padding: '4px 12px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280', fontSize: 12, fontWeight: 600 }}>✓ Read</span>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={async (e) => { await deleteNotification(selectedNotif._id, e); setSelectedNotif(null); }}
                style={{ padding: '10px 20px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >🗑️ Delete</button>
              <button
                onClick={() => setSelectedNotif(null)}
                style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="manager-container">
      <ManagerNavbar />
      <div className="manager-layout">
        <ManagerSidebar />
        <div className="manager-content" style={S.content}>

          {/* ── Page Header ── */}
          <div style={S.pageHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28 }}>🔔</span>
              <div>
                <h1 style={S.pageTitle}>All Notifications</h1>
                <p style={S.pageSub}>Admin updates, announcements, and your request status</p>
              </div>
            </div>
            {unreadCount > 0 && (
              <div style={S.unreadBadge}>{unreadCount} unread</div>
            )}
          </div>

          {/* ── Filter Bar ── */}
          <div style={S.filterBar}>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { key: 'all',    label: `All (${notifications.length})` },
                { key: 'unread', label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    ...S.filterPill,
                    background: filter === f.key ? '#667eea' : 'white',
                    color: filter === f.key ? 'white' : '#6b7280',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <button style={S.markAllBtn} onClick={markAllRead}>
                ✓ Mark all as read
              </button>
            )}
          </div>

          {/* ── Notifications List ── */}
          <div style={S.listCard}>
            {loading ? (
              <div style={S.centerBox}>
                <div style={S.spinner}></div>
                <p style={{ color: '#6b7280', marginTop: 12 }}>Loading notifications...</p>
              </div>
            ) : displayed.length === 0 ? (
              <div style={S.emptyBox}>
                <div style={{ fontSize: 72, opacity: 0.25, marginBottom: 16 }}>📭</div>
                <h3 style={{ color: '#374151', margin: '0 0 8px', fontSize: 18 }}>
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </h3>
                <p style={{ color: '#9ca3af', margin: 0, fontSize: 14 }}>
                  {filter === 'unread'
                    ? 'All caught up! Switch to "All" to see previous notifications.'
                    : 'Admin announcements, leave updates, and alerts will appear here.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {displayed.map(notif => (
                  <div
                    key={notif._id}
                    onClick={async () => { 
  if (!notif.isRead) await markAsRead(notif._id); 
  setSelectedNotif({ ...notif, isRead: true });
}}
                    style={{
                      ...S.notifCard,
                      background: notif.isRead ? 'white' : '#f0f4ff',
                      borderLeft: `4px solid ${notif.isRead ? '#e5e7eb' : '#667eea'}`,
                      cursor: notif.isRead ? 'default' : 'pointer',
                    }}
                    onMouseEnter={e => { if (notif.isRead) e.currentTarget.style.background = '#f9fafb'; }}
                    onMouseLeave={e => { if (notif.isRead) e.currentTarget.style.background = 'white'; }}
                  >
                    <div style={S.iconBox}>{getNotifIcon(notif.type)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                        <div style={S.notifTitle}>{notif.title || 'Notification'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          {!notif.isRead && <span style={S.newPill}>New</span>}
                          <span style={S.timeText}>{getTimeAgo(notif.createdAt)}</span>
                        </div>
                      </div>
                      {notif.message && (
                        <div style={S.notifMsg}>{notif.message}</div>
                      )}
                    </div>

                    {/* ✅ NEW: Delete Button */}
                    <button
                      onClick={(e) => deleteNotification(notif._id, e)}
                      disabled={deleting === notif._id}
                      style={{
                        ...S.deleteBtn,
                        opacity: deleting === notif._id ? 0.5 : 1,
                        cursor: deleting === notif._id ? 'not-allowed' : 'pointer'
                      }}
                      title="Delete notification"
                    >
                      {deleting === notif._id ? '...' : '×'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

const S = {
  content:    { padding: 24, background: '#f9fafb', minHeight: 'calc(100vh - 80px)' },
  pageHeader: { background: 'white', borderRadius: 16, padding: '20px 28px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  pageTitle:  { fontSize: 26, fontWeight: 700, background: 'linear-gradient(135deg,#667eea,#764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 0 4px 0' },
  pageSub:    { fontSize: 14, color: '#6b7280', margin: 0 },
  unreadBadge:{ padding: '6px 16px', background: 'rgba(102,126,234,0.1)', color: '#667eea', borderRadius: 20, fontSize: 13, fontWeight: 700, border: '1px solid rgba(102,126,234,0.2)' },
  filterBar:  { background: 'white', borderRadius: 12, padding: '14px 20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  filterPill: { padding: '7px 18px', border: '1px solid #e5e7eb', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  markAllBtn: { padding: '8px 18px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  listCard:   { background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', minHeight: 300 },
  centerBox:  { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' },
  spinner:    { width: 40, height: 40, border: '3px solid #f3f3f3', borderTop: '3px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  emptyBox:   { textAlign: 'center', padding: '60px 20px' },
  notifCard:  { display: 'flex', gap: 14, padding: '16px 18px', borderRadius: 12, border: '1px solid #f3f4f6', transition: 'background 0.2s', position: 'relative' },
  iconBox:    { width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#ede9fe,#ddd6fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 },
  notifTitle: { fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 },
  notifMsg:   { fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginTop: 2 },
  newPill:    { background: '#667eea', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 },
  timeText:   { fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' },
  
  // ✅ NEW: Delete button styles
  deleteBtn:  { 
    width: 28, 
    height: 28, 
    borderRadius: '50%', 
    background: '#fee2e2', 
    border: '1px solid #fecaca', 
    color: '#dc2626', 
    fontSize: 20, 
    fontWeight: 700, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    flexShrink: 0, 
    transition: 'all 0.2s',
    lineHeight: 1,
    padding: 0,
    cursor: 'pointer'
  },
};

export default ManagerNotifications;