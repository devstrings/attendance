import React, { useState, useEffect, useCallback } from 'react';

// ============================================================
// ⏰ OvertimeManagement.jsx — Admin + Manager Frontend
// Admin: /admin/overtime  |  Manager: /manager/overtime
// Yeh component dono ke liye use hoga — role se behavior change hoga
// ============================================================

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const OvertimeManagement = ({ isManager = false }) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  // Direct set overtime state
  const [showSetForm, setShowSetForm] = useState(false);
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [directMinutes, setDirectMinutes] = useState('');
  const [directNote, setDirectNote] = useState('');
  const [directSubmitting, setDirectSubmitting] = useState(false);

  // Approve modal state
  const [approveModal, setApproveModal] = useState(null); // { req, action: 'approve'|'reject' }
  const [approveMinutes, setApproveMinutes] = useState('');
  const [rejectNote, setRejectNote] = useState('');

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
      const res = await fetch(`${API}/attendance/overtime/pending`, {
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

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  // Employee attendance search (last 30 days)
  const handleAttendanceSearch = async () => {
    if (!attendanceSearch.trim()) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const past30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const res = await fetch(
        `${API}/attendance?startDate=${past30}&endDate=${today}&limit=200`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const data = await res.json();
      const all = data.data?.attendance || [];

      // Name se filter karo
      const term = attendanceSearch.toLowerCase();
      const filtered = all.filter((a) => {
        const name = `${a.employeeId?.firstName || ''} ${a.employeeId?.lastName || ''}`.toLowerCase();
        return name.includes(term) && (a.status === 'present' || a.status === 'half-day');
      });

      setSearchResults(filtered.slice(0, 20));
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  // Direct overtime set
  const handleDirectSet = async () => {
    if (!selectedRecord || !directMinutes || parseInt(directMinutes) <= 0) {
      showToast('Record aur overtime minutes required hain.', 'error');
      return;
    }
    setDirectSubmitting(true);
    try {
      const res = await fetch(
        `${API}/attendance/${selectedRecord._id}/overtime`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            overtimeMinutes: parseInt(directMinutes),
            overtimeNote: directNote.trim(),
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setShowSetForm(false);
        setSelectedRecord(null);
        setDirectMinutes('');
        setDirectNote('');
        setSearchResults([]);
        setAttendanceSearch('');
        fetchPending();
      } else {
        showToast(data.message || 'Failed to set overtime.', 'error');
      }
    } catch (err) {
      showToast('Server error.', 'error');
    } finally {
      setDirectSubmitting(false);
    }
  };

  // Approve / Reject
  const handleApproveAction = async () => {
    if (!approveModal) return;
    const { req, action } = approveModal;

    if (action === 'reject' && !rejectNote.trim()) {
      showToast('Rejection reason likhein.', 'error');
      return;
    }

    setProcessing(req._id);
    try {
      const body =
        action === 'approve'
          ? { approved: true, overtimeMinutes: approveMinutes ? parseInt(approveMinutes) : undefined }
          : { approved: false, rejectionNote: rejectNote };

      const res = await fetch(
        `${API}/attendance/${req._id}/overtime-approve`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setApproveModal(null);
        setApproveMinutes('');
        setRejectNote('');
        fetchPending();
      } else {
        showToast(data.message || 'Action failed.', 'error');
      }
    } catch (err) {
      showToast('Server error.', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-GB', {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    });

  const formatTime = (t) =>
    t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

  const minsToHrs = (m) => {
    if (!m) return '0 min';
    const h = Math.floor(m / 60);
    const rem = m % 60;
    if (h === 0) return `${rem} min`;
    return rem === 0 ? `${h} hr` : `${h} hr ${rem} min`;
  };

  return (
    <div style={S.wrapper}>

      {/* Toast */}
      {toast && (
        <div style={{ ...S.toast, background: toast.type === 'error' ? '#fef2f2' : '#ecfdf5', color: toast.type === 'error' ? '#dc2626' : '#065f46', border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#a7f3d0'}` }}>
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>⏰ Overtime Management</h1>
          <p style={S.pageSub}>
            {isManager ? 'Apne employees ka overtime manage karo' : 'Saare employees ka overtime manage karo'}
          </p>
        </div>
        <button style={S.setBtn} onClick={() => setShowSetForm(!showSetForm)}>
          {showSetForm ? '✕ Close' : '+ Set Overtime Directly'}
        </button>
      </div>

      {/* ── DIRECT SET FORM ── */}
      {showSetForm && (
        <div style={S.card}>
          <div style={S.cardTitle}>🎯 Directly Employee Ka Overtime Set Karo</div>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            Employee ki request ke bina seedha overtime set karo (jab admin/manager ko already pata ho)
          </p>

          <div style={S.formGroup}>
            <label style={S.label}>🔍 Employee Name Search Karo</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                style={{ ...S.input, flex: 1 }}
                placeholder="Employee ka naam likhein..."
                value={attendanceSearch}
                onChange={(e) => setAttendanceSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAttendanceSearch()}
              />
              <button style={S.searchBtn} onClick={handleAttendanceSearch}>
                Search
              </button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div style={S.formGroup}>
              <label style={S.label}>📋 Attendance Record Select Karo</label>
              <div style={S.resultList}>
                {searchResults.map((r) => {
                  const empName = `${r.employeeId?.firstName || ''} ${r.employeeId?.lastName || ''}`;
                  const isSelected = selectedRecord?._id === r._id;
                  return (
                    <div
                      key={r._id}
                      onClick={() => setSelectedRecord(r)}
                      style={{
                        ...S.resultRow,
                        background: isSelected ? '#eef2ff' : 'white',
                        border: isSelected ? '2px solid #667eea' : '1px solid #e5e7eb',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#111827' }}>{empName}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                          {formatDate(r.date)} · {formatTime(r.clockIn)} – {formatTime(r.clockOut)} · {r.workHours || 0} hrs
                        </div>
                        {r.overtimeStatus && r.overtimeStatus !== 'none' && (
                          <div style={{ fontSize: 12, color: '#d97706', marginTop: 2 }}>
                            Overtime: {r.overtimeStatus} ({minsToHrs(r.overtimeMinutes)})
                          </div>
                        )}
                      </div>
                      {isSelected && <span style={{ color: '#667eea', fontSize: 18 }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedRecord && (
            <>
              <div style={S.formGroup}>
                <label style={S.label}>⏱️ Overtime Minutes</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {[30, 60, 90, 120].map((m) => (
                    <button
                      key={m}
                      onClick={() => setDirectMinutes(String(m))}
                      style={{ ...S.quickBtn, background: directMinutes === String(m) ? '#667eea' : '#f3f4f6', color: directMinutes === String(m) ? 'white' : '#374151' }}
                    >
                      {minsToHrs(m)}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  placeholder="Ya manually likhein (minutes mein)"
                  value={directMinutes}
                  onChange={(e) => setDirectMinutes(e.target.value)}
                  style={S.input}
                  min="1"
                />
                {directMinutes > 0 && (
                  <div style={{ fontSize: 12, color: '#667eea', marginTop: 6 }}>
                    = {minsToHrs(parseInt(directMinutes))} overtime
                  </div>
                )}
              </div>

              <div style={S.formGroup}>
                <label style={S.label}>📝 Note (optional)</label>
                <input
                  placeholder="Kisi kaam ka note, e.g. Project X overtime"
                  value={directNote}
                  onChange={(e) => setDirectNote(e.target.value)}
                  style={S.input}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  style={{ ...S.setBtn, background: '#f3f4f6', color: '#374151' }}
                  onClick={() => { setSelectedRecord(null); setDirectMinutes(''); setDirectNote(''); }}
                >
                  Clear
                </button>
                <button
                  style={{ ...S.setBtn, opacity: (!directMinutes || directSubmitting) ? 0.5 : 1 }}
                  disabled={!directMinutes || directSubmitting}
                  onClick={handleDirectSet}
                >
                  {directSubmitting ? 'Setting...' : '✅ Set Overtime'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── PENDING REQUESTS ── */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={S.cardTitle}>
            📋 Pending Overtime Requests
            {pendingRequests.length > 0 && (
              <span style={S.badge}>{pendingRequests.length}</span>
            )}
          </div>
          <button style={S.refreshBtn} onClick={fetchPending}>🔄 Refresh</button>
        </div>

        {loading ? (
          <div style={S.centerBox}><div style={S.spinner} /></div>
        ) : pendingRequests.length === 0 ? (
          <div style={S.emptyBox}>
            <div style={{ fontSize: 48, opacity: 0.3, marginBottom: 8 }}>✅</div>
            <div style={{ color: '#6b7280', fontSize: 14 }}>Koi pending overtime request nahi</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingRequests.map((req) => {
              const empName = `${req.employeeId?.firstName || ''} ${req.employeeId?.lastName || ''}`;
              return (
                <div key={req._id} style={S.reqCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={S.avatar}>
                          {empName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#111827', fontSize: 15 }}>{empName}</div>
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>
                            {req.employeeId?.employeeCode || ''} · {req.employeeId?.department || ''}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                        📅 {formatDate(req.date)} &nbsp;·&nbsp;
                        {formatTime(req.clockIn)} – {formatTime(req.clockOut)} &nbsp;·&nbsp;
                        Regular: {req.workHours || 0} hrs
                      </div>

                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ ...S.infoBox, background: '#fffbeb', border: '1px solid #fde68a' }}>
                          <div style={S.infoLabel}>Requested Overtime</div>
                          <div style={{ ...S.infoVal, color: '#d97706' }}>{minsToHrs(req.overtimeMinutes)}</div>
                        </div>
                        <div style={S.infoBox}>
                          <div style={S.infoLabel}>Requested At</div>
                          <div style={S.infoVal}>{req.overtimeRequestedAt ? formatDate(req.overtimeRequestedAt) : '—'}</div>
                        </div>
                      </div>

                      {req.overtimeNote && (
                        <div style={{ marginTop: 10, fontSize: 13, color: '#374151', background: '#f9fafb', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                          📝 {req.overtimeNote}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                      <button
                        style={S.approveBtn}
                        disabled={processing === req._id}
                        onClick={() => { setApproveModal({ req, action: 'approve' }); setApproveMinutes(String(req.overtimeMinutes)); }}
                      >
                        ✅ Approve
                      </button>
                      <button
                        style={S.rejectBtn}
                        disabled={processing === req._id}
                        onClick={() => { setApproveModal({ req, action: 'reject' }); }}
                      >
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

      {/* ── APPROVE/REJECT MODAL ── */}
      {approveModal && (
        <div style={S.modalOverlay} onClick={() => setApproveModal(null)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalTitle}>
              {approveModal.action === 'approve' ? '✅ Overtime Approve Karo' : '❌ Overtime Reject Karo'}
            </div>

            {approveModal.action === 'approve' ? (
              <>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
                  Employee ne {minsToHrs(approveModal.req.overtimeMinutes)} request ki hai. Aap directly approve kar sakte ho ya minutes adjust kar sakte ho.
                </p>
                <label style={S.label}>Overtime Minutes (adjust karo agar chahiye)</label>
                <input
                  type="number"
                  value={approveMinutes}
                  onChange={(e) => setApproveMinutes(e.target.value)}
                  style={{ ...S.input, marginBottom: 16 }}
                />
                {approveMinutes > 0 && (
                  <div style={{ fontSize: 12, color: '#667eea', marginBottom: 16 }}>
                    = {minsToHrs(parseInt(approveMinutes))} approve hogi
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button style={{ ...S.setBtn, background: '#f3f4f6', color: '#374151' }} onClick={() => setApproveModal(null)}>Cancel</button>
                  <button style={S.approveBtn} onClick={handleApproveAction} disabled={!!processing}>
                    {processing ? 'Processing...' : '✅ Approve Karo'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
                  Rejection reason likhna zaroori hai taake employee samajh sake.
                </p>
                <label style={S.label}>Rejection Reason *</label>
                <textarea
                  placeholder="Wajah likhein..."
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  style={{ ...S.input, height: 80, resize: 'vertical', marginBottom: 16 }}
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button style={{ ...S.setBtn, background: '#f3f4f6', color: '#374151' }} onClick={() => setApproveModal(null)}>Cancel</button>
                  <button style={S.rejectBtn} onClick={handleApproveAction} disabled={!!processing}>
                    {processing ? 'Processing...' : '❌ Reject Karo'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  wrapper:     { padding: 24, background: '#f9fafb', minHeight: '100vh' },
  toast:       { position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  pageHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  pageTitle:   { fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 4px' },
  pageSub:     { fontSize: 14, color: '#6b7280', margin: 0 },
  setBtn:      { padding: '10px 20px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  card:        { background: 'white', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardTitle:   { fontSize: 16, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 },
  badge:       { background: '#fef3c7', color: '#d97706', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 10 },
  refreshBtn:  { padding: '6px 14px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#374151' },
  formGroup:   { marginBottom: 16 },
  label:       { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 },
  input:       { width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  searchBtn:   { padding: '10px 18px', background: '#667eea', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' },
  quickBtn:    { padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  resultList:  { display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' },
  resultRow:   { padding: '10px 14px', borderRadius: 10, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  reqCard:     { background: '#f9fafb', borderRadius: 12, padding: '16px 18px', border: '1px solid #e5e7eb' },
  avatar:      { width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 },
  infoBox:     { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 14px', minWidth: 90 },
  infoLabel:   { fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 2 },
  infoVal:     { fontSize: 15, fontWeight: 700, color: '#111827' },
  approveBtn:  { padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 },
  rejectBtn:   { padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 },
  centerBox:   { display: 'flex', justifyContent: 'center', padding: '40px' },
  spinner:     { width: 32, height: 32, border: '3px solid #f3f3f3', borderTop: '3px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  emptyBox:    { textAlign: 'center', padding: '40px' },
  modalOverlay:{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal:       { background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalTitle:  { fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 },
};

export default OvertimeManagement;