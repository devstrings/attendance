import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const OvertimeManagement = ({ isManager = false }) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [processing, setProcessing]           = useState(null);
  const [activeTab, setActiveTab]             = useState('pending');

  // Search state
  const [searchQuery, setSearchQuery]         = useState('');
  const [allEmployees, setAllEmployees]       = useState([]);
  const [suggestions, setSuggestions]         = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Date mode: 'today' | 'week'
  const [dateMode, setDateMode]               = useState('today');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedRecord, setSelectedRecord]   = useState(null);
  const [loadingRecords, setLoadingRecords]   = useState(false);

  // Overtime form
  const [directMinutes, setDirectMinutes]     = useState('');
  const [directNote, setDirectNote]           = useState('');
  const [directSubmitting, setDirectSubmitting] = useState(false);

  // Approve/Reject modal
  const [approveModal, setApproveModal]       = useState(null);
  const [approveMinutes, setApproveMinutes]   = useState('');
  const [rejectNote, setRejectNote]           = useState('');

  // ✅ Correction Requests state
  const [correctionRequests, setCorrectionRequests]     = useState([]);
  const [correctionLoading, setCorrectionLoading]       = useState(false);
  const [correctionProcessing, setCorrectionProcessing] = useState(null);
  const [correctionModal, setCorrectionModal]           = useState(null); // { req, action }
  const [correctionResolution, setCorrectionResolution] = useState('');

  // ✅ Direct Attendance Fix state
  const [fixSearchQuery, setFixSearchQuery]         = useState('');
  const [fixSuggestions, setFixSuggestions]         = useState([]);
  const [showFixSuggestions, setShowFixSuggestions] = useState(false);
  const [fixEmployee, setFixEmployee]               = useState(null);
  const [fixDateMode, setFixDateMode]               = useState('week');
  const [fixRecords, setFixRecords]                 = useState([]);
  const [fixLoadingRecords, setFixLoadingRecords]   = useState(false);
  const [fixSelectedRecord, setFixSelectedRecord]   = useState(null);
  const [fixForm, setFixForm]                       = useState({ status: 'present', clockIn: '10:00', clockOut: '19:00', reason: '' });
  const [fixSubmitting, setFixSubmitting]           = useState(false);

  const [toast, setToast]     = useState(null);
  const searchRef             = useRef(null);
  const fixSearchRef          = useRef(null);
  const debounceRef           = useRef(null);
  const fixDebounceRef        = useRef(null);

  const getToken = () =>
    localStorage.getItem('admin_token') ||
    localStorage.getItem('manager_token') ||
    localStorage.getItem('token');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchAllEmployees();
    fetchPending();
    fetchCorrectionRequests();
  }, []);

  // ✅ Jab correction tab open ho to refresh
  useEffect(() => {
    if (activeTab === 'corrections') fetchCorrectionRequests();
  }, [activeTab]);

  const fetchAllEmployees = async () => {
    try {
      const res  = await fetch(`${API}/admin/employees?limit=1000`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      setAllEmployees(data.data?.employees || []);
    } catch (e) {
      console.error('Employees fetch error:', e);
    }
  };

  const fetchPending = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API}/attendance/overtime/pending`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      setPendingRequests(data.data?.requests || []);
    } catch (e) {
      console.error('Fetch pending error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Correction requests fetch
  const fetchCorrectionRequests = async () => {
    try {
      setCorrectionLoading(true);
      const res  = await fetch(`${API}/correction-requests?status=pending&limit=50`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      setCorrectionRequests(data.data?.correctionRequests || []);
    } catch (e) {
      console.error('Correction fetch error:', e);
    } finally {
      setCorrectionLoading(false);
    }
  };

  // ✅ Correction approve
  const handleCorrectionApprove = async () => {
    if (!correctionResolution.trim()) {
      showToast('Resolution note required.', 'error'); return;
    }
    setCorrectionProcessing(correctionModal.req._id);
    try {
      const res  = await fetch(`${API}/correction-requests/${correctionModal.req._id}/approve`, {
        method:  'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ resolution: correctionResolution, updateAttendance: true })
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Correction approved and attendance updated!');
        setCorrectionModal(null); setCorrectionResolution('');
        fetchCorrectionRequests();
        window.dispatchEvent(new CustomEvent('requests-updated'));
      } else {
        showToast(data.message || 'Failed to approve.', 'error');
      }
    } catch (e) {
      showToast('Server error.', 'error');
    } finally {
      setCorrectionProcessing(null);
    }
  };

  // ✅ Correction reject
  const handleCorrectionReject = async () => {
    if (!correctionResolution.trim()) {
      showToast('Rejection reason required.', 'error'); return;
    }
    setCorrectionProcessing(correctionModal.req._id);
    try {
      const res  = await fetch(`${API}/correction-requests/${correctionModal.req._id}/reject`, {
        method:  'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ resolution: correctionResolution })
      });
      const data = await res.json();
      if (data.success) {
        showToast('❌ Correction request rejected.');
        setCorrectionModal(null); setCorrectionResolution('');
        fetchCorrectionRequests();
        window.dispatchEvent(new CustomEvent('requests-updated'));
      } else {
        showToast(data.message || 'Failed to reject.', 'error');
      }
    } catch (e) {
      showToast('Server error.', 'error');
    } finally {
      setCorrectionProcessing(null);
    }
  };

  // ── Live search for overtime ─────────────────────────────────────────────────
  const handleSearchInput = (val) => {
    setSearchQuery(val);
    setSelectedEmployee(null);
    setAttendanceRecords([]);
    setSelectedRecord(null);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(() => {
      const term = val.toLowerCase();
      const matched = allEmployees.filter(emp =>
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(term)
      ).slice(0, 8);
      setSuggestions(matched);
      setShowSuggestions(true);
    }, 200);
  };

  const handleSelectEmployee = async (emp) => {
    setSelectedEmployee(emp);
    setSearchQuery(`${emp.firstName} ${emp.lastName}`);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedRecord(null);
    setDirectMinutes('');
    await fetchEmployeeAttendance(emp._id, dateMode);
  };

  const fetchEmployeeAttendance = async (empId, mode) => {
    setLoadingRecords(true);
    setAttendanceRecords([]);
    try {
      const today = new Date();
      const localDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      let startDate, endDate;
      if (mode === 'today') {
        startDate = endDate = localDate;
      } else {
        endDate = localDate;
        const s = new Date(today);
        s.setDate(today.getDate() - 7);
        startDate = `${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,'0')}-${String(s.getDate()).padStart(2,'0')}`;
      }
      const res  = await fetch(
        `${API}/attendance?employeeId=${empId}&startDate=${startDate}&endDate=${endDate}&limit=50`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const data = await res.json();
      const records = (data.data?.attendance || []).filter(a =>
        ['present', 'half-day', 'late'].includes(a.status)
      );
      setAttendanceRecords(records);
      if (records.length === 0) showToast(`No records found for ${mode === 'today' ? 'today' : 'last 7 days'}.`, 'error');
    } catch (e) {
      console.error('Attendance fetch error:', e);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleDateModeChange = (mode) => {
    setDateMode(mode);
    setSelectedRecord(null);
    if (selectedEmployee) fetchEmployeeAttendance(selectedEmployee._id, mode);
  };

  const handleDirectSet = async () => {
    if (!selectedRecord || !directMinutes || parseInt(directMinutes) <= 0) {
      showToast('Please select an attendance record and enter overtime minutes.', 'error'); return;
    }
    setDirectSubmitting(true);
    try {
      const res  = await fetch(`${API}/attendance/${selectedRecord._id}/overtime`, {
        method:  'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ overtimeMinutes: parseInt(directMinutes), overtimeNote: directNote.trim() })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Overtime set: ${minsToHrs(parseInt(directMinutes))} for ${selectedEmployee?.firstName}`);
        setSelectedRecord(null); setDirectMinutes(''); setDirectNote('');
        setSearchQuery(''); setSelectedEmployee(null); setAttendanceRecords([]);
        fetchPending();
      } else {
        showToast(data.message || 'Failed to set overtime.', 'error');
      }
    } catch (e) {
      showToast('Server error. Please try again.', 'error');
    } finally {
      setDirectSubmitting(false);
    }
  };

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
        body:    JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setApproveModal(null); setApproveMinutes(''); setRejectNote('');
        fetchPending();
      } else {
        showToast(data.message || 'Action failed.', 'error');
      }
    } catch (e) {
      showToast('Server error.', 'error');
    } finally {
      setProcessing(null);
    }
  };

  // ✅ Direct Fix — search
  const handleFixSearchInput = (val) => {
    setFixSearchQuery(val);
    setFixEmployee(null);
    setFixRecords([]);
    setFixSelectedRecord(null);
    clearTimeout(fixDebounceRef.current);
    if (!val.trim()) { setFixSuggestions([]); setShowFixSuggestions(false); return; }
    fixDebounceRef.current = setTimeout(() => {
      const term = val.toLowerCase();
      const matched = allEmployees.filter(emp =>
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(term)
      ).slice(0, 8);
      setFixSuggestions(matched);
      setShowFixSuggestions(true);
    }, 200);
  };

  const handleSelectFixEmployee = async (emp) => {
    setFixEmployee(emp);
    setFixSearchQuery(`${emp.firstName} ${emp.lastName}`);
    setFixSuggestions([]);
    setShowFixSuggestions(false);
    setFixSelectedRecord(null);
    await fetchFixRecords(emp._id, fixDateMode);
  };

  const fetchFixRecords = async (empId, mode) => {
    setFixLoadingRecords(true);
    setFixRecords([]);
    try {
      const today = new Date();
      const toLocal = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const endDate = toLocal(today);
      const s = new Date(today);
      s.setDate(today.getDate() - (mode === 'today' ? 0 : 7));
      const startDate = toLocal(s);

      const res  = await fetch(
        `${API}/attendance?employeeId=${empId}&startDate=${startDate}&endDate=${endDate}&limit=50`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const data = await res.json();
      setFixRecords(data.data?.attendance || []);
    } catch (e) {
      console.error('Fix records fetch error:', e);
    } finally {
      setFixLoadingRecords(false);
    }
  };

  const handleFixDateModeChange = (mode) => {
    setFixDateMode(mode);
    setFixSelectedRecord(null);
    if (fixEmployee) fetchFixRecords(fixEmployee._id, mode);
  };

  // ✅ Direct attendance fix submit
  const handleFixSubmit = async () => {
    if (!fixSelectedRecord) { showToast('Please select an attendance record.', 'error'); return; }
    if (!fixForm.reason.trim()) { showToast('Please enter a reason.', 'error'); return; }
    setFixSubmitting(true);
    try {
      const dateStr = new Date(fixSelectedRecord.date).toISOString().split('T')[0];
      const body = {
        status:    fixForm.status,
        clockIn:   `${dateStr}T${fixForm.clockIn}:00+05:00`,
        clockOut:  fixForm.clockOut ? `${dateStr}T${fixForm.clockOut}:00+05:00` : null,
        correctionReason: fixForm.reason,
      };
      const res  = await fetch(`${API}/attendance/${fixSelectedRecord._id}`, {
        method:  'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Attendance updated for ${fixEmployee?.firstName}!`);
        setFixSelectedRecord(null);
        setFixForm({ status: 'present', clockIn: '10:00', clockOut: '19:00', reason: '' });
        fetchFixRecords(fixEmployee._id, fixDateMode);
      } else {
        showToast(data.message || 'Failed to update.', 'error');
      }
    } catch (e) {
      showToast('Server error.', 'error');
    } finally {
      setFixSubmitting(false);
    }
  };

  const fmtDate = d => new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const fmtTime = t => t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
  const minsToHrs = m => {
    if (!m) return '0 min';
    const h = Math.floor(m / 60), r = m % 60;
    return h === 0 ? `${r} min` : r === 0 ? `${h} hr` : `${h} hr ${r} min`;
  };

  const getStatusColor = (s) => ({
    present: '#10b981', absent: '#ef4444', late: '#f59e0b',
    'half-day': '#8b5cf6', leave: '#3b82f6', 'on-leave': '#3b82f6'
  }[s] || '#6b7280');

  return (
    <div className={isManager ? 'manager-container' : 'admin-container'}>
      <AdminNavbar />
      <div className={isManager ? 'manager-layout' : 'admin-layout'}>
        <AdminSidebar />
        <div className={isManager ? 'manager-content' : 'admin-content'}
          style={{ padding: 24, background: '#f9fafb', minHeight: '100vh' }}>

          {toast && (
            <div style={{ ...S.toast,
              background: toast.type === 'error' ? '#fef2f2' : '#ecfdf5',
              color:      toast.type === 'error' ? '#dc2626' : '#065f46',
              border:    `1px solid ${toast.type === 'error' ? '#fecaca' : '#a7f3d0'}`
            }}>
              {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
            </div>
          )}

          <div style={S.pageHeader}>
            <div>
              <h1 style={S.pageTitle}>⏱️ Overtime & Corrections</h1>
              <p style={S.pageSub}>Review overtime requests, correction requests, and fix attendance directly</p>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div style={S.tabs}>
            <button style={{ ...S.tab, ...(activeTab === 'pending' ? S.tabActive : {}) }}
              onClick={() => setActiveTab('pending')}>
              📋 Pending OT Requests
              {pendingRequests.length > 0 && <span style={S.badge}>{pendingRequests.length}</span>}
            </button>
            <button style={{ ...S.tab, ...(activeTab === 'corrections' ? S.tabActive : {}) }}
              onClick={() => setActiveTab('corrections')}>
              ✏️ Correction Requests
              {correctionRequests.length > 0 && <span style={{ ...S.badge, background: '#fef2f2', color: '#dc2626' }}>{correctionRequests.length}</span>}
            </button>
            <button style={{ ...S.tab, ...(activeTab === 'set' ? S.tabActive : {}) }}
              onClick={() => setActiveTab('set')}>
              ➕ Set Overtime Directly
            </button>
            <button style={{ ...S.tab, ...(activeTab === 'fix' ? S.tabActive : {}) }}
              onClick={() => setActiveTab('fix')}>
              🔧 Fix Attendance Directly
            </button>
          </div>

          {/* ── TAB: PENDING OT ── */}
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                              <div style={S.avatar}>{empName.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                              <div>
                                <div style={{ fontWeight: 700, color: '#111827', fontSize: 15 }}>{empName}</div>
                                <div style={{ fontSize: 12, color: '#9ca3af' }}>{req.employeeId?.employeeCode} · {req.employeeId?.department}</div>
                              </div>
                            </div>
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
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                            <button style={S.approveBtn} disabled={processing === req._id}
                              onClick={() => { setApproveModal({ req, action: 'approve' }); setApproveMinutes(String(req.overtimeMinutes)); }}>
                              ✅ Approve
                            </button>
                            <button style={S.rejectBtn} disabled={processing === req._id}
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

          {/* ── TAB: CORRECTION REQUESTS ── */}
          {activeTab === 'corrections' && (
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={S.cardTitle}>Pending Attendance Correction Requests</div>
                <button style={S.refreshBtn} onClick={fetchCorrectionRequests}>🔄 Refresh</button>
              </div>
              {correctionLoading ? (
                <div style={S.centerBox}><div style={S.spinner} /><style>{spinCSS}</style></div>
              ) : correctionRequests.length === 0 ? (
                <div style={S.emptyBox}>
                  <div style={{ fontSize: 52, opacity: 0.3, marginBottom: 10 }}>✅</div>
                  <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>No Pending Corrections</div>
                  <div style={{ color: '#9ca3af', fontSize: 13 }}>All correction requests have been reviewed.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {correctionRequests.map(req => (
                    <div key={req._id} style={S.reqCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div style={S.avatar}>{(req.employeeName || 'E').split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#111827', fontSize: 15 }}>{req.employeeName}</div>
                              <div style={{ fontSize: 12, color: '#9ca3af' }}>{req.employeeEmail}</div>
                            </div>
                            <span style={{ ...S.priorityBadge, background: req.priority === 'high' ? '#fef2f2' : req.priority === 'medium' ? '#fffbeb' : '#ecfdf5', color: req.priority === 'high' ? '#dc2626' : req.priority === 'medium' ? '#d97706' : '#059669' }}>
                              {req.priority === 'high' ? '🔴' : req.priority === 'medium' ? '🟡' : '🟢'} {req.priority}
                            </span>
                          </div>

                          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                            📅 {fmtDate(req.attendanceDate)} &nbsp;·&nbsp;
                            Issue: <strong>{req.issueType?.replace(/_/g, ' ')}</strong>
                          </div>

                          {/* Status change */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <span style={{ background: '#fef2f2', color: '#dc2626', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                              {req.currentStatus}
                            </span>
                            <span style={{ color: '#9ca3af' }}>→</span>
                            <span style={{ background: '#ecfdf5', color: '#059669', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                              {req.requestedStatus}
                            </span>
                            {req.requestedClockIn && (
                              <span style={{ fontSize: 12, color: '#6b7280' }}>
                                &nbsp;· {req.requestedClockIn} – {req.requestedClockOut || 'N/A'}
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: 13, color: '#374151', background: '#f9fafb', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                            💬 {req.reason}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                          <button style={S.approveBtn} disabled={correctionProcessing === req._id}
                            onClick={() => { setCorrectionModal({ req, action: 'approve' }); setCorrectionResolution(''); }}>
                            ✅ Approve
                          </button>
                          <button style={S.rejectBtn} disabled={correctionProcessing === req._id}
                            onClick={() => { setCorrectionModal({ req, action: 'reject' }); setCorrectionResolution(''); }}>
                            ❌ Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: SET OVERTIME ── */}
          {activeTab === 'set' && (
            <div style={S.card}>
              <div style={S.cardTitle}>Set Overtime Directly</div>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 20px' }}>
                Set overtime for an employee directly. They will be notified automatically.
              </p>
              <div style={S.formGroup}>
                <label style={S.label}>Search Employee</label>
                <div style={{ position: 'relative' }} ref={searchRef}>
                  <input style={S.input} placeholder="Type name to search..."
                    value={searchQuery} onChange={e => handleSearchInput(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    autoComplete="off" />
                  {showSuggestions && suggestions.length > 0 && (
                    <div style={S.dropdown}>
                      {suggestions.map(emp => (
                        <div key={emp._id} style={S.dropItem} onMouseDown={() => handleSelectEmployee(emp)}>
                          <div style={S.dropAvatar}>{emp.firstName?.[0]}{emp.lastName?.[0]}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{emp.firstName} {emp.lastName}</div>
                            <div style={{ fontSize: 12, color: '#9ca3af' }}>{emp.employeeCode} · {emp.department}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedEmployee && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>Select Time Period</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ ...S.modeBtn, ...(dateMode === 'today' ? S.modeBtnActive : {}) }} onClick={() => handleDateModeChange('today')}>📅 Today</button>
                      <button style={{ ...S.modeBtn, ...(dateMode === 'week' ? S.modeBtnActive : {}) }} onClick={() => handleDateModeChange('week')}>📆 Last 7 Days</button>
                    </div>
                  </div>
                  {loadingRecords ? (
                    <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>Loading attendance records...</div>
                  ) : attendanceRecords.length > 0 ? (
                    <div style={S.formGroup}>
                      <label style={S.label}>Select Attendance Record <span style={{ color: '#9ca3af', fontWeight: 400 }}>({attendanceRecords.length} found)</span></label>
                      <div style={S.resultList}>
                        {attendanceRecords.map(r => {
                          const sel = selectedRecord?._id === r._id;
                          const hasOT = r.overtimeStatus && r.overtimeStatus !== 'none';
                          return (
                            <div key={r._id} onClick={() => { setSelectedRecord(r); setDirectMinutes(''); }}
                              style={{ ...S.resultRow, background: sel ? '#eef2ff' : 'white', border: sel ? '2px solid #667eea' : '1px solid #e5e7eb' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: '#111827', marginBottom: 2 }}>{fmtDate(r.date)}</div>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>In: {fmtTime(r.clockIn)} · Out: {fmtTime(r.clockOut)} · {r.workHours || 0} hrs</div>
                                {hasOT && <div style={{ fontSize: 12, color: '#d97706', marginTop: 2, fontWeight: 600 }}>⏱️ OT already: {r.overtimeStatus} ({minsToHrs(r.overtimeMinutes)})</div>}
                              </div>
                              {sel && <span style={{ color: '#667eea', fontSize: 22, fontWeight: 700 }}>✓</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: 16, background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
                      ❌ No records found for {selectedEmployee.firstName} in {dateMode === 'today' ? 'today' : 'last 7 days'}.
                    </div>
                  )}
                </>
              )}

              {selectedRecord && (
                <>
                  <div style={{ background: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                    <div style={{ fontWeight: 600, color: '#374151' }}>✅ {selectedEmployee?.firstName} {selectedEmployee?.lastName} — {fmtDate(selectedRecord.date)}</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>In: {fmtTime(selectedRecord.clockIn)} · Out: {fmtTime(selectedRecord.clockOut)} · {selectedRecord.workHours || 0} hrs</div>
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
                    <input type="number" placeholder="Or enter custom minutes" value={directMinutes} onChange={e => setDirectMinutes(e.target.value)} style={S.input} min="1" />
                    {directMinutes > 0 && <div style={{ fontSize: 12, color: '#667eea', marginTop: 6 }}>= {minsToHrs(parseInt(directMinutes))} overtime</div>}
                  </div>
                  <div style={S.formGroup}>
                    <label style={S.label}>Note (optional)</label>
                    <input placeholder="e.g. Project deadline overtime" value={directNote} onChange={e => setDirectNote(e.target.value)} style={S.input} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button style={{ ...S.setBtn, background: '#f3f4f6', color: '#374151' }} onClick={() => { setSelectedRecord(null); setDirectMinutes(''); setDirectNote(''); }}>Clear</button>
                    <button style={{ ...S.setBtn, opacity: (!directMinutes || directSubmitting) ? 0.5 : 1 }} disabled={!directMinutes || directSubmitting} onClick={handleDirectSet}>
                      {directSubmitting ? 'Saving...' : '✅ Set Overtime'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── TAB: FIX ATTENDANCE ── */}
          {activeTab === 'fix' && (
            <div style={S.card}>
              <div style={S.cardTitle}>🔧 Fix Attendance Directly</div>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 20px' }}>
                Directly correct any employee's attendance record for the last 7 days.
              </p>

              <div style={S.formGroup}>
                <label style={S.label}>Search Employee</label>
                <div style={{ position: 'relative' }} ref={fixSearchRef}>
                  <input style={S.input} placeholder="Type name to search..."
                    value={fixSearchQuery} onChange={e => handleFixSearchInput(e.target.value)}
                    onFocus={() => fixSuggestions.length > 0 && setShowFixSuggestions(true)}
                    autoComplete="off" />
                  {showFixSuggestions && fixSuggestions.length > 0 && (
                    <div style={S.dropdown}>
                      {fixSuggestions.map(emp => (
                        <div key={emp._id} style={S.dropItem} onMouseDown={() => handleSelectFixEmployee(emp)}>
                          <div style={S.dropAvatar}>{emp.firstName?.[0]}{emp.lastName?.[0]}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{emp.firstName} {emp.lastName}</div>
                            <div style={{ fontSize: 12, color: '#9ca3af' }}>{emp.employeeCode}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {fixEmployee && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>Select Time Period</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ ...S.modeBtn, ...(fixDateMode === 'today' ? S.modeBtnActive : {}) }} onClick={() => handleFixDateModeChange('today')}>📅 Today</button>
                      <button style={{ ...S.modeBtn, ...(fixDateMode === 'week' ? S.modeBtnActive : {}) }} onClick={() => handleFixDateModeChange('week')}>📆 Last 7 Days</button>
                    </div>
                  </div>

                  {fixLoadingRecords ? (
                    <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>Loading records...</div>
                  ) : fixRecords.length > 0 ? (
                    <div style={S.formGroup}>
                      <label style={S.label}>Select Record to Fix <span style={{ color: '#9ca3af', fontWeight: 400 }}>({fixRecords.length} found)</span></label>
                      <div style={S.resultList}>
                        {fixRecords.map(r => {
                          const sel = fixSelectedRecord?._id === r._id;
                          return (
                            <div key={r._id}
                              onClick={() => {
                                setFixSelectedRecord(r);
                                setFixForm({
                                  status: r.status,
                                  clockIn: r.clockIn ? new Date(r.clockIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : '10:00',
                                  clockOut: r.clockOut ? new Date(r.clockOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : '19:00',
                                  reason: ''
                                });
                              }}
                              style={{ ...S.resultRow, background: sel ? '#eef2ff' : 'white', border: sel ? '2px solid #667eea' : '1px solid #e5e7eb' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: '#111827', marginBottom: 2 }}>{fmtDate(r.date)}</div>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>
                                  In: {fmtTime(r.clockIn)} · Out: {fmtTime(r.clockOut)}
                                  &nbsp;·&nbsp;
                                  <span style={{ color: getStatusColor(r.status), fontWeight: 600 }}>{r.status}</span>
                                </div>
                              </div>
                              {sel && <span style={{ color: '#667eea', fontSize: 22, fontWeight: 700 }}>✓</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: 16, background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
                      ❌ No records found.
                    </div>
                  )}
                </>
              )}

              {fixSelectedRecord && (
                <>
                  <div style={{ background: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                    <div style={{ fontWeight: 600, color: '#374151' }}>Editing: {fixEmployee?.firstName} {fixEmployee?.lastName} — {fmtDate(fixSelectedRecord.date)}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div style={S.formGroup}>
                      <label style={S.label}>Status</label>
                      <select value={fixForm.status} onChange={e => setFixForm(f => ({ ...f, status: e.target.value }))} style={S.input}>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="half-day">Half Day</option>
                        <option value="leave">Leave</option>
                      </select>
                    </div>
                    <div style={S.formGroup}>
                      <label style={S.label}>Clock In</label>
                      <input type="time" value={fixForm.clockIn} onChange={e => setFixForm(f => ({ ...f, clockIn: e.target.value }))} style={S.input} />
                    </div>
                    <div style={S.formGroup}>
                      <label style={S.label}>Clock Out</label>
                      <input type="time" value={fixForm.clockOut} onChange={e => setFixForm(f => ({ ...f, clockOut: e.target.value }))} style={S.input} />
                    </div>
                    <div style={S.formGroup}>
                      <label style={S.label}>Reason *</label>
                      <input placeholder="Why are you correcting this?" value={fixForm.reason} onChange={e => setFixForm(f => ({ ...f, reason: e.target.value }))} style={S.input} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button style={{ ...S.setBtn, background: '#f3f4f6', color: '#374151' }} onClick={() => setFixSelectedRecord(null)}>Cancel</button>
                    <button style={{ ...S.setBtn, opacity: fixSubmitting ? 0.5 : 1 }} disabled={fixSubmitting} onClick={handleFixSubmit}>
                      {fixSubmitting ? 'Saving...' : '✅ Save Changes'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── OT Approve/Reject Modal ── */}
          {approveModal && (
            <div style={S.overlay} onClick={() => setApproveModal(null)}>
              <div style={S.modal} onClick={e => e.stopPropagation()}>
                <div style={S.modalTitle}>{approveModal.action === 'approve' ? '✅ Approve Overtime' : '❌ Reject Overtime'}</div>
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: '#374151' }}>
                  <strong>{approveModal.req.employeeId?.firstName} {approveModal.req.employeeId?.lastName}</strong> — {fmtDate(approveModal.req.date)}<br />
                  Requested: <strong>{minsToHrs(approveModal.req.overtimeMinutes)}</strong>
                  {approveModal.req.overtimeNote && <><br />Note: {approveModal.req.overtimeNote}</>}
                </div>
                {approveModal.action === 'approve' ? (
                  <>
                    <label style={S.label}>Approved Minutes (adjust if needed)</label>
                    <input type="number" value={approveMinutes} onChange={e => setApproveMinutes(e.target.value)} style={{ ...S.input, marginBottom: 8 }} />
                    {approveMinutes > 0 && <div style={{ fontSize: 12, color: '#667eea', marginBottom: 12 }}>= {minsToHrs(parseInt(approveMinutes))} will be approved</div>}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      <button style={{ ...S.setBtn, background: '#f3f4f6', color: '#374151' }} onClick={() => setApproveModal(null)}>Cancel</button>
                      <button style={S.approveBtn} onClick={handleApproveAction} disabled={!!processing}>{processing ? 'Processing...' : '✅ Approve'}</button>
                    </div>
                  </>
                ) : (
                  <>
                    <label style={S.label}>Rejection Reason *</label>
                    <textarea placeholder="Explain why this overtime is rejected..." value={rejectNote} onChange={e => setRejectNote(e.target.value)} style={{ ...S.input, height: 80, resize: 'vertical', marginBottom: 16 }} />
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      <button style={{ ...S.setBtn, background: '#f3f4f6', color: '#374151' }} onClick={() => setApproveModal(null)}>Cancel</button>
                      <button style={S.rejectBtn} onClick={handleApproveAction} disabled={!!processing}>{processing ? 'Processing...' : '❌ Reject'}</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Correction Approve/Reject Modal ── */}
          {correctionModal && (
            <div style={S.overlay} onClick={() => setCorrectionModal(null)}>
              <div style={S.modal} onClick={e => e.stopPropagation()}>
                <div style={S.modalTitle}>
                  {correctionModal.action === 'approve' ? '✅ Approve Correction' : '❌ Reject Correction'}
                </div>
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: '#374151' }}>
                  <strong>{correctionModal.req.employeeName}</strong> — {fmtDate(correctionModal.req.attendanceDate)}<br />
                  Change: <strong>{correctionModal.req.currentStatus}</strong> → <strong>{correctionModal.req.requestedStatus}</strong><br />
                  Reason: {correctionModal.req.reason}
                </div>
                <label style={S.label}>{correctionModal.action === 'approve' ? 'Resolution Note *' : 'Rejection Reason *'}</label>
                <textarea
                  placeholder={correctionModal.action === 'approve' ? 'Describe what was corrected...' : 'Explain why rejected...'}
                  value={correctionResolution}
                  onChange={e => setCorrectionResolution(e.target.value)}
                  style={{ ...S.input, height: 80, resize: 'vertical', marginBottom: 16 }}
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button style={{ ...S.setBtn, background: '#f3f4f6', color: '#374151' }} onClick={() => setCorrectionModal(null)}>Cancel</button>
                  {correctionModal.action === 'approve' ? (
                    <button style={S.approveBtn} onClick={handleCorrectionApprove} disabled={!!correctionProcessing}>
                      {correctionProcessing ? 'Processing...' : '✅ Approve & Update'}
                    </button>
                  ) : (
                    <button style={S.rejectBtn} onClick={handleCorrectionReject} disabled={!!correctionProcessing}>
                      {correctionProcessing ? 'Processing...' : '❌ Reject'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

const S = {
  toast:        { position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  pageHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  pageTitle:    { fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 4px' },
  pageSub:      { fontSize: 14, color: '#6b7280', margin: 0 },
  tabs:         { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  tab:          { padding: '10px 20px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: 'white', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8 },
  tabActive:    { background: 'linear-gradient(135deg,#667eea,#764ba2)', border: '2px solid #667eea', color: 'white' },
  badge:        { background: '#fef3c7', color: '#d97706', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10 },
  priorityBadge:{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 },
  card:         { background: 'white', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardTitle:    { fontSize: 16, fontWeight: 700, color: '#111827' },
  refreshBtn:   { padding: '6px 14px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#374151' },
  setBtn:       { padding: '10px 20px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  formGroup:    { marginBottom: 16 },
  label:        { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 },
  input:        { width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  quickBtn:     { padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  dropdown:     { position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #e5e7eb', zIndex: 100, overflow: 'hidden', marginTop: 4 },
  dropItem:     { padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 },
  dropAvatar:   { width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  modeBtn:      { padding: '8px 18px', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'white', color: '#374151' },
  modeBtnActive:{ background: '#667eea', border: '2px solid #667eea', color: 'white' },
  resultList:   { display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' },
  resultRow:    { padding: '12px 14px', borderRadius: 10, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  reqCard:      { background: '#f9fafb', borderRadius: 12, padding: '16px 18px', border: '1px solid #e5e7eb' },
  avatar:       { width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 },
  infoBox:      { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 14px', minWidth: 90 },
  infoLabel:    { fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 2 },
  infoVal:      { fontSize: 15, fontWeight: 700, color: '#111827' },
  approveBtn:   { padding: '8px 18px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 },
  rejectBtn:    { padding: '8px 18px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 },
  centerBox:    { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px' },
  spinner:      { width: 36, height: 36, border: '3px solid #f3f3f3', borderTop: '3px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  emptyBox:     { textAlign: 'center', padding: '50px' },
  overlay:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal:        { background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalTitle:   { fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 },
};

const spinCSS = `@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`;

export default OvertimeManagement;