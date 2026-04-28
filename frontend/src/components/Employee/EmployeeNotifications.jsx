import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeNavbar from './EmployeeNavbar';
import '../../styles/Employee.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const EmployeeNotifications = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('notifications');

  const [notifications, setNotifications] = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(true);
  const [notifsFilter, setNotifsFilter] = useState('all');

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [correctionRequests, setCorrectionRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsTab, setRequestsTab] = useState('leave');
  const [requestsFilter, setRequestsFilter] = useState('all');

  const getToken = () => localStorage.getItem('employee_token') || localStorage.getItem('token');

  const fetchNotifications = useCallback(async () => {
    try {
      setNotifsLoading(true);
      const res = await fetch(`${API}/notifications/my-notifications?limit=50`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      setNotifications(data.data?.notifications || data.notifications || []);
    } catch (err) {
      console.error('Notifications error:', err);
      setNotifications([]);
    } finally {
      setNotifsLoading(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      setRequestsLoading(true);
      const headers = { 'Authorization': `Bearer ${getToken()}` };

      const leaveRes = await fetch(`${API}/leave-requests/my-requests`, { headers });
      if (leaveRes.ok) {
        const d = await leaveRes.json();
        const requests = d.data?.leaveRequests || d.data?.requests || d.leaveRequests || d.requests || [];
        setLeaveRequests(requests);
      } else {
        setLeaveRequests([]);
      }

      try {
        const corrRes = await fetch(`${API}/correction-requests/my-requests`, { headers });
        if (corrRes.ok) {
          const d = await corrRes.json();
          const requests = d.data?.correctionRequests || d.data?.requests || d.correctionRequests || d.requests || [];
          setCorrectionRequests(requests);
        }
      } catch (e) { setCorrectionRequests([]); }

    } catch (err) {
      console.error('Requests error:', err);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchRequests();
  }, [fetchNotifications, fetchRequests]);

  const markAsRead = async (id) => {
    try {
      await fetch(`${API}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {}
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API}/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {}
  };

  // ✅ DELETE notification — removes from DB + bell icon
  const deleteNotif = async (e, id) => {
    e.stopPropagation();
    // Optimistic UI update — remove immediately
    setNotifications(prev => prev.filter(n => n._id !== id));
    try {
      await fetch(`${API}/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
    } catch (err) {
      console.error('Delete notif error:', err);
      // Already removed from UI, no need to revert
    }
  };

  const getTimeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const getNotifIcon = (type) => {
    if (!type) return '🔔';
    if (type.includes('leave')) return '🏖️';
    if (type.includes('attendance')) return '✅';
    if (type.includes('broadcast')) return '📢';
    if (type.includes('correction')) return '⚠️';
    return '🔔';
  };

  const getStatusStyle = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'approved': return { bg: 'rgba(16,185,129,0.1)', color: '#059669', border: 'rgba(16,185,129,0.3)', label: '✅ Approved' };
      case 'rejected': return { bg: 'rgba(239,68,68,0.1)', color: '#dc2626', border: 'rgba(239,68,68,0.3)', label: '❌ Rejected' };
      case 'pending':  return { bg: 'rgba(245,158,11,0.1)', color: '#d97706', border: 'rgba(245,158,11,0.3)', label: '⏳ Pending' };
      case 'cancelled':return { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb', label: '🚫 Cancelled' };
      default:         return { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb', label: status || 'Unknown' };
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const filteredNotifs = notifsFilter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;

  const filteredLeave = requestsFilter === 'all'
    ? leaveRequests
    : leaveRequests.filter(r => (r.status || '').toLowerCase() === requestsFilter);

  const filteredCorrection = requestsFilter === 'all'
    ? correctionRequests
    : correctionRequests.filter(r => (r.status || '').toLowerCase() === requestsFilter);

  return (
    <div className="employee-container">
      <EmployeeNavbar />
      <div style={S.content}>

        {/* Header */}
        <div style={S.pageHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>🔔</span>
            <div>
              <h1 style={S.pageTitle}>All Notifications</h1>
              <p style={S.pageSub}>Your notifications and requests in one place</p>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <div style={S.mainTabs}>
          <button style={{ ...S.mainTab, ...(activeTab === 'notifications' ? S.mainTabActive : {}) }} onClick={() => setActiveTab('notifications')}>
            🔔 My Notifications {unreadCount > 0 && <span style={S.tabBadge}>{unreadCount}</span>}
          </button>
          <button style={{ ...S.mainTab, ...(activeTab === 'requests' ? S.mainTabActive : {}) }} onClick={() => setActiveTab('requests')}>
            📋 My Requests {leaveRequests.length > 0 && <span style={S.tabBadge}>{leaveRequests.length}</span>}
          </button>
        </div>

        {/* TAB 1: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div style={S.tabContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {['all', 'unread'].map(f => (
                  <button key={f} onClick={() => setNotifsFilter(f)} style={{ ...S.filterPill, background: notifsFilter === f ? '#667eea' : 'white', color: notifsFilter === f ? 'white' : '#6b7280' }}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}{f === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
                  </button>
                ))}
              </div>
              {unreadCount > 0 && <button style={S.markAllBtn} onClick={markAllRead}>✓ Mark all as read</button>}
            </div>

            {notifsLoading ? (
              <div style={S.centerBox}><div style={S.spinner}></div></div>
            ) : filteredNotifs.length === 0 ? (
              <div style={S.emptyBox}>
                <div style={{ fontSize: 64, opacity: 0.3, marginBottom: 16 }}>📭</div>
                <h3 style={{ color: '#374151', margin: '0 0 8px' }}>No notifications</h3>
                <p style={{ color: '#9ca3af', margin: 0, fontSize: 14 }}>{notifsFilter === 'unread' ? 'No unread notifications' : 'You have no notifications yet'}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredNotifs.map(notif => (
                  <div key={notif._id}
                    onClick={() => { if (!notif.isRead) markAsRead(notif._id); }}
                    style={{ ...S.notifCard, background: notif.isRead ? 'white' : '#f0f4ff', borderLeft: `4px solid ${notif.isRead ? '#e5e7eb' : '#667eea'}`, cursor: 'pointer', position: 'relative' }}>

                    <div style={S.notifIconBox}>{getNotifIcon(notif.type)}</div>

                    <div style={{ flex: 1, paddingRight: 28 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={S.notifTitle}>{notif.title || 'Notification'}</div>
                        {!notif.isRead && <span style={S.unreadPill}>New</span>}
                      </div>
                      {notif.message && <div style={S.notifMsg}>{notif.message}</div>}
                      <div style={S.notifTime}>{getTimeAgo(notif.createdAt)}</div>
                    </div>

                    {/* ✅ × Remove button */}
                    <button
                      onClick={(e) => deleteNotif(e, notif._id)}
                      title="Remove notification"
                      style={S.deleteBtn}
                    >×</button>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY REQUESTS */}
        {activeTab === 'requests' && (
          <div style={S.tabContent}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { key: 'leave', label: '🏖️ Leave Requests', count: leaveRequests.length },
                  { key: 'correction', label: '⚠️ Correction Requests', count: correctionRequests.length }
                ].map(({ key, label, count }) => (
                  <button key={key} onClick={() => setRequestsTab(key)} style={{
                    ...S.reqTypeBtn,
                    background: requestsTab === key ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'white',
                    color: requestsTab === key ? 'white' : '#6b7280',
                    border: requestsTab === key ? 'none' : '2px solid #e5e7eb',
                  }}>
                    {label}
                    {count > 0 && <span style={{ ...S.tabBadge, background: requestsTab === key ? 'rgba(255,255,255,0.3)' : '#667eea', color: 'white' }}>{count}</span>}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={S.actionBtn} onClick={() => navigate('/employee/request-leave')}>🏖️ Request Leave</button>
                <button style={{ ...S.actionBtn, background: '#f59e0b' }} onClick={() => navigate('/employee/report-issue')}>⚠️ Report Issue</button>
              </div>
            </div>

            {/* Status filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {['all', 'pending', 'approved', 'rejected'].map(f => (
                <button key={f} onClick={() => setRequestsFilter(f)} style={{
                  ...S.filterPill,
                  background: requestsFilter === f ? (f === 'approved' ? '#10b981' : f === 'rejected' ? '#ef4444' : f === 'pending' ? '#f59e0b' : '#667eea') : 'white',
                  color: requestsFilter === f ? 'white' : '#6b7280',
                }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f !== 'all' && (
                    <span style={{ marginLeft: 4, opacity: 0.8 }}>
                      ({leaveRequests.filter(r => (r.status || '').toLowerCase() === f).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Leave Requests List */}
            {requestsTab === 'leave' && (
              requestsLoading ? (
                <div style={S.centerBox}><div style={S.spinner}></div></div>
              ) : filteredLeave.length === 0 ? (
                <div style={S.emptyBox}>
                  <div style={{ fontSize: 64, opacity: 0.3, marginBottom: 16 }}>📭</div>
                  <h3 style={{ color: '#374151', margin: '0 0 8px' }}>
                    {requestsFilter === 'all' ? 'No leave requests found' : `No ${requestsFilter} requests`}
                  </h3>
                  <p style={{ color: '#9ca3af', margin: '0 0 20px', fontSize: 14 }}>
                    {requestsFilter === 'all' ? "You haven't submitted any leave requests yet" : `No requests with status: ${requestsFilter}`}
                  </p>
                  {requestsFilter === 'all' && (
                    <button style={S.actionBtn} onClick={() => navigate('/employee/request-leave')}>Request Leave Now</button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredLeave.map(req => {
                    const st = getStatusStyle(req.status);
                    const fromDate = req.fromDate || req.startDate;
                    const toDate = req.toDate || req.endDate;
                    return (
                      <div key={req._id} style={S.reqCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={S.reqTitle}>🏖️ {req.leaveType || 'Leave'} Request</div>
                            <div style={S.reqDate}>
                              📅 {fromDate ? new Date(fromDate).toLocaleDateString('en-GB') : '—'}
                              {toDate && toDate !== fromDate && ` → ${new Date(toDate).toLocaleDateString('en-GB')}`}
                              {req.numberOfDays && <span style={{ marginLeft: 8, color: '#9ca3af' }}>({req.numberOfDays} day{req.numberOfDays > 1 ? 's' : ''})</span>}
                            </div>
                            {req.reason && <div style={S.reqReason}>📝 {req.reason}</div>}
                          </div>
                          <span style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}`, whiteSpace: 'nowrap' }}>
                            {st.label}
                          </span>
                        </div>
                        {req.status === 'rejected' && req.rejectionReason && (
                          <div style={{ ...S.adminComment, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
                            <strong>❌ Rejection Reason:</strong> {req.rejectionReason}
                          </div>
                        )}
                        {req.adminComment && (
                          <div style={S.adminComment}>
                            <strong>💬 Admin Note:</strong> {req.adminComment}
                          </div>
                        )}
                        <div style={S.reqFooter}>
                          Submitted {getTimeAgo(req.createdAt)}
                          {req.approverName && <span style={{ marginLeft: 12, color: '#667eea' }}>• By {req.approverName}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* Correction Requests List */}
            {requestsTab === 'correction' && (
              requestsLoading ? (
                <div style={S.centerBox}><div style={S.spinner}></div></div>
              ) : filteredCorrection.length === 0 ? (
                <div style={S.emptyBox}>
                  <div style={{ fontSize: 64, opacity: 0.3, marginBottom: 16 }}>📭</div>
                  <h3 style={{ color: '#374151', margin: '0 0 8px' }}>No correction requests</h3>
                  <p style={{ color: '#9ca3af', margin: '0 0 20px', fontSize: 14 }}>You haven't submitted any correction requests yet</p>
                  <button style={{ ...S.actionBtn, background: '#f59e0b' }} onClick={() => navigate('/employee/report-issue')}>Report an Issue</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredCorrection.map(req => {
                    const st = getStatusStyle(req.status);
                    return (
                      <div key={req._id} style={S.reqCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={S.reqTitle}>⚠️ {req.issueType || 'Correction'} Request</div>
                            {req.date && <div style={S.reqDate}>📅 {new Date(req.date).toLocaleDateString('en-GB')}</div>}
                            {req.description && <div style={S.reqReason}>📝 {req.description}</div>}
                          </div>
                          <span style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}`, whiteSpace: 'nowrap' }}>
                            {st.label}
                          </span>
                        </div>
                        {req.status === 'rejected' && req.rejectionReason && (
                          <div style={{ ...S.adminComment, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
                            <strong>❌ Rejection Reason:</strong> {req.rejectionReason}
                          </div>
                        )}
                        {req.adminComment && <div style={S.adminComment}><strong>💬 Admin Note:</strong> {req.adminComment}</div>}
                        <div style={S.reqFooter}>Submitted {getTimeAgo(req.createdAt)}</div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

const S = {
  content:      { padding: 24, background: '#f9fafb', minHeight: 'calc(100vh - 80px)', maxWidth: 900, margin: '0 auto' },
  pageHeader:   { background: 'white', borderRadius: 16, padding: '20px 28px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  pageTitle:    { fontSize: 26, fontWeight: 700, background: 'linear-gradient(135deg,#667eea,#764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 0 4px 0' },
  pageSub:      { fontSize: 14, color: '#6b7280', margin: 0 },
  mainTabs:     { display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 0, background: 'white', borderRadius: '16px 16px 0 0', padding: '0 4px' },
  mainTab:      { padding: '16px 24px', background: 'none', border: 'none', fontSize: 14, fontWeight: 600, color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '2px solid transparent', marginBottom: -2 },
  mainTabActive:{ color: '#667eea', borderBottomColor: '#667eea' },
  tabBadge:     { background: '#667eea', color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10 },
  tabContent:   { background: 'white', borderRadius: '0 0 16px 16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 24 },
  filterPill:   { padding: '6px 16px', border: '1px solid #e5e7eb', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  markAllBtn:   { padding: '8px 16px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  centerBox:    { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' },
  spinner:      { width: 40, height: 40, border: '3px solid #f3f3f3', borderTop: '3px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  emptyBox:     { textAlign: 'center', padding: '60px 20px' },
  notifCard:    { display: 'flex', gap: 14, padding: '16px 20px', borderRadius: 12, border: '1px solid #f3f4f6', transition: 'all 0.2s' },
  notifIconBox: { width: 44, height: 44, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 },
  notifTitle:   { fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 },
  notifMsg:     { fontSize: 13, color: '#6b7280', marginBottom: 4, lineHeight: 1.5 },
  notifTime:    { fontSize: 12, color: '#9ca3af' },
  unreadPill:   { background: '#667eea', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, flexShrink: 0 },
  // ✅ × delete button style
  deleteBtn:    { position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: '50%', background: '#f3f4f6', color: '#9ca3af', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0, transition: 'all 0.2s' },
  reqTypeBtn:   { padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
  actionBtn:    { padding: '10px 20px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  reqCard:      { background: '#f9fafb', borderRadius: 12, padding: '18px 20px', border: '1px solid #e5e7eb' },
  reqTitle:     { fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 },
  reqDate:      { fontSize: 13, color: '#667eea', fontWeight: 600, marginBottom: 4 },
  reqReason:    { fontSize: 13, color: '#6b7280', marginTop: 4 },
  adminComment: { marginTop: 12, padding: '10px 14px', background: '#fffbeb', borderRadius: 8, fontSize: 13, color: '#92400e', border: '1px solid #fde68a' },
  reqFooter:    { marginTop: 12, fontSize: 12, color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: 10 },
};

export default EmployeeNotifications;