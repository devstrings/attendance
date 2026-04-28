/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars, import/no-anonymous-default-export, jsx-a11y/anchor-is-valid */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ManagerNavbar from './ManagerNavbar';
import ManagerSidebar from './ManagerSidebar';
import managerService from '../../services/managerService';
import '../../styles/Manager.css';

const EmployeeAttendanceHistory = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employeeId || '');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  // ✅ totalLeave added
  const [statistics, setStatistics] = useState({
    totalPresent: 0, totalAbsent: 0, totalLate: 0, totalLeave: 0
  });
  const [filters, setFilters] = useState({ startDate: '', endDate: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  useEffect(() => { fetchMyEmployees(); }, []);
  useEffect(() => { if (selectedEmployeeId) fetchAttendanceHistory(); }, [selectedEmployeeId, filters]);

  const fetchMyEmployees = async () => {
    try {
      setLoading(true);
      const response = await managerService.getMyEmployees();
      if (response.success && response.data.employees) {
        setEmployees(response.data.employees);
        if (employeeId && response.data.employees.length > 0) {
          setSelectedEmployeeId(employeeId);
        } else if (response.data.employees.length > 0) {
          setSelectedEmployeeId(response.data.employees[0]._id);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching employees:', error);
    } finally { setLoading(false); }
  };

  const fetchAttendanceHistory = async () => {
    if (!selectedEmployeeId) return;
    try {
      setFetchingHistory(true);
      const response = await managerService.getEmployeeAttendanceHistory(selectedEmployeeId, filters);
      if (response.success) {
        const records = response.data.attendance || [];
        setAttendanceRecords(records);

        // ✅ Calculate totalLeave from records if backend doesn't send it
        const stats = response.data.statistics || {};
        const totalLeave = stats.totalLeave !== undefined
          ? stats.totalLeave
          : records.filter(r => r.status === 'leave' || r.status === 'on-leave').length;

        setStatistics({
          totalPresent: stats.totalPresent || 0,
          totalAbsent:  stats.totalAbsent  || 0,
          totalLate:    stats.totalLate    || 0,
          totalLeave,
        });
      }
    } catch (error) {
      console.error('❌ Error fetching attendance history:', error);
    } finally { setFetchingHistory(false); }
  };

  const handleEmployeeChange = (e) => setSelectedEmployeeId(e.target.value);
  const handleFilterChange   = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));
  const clearFilters         = () => setFilters({ startDate: '', endDate: '', status: '' });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'present':  return S.badgePresent;
      case 'absent':   return S.badgeAbsent;
      case 'leave':
      case 'on-leave': return S.badgeLeave;
      case 'half-day': return S.badgeHalfDay;
      default:         return S.badgeDefault;
    }
  };

  const getStatusEmoji = (status) => {
    switch (status) {
      case 'present':  return '✅';
      case 'absent':   return '❌';
      case 'leave':
      case 'on-leave': return '🏖️';
      case 'half-day': return '🌗';
      default:         return '';
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'on-leave') return 'Leave';
    return status;
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const selectedEmployee = employees.find(emp => emp._id === selectedEmployeeId);

  // ── Loading ──
  if (loading) {
    return (
      <div className="manager-container">
        <ManagerNavbar />
        <div className="manager-layout">
          <ManagerSidebar />
          <div className="manager-content">
            <div style={S.loadingBox}>
              <div style={S.spinner}></div>
              <p style={{ color: '#6b7280', marginTop: 12 }}>Loading employees...</p>
            </div>
            <style>{spinnerCSS}</style>
          </div>
        </div>
      </div>
    );
  }

  // ── No employees ──
  if (employees.length === 0) {
    return (
      <div className="manager-container">
        <ManagerNavbar />
        <div className="manager-layout">
          <ManagerSidebar />
          <div className="manager-content">
            <div style={S.emptyState}>
              <div style={{ fontSize: 48 }}>👥</div>
              <h3 style={{ color: '#374151', marginTop: 12 }}>No Employees Found</h3>
              <p style={{ color: '#9ca3af' }}>You don't have any employees assigned yet.</p>
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
        <div className="manager-content">

          {/* ── Page Header ── */}
          <div style={S.pageHeader}>
            <div>
              <h1 style={S.pageTitle}>📅 Attendance History</h1>
              <p style={S.pageSubtitle}>View detailed attendance records for your team members</p>
            </div>
            <button style={S.backBtn} onClick={() => navigate('/manager/my-employees')}>
              ← Back to Employees
            </button>
          </div>

          {/* ── Filters ── */}
          <div className="filters-section">
            <div className="filter-row">
              <div className="filter-group">
                <label style={S.filterLabel}>Select Employee</label>
                <select value={selectedEmployeeId} onChange={handleEmployeeChange} className="filter-select">
                  <option value="">Choose Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} - {emp.employeeCode}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label style={S.filterLabel}>Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={e => handleFilterChange('startDate', e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label style={S.filterLabel}>End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={e => handleFilterChange('endDate', e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label style={S.filterLabel}>Status</label>
                <select
                  value={filters.status}
                  onChange={e => handleFilterChange('status', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Status</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="on-leave">On Leave</option>
                  <option value="half-day">Half Day</option>
                </select>
              </div>

              <div className="filter-group" style={{ justifyContent: 'flex-end', display: 'flex', alignItems: 'flex-end' }}>
                <button onClick={clearFilters} style={S.clearFiltersBtn}>
                  🗑️ Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* ── Employee Info Card ── */}
          {selectedEmployee && (
            <>
              <div className="employee-info-card">
                <div style={S.empAvatar}>
                  {selectedEmployee.firstName.charAt(0)}{selectedEmployee.lastName.charAt(0)}
                </div>
                <div className="employee-details">
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h3>
                  <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', fontSize: 14 }}>
                    <span style={S.codeBadge}>{selectedEmployee.employeeCode}</span>
                    <span>•</span>
                    <span>{selectedEmployee.department}</span>
                  </p>
                </div>
              </div>

              {/* ✅ 4 Stats Cards — Present, Absent, Late, On Leave */}
              <div style={S.statsGrid}>

                <div style={{ ...S.statCard, borderTopColor: '#10b981' }}>
                  <div style={S.statIcon}>✅</div>
                  <div style={S.statLabel}>Total Present</div>
                  <div style={{ ...S.statValue, color: '#10b981' }}>{statistics.totalPresent}</div>
                </div>

                <div style={{ ...S.statCard, borderTopColor: '#ef4444' }}>
                  <div style={S.statIcon}>❌</div>
                  <div style={S.statLabel}>Total Absent</div>
                  <div style={{ ...S.statValue, color: '#ef4444' }}>{statistics.totalAbsent}</div>
                </div>

                <div style={{ ...S.statCard, borderTopColor: '#f59e0b' }}>
                  <div style={S.statIcon}>⏰</div>
                  <div style={S.statLabel}>Late Arrivals</div>
                  <div style={{ ...S.statValue, color: '#f59e0b' }}>{statistics.totalLate}</div>
                </div>

                {/* ✅ NEW: On Leave card */}
                <div style={{ ...S.statCard, borderTopColor: '#8b5cf6' }}>
                  <div style={S.statIcon}>🏖️</div>
                  <div style={S.statLabel}>On Leave</div>
                  <div style={{ ...S.statValue, color: '#8b5cf6' }}>{statistics.totalLeave}</div>
                </div>

              </div>
            </>
          )}

          {/* ── Attendance Table ── */}
          <div className="table-container" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={S.tableHeader}>
              <h2 style={S.tableTitle}>Attendance Records</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {(filters.startDate || filters.endDate) && (
                  <span style={S.dateRangeBadge}>
                    📅 {filters.startDate || '...'} → {filters.endDate || '...'}
                  </span>
                )}
                <span style={S.recordCount}>{attendanceRecords.length} records</span>
              </div>
            </div>

            {fetchingHistory ? (
              <div style={S.loadingBox}>
                <div style={S.spinner}></div>
                <p style={{ color: '#6b7280', marginTop: 12 }}>Loading attendance records...</p>
              </div>
            ) : attendanceRecords.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr style={S.theadRow}>
                    {['Date','Status','Clock In','Clock Out','Working Hours','Late','Remarks'].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record) => (
                    <tr
                      key={record._id}
                      style={{ background: 'white', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <td style={{ ...S.td, fontWeight: 600, color: '#111827' }}>
                        {formatDate(record.date)}
                      </td>
                      <td style={S.td}>
                        <span style={getStatusStyle(record.status)}>
                          {getStatusEmoji(record.status)} {getStatusLabel(record.status)}
                        </span>
                      </td>
                      <td style={S.td}>{formatTime(record.clockIn)}</td>
                      <td style={S.td}>{formatTime(record.clockOut)}</td>
                      <td style={S.td}>
                        {record.workHours
                          ? <span style={S.hoursChip}>{record.workHours.toFixed(2)} hrs</span>
                          : <span style={{ color: '#9ca3af' }}>—</span>}
                      </td>
                      <td style={S.td}>
                        {record.isLate
                          ? <span style={S.lateChip}>🔴 Late ({record.lateMinutes} min)</span>
                          : <span style={S.onTimeChip}>✅ On Time</span>}
                      </td>
                      <td style={{ ...S.td, color: '#6b7280', fontSize: 13 }}>
                        {record.remarks || <span style={{ color: '#9ca3af' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={S.noDataBox}>
                <div style={{ fontSize: 56, opacity: 0.25, marginBottom: 12 }}>📭</div>
                <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  No attendance records found
                </div>
                <div style={{ fontSize: 13, color: '#9ca3af' }}>
                  {filters.startDate || filters.endDate || filters.status
                    ? 'Try changing the filters or date range'
                    : 'No records available for this employee'}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
      <style>{spinnerCSS}</style>
    </div>
  );
};

const spinnerCSS = `@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`;

const S = {
  loadingBox:  { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:300, padding:40 },
  spinner:     { width:48, height:48, border:'4px solid #f3f3f3', borderTop:'4px solid #667eea', borderRadius:'50%', animation:'spin 1s linear infinite' },
  emptyState:  { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:300, background:'white', borderRadius:16, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' },

  pageHeader:   { display:'flex', justifyContent:'space-between', alignItems:'center', background:'white', borderRadius:16, padding:'24px 28px', marginBottom:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', flexWrap:'wrap', gap:16 },
  pageTitle:    { fontSize:26, fontWeight:700, background:'linear-gradient(135deg,#667eea,#764ba2)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', margin:'0 0 4px 0' },
  pageSubtitle: { fontSize:14, color:'#6b7280', margin:0 },
  backBtn:      { padding:'10px 20px', background:'white', color:'#667eea', border:'2px solid #667eea', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' },

  filterLabel:     { fontSize:12, fontWeight:700, color:'#4b5563', textTransform:'uppercase', letterSpacing:'0.4px', display:'block', marginBottom:6 },
  clearFiltersBtn: { padding:'10px 18px', background:'linear-gradient(135deg,#ef4444,#dc2626)', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, whiteSpace:'nowrap', boxShadow:'0 2px 8px rgba(239,68,68,0.3)' },

  empAvatar: { width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#667eea,#764ba2)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:18, flexShrink:0 },
  codeBadge: { padding:'3px 10px', background:'#ede9fe', color:'#7c3aed', borderRadius:20, fontSize:12, fontWeight:700 },

  // ✅ NEW: 4-column stats grid
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 },
  statCard:  { background:'white', borderRadius:14, padding:'20px 24px', boxShadow:'0 1px 3px rgba(0,0,0,0.08)', borderTop:'4px solid', textAlign:'center' },
  statIcon:  { fontSize:24, marginBottom:8 },
  statLabel: { fontSize:12, color:'#6b7280', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:8 },
  statValue: { fontSize:36, fontWeight:800 },

  tableHeader:    { padding:'18px 24px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' },
  tableTitle:     { fontSize:16, fontWeight:700, color:'#111827', margin:0 },
  dateRangeBadge: { padding:'4px 12px', background:'#dbeafe', color:'#1d4ed8', borderRadius:20, fontSize:12, fontWeight:600 },
  recordCount:    { padding:'4px 12px', background:'#ede9fe', color:'#7c3aed', borderRadius:20, fontSize:12, fontWeight:700 },
  noDataBox:      { textAlign:'center', padding:'48px 20px', color:'#9ca3af', fontSize:14 },

  theadRow: { background:'linear-gradient(135deg,#667eea,#764ba2)' },
  th:       { padding:'14px 16px', textAlign:'left', color:'white', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap' },
  td:       { padding:'14px 16px', color:'#374151', verticalAlign:'middle', borderBottom:'1px solid #f3f4f6' },

  badgePresent: { display:'inline-flex', alignItems:'center', gap:4, padding:'4px 12px', background:'rgba(16,185,129,0.1)', color:'#059669', borderRadius:20, fontSize:12, fontWeight:600, border:'1px solid rgba(16,185,129,0.2)', textTransform:'capitalize' },
  badgeAbsent:  { display:'inline-flex', alignItems:'center', gap:4, padding:'4px 12px', background:'rgba(239,68,68,0.1)', color:'#dc2626', borderRadius:20, fontSize:12, fontWeight:600, border:'1px solid rgba(239,68,68,0.2)', textTransform:'capitalize' },
  badgeLeave:   { display:'inline-flex', alignItems:'center', gap:4, padding:'4px 12px', background:'rgba(139,92,246,0.1)', color:'#7c3aed', borderRadius:20, fontSize:12, fontWeight:600, border:'1px solid rgba(139,92,246,0.2)', textTransform:'capitalize' },
  badgeHalfDay: { display:'inline-flex', alignItems:'center', gap:4, padding:'4px 12px', background:'rgba(245,158,11,0.1)', color:'#d97706', borderRadius:20, fontSize:12, fontWeight:600, border:'1px solid rgba(245,158,11,0.2)', textTransform:'capitalize' },
  badgeDefault: { display:'inline-flex', alignItems:'center', gap:4, padding:'4px 12px', background:'#f3f4f6', color:'#6b7280', borderRadius:20, fontSize:12, fontWeight:600, textTransform:'capitalize' },

  hoursChip:  { padding:'3px 10px', background:'#dbeafe', color:'#1d4ed8', borderRadius:20, fontSize:12, fontWeight:600 },
  lateChip:   { padding:'3px 10px', background:'rgba(239,68,68,0.1)', color:'#dc2626', borderRadius:20, fontSize:12, fontWeight:600 },
  onTimeChip: { padding:'3px 10px', background:'rgba(16,185,129,0.1)', color:'#059669', borderRadius:20, fontSize:12, fontWeight:600 },
};

export default EmployeeAttendanceHistory;
