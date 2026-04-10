import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createCorrectionRequest, getMyCorrectionRequests } from '../../services/correctionRequestService';
import './../../styles/NotificationStyles.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// ─── Correction Request Modal ─────────────────────────────────────────────────
const NewCorrectionModal = ({ onClose, onSubmitted }) => {
  const [form, setForm] = useState({
    attendanceDate: '',
    issueType: 'wrong_status',
    currentStatus: 'absent',
    requestedStatus: 'present',
    currentClockIn: '',
    currentClockOut: '',
    requestedClockIn: '10:00',
    requestedClockOut: '19:00',
    reason: '',
    priority: 'medium',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingAttendance, setFetchingAttendance] = useState(false);

  // ✅ Check karo 7PM ho gayi hai ya nahi
  const isAfter7PM = () => {
    const now = new Date();
    return now.getHours() >= 19;
  };

  // ✅ Date change hone pe us din ki attendance fetch karo
  const handleDateChange = async (e) => {
    const selectedDate = e.target.value;
    setForm(p => ({ ...p, attendanceDate: selectedDate }));

    if (!selectedDate) return;

    setFetchingAttendance(true);
    try {
      const token =
        localStorage.getItem('employee_token') ||
        localStorage.getItem('token');

      const response = await fetch(
        `${API_URL}/employee/my-attendance?startDate=${selectedDate}&endDate=${selectedDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        const records = data.data?.attendanceRecords || data.data?.attendance || data.data || [];
        const record = Array.isArray(records) ? records[0] : null;

        if (record) {
          // clockIn time nikaalo (HH:MM format)
          const clockInTime = record.clockIn
            ? new Date(record.clockIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
            : '10:00';

          // clockOut — sirf tab set karo jab 7PM ho gayi ho
          let clockOutTime = '19:00';
          if (record.clockOut) {
            clockOutTime = new Date(record.clockOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
          } else if (!isAfter7PM()) {
            // 7PM nahi aayi to clockOut field blank rakho
            clockOutTime = '';
          }

          setForm(p => ({
            ...p,
            currentStatus: record.status || 'absent',
            requestedClockIn: clockInTime,
            requestedClockOut: clockOutTime,
          }));
        } else {
          // Koi record nahi mila — today check karo
          const today = new Date().toISOString().split('T')[0];
          const isToday = selectedDate === today;

          setForm(p => ({
            ...p,
            currentStatus: 'absent',
            requestedClockIn: '10:00',
            // Aaj ka din aur 7PM nahi aayi — clockOut blank
            requestedClockOut: isToday && !isAfter7PM() ? '' : '19:00',
          }));
        }
      }
    } catch (err) {
      console.error('Attendance fetch error:', err);
    } finally {
      setFetchingAttendance(false);
    }
  };

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.attendanceDate) { setError('Please select attendance date.'); return; }
    if (!form.reason.trim()) { setError('Please provide a reason.'); return; }
    setError('');
    setLoading(true);
    try {
      const response = await createCorrectionRequest(form);
      if (response.success) {
        onSubmitted();
      } else {
        setError(response.message || 'Submission failed.');
      }
    } catch (err) {
      setError(err.message || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showClockFields = form.requestedStatus === 'present' || form.requestedStatus === 'half-day' || form.requestedStatus === 'late';

  // ✅ clockOut field dikhao sirf tab jab 7PM ho gayi ho ya past date ho
  const showClockOut = () => {
    if (!form.attendanceDate) return true;
    const today = new Date().toISOString().split('T')[0];
    const isToday = form.attendanceDate === today;
    return !isToday || isAfter7PM();
  };

  return (
    <div style={ms.overlay}>
      <div style={ms.modal}>
        <div style={ms.header}>
          <div>
            <h2 style={ms.title}>📝 Request Attendance Correction</h2>
            <p style={ms.subtitle}>Admin will review and update your record</p>
          </div>
          <button style={ms.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={ms.body}>
          {/* Date */}
          <div style={ms.field}>
            <label style={ms.label}>Attendance Date *</label>
            <input
              type="date"
              name="attendanceDate"
              value={form.attendanceDate}
              onChange={handleDateChange}
              max={new Date().toISOString().split('T')[0]}
              style={ms.input}
            />
            {fetchingAttendance && (
              <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>
                ⏳ Fetching attendance record...
              </span>
            )}
          </div>

          {/* Issue Type */}
          <div style={ms.field}>
            <label style={ms.label}>Issue Type *</label>
            <select name="issueType" value={form.issueType} onChange={handleChange} style={ms.input}>
              <option value="wrong_status">Wrong Status Marked</option>
              <option value="missed_clock_in">Missed Clock In</option>
              <option value="missed_clock_out">Missed Clock Out</option>
              <option value="wrong_time">Wrong Time Recorded</option>
              <option value="technical_issue">Technical Issue</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Status row */}
          <div style={ms.row}>
            <div style={ms.field}>
              <label style={ms.label}>Current Status</label>
              <select name="currentStatus" value={form.currentStatus} onChange={handleChange} style={ms.input}>
                <option value="absent">Absent</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="half-day">Half Day</option>
                <option value="leave">Leave</option>
              </select>
            </div>
            <div style={{ alignSelf: 'flex-end', paddingBottom: 10, color: '#94a3b8', fontSize: 20 }}>→</div>
            <div style={ms.field}>
              <label style={ms.label}>Requested Status *</label>
              <select name="requestedStatus" value={form.requestedStatus} onChange={handleChange} style={ms.input}>
                <option value="present">Present</option>
                <option value="half-day">Half Day</option>
                <option value="late">Late</option>
                <option value="on-leave">On Leave</option>
              </select>
            </div>
          </div>

          {/* ✅ Clock times — clockOut sirf 7PM baad */}
          {showClockFields && (
            <div style={ms.row}>
              <div style={ms.field}>
                <label style={ms.label}>Requested Clock In</label>
                <input
                  type="time"
                  name="requestedClockIn"
                  value={form.requestedClockIn}
                  onChange={handleChange}
                  style={ms.input}
                />
              </div>
              {showClockOut() && (
                <div style={ms.field}>
                  <label style={ms.label}>Requested Clock Out</label>
                  <input
                    type="time"
                    name="requestedClockOut"
                    value={form.requestedClockOut}
                    onChange={handleChange}
                    style={ms.input}
                  />
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div style={ms.field}>
            <label style={ms.label}>
              Reason * <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 12 }}>(admin will see this)</span>
            </label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              rows={3}
              placeholder="Explain what happened and why correction is needed..."
              style={{ ...ms.input, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {/* Priority */}
          <div style={ms.field}>
            <label style={ms.label}>Priority</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['low', 'medium', 'high'].map(p => (
                <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 8,
                    border: `2px solid ${form.priority === p ? (p === 'high' ? '#ef4444' : p === 'medium' ? '#f59e0b' : '#10b981') : '#e2e8f0'}`,
                    background: form.priority === p ? (p === 'high' ? '#fef2f2' : p === 'medium' ? '#fffbeb' : '#ecfdf5') : '#f8fafc',
                    color: form.priority === p ? (p === 'high' ? '#dc2626' : p === 'medium' ? '#d97706' : '#059669') : '#64748b',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
                  }}>
                  {p === 'high' ? '🔴' : p === 'medium' ? '🟡' : '🟢'} {p}
                </button>
              ))}
            </div>
          </div>

          {error && <div style={ms.error}>⚠️ {error}</div>}

          <div style={ms.actions}>
            <button style={ms.cancelBtn} onClick={onClose} disabled={loading}>Cancel</button>
            <button
              style={{ ...ms.submitBtn, opacity: loading ? 0.7 : 1 }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Submitting...' : '📤 Submit Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MyRequests = () => {
  const API_URL_LOCAL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
  const location = useLocation();

  // ✅ Navbar se aaye to correction tab + modal auto open
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'leave');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [correctionRequests, setCorrectionRequests] = useState([]);
  const [leaveStats, setLeaveStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cancelling, setCancelling] = useState(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState(location.state?.openModal || false);
  const [successMsg, setSuccessMsg] = useState('');
  const [dismissedIds, setDismissedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dismissedLeaveIds') || '[]'); } catch { return []; }
  });
  const navigate = useNavigate();

  useEffect(() => { fetchRequests(); }, [activeTab, filter]);

  useEffect(() => {
    const interval = setInterval(() => { fetchRequests(); }, 10000);
    return () => clearInterval(interval);
  }, [activeTab, filter]);

  const getToken = () =>
    localStorage.getItem('employee_token') ||
    localStorage.getItem('token');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (activeTab === 'leave') {
        const url = filter === 'all'
          ? `${API_URL_LOCAL}/leave-requests/my-requests`
          : `${API_URL_LOCAL}/leave-requests/my-requests?status=${filter}`;
        const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (response.ok) {
          const data = await response.json();
          setLeaveRequests(data.data?.leaveRequests || []);
          setLeaveStats(data.data?.stats || null);
        }
      } else {
        const response = await getMyCorrectionRequests(filter === 'all' ? null : filter);
        if (response.success) {
          setCorrectionRequests(response.data?.correctionRequests || []);
        }
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelLeave = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) return;
    setCancelling(requestId);
    try {
      const token = getToken();
      const response = await fetch(`${API_URL_LOCAL}/leave-requests/${requestId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        fetchRequests();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to cancel leave request');
      }
    } catch (error) {
      alert('Failed to cancel leave request');
    } finally {
      setCancelling(null);
    }
  };

  const handleDismiss = (requestId) => {
    const updated = [...dismissedIds, requestId];
    setDismissedIds(updated);
    localStorage.setItem('dismissedLeaveIds', JSON.stringify(updated));
  };

  const handleCorrectionSubmitted = () => {
    setShowCorrectionModal(false);
    setSuccessMsg('✅ Correction request submitted! Admin will review it shortly.');
    setTimeout(() => setSuccessMsg(''), 5000);
    setActiveTab('correction');
    fetchRequests();
  };

  const getStatusColor = (status) => {
    const colors = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444', cancelled: '#6b7280', resolved: '#8b5cf6' };
    return colors[status] || '#6b7280';
  };

  const getLeaveTypeColor = (type) => {
    const colors = { sick: '#ef4444', casual: '#3b82f6', annual: '#10b981', emergency: '#f59e0b', unpaid: '#6b7280', other: '#8b5cf6' };
    return colors[type] || '#6b7280';
  };

  const getIssueIcon = (type) => {
    const icons = { wrong_status: '❌', missed_clock_in: '⏰', missed_clock_out: '⏱️', wrong_time: '🕐', technical_issue: '🔧', other: '📝' };
    return icons[type] || '📝';
  };

  const visibleLeaveRequests = leaveRequests.filter(r => !dismissedIds.includes(r._id));

  return (
    <div className="my-requests-container">
      <div className="page-header">
        <h1>📋 My Requests</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/employee/request-leave')}>🏖️ Request Leave</button>
          <button className="btn btn-secondary" onClick={() => navigate('/employee/report-issue')}>⚠️ Report Issue</button>
        </div>
      </div>

      {successMsg && (
        <div style={{
          background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46',
          padding: '12px 20px', borderRadius: 10, marginBottom: 16,
          fontWeight: 600, fontSize: 14,
        }}>
          {successMsg}
        </div>
      )}

      {activeTab === 'leave' && leaveStats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-number">{leaveStats.totalApproved || 0}</span>
            <span className="stat-label">Approved Leaves</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{leaveStats.totalDays || 0}</span>
            <span className="stat-label">Total Days Taken</span>
          </div>
        </div>
      )}

      <div className="tabs-container">
        <div className="tabs">
          <button className={activeTab === 'leave' ? 'active' : ''} onClick={() => { setActiveTab('leave'); setFilter('all'); }}>
            🏖️ Leave Requests ({leaveRequests.length})
          </button>
          <button className={activeTab === 'correction' ? 'active' : ''} onClick={() => { setActiveTab('correction'); setFilter('all'); }}>
            ⚠️ Correction Requests ({correctionRequests.length})
          </button>
        </div>
      </div>

      <div className="filter-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div className="filter-tabs">
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'correction' && (
          <button
            onClick={() => setShowCorrectionModal(true)}
            style={{
              background: 'linear-gradient(135deg, #f97316, #ef4444)',
              color: 'white', border: 'none', borderRadius: 8,
              padding: '9px 18px', cursor: 'pointer', fontSize: 13,
              fontWeight: 700, boxShadow: '0 3px 8px rgba(249,115,22,0.3)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            ✏️ New Correction Request
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-state">Loading requests...</div>
      ) : (
        <>
          {activeTab === 'leave' && (
            <div className="requests-grid">
              {visibleLeaveRequests.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📭</span>
                  <h3>No leave requests found</h3>
                  <p>You haven't submitted any leave requests yet.</p>
                  <button className="btn btn-primary" onClick={() => navigate('/employee/request-leave')}>Request Leave Now</button>
                </div>
              ) : (
                visibleLeaveRequests.map((request) => (
                  <div key={request._id} className="request-card" style={{ position: 'relative' }}>
                    {(request.status === 'rejected' || request.status === 'cancelled') && (
                      <button onClick={() => handleDismiss(request._id)} title="Dismiss"
                        style={{
                          position: 'absolute', top: 10, right: 10,
                          width: 26, height: 26, borderRadius: '50%',
                          background: '#fee2e2', color: '#dc2626',
                          border: '1px solid #fecaca', cursor: 'pointer',
                          fontWeight: 700, fontSize: 14, lineHeight: 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
                        }}>✕</button>
                    )}
                    <div className="request-header">
                      <span className="leave-type-badge" style={{ backgroundColor: getLeaveTypeColor(request.leaveType) }}>
                        {request.leaveType}
                      </span>
                      <span className="status-badge" style={{ backgroundColor: getStatusColor(request.status), marginRight: (request.status === 'rejected' || request.status === 'cancelled') ? 30 : 0 }}>
                        {request.status}
                      </span>
                    </div>
                    <div className="request-details">
                      <div className="detail-row"><span className="detail-label">Duration:</span><span className="detail-value">{request.numberOfDays} day(s)</span></div>
                      <div className="detail-row"><span className="detail-label">From:</span><span className="detail-value">{new Date(request.fromDate).toLocaleDateString()}</span></div>
                      <div className="detail-row"><span className="detail-label">To:</span><span className="detail-value">{new Date(request.toDate).toLocaleDateString()}</span></div>
                      <div className="detail-row full-width"><span className="detail-label">Reason:</span><p className="reason-text">{request.reason}</p></div>
                      {request.status !== 'pending' && request.approverName && (
                        <div className="detail-row full-width">
                          <span className="detail-label">{request.status === 'approved' ? 'Approved' : 'Rejected'} by:</span>
                          <span className="detail-value">{request.approverName} on {new Date(request.approvedAt).toLocaleString()}</span>
                        </div>
                      )}
                      {request.rejectionReason && (
                        <div className="detail-row full-width rejection-reason">
                          <span className="detail-label">Rejection Reason:</span>
                          <p>{request.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                    <div className="request-footer">
                      <span className="request-date">Requested on {new Date(request.createdAt).toLocaleDateString()}</span>
                      {request.status === 'pending' && (
                        <button className="btn btn-reject btn-small"
                          onClick={() => handleCancelLeave(request._id)}
                          disabled={cancelling === request._id}>
                          {cancelling === request._id ? 'Cancelling...' : 'Cancel Request'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'correction' && (
            <div className="requests-grid">
              {correctionRequests.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">✅</span>
                  <h3>No correction requests found</h3>
                  <p>Submit a request if your attendance was marked incorrectly.</p>
                  <button className="btn btn-secondary" onClick={() => setShowCorrectionModal(true)}>
                    ✏️ New Correction Request
                  </button>
                </div>
              ) : (
                correctionRequests.map((request) => (
                  <div key={request._id} className="request-card correction-card">
                    <div className="request-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{getIssueIcon(request.issueType)}</span>
                        <span className="issue-type" style={{ textTransform: 'capitalize' }}>
                          {request.issueType?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="badges">
                        <span className="status-badge" style={{ backgroundColor: getStatusColor(request.status) }}>
                          {request.status}
                        </span>
                      </div>
                    </div>

                    <div className="request-details">
                      <div className="detail-row">
                        <span className="detail-label">Date:</span>
                        <span className="detail-value">{new Date(request.attendanceDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Change:</span>
                        <span className="detail-value">
                          <span style={{ background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                            {request.currentStatus}
                          </span>
                          <span style={{ margin: '0 6px', color: '#94a3b8' }}>→</span>
                          <span style={{ background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                            {request.requestedStatus}
                          </span>
                        </span>
                      </div>
                      {request.requestedClockIn && (
                        <div className="detail-row">
                          <span className="detail-label">Requested Time:</span>
                          <span className="detail-value">{request.requestedClockIn} — {request.requestedClockOut || 'N/A'}</span>
                        </div>
                      )}
                      <div className="detail-row full-width">
                        <span className="detail-label">Reason:</span>
                        <p className="reason-text">{request.reason}</p>
                      </div>
                      {request.status !== 'pending' && request.resolution && (
                        <div className="detail-row full-width" style={{ background: request.status === 'approved' ? '#ecfdf5' : '#fef2f2', borderRadius: 8, padding: '10px 12px', marginTop: 8 }}>
                          <span className="detail-label">{request.status === 'approved' ? '✅ Resolution:' : '❌ Rejection Reason:'}</span>
                          <p style={{ margin: '4px 0 0', fontSize: 13, color: request.status === 'approved' ? '#065f46' : '#991b1b' }}>{request.resolution}</p>
                        </div>
                      )}
                    </div>

                    <div className="request-footer">
                      <span className="request-date">Requested on {new Date(request.createdAt).toLocaleDateString()}</span>
                      {request.status === 'pending' && (
                        <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                          ⏳ Awaiting Review
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {showCorrectionModal && (
        <NewCorrectionModal
          onClose={() => setShowCorrectionModal(false)}
          onSubmitted={handleCorrectionSubmitted}
        />
      )}
    </div>
  );
};

// ── Modal styles ──────────────────────────────────────────────────────────────
const ms = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 24px 0' },
  title: { margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' },
  subtitle: { margin: '4px 0 0', fontSize: 13, color: '#64748b' },
  closeBtn: { background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: '#64748b', fontWeight: 600, flexShrink: 0 },
  body: { padding: '20px 24px 24px' },
  field: { marginBottom: 14, flex: 1 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, color: '#1e293b', outline: 'none', boxSizing: 'border-box' },
  row: { display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 },
  error: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '9px 14px', color: '#dc2626', fontSize: 13, marginBottom: 14 },
  actions: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 },
  cancelBtn: { padding: '9px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  submitBtn: { padding: '9px 22px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700 },
};

export default MyRequests;