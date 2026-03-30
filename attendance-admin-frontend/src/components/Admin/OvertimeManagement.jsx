import React, { useState, useEffect, useCallback } from 'react';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';

// ============================================================
// ⏰ OvertimeManagement.jsx — Admin + Manager
// Admin route:   /admin/overtime
// Manager route: /manager/overtime
// ============================================================

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const OvertimeManagement = ({ isManager = false }) => {
  const [pendingRequests, setPendingRequests]   = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [processing, setProcessing]             = useState(null);
  const [activeTab, setActiveTab]               = useState('pending'); // pending | set

  // Direct set form
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [searchResults, setSearchResults]       = useState([]);
  const [selectedRecord, setSelectedRecord]     = useState(null);
  const [directMinutes, setDirectMinutes]       = useState('');
  const [directNote, setDirectNote]             = useState('');
  const [directSubmitting, setDirectSubmitting] = useState(false);

  // Approve/Reject modal
  const [approveModal, setApproveModal]   = useState(null);
  const [approveMinutes, setApproveMinutes] = useState('');
  const [rejectNote, setRejectNote]         = useState('');

  const [toast, setToast] = useState(null);

  const getToken = () =>
    localStorage.getItem('admin_token') ||
    localStorage.getItem('manager_token') ||
    localStorage.getItem('token');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPending = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API}/attendance/overtime/pending`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setPendingRequests(data.data?.requests || []);
    } catch (err) {
      console.error('Fetch pending overtime error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  // ── Search attendance records ───────────────────────────────────────────────
  const handleSearch = async () => {
    if (!attendanceSearch.trim()) return;
    try {
      const today  = new Date().toISOString().split('T')[0];
      const past30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const res    = await fetch(
        `${API}/attendance?startDate=${past30}&endDate=${today}&limit=500`,
  { headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' } }
);
      const data = await res.json();
console.log('Search results raw:', data); // debug ke liye
      const all    = data.data?.attendance || [];
      const term   = attendanceSearch.toLowerCase();
      const filtered = all.filter(a => {
        const name = `${a.employeeId?.firstName || ''} ${a.employeeId?.lastName || ''}`.toLowerCase();
        return name.includes(term) && ['present', 'half-day', 'late'].includes(a.status);
      });
      setSearchResults(filtered.slice(0, 20));
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  // ── Direct overtime set ─────────────────────────────────────────────────────
  const handleDirectSet = async () => {
    if (!selectedRecord || !directMinutes || parseInt(directMinutes) <= 0) {
      showToast('Please select a record and enter valid overtime minutes.', 'error');
      return;
    }
    setDirectSubmitting(true);
    try {
      const res  = await fetch(`${API}/attendance/${selectedRecord._id}/overtime`, {
        method:  'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ overtimeMinutes: parseInt(directMinutes), overtimeNote: directNote.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Overtime set: ${directMinutes} min for ${selectedRecord.employeeId?.firstName}`);
        setSelectedRecord(null); setDirectMinutes(''); setDirectNote('');
        setSearchResults([]); setAttendanceSearch('');
        fetchPending();
      } else {
        showToast(data.message || 'Failed to set overtime.', 'error');
      }
    } catch (err) {
      showToast('Server error. Please try again.', 'error');
    } finally {
      setDirectSubmitting(false);
    }
  };

  // ── Approve / Reject ────────────────────────────────────────────────────────
  const handleApproveAction = async () => {
    if (!approveModal) return;
    const { req, action } = approveModal;
    if (action === 'reject' && !rejectNote.trim()) {
      showToast('Rejection reason is required.', 'error'); return;
    }
    setProcessing(req._id);
    try {
      const body = action === 'approve'
        ? { approved: true,  overtimeMinutes: approveMinutes ? parseInt(approveMinutes) : undefined }
        : { approved: false, rejectionNote: rejectNote };
      const res  = await fetch(`${API}/attendance/${req._id}/overtime-approve`, {
        method:  'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setApproveModal(null); setApproveMinutes(''); setRejectNote('');
        fetchPending();
      } else {
        showToast(data.message || 'Action failed.', 'error');
      }
    } catch (err) {
      showToast('Server error. Please try again.', 'error');
    } finally {
      setProcessing(null);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const fmtDate = d => new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const fmtTime = t => t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
  const minsToHrs = m => {
    if (!m) return '0 min';
    const h = Math.floor(m / 60), r = m % 60;
    return h === 0 ? `${r} min` : r === 0 ? `${h} hr` : `${h} hr ${r} min`;
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  const containerClass = isManager ? 'manager-container' : 'admin-container';
  const layoutClass    = isManager ? 'manager-layout'    : 'admin-layout';
  const contentClass   = isManager ? 'manager-content'   : 'admin-content';
  const NavbarComp  = AdminNavbar;
const SidebarComp = AdminSidebar;

  return (
    <div className={containerClass}>
      <NavbarComp />
      <div className={layoutClass}>
        <SidebarComp />
        <div className={contentClass} style={{ padding: 24, background: '#f9fafb', minHeight: '100vh' }}>

          {/* Toast */}
          {toast && (
            <div style={{ ...S.toast, background: toast.type === 'error' ? '#fef2f2' : '#ecfdf5', color: toast.type === 'error' ? '#dc2626' : '#065f46', border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#a7f3d0'}` }}>
              {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
            </div>
          )}

          {/* Page Header */}
          <div style={S.pageHeader}>
            <div>
              <h1 style={S.pageTitle}>⏱️ Overtime Management</h1>
              <p style={S.pageSub}>{isManager ? 'Manage overtime for your team' : 'Review requests and set overtime for all employees'}</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={S.tabs}>
            <button style={{ ...S.tab, ...(activeTab === 'pending' ? S.tabActive : {}) }} onClick={() => setActiveTab('pending')}>
              📋 Pending Requests
              {pendingRequests.length > 0 && <span style={S.badge}>{pendingRequests.length}</span>}
            </button>
            <button style={{ ...S.tab, ...(activeTab === 'set' ? S.tabActive : {}) }} onClick={() => setActiveTab('set')}>
              ➕ Set Overtime Directly
            </button>
          </div>

          {/* ── TAB: PENDING REQUESTS ── */}
          {activeTab === 'pending' && (
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={S.cardTitle}>Pending Employee Overtime Requests</div>
                <button style={S.refreshBtn} onClick={fetchPending}>🔄 Refresh</button>
              </div>

              {loading ? (
                <div style={S.centerBox}><div style={S.spinner} /><style>{spinCSS}</style></div>
              ) : pendingRequests.length === 0 ? (
                <div style={S.emptyBox}>
                  <div style={{ fontSize: 52, opacity: 0.3, marginBottom: 10 }}>✅</div>
                  <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>No Pending Requests</div>
                  <div style={{ color: '#9ca3af', fontSize: 13 }}>All overtime requests have been reviewed.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pendingRequests.map(req => {
                    const empName = `${req.employeeId?.firstName || ''} ${req.employeeId?.lastName || ''}`;
                    return (
                      <div key={req._id} style={S.reqCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            {/* Employee Info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                              <div style={S.avatar}>{empName.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                              <div>
                                <div style={{ fontWeight: 700, color: '#111827', fontSize: 15 }}>{empName}</div>
                                <div style={{ fontSize: 12, color: '#9ca3af' }}>
                                  {req.employeeId?.employeeCode} · {req.employeeId?.department}
                                </div>
                              </div>
                            </div>

                            {/* Date & Hours */}
                            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>
                              📅 {fmtDate(req.date)} &nbsp;·&nbsp;
                              {fmtTime(req.clockIn)} – {fmtTime(req.clockOut)} &nbsp;·&nbsp;
                              Regular: <strong>{req.workHours || 0} hrs</strong>
                            </div>

                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: req.overtimeNote ? 10 : 0 }}>
                              <div style={{ ...S.infoBox, background: '#fffbeb', border: '1px solid #fde68a' }}>
                                <div style={S.infoLabel}>Requested Overtime</div>
                                <div style={{ ...S.infoVal, color: '#d97706' }}>{minsToHrs(req.overtimeMinutes)}</div>
                              </div>
                              <div style={S.infoBox}>
                                <div style={S.infoLabel}>Requested On</div>
                                <div style={S.infoVal}>{req.overtimeRequestedAt ? fmtDate(req.overtimeRequestedAt) : '—'}</div>
                              </div>
                            </div>

                            {req.overtimeNote && (
                              <div style={{ fontSize: 13, color: '#374151', background: '#f9fafb', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                                📝 {req.overtimeNote}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                            <button style={S.approveBtn}
                              disabled={processing === req._id}
                              onClick={() => { setApproveModal({ req, action: 'approve' }); setApproveMinutes(String(req.overtimeMinutes)); }}>
                              ✅ Approve
                            </button>
                            <button style={S.rejectBtn}
                              disabled={processing === req._id}
                              onClick={() => setApproveModal({ req, action: 'reject' })}>
                              ❌ Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: SET OVERTIME DIRECTLY ── */}
          {activeTab === 'set' && (
            <div style={S.card}>
              <div style={S.cardTitle}>Set Overtime Directly</div>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 20px' }}>
                Set overtime for an employee without waiting for their request. The employee will be notified automatically.
              </p>

              {/* Search */}
              <div style={S.formGroup}>
                <label style={S.label}>Search Employee by Name</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={{ ...S.input, flex: 1 }}
                    placeholder="Type employee name..."
                    value={attendanceSearch}
                    onChange={e => setAttendanceSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                  <button style={S.searchBtn} onClick={handleSearch}>Search</button>
                </div>
              </div>

              {/* Results */}
              {searchResults.length > 0 && (
                <div style={S.formGroup}>
                  <label style={S.label}>Select Attendance Record</label>
                  <div style={S.resultList}>
                    {searchResults.map(r => {
                      const name = `${r.employeeId?.firstName || ''} ${r.employeeId?.lastName || ''}`;
                      const sel  = selectedRecord?._id === r._id;
                      return (
                        <div key={r._id} onClick={() => setSelectedRecord(r)}
                          style={{ ...S.resultRow, background: sel ? '#eef2ff' : 'white', border: sel ? '2px solid #667eea' : '1px solid #e5e7eb' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: '#111827' }}>{name}</div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>
                              {fmtDate(r.date)} · {fmtTime(r.clockIn)} – {fmtTime(r.clockOut)} · {r.workHours || 0} hrs
                            </div>
                            {r.overtimeStatus && r.overtimeStatus !== 'none' && (
                              <div style={{ fontSize: 12, color: '#d97706', marginTop: 2 }}>
                                Overtime already set: {r.overtimeStatus} ({minsToHrs(r.overtimeMinutes)})
                              </div>
                            )}
                          </div>
                          {sel && <span style={{ color: '#667eea', fontSize: 20 }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedRecord && (
                <>
                  {/* Selected record summary */}
                  <div style={{ background: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                    <div style={{ fontWeight: 600, color: '#374151' }}>
                      Selected: {selectedRecord.employeeId?.firstName} {selectedRecord.employeeId?.lastName} — {fmtDate(selectedRecord.date)}
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                      Clock In: {fmtTime(selectedRecord.clockIn)} · Clock Out: {fmtTime(selectedRecord.clockOut)} · Regular Hours: {selectedRecord.workHours || 0} hrs
                    </div>
                  </div>

                  <div style={S.formGroup}>
                    <label style={S.label}>Overtime Duration</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                      {[30, 60, 90, 120].map(m => (
                        <button key={m} onClick={() => setDirectMinutes(String(m))}
                          style={{ ...S.quickBtn, background: directMinutes === String(m) ? '#667eea' : '#f3f4f6', color: directMinutes === String(m) ? 'white' : '#374151' }}>
                          {minsToHrs(m)}
                        </button>
                      ))}
                    </div>
                    <input type="number" placeholder="Or enter custom minutes (e.g. 45)"
                      value={directMinutes} onChange={e => setDirectMinutes(e.target.value)}
                      style={S.input} min="1" />
                    {directMinutes > 0 && (
                      <div style={{ fontSize: 12, color: '#667eea', marginTop: 6 }}>= {minsToHrs(parseInt(directMinutes))} overtime</div>
                    )}
                  </div>

                  <div style={S.formGroup}>
                    <label style={S.label}>Note (optional)</label>
                    <input placeholder="e.g. Project X deadline overtime"
                      value={directNote} onChange={e => setDirectNote(e.target.value)} style={S.input} />
                  </div>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button style={{ ...S.setBtn, background: '#f3f4f6', color: '#374151' }}
                      onClick={() => { setSelectedRecord(null); setDirectMinutes(''); setDirectNote(''); setSearchResults([]); setAttendanceSearch(''); }}>
                      Clear
                    </button>
                    <button style={{ ...S.setBtn, opacity: (!directMinutes || directSubmitting) ? 0.5 : 1 }}
                      disabled={!directMinutes || directSubmitting} onClick={handleDirectSet}>
                      {directSubmitting ? 'Saving...' : '✅ Set Overtime'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Approve/Reject Modal ── */}
          {approveModal && (
            <div style={S.overlay} onClick={() => setApproveModal(null)}>
              <div style={S.modal} onClick={e => e.stopPropagation()}>
                <div style={S.modalTitle}>
                  {approveModal.action === 'approve' ? '✅ Approve Overtime Request' : '❌ Reject Overtime Request'}
                </div>

                <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: '#374151' }}>
                  <strong>{approveModal.req.employeeId?.firstName} {approveModal.req.employeeId?.lastName}</strong> — {fmtDate(approveModal.req.date)}<br />
                  Requested: <strong>{minsToHrs(approveModal.req.overtimeMinutes)}</strong>
                  {approveModal.req.overtimeNote && <><br />Note: {approveModal.req.overtimeNote}</>}
                </div>

                {approveModal.action === 'approve' ? (
                  <>
                    <label style={S.label}>Approved Minutes (adjust if needed)</label>
                    <input type="number" value={approveMinutes}
                      onChange={e => setApproveMinutes(e.target.value)}
                      style={{ ...S.input, marginBottom: 8 }} />
                    {approveMinutes > 0 && (
                      <div style={{ fontSize: 12, color: '#667eea', marginBottom: 16 }}>= {minsToHrs(parseInt(approveMinutes))} will be approved</div>
                    )}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                      <button style={{ ...S.setBtn, background: '#f3f4f6', color: '#374151' }} onClick={() => setApproveModal(null)}>Cancel</button>
                      <button style={S.approveBtn} onClick={handleApproveAction} disabled={!!processing}>
                        {processing ? 'Processing...' : '✅ Approve'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <label style={S.label}>Rejection Reason *</label>
                    <textarea placeholder="Explain why this overtime is rejected..."
                      value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                      style={{ ...S.input, height: 80, resize: 'vertical', marginBottom: 16 }} />
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      <button style={{ ...S.setBtn, background: '#f3f4f6', color: '#374151' }} onClick={() => setApproveModal(null)}>Cancel</button>
                      <button style={S.rejectBtn} onClick={handleApproveAction} disabled={!!processing}>
                        {processing ? 'Processing...' : '❌ Reject'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

const S = {
  toast:       { position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  pageHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  pageTitle:   { fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 4px' },
  pageSub:     { fontSize: 14, color: '#6b7280', margin: 0 },
  tabs:        { display: 'flex', gap: 8, marginBottom: 20 },
  tab:         { padding: '10px 20px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: 'white', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8 },
  tabActive:   { background: 'linear-gradient(135deg,#667eea,#764ba2)', border: '2px solid #667eea', color: 'white' },
  badge:       { background: '#fef3c7', color: '#d97706', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10 },
  card:        { background: 'white', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardTitle:   { fontSize: 16, fontWeight: 700, color: '#111827' },
  refreshBtn:  { padding: '6px 14px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#374151' },
  setBtn:      { padding: '10px 20px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  formGroup:   { marginBottom: 16 },
  label:       { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 },
  input:       { width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  searchBtn:   { padding: '10px 18px', background: '#667eea', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' },
  quickBtn:    { padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  resultList:  { display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' },
  resultRow:   { padding: '10px 14px', borderRadius: 10, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  reqCard:     { background: '#f9fafb', borderRadius: 12, padding: '16px 18px', border: '1px solid #e5e7eb' },
  avatar:      { width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 },
  infoBox:     { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 14px', minWidth: 90 },
  infoLabel:   { fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 2 },
  infoVal:     { fontSize: 15, fontWeight: 700, color: '#111827' },
  approveBtn:  { padding: '8px 18px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 },
  rejectBtn:   { padding: '8px 18px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 },
  centerBox:   { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px' },
  spinner:     { width: 36, height: 36, border: '3px solid #f3f3f3', borderTop: '3px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  emptyBox:    { textAlign: 'center', padding: '50px' },
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal:       { background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalTitle:  { fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 },
};

const spinCSS = `@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`;

export default OvertimeManagement;