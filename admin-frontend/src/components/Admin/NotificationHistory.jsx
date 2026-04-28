import React, { useState, useEffect } from 'react';
import { getAllNotifications, sendBroadcast, deleteBroadcast } from '../../services/notificationService';
import leaveRequestService from '../../services/leaveRequestService';
import correctionRequestService from '../../services/correctionRequestService';
import './../../styles/NotificationStyles.css';

const NotificationHistory = () => {
  // ===== TAB STATE =====
  const [activeTab, setActiveTab] = useState('requests');
  
  // ===== BROADCAST STATE =====
  const [broadcastGroups, setBroadcastGroups] = useState([]);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState(null);
  const [broadcastData, setBroadcastData] = useState({ updateType: '', updateDetails: '', affectedUsers: 'all' });
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // ===== REQUESTS STATE =====
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [correctionRequests, setCorrectionRequests] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null); // ✅ NEW: Track which request is processing

  useEffect(() => { fetchAllData(); }, []);

  // ✅ AUTO-REFRESH every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllData();
    }, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, []);

  // ===== FETCH ALL DATA =====
  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch broadcasts
      const response = await getAllNotifications(1, 500, 'announcement', null);
      if (response.success) {
        setBroadcastGroups(groupBroadcasts(response.data.notifications));
      }

      // ✅ Fetch leave requests (PENDING ONLY)
      try {
        console.log('🔍 Fetching leave requests...');
        const leaveRes = await leaveRequestService.getAllLeaveRequests('pending');
        console.log('✅ Leave Response:', leaveRes);
        
        if (leaveRes.success) {
          const requests = leaveRes.data?.leaveRequests || [];
          console.log('📋 Leave Requests:', requests);
          setLeaveRequests(Array.isArray(requests) ? requests : []);
        }
      } catch (err) {
        console.error('❌ Error fetching leave requests:', err);
      }

      // ✅ Fetch correction requests (PENDING ONLY)
      try {
        console.log('🔍 Fetching correction requests...');
        const correctionRes = await correctionRequestService.getAllCorrectionRequests('pending');
        console.log('✅ Correction Response:', correctionRes);
        
        if (correctionRes.success) {
          const requests = correctionRes.data?.correctionRequests || [];
          console.log('🔧 Correction Requests:', requests);
          setCorrectionRequests(Array.isArray(requests) ? requests : []);
        }
      } catch (err) {
        console.error('❌ Error fetching correction requests:', err);
      }

    } catch (error) {
      console.error('❌ Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Bell se sync — jab bell side se approve/reject ho to idhar bhi refresh
useEffect(() => {
  const handler = () => fetchAllData();
  window.addEventListener('requests-updated', handler);
  return () => window.removeEventListener('requests-updated', handler);
}, []);

  // ===== BROADCAST FUNCTIONS =====
  const groupBroadcasts = (notifications) => {
    const map = {};
    notifications.forEach(n => {
      const key = `${n.title}__${n.message}__${n.createdAt?.slice(0, 16)}`;
      if (!map[key]) {
        map[key] = { key, title: n.title, message: n.message, createdAt: n.createdAt, broadcastRole: n.metadata?.broadcastRole || 'all', recipients: [] };
      }
      map[key].recipients.push(n);
    });
    return Object.values(map).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const handleSendBroadcast = async () => {
    if (!broadcastData.updateType || !broadcastData.updateDetails) { alert('Please fill in all fields'); return; }
    setSending(true);
    try {
      const response = await sendBroadcast(broadcastData.updateType, broadcastData.updateDetails, broadcastData.affectedUsers);
      if (response.success) {
        alert(`✅ Broadcast sent to ${response.data?.count ?? 0} users`);
        setBroadcastData({ updateType: '', updateDetails: '', affectedUsers: 'all' });
        setShowBroadcastModal(false);
        fetchAllData();
      }
    } catch (error) {
      alert(error.message || 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteBroadcast = async (group, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Delete broadcast "${group.title}" from all ${group.recipients.length} recipients?`)) return;
    setDeleting(group.key);
    try {
      const ids = group.recipients.map(r => r._id);
      await deleteBroadcast(ids);
      alert('✅ Broadcast deleted');
      setShowDetailModal(false);
      fetchAllData();
    } catch (error) {
      alert(error.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const getStats = (recipients) => {
    const read = recipients.filter(r => r.isRead).length;
    return { read, unread: recipients.length - read, total: recipients.length };
  };

  // ===== REQUEST FUNCTIONS =====
  const handleApproveLeave = async (requestId) => {
    if (!window.confirm('Approve this leave request?')) return;
    
    setProcessing(requestId); // ✅ Show loading
    try {
      const result = await leaveRequestService.approveLeaveRequest(requestId);
      if (result.success) {
        console.log('✅ Leave approved successfully');
        
        // ✅ CRITICAL: Fetch data again to refresh bell icon
        await fetchAllData();
        window.dispatchEvent(new CustomEvent('requests-updated'));
        
        alert('✅ Leave request approved! Notification sent to employee.');
      } else {
        alert('Failed: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error approving leave:', error);
      alert('Failed to approve leave request');
    } finally {
      setProcessing(null); // ✅ Hide loading
    }
  };

  const handleRejectLeave = async (requestId) => {
    const reason = window.prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled
    
    setProcessing(requestId); // ✅ Show loading
    try {
      const result = await leaveRequestService.rejectLeaveRequest(requestId, reason || 'No reason provided');
      if (result.success) {
        console.log('✅ Leave rejected successfully');
        
        // ✅ CRITICAL: Fetch data again to refresh bell icon
        await fetchAllData();
        
        alert('❌ Leave request rejected. Notification sent to employee.');
      } else {
        alert('Failed: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error rejecting leave:', error);
      alert('Failed to reject leave request');
    } finally {
      setProcessing(null); // ✅ Hide loading
    }
  };

  const handleApproveCorrection = async (requestId) => {
    if (!window.confirm('Approve this correction request?')) return;
    
    setProcessing(requestId); // ✅ Show loading
    try {
      const result = await correctionRequestService.approveCorrectionRequest(
        requestId, 
        'Approved by admin', 
        'Request approved',
        true // updateAttendance
      );
      if (result.success) {
        console.log('✅ Correction approved successfully');
        
        // ✅ CRITICAL: Fetch data again to refresh bell icon
        await fetchAllData();
        
        alert('✅ Correction request approved!');
      } else {
        alert('Failed: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error approving correction:', error);
      alert('Failed to approve correction request');
    } finally {
      setProcessing(null); // ✅ Hide loading
    }
  };

  const handleRejectCorrection = async (requestId) => {
    const reason = window.prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled
    
    setProcessing(requestId); // ✅ Show loading
    try {
      const result = await correctionRequestService.rejectCorrectionRequest(
        requestId,
        reason || 'No reason provided',
        'Request rejected'
      );
      if (result.success) {
        console.log('✅ Correction rejected successfully');
        
        // ✅ CRITICAL: Fetch data again to refresh bell icon
        await fetchAllData();
        
        alert('❌ Correction request rejected');
      } else {
        alert('Failed: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error rejecting correction:', error);
      alert('Failed to reject correction request');
    } finally {
      setProcessing(null); // ✅ Hide loading
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = { year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60 };
    for (const [unit, value] of Object.entries(intervals)) {
      const i = Math.floor(seconds / value);
      if (i >= 1) return `${i} ${unit}${i > 1 ? 's' : ''} ago`;
    }
    return 'Just now';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // ===== RENDER TABS =====
  const renderTabs = () => (
    <div style={s.tabContainer}>
      <button 
        style={activeTab === 'requests' ? s.tabActive : s.tab}
        onClick={() => setActiveTab('requests')}
      >
        📋 Leave & Correction Requests
        {(leaveRequests.filter(r => r.status === 'pending').length + correctionRequests.filter(r => r.status === 'pending').length) > 0 && (
          <span style={s.badge}>
            {leaveRequests.filter(r => r.status === 'pending').length + correctionRequests.filter(r => r.status === 'pending').length}
          </span>
        )}
      </button>
      <button 
        style={activeTab === 'broadcasts' ? s.tabActive : s.tab}
        onClick={() => setActiveTab('broadcasts')}
      >
        📢 Broadcast History
      </button>
    </div>
  );

  // ===== RENDER REQUESTS TAB =====
  const renderRequestsTab = () => {
    const pendingLeave = leaveRequests.filter(r => r.status === 'pending');
    const pendingCorrection = correctionRequests.filter(r => r.status === 'pending');
    const allRequests = [...pendingLeave, ...pendingCorrection].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (allRequests.length === 0) {
      return (
        <div className="empty-state">
          <span className="empty-icon">✅</span>
          <h3>No pending requests</h3>
          <p>All leave and correction requests have been processed</p>
        </div>
      );
    }

    return (
      <div style={s.list}>
        {allRequests.map((req) => {
          const isLeave = req.leaveType !== undefined;
          const isProcessing = processing === req._id; // ✅ Check if processing
          
          return (
            <div key={req._id} style={s.requestCard}>
              <div style={s.reqIcon}>{isLeave ? '🏖️' : '🔧'}</div>
              <div style={s.reqBody}>
                <div style={s.reqTitle}>
                  {isLeave ? `Leave Request - ${req.leaveType}` : 'Attendance Correction Request'}
                </div>
                <div style={s.reqUser}>
                  👤 {req.employee?.firstName || req.employee?.name || req.employeeName || 'Unknown Employee'} 
                  {req.employee?.email && ` (${req.employee.email})`}
                </div>
                {isLeave ? (
                  <>
                    <div style={s.reqDetails}>
                      📅 {formatDate(req.fromDate)} to {formatDate(req.toDate)} ({req.numberOfDays || 0} days)
                    </div>
                    <div style={s.reqReason}>💬 {req.reason || 'No reason provided'}</div>
                  </>
                ) : (
                  <>
                    <div style={s.reqDetails}>
                      📅 Date: {formatDate(req.attendanceDate || req.date)}
                    </div>
                    <div style={s.reqReason}>💬 {req.reason || 'No reason provided'}</div>
                  </>
                )}
                <div style={s.reqTime}>🕐 {getTimeAgo(req.createdAt)}</div>
              </div>
              <div style={s.reqActions}>
                <button 
                  style={{
                    ...s.approveBtn,
                    opacity: isProcessing ? 0.6 : 1,
                    cursor: isProcessing ? 'not-allowed' : 'pointer'
                  }}
                  onClick={() => isLeave ? handleApproveLeave(req._id) : handleApproveCorrection(req._id)}
                  disabled={isProcessing}
                >
                  {isProcessing ? '⏳ Processing...' : '✅ Approve'}
                </button>
                <button 
                  style={{
                    ...s.rejectBtn,
                    opacity: isProcessing ? 0.6 : 1,
                    cursor: isProcessing ? 'not-allowed' : 'pointer'
                  }}
                  onClick={() => isLeave ? handleRejectLeave(req._id) : handleRejectCorrection(req._id)}
                  disabled={isProcessing}
                >
                  {isProcessing ? '⏳ Processing...' : '❌ Reject'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ===== RENDER BROADCASTS TAB =====
  const renderBroadcastsTab = () => {
    if (broadcastGroups.length === 0) {
      return (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <h3>No broadcasts sent yet</h3>
        </div>
      );
    }

    return (
      <div style={s.list}>
        {broadcastGroups.map((group) => {
          const stats = getStats(group.recipients);
          const pct = Math.round((stats.read / stats.total) * 100);
          return (
            <div key={group.key} style={s.card} onClick={() => { setSelectedBroadcast(group); setShowDetailModal(true); }}>
              <div style={s.cardIcon}>📣</div>
              <div style={s.cardBody}>
                <div style={s.cardTitle}>{group.title}</div>
                <div style={s.cardMsg}>{group.message}</div>
                <div style={s.cardMeta}>
                  <span style={s.tag}>👥 {stats.total} recipients</span>
                  <span style={s.tag}>📋 {group.broadcastRole}</span>
                  <span style={s.time}>🕐 {getTimeAgo(group.createdAt)}</span>
                </div>
                <div style={s.progressRow}>
                  <div style={s.bar}><div style={{ ...s.fill, width: `${pct}%` }} /></div>
                  <span style={s.pctText}>✅ {stats.read} read &nbsp; ❌ {stats.unread} unread</span>
                </div>
              </div>
              <div style={s.cardActions}>
                <button
                  style={s.trashBtn}
                  onClick={(e) => handleDeleteBroadcast(group, e)}
                  disabled={deleting === group.key}
                  title="Delete broadcast"
                >
                  {deleting === group.key ? '...' : '🗑️'}
                </button>
                <span style={s.viewLink}>Details →</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="notification-history-container">

      {/* Header */}
      <div className="page-header">
        <h1>🔔 All Notifications</h1>
        {activeTab === 'broadcasts' && (
          <button className="btn btn-primary" onClick={() => setShowBroadcastModal(true)}>
            📢 Send Broadcast
          </button>
        )}
      </div>

      {/* Tabs */}
      {renderTabs()}

      {/* Content */}
      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : (
        <>
          {activeTab === 'requests' && renderRequestsTab()}
          {activeTab === 'broadcasts' && renderBroadcastsTab()}
        </>
      )}

      {/* ===== DETAIL MODAL (Broadcasts) ===== */}
      {showDetailModal && selectedBroadcast && (() => {
        const stats = getStats(selectedBroadcast.recipients);
        return (
          <div style={s.overlay} onClick={() => setShowDetailModal(false)}>
            <div style={s.detailBox} onClick={e => e.stopPropagation()}>

              <div style={s.dHeader}>
                <div>
                  <h2 style={s.dTitle}>{selectedBroadcast.title}</h2>
                  <p style={s.dTime}>{getTimeAgo(selectedBroadcast.createdAt)} • Sent to: {selectedBroadcast.broadcastRole}</p>
                </div>
                <button style={s.closeBtn} onClick={() => setShowDetailModal(false)}>×</button>
              </div>

              <div style={s.dMsg}>{selectedBroadcast.message}</div>

              {/* Stats */}
              <div style={s.statsRow}>
                <div style={{ ...s.statBox, borderColor: '#3b82f6' }}>
                  <div style={s.statNum}>{stats.total}</div>
                  <div style={s.statLbl}>Total Sent</div>
                </div>
                <div style={{ ...s.statBox, borderColor: '#10b981' }}>
                  <div style={{ ...s.statNum, color: '#10b981' }}>{stats.read}</div>
                  <div style={s.statLbl}>✅ Read</div>
                </div>
                <div style={{ ...s.statBox, borderColor: '#ef4444' }}>
                  <div style={{ ...s.statNum, color: '#ef4444' }}>{stats.unread}</div>
                  <div style={s.statLbl}>❌ Unread</div>
                </div>
              </div>

              {/* Recipients */}
              <div style={s.recSection}>
                <div style={s.recTitle}>Recipients ({stats.total})</div>
                <div style={s.recScroll}>
                  {selectedBroadcast.recipients.map(r => (
                    <div key={r._id} style={s.recRow}>
                      <div style={s.recAvatar}>{(r.recipient?.email || '?')[0].toUpperCase()}</div>
                      <div style={s.recInfo}>
                        <div style={s.recEmail}>{r.recipient?.email || 'Unknown'}</div>
                        <div style={s.recRole}>{r.recipient?.role || ''}</div>
                      </div>
                      <span style={{ ...s.badgeSmall, background: r.isRead ? '#dcfce7' : '#fee2e2', color: r.isRead ? '#16a34a' : '#dc2626' }}>
                        {r.isRead ? '✅ Read' : '❌ Unread'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div style={s.dFooter}>
                <button
                  style={s.deleteBtn}
                  onClick={() => handleDeleteBroadcast(selectedBroadcast, null)}
                  disabled={deleting === selectedBroadcast.key}
                >
                  🗑️ {deleting === selectedBroadcast.key ? 'Deleting...' : 'Delete This Broadcast'}
                </button>
                <button style={s.cancelBtn} onClick={() => setShowDetailModal(false)}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===== SEND BROADCAST MODAL ===== */}
      {showBroadcastModal && (
        <div style={s.overlay} onClick={() => setShowBroadcastModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📢 Send Broadcast Notification</h2>
              <button className="modal-close" onClick={() => setShowBroadcastModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Update Type *</label>
                <input type="text" value={broadcastData.updateType}
                  onChange={e => setBroadcastData({ ...broadcastData, updateType: e.target.value })}
                  placeholder="e.g., Holiday Announcement, Policy Change" />
              </div>
              <div className="form-group">
                <label>Update Details *</label>
                <textarea value={broadcastData.updateDetails}
                  onChange={e => setBroadcastData({ ...broadcastData, updateDetails: e.target.value })}
                  placeholder="Enter detailed message..." rows="5" />
              </div>
              <div className="form-group">
                <label>Send To</label>
                <select value={broadcastData.affectedUsers}
                  onChange={e => setBroadcastData({ ...broadcastData, affectedUsers: e.target.value })}>
                  <option value="all">All Users</option>
                  <option value="employee">Employees Only</option>
                  <option value="manager">Managers Only</option>
                  <option value="admin">Admins Only</option>
                </select>
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={handleSendBroadcast}
                  disabled={sending || !broadcastData.updateType || !broadcastData.updateDetails}>
                  {sending ? 'Sending...' : '📢 Send Broadcast'}
                </button>
                <button className="btn btn-secondary" onClick={() => setShowBroadcastModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const s = {
  // Tabs
  tabContainer: { display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' },
  tab: { padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: '3px solid transparent', fontSize: '14px', fontWeight: '600', color: '#6b7280', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' },
  tabActive: { padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: '3px solid #667eea', fontSize: '14px', fontWeight: '600', color: '#667eea', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  badge: { background: '#ef4444', color: 'white', borderRadius: '20px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' },

  // Requests
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  requestCard: { display: 'flex', alignItems: 'flex-start', gap: '16px', background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' },
  reqIcon: { fontSize: '32px', flexShrink: 0 },
  reqBody: { flex: 1, minWidth: 0 },
  reqTitle: { fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '6px' },
  reqUser: { fontSize: '13px', color: '#667eea', fontWeight: '600', marginBottom: '8px' },
  reqDetails: { fontSize: '13px', color: '#374151', marginBottom: '4px' },
  reqReason: { fontSize: '13px', color: '#6b7280', fontStyle: 'italic', marginBottom: '8px', padding: '8px', background: '#f9fafb', borderRadius: '6px' },
  reqTime: { fontSize: '11px', color: '#9ca3af' },
  reqActions: { display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 },
  approveBtn: { padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' },
  rejectBtn: { padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' },

  // Broadcasts
  card: { display: 'flex', alignItems: 'center', gap: '16px', background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', cursor: 'pointer' },
  cardIcon: { fontSize: '32px', flexShrink: 0 },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '4px' },
  cardMsg: { fontSize: '13px', color: '#6b7280', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardMeta: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' },
  tag: { fontSize: '11px', background: '#f3f4f6', padding: '2px 8px', borderRadius: '20px', color: '#374151' },
  time: { fontSize: '11px', color: '#9ca3af' },
  progressRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  bar: { flex: 1, height: '6px', background: '#f3f4f6', borderRadius: '10px', overflow: 'hidden' },
  fill: { height: '100%', background: '#10b981', borderRadius: '10px' },
  pctText: { fontSize: '11px', color: '#6b7280', whiteSpace: 'nowrap' },
  cardActions: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 },
  trashBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', padding: '4px' },
  viewLink: { fontSize: '12px', color: '#667eea', fontWeight: '600' },

  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  detailBox: { background: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  dHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px', borderBottom: '1px solid #e5e7eb' },
  dTitle: { fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 },
  dTime: { fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' },
  closeBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#9ca3af', lineHeight: 1 },
  dMsg: { margin: '16px 24px', padding: '14px', background: '#f9fafb', borderRadius: '8px', fontSize: '14px', color: '#374151', lineHeight: 1.6 },
  statsRow: { display: 'flex', gap: '12px', padding: '0 24px 16px' },
  statBox: { flex: 1, textAlign: 'center', padding: '12px', borderRadius: '10px', border: '2px solid' },
  statNum: { fontSize: '28px', fontWeight: '700', color: '#111827' },
  statLbl: { fontSize: '12px', color: '#6b7280', marginTop: '4px' },
  recSection: { flex: 1, overflow: 'hidden', padding: '0 24px 12px', display: 'flex', flexDirection: 'column' },
  recTitle: { fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' },
  recScroll: { overflowY: 'auto', maxHeight: '180px', display: 'flex', flexDirection: 'column', gap: '6px' },
  recRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', background: '#f9fafb', borderRadius: '8px' },
  recAvatar: { width: '32px', height: '32px', borderRadius: '50%', background: '#667eea', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0 },
  recInfo: { flex: 1 },
  recEmail: { fontSize: '13px', fontWeight: '500', color: '#111827' },
  recRole: { fontSize: '11px', color: '#9ca3af' },
  badgeSmall: { fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '20px', flexShrink: 0 },
  dFooter: { display: 'flex', gap: '12px', padding: '14px 24px', borderTop: '1px solid #e5e7eb' },
  deleteBtn: { flex: 1, padding: '10px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  cancelBtn: { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
};

export default NotificationHistory;