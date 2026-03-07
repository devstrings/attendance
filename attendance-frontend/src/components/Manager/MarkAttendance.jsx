import React, { useState, useEffect } from 'react';
import ManagerNavbar from './ManagerNavbar';
import ManagerSidebar from './ManagerSidebar';
import managerService from '../../services/managerService';
import ManagerMarkAttendanceModal from './ManagerMarkAttendanceModal';
import '../../styles/Manager.css';

const MarkAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [apiError, setApiError]     = useState('');

  // ✅ Fetch whenever date changes
  useEffect(() => { fetchData(); }, [selectedDate]);

  // ✅ Filter whenever records/search/status changes
  useEffect(() => { filterRecords(); }, [searchTerm, filterStatus, attendanceRecords]);

  const fetchData = async () => {
    setLoading(true);
    setApiError('');
    try {
      console.log('📅 Fetching data for date:', selectedDate);

      // Fetch both in parallel
      const [attendanceRes, employeesRes] = await Promise.all([
        managerService.getAttendanceByDate({ date: selectedDate }),
        managerService.getMyEmployees()
      ]);

      console.log('📊 Attendance response:', attendanceRes);
      console.log('👥 Employees response:', employeesRes);

      // ── Process attendance ──
      if (attendanceRes?.success) {
        // Handle different response structures from backend
        const rawRecords =
          attendanceRes.data?.attendance ||
          attendanceRes.data?.records    ||
          attendanceRes.attendance       ||
          attendanceRes.records          ||
          [];

        console.log(`✅ Found ${rawRecords.length} attendance records`);

        const formatted = rawRecords.map(record => {
          const emp = record.employeeId || record.employee || {};
          return {
            id:           record._id,
            employeeId:   emp.employeeCode || emp.empCode || 'N/A',
            employeeName: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown',
            department:   emp.department || 'N/A',
            status:       record.status || 'unknown',
            clockIn:  record.clockIn
              ? new Date(record.clockIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
              : null,
            clockOut: record.clockOut
              ? new Date(record.clockOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
              : null,
            hoursWorked: record.workHours || record.hoursWorked || 0,
            notes: record.remarks || record.notes || ''
          };
        });

        setAttendanceRecords(formatted);
      } else {
        console.warn('⚠️ Attendance fetch failed or returned no success flag');
        setAttendanceRecords([]);
        if (attendanceRes?.message) setApiError(attendanceRes.message);
      }

      // ── Process employees count ──
      if (employeesRes?.success) {
        const emps =
          employeesRes.data?.employees ||
          employeesRes.employees       ||
          [];
        setTotalEmployees(emps.length);
      }

    } catch (error) {
      console.error('❌ fetchData error:', error);
      setAttendanceRecords([]);
      setApiError('Failed to load attendance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...attendanceRecords];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.employeeName.toLowerCase().includes(q) ||
        r.employeeId.toLowerCase().includes(q)
      );
    }

    if (filterStatus) {
      if (filterStatus === 'leave') {
        filtered = filtered.filter(r => r.status === 'leave' || r.status === 'on-leave');
      } else {
        filtered = filtered.filter(r => r.status === filterStatus);
      }
    }

    setFilteredRecords(filtered);
  };

  const handleAttendanceMarked = () => {
    setShowModal(false);
    fetchData(); // ✅ Refresh after marking
  };

  // ── Stats ──
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const leaveCount   = attendanceRecords.filter(r => r.status === 'leave' || r.status === 'on-leave').length;
  const absentCount  = Math.max(0, totalEmployees - presentCount - leaveCount);

  // ── Format display date ──
  const displayDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="manager-container">
        <ManagerNavbar />
        <div className="manager-layout">
          <ManagerSidebar />
          <div className="manager-content" style={S.content}>
            <div style={S.loadingBox}>
              <div style={S.spinner}></div>
              <p style={{ color: '#6b7280', marginTop: 12 }}>
                Loading attendance for {displayDate}...
              </p>
            </div>
          </div>
        </div>
        <style>{spinnerCSS}</style>
      </div>
    );
  }

  return (
    <div className="manager-container">
      <ManagerNavbar />
      <div className="manager-layout">
        <ManagerSidebar />
        <div className="manager-content" style={S.content}>

          {/* ── Header ── */}
          <div style={S.header}>
            <div>
              <h1 style={S.pageTitle}>📋 Attendance View</h1>
              <p style={S.pageSubtitle}>
                Track and manage your team's attendance
                {!isToday && <span style={S.historyBadge}>📜 History</span>}
              </p>
            </div>
            <div style={S.dateBox}>
              <span style={{ fontSize: 18 }}>📅</span>
              <input
                type="date"
                value={selectedDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => {
                  console.log('📅 Date changed to:', e.target.value);
                  setSelectedDate(e.target.value);
                }}
                style={S.dateInput}
              />
            </div>
          </div>

          {/* ── API Error ── */}
          {apiError && (
            <div style={S.errorBanner}>
              ⚠️ {apiError}
              <button style={S.retryBtn} onClick={fetchData}>🔄 Retry</button>
            </div>
          )}

          {/* ── Stats Grid ── */}
          <div style={S.statsGrid}>
            {[
              { label: 'My Employees', value: totalEmployees, color: '#8b5cf6' },
              { label: 'Present',      value: presentCount,   color: '#10b981' },
              { label: 'Absent',       value: absentCount,    color: '#ef4444' },
              { label: 'On Leave',     value: leaveCount,     color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} style={{ ...S.statCard, borderLeftColor: s.color }}>
                <div style={S.statLabel}>{s.label}</div>
                <div style={{ ...S.statValue, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* ── Mark Attendance Button (only for today) ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: 12, alignItems: 'center' }}>
            {!isToday && (
              <span style={S.viewingLabel}>
                Viewing: <strong>{displayDate}</strong>
              </span>
            )}
            {isToday && (
              <button
                onClick={() => setShowModal(true)}
                style={S.markBtn}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(102,126,234,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(102,126,234,0.3)'; }}
              >
                <span style={{ fontSize: 18 }}>✓</span>
                Mark Attendance
              </button>
            )}
          </div>

          {/* ── Filters ── */}
          <div style={S.filtersRow}>
            <input
              type="text"
              placeholder="🔍 Search by name or ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={S.searchInput}
            />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={S.filterSelect}
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="leave">Leave</option>
            </select>
            <button
              style={S.clearBtn}
              onClick={() => { setSearchTerm(''); setFilterStatus(''); }}
            >
              🗑️ Clear Filters
            </button>
          </div>

          {/* ── Table ── */}
          <div style={S.tableCard}>
            {/* Selected Date Banner */}
            <div style={S.dateBanner}>
              <span>📅 {displayDate}</span>
              <span style={{ color: '#9ca3af', fontSize: 12 }}>
                {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} found
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={S.table}>
                <thead>
                  <tr style={S.theadRow}>
                    {['Employee ID','Name','Department','Status','Clock In','Clock Out','Hours','Notes'].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length > 0 ? filteredRecords.map((record, idx) => (
                    <tr
                      key={record.id || idx}
                      style={{ background: 'white', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <td style={S.td}>
                        <span style={S.idBadge}>{record.employeeId}</span>
                      </td>
                      <td style={{ ...S.td, fontWeight: 600, color: '#111827' }}>{record.employeeName}</td>
                      <td style={S.td}>{record.department}</td>
                      <td style={S.td}>
                        <span style={getStatusStyle(record.status)}>
                          {getStatusEmoji(record.status)}{' '}
                          {(record.status === 'leave' || record.status === 'on-leave') ? 'Leave' : record.status}
                        </span>
                      </td>
                      <td style={S.td}>{record.clockIn  || <span style={{ color: '#9ca3af' }}>—</span>}</td>
                      <td style={S.td}>{record.clockOut || <span style={{ color: '#9ca3af' }}>—</span>}</td>
                      <td style={S.td}>
                        {record.hoursWorked > 0
                          ? <span style={S.hoursChip}>{record.hoursWorked} hrs</span>
                          : <span style={{ color: '#9ca3af' }}>—</span>}
                      </td>
                      <td style={{ ...S.td, color: '#6b7280', fontSize: 13 }}>
                        {record.notes || <span style={{ color: '#9ca3af' }}>—</span>}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="8" style={S.noData}>
                        <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>📭</div>
                        <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                          No attendance records found
                        </div>
                        <div style={{ fontSize: 13, color: '#9ca3af' }}>
                          {displayDate}
                        </div>
                        {isToday && (
                          <button
                            style={{ ...S.markBtn, marginTop: 16, fontSize: 13, padding: '10px 20px' }}
                            onClick={() => setShowModal(true)}
                          >
                            ✓ Mark Attendance Now
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={S.tableFooter}>
              Showing <strong>{filteredRecords.length}</strong> records · <strong>{totalEmployees}</strong> total employees
            </div>
          </div>

        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <ManagerMarkAttendanceModal
          selectedDate={selectedDate}
          onClose={() => setShowModal(false)}
          onAttendanceMarked={handleAttendanceMarked}
        />
      )}

      <style>{spinnerCSS}</style>
    </div>
  );
};

// ── Helpers ──
const getStatusStyle = (status) => {
  const base = { display:'inline-flex', alignItems:'center', gap:4, padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600, textTransform:'capitalize' };
  switch (status) {
    case 'present':  return { ...base, background:'rgba(16,185,129,0.1)',  color:'#059669', border:'1px solid rgba(16,185,129,0.2)' };
    case 'absent':   return { ...base, background:'rgba(239,68,68,0.1)',   color:'#dc2626', border:'1px solid rgba(239,68,68,0.2)' };
    case 'leave':
    case 'on-leave': return { ...base, background:'rgba(245,158,11,0.1)',  color:'#d97706', border:'1px solid rgba(245,158,11,0.2)' };
    default:         return { ...base, background:'#f3f4f6', color:'#6b7280', border:'1px solid #e5e7eb' };
  }
};

const getStatusEmoji = (status) => {
  switch (status) {
    case 'present':  return '✅';
    case 'absent':   return '❌';
    case 'leave':
    case 'on-leave': return '🏖️';
    default:         return '❓';
  }
};

const spinnerCSS = `@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`;

const S = {
  content:    { padding:24, background:'#f9fafb', minHeight:'calc(100vh - 80px)' },
  loadingBox: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:400 },
  spinner:    { width:48, height:48, border:'4px solid #f3f3f3', borderTop:'4px solid #667eea', borderRadius:'50%', animation:'spin 1s linear infinite' },

  header:       { display:'flex', justifyContent:'space-between', alignItems:'center', background:'white', borderRadius:16, padding:'24px 28px', marginBottom:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', flexWrap:'wrap', gap:16 },
  pageTitle:    { fontSize:26, fontWeight:700, background:'linear-gradient(135deg,#667eea,#764ba2)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', margin:'0 0 4px 0' },
  pageSubtitle: { fontSize:14, color:'#6b7280', margin:0, display:'flex', alignItems:'center', gap:8 },
  historyBadge: { background:'rgba(102,126,234,0.1)', color:'#667eea', fontSize:12, fontWeight:600, padding:'2px 8px', borderRadius:8 },
  dateBox:      { display:'flex', alignItems:'center', gap:10, background:'#f3f4f6', padding:'10px 16px', borderRadius:12, border:'1px solid #e5e7eb' },
  dateInput:    { border:'none', background:'transparent', fontSize:14, fontWeight:600, color:'#111827', cursor:'pointer', outline:'none' },

  errorBanner:  { background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12, padding:'12px 20px', marginBottom:16, color:'#dc2626', fontSize:14, display:'flex', justifyContent:'space-between', alignItems:'center' },
  retryBtn:     { background:'#ef4444', color:'white', border:'none', borderRadius:8, padding:'6px 14px', fontSize:13, fontWeight:600, cursor:'pointer' },

  statsGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:20 },
  statCard:   { background:'white', borderRadius:14, padding:'20px 24px', boxShadow:'0 1px 3px rgba(0,0,0,0.08)', borderLeft:'4px solid' },
  statLabel:  { fontSize:12, color:'#6b7280', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:8 },
  statValue:  { fontSize:36, fontWeight:800 },

  viewingLabel: { fontSize:13, color:'#6b7280', background:'#f3f4f6', padding:'8px 16px', borderRadius:8 },
  markBtn:      { padding:'12px 24px', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'white', border:'none', borderRadius:10, fontSize:15, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 12px rgba(102,126,234,0.3)', transition:'all 0.2s' },

  filtersRow:   { display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' },
  searchInput:  { flex:1, minWidth:200, padding:'11px 16px', border:'2px solid #e5e7eb', borderRadius:10, fontSize:14, outline:'none' },
  filterSelect: { padding:'11px 14px', border:'2px solid #e5e7eb', borderRadius:10, fontSize:14, outline:'none', background:'white', cursor:'pointer' },
  clearBtn:     { padding:'11px 18px', background:'white', color:'#ef4444', border:'2px solid #ef4444', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' },

  tableCard:   { background:'white', borderRadius:16, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', overflow:'hidden' },
  dateBanner:  { padding:'12px 20px', background:'#f9fafb', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:14, fontWeight:600, color:'#374151' },
  table:       { width:'100%', borderCollapse:'collapse', fontSize:14 },
  theadRow:    { background:'linear-gradient(135deg,#667eea,#764ba2)' },
  th:          { padding:'14px 16px', textAlign:'left', color:'white', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap' },
  td:          { padding:'14px 16px', color:'#374151', verticalAlign:'middle', borderBottom:'1px solid #f3f4f6' },
  noData:      { textAlign:'center', padding:48, color:'#9ca3af', fontSize:14 },
  tableFooter: { padding:'14px 20px', borderTop:'1px solid #f3f4f6', fontSize:13, color:'#6b7280' },

  idBadge:     { padding:'3px 10px', background:'#ede9fe', color:'#7c3aed', borderRadius:20, fontSize:12, fontWeight:700 },
  hoursChip:   { padding:'3px 10px', background:'#dbeafe', color:'#1d4ed8', borderRadius:20, fontSize:12, fontWeight:600 },
};

export default MarkAttendance;