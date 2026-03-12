import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeNavbar from './EmployeeNavbar';
import employeeService from '../../services/employeeService';
import '../../styles/Employee.css';

const MyAttendance = () => {
  const navigate = useNavigate();
  const [attendanceData, setAttendanceData] = useState([]);
  const [statistics, setStatistics]         = useState(null);
  const [loading, setLoading]               = useState(true);
  const [selectedMonth, setSelectedMonth]   = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear]     = useState(new Date().getFullYear());

  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => { fetchAttendanceData(); }, [selectedMonth, selectedYear]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const response = await employeeService.getAttendanceHistory(selectedMonth, selectedYear);
      if (response.success) {
        setAttendanceData(response.data.attendance  || []);
        setStatistics(response.data.statistics      || {});
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Stats calculation ────────────────────────────────────────────────────
  // absent = totalWorkingDays - present - leave
  // Jo din record nahi hai (aur past mein hai) = absent
  const stats = (() => {
    const totalDays   = statistics?.totalDays || 0;  // working days backend se
    const presentDays = statistics?.present   || 0;
    const leaveDays   = statistics?.onLeave   || 0;
    const lateDays    = statistics?.late      || 0;
    // ✅ KEY FIX: absent = jo working days bache (na present, na leave)
    const absentDays  = Math.max(0, totalDays - presentDays - leaveDays);
    const attendanceRate = totalDays > 0
      ? ((presentDays / totalDays) * 100).toFixed(1)
      : 0;
    return { totalDays, presentDays, absentDays, leaveDays, lateDays, attendanceRate };
  })();

  const getStatusIcon = (status) => ({
    present:  '✅',
    absent:   '❌',
    'on-leave': '🏖️',
    leave:    '🏖️',
    holiday:  '🎉',
    'half-day': '🕐',
    late:     '⏰',
  }[status] || '❓');

  const formatTime = (dt) =>
    dt ? new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

  if (loading) {
    return (
      <div className="employee-container">
        <EmployeeNavbar />
        <div className="employee-content" style={s.center}>
          <div style={s.spinner} />
          <p style={{ color: '#6b7280', marginTop: 12 }}>Loading attendance...</p>
          <style>{spinCSS}</style>
        </div>
      </div>
    );
  }

  const perfClass =
    stats.attendanceRate >= 90 ? 'excellent' :
    stats.attendanceRate >= 80 ? 'good' :
    stats.attendanceRate >= 70 ? 'average' : 'poor';

  return (
    <div className="employee-container">
      <EmployeeNavbar />
      <div className="employee-content" style={s.content}>

        {/* ── Header ── */}
        <div style={s.header}>
          <h1 style={s.title}>📋 My Attendance</h1>
          <div style={s.monthSelector}>
            <select style={s.select} value={selectedMonth}
              onChange={e => setSelectedMonth(parseInt(e.target.value))}>
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select style={s.select} value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div style={s.statsGrid}>
          {[
            { icon: '📅', label: 'Working Days',    value: stats.totalDays,           color: '#3b82f6', hint: 'Join date se aaj tak' },
            { icon: '✅', label: 'Present Days',    value: stats.presentDays,         color: '#10b981' },
            { icon: '❌', label: 'Absent Days',     value: stats.absentDays,          color: '#ef4444', hint: 'Unmarked days included' },
            { icon: '🏖️', label: 'Leave Days',      value: stats.leaveDays,           color: '#f59e0b' },
            { icon: '📊', label: 'Attendance Rate', value: `${stats.attendanceRate}%`, color: '#06b6d4' },
          ].map((c, i) => (
            <div key={i} style={{ ...s.statCard, borderTopColor: c.color }}>
              <div style={s.statIcon}>{c.icon}</div>
              <div>
                <div style={{ ...s.statVal, color: c.color }}>{c.value}</div>
                <div style={s.statLabel}>{c.label}</div>
                {c.hint && <div style={s.statHint}>{c.hint}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* ── Attendance Records Table ── */}
        <div style={s.tableCard}>
          <h2 style={s.tableTitle}>
            Attendance Records — {months[selectedMonth - 1]} {selectedYear}
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Date','Day','Status','Clock In','Clock Out','Hours','Late'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attendanceData.length > 0 ? attendanceData.map(record => {
                  const d = new Date(record.date);
                  return (
                    <tr key={record._id} style={s.tr}>
                      <td style={s.td}>{d.toLocaleDateString()}</td>
                      <td style={s.td}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, ...badgeStyle(record.status) }}>
                          {getStatusIcon(record.status)} {record.status}
                        </span>
                      </td>
                      <td style={s.td}>{formatTime(record.clockIn)}</td>
                      <td style={s.td}>{formatTime(record.clockOut)}</td>
                      <td style={s.td}>{record.workHours ? `${record.workHours.toFixed(1)} hrs` : '0 hrs'}</td>
                      <td style={s.td}>
                        {record.isLate
                          ? <span style={s.lateBadge}>⏰ {record.lateMinutes || 0} min</span>
                          : <span style={{ color: '#9ca3af' }}>—</span>}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="7" style={s.noData}>
                      No attendance records for {months[selectedMonth - 1]} {selectedYear}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Performance Bar ── */}
        <div style={s.perfCard}>
          <h3 style={s.perfTitle}>📈 Performance Indicator</h3>
          <div style={s.perfTrack}>
            <div style={{
              ...s.perfFill,
              width: `${stats.attendanceRate}%`,
              background: perfClass === 'excellent' ? 'linear-gradient(90deg,#10b981,#059669)' :
                          perfClass === 'good'      ? 'linear-gradient(90deg,#3b82f6,#2563eb)' :
                          perfClass === 'average'   ? 'linear-gradient(90deg,#f59e0b,#d97706)' :
                                                      'linear-gradient(90deg,#ef4444,#dc2626)',
            }}>
              {stats.attendanceRate}%
            </div>
          </div>
          <div style={s.perfLegend}>
            {[
              { label: 'Excellent (90%+)',  color: '#10b981' },
              { label: 'Good (80–89%)',     color: '#3b82f6' },
              { label: 'Average (70–79%)', color: '#f59e0b' },
              { label: 'Poor (<70%)',       color: '#ef4444' },
            ].map(p => (
              <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                <span style={{ fontSize: 12, color: '#6b7280' }}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
      <style>{spinCSS}</style>
    </div>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const badgeStyle = (status) => ({
  present:    { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' },
  late:       { background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' },
  'half-day': { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' },
  absent:     { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
  leave:      { background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' },
  'on-leave': { background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' },
  holiday:    { background: '#fdf4ff', color: '#9333ea', border: '1px solid #e9d5ff' },
}[status] || { background: '#f3f4f6', color: '#6b7280' });

// ── Styles ───────────────────────────────────────────────────────────────────
const s = {
  content: { padding: '24px', background: '#f8f9fc', minHeight: '100vh' },
  center:  { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' },

  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24, background: '#fff', padding: '18px 24px', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  title:  { fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 },
  monthSelector: { display: 'flex', gap: 10 },
  select: { padding: '8px 14px', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#374151', outline: 'none', cursor: 'pointer' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 },
  statCard:  { background: '#fff', borderRadius: 12, padding: '16px', borderTop: '3px solid', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 12 },
  statIcon:  { fontSize: 26 },
  statVal:   { fontSize: 24, fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: 12, color: '#6b7280', fontWeight: 600, marginTop: 3 },
  statHint:  { fontSize: 10, color: '#9ca3af', marginTop: 2 },

  tableCard:  { background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 20 },
  tableTitle: { fontSize: 16, fontWeight: 700, color: '#111827', margin: 0, padding: '18px 24px', borderBottom: '1px solid #f3f4f6' },
  table:  { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:     { padding: '12px 14px', textAlign: 'left', background: 'linear-gradient(135deg,#4338ca,#6366f1)', color: '#fff', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr:     { borderBottom: '1px solid #f3f4f6' },
  td:     { padding: '12px 14px', color: '#374151' },
  noData: { textAlign: 'center', padding: '40px', color: '#9ca3af' },
  badge:  { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' },
  lateBadge: { background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 },

  perfCard:   { background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  perfTitle:  { fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 14px 0' },
  perfTrack:  { background: '#f3f4f6', borderRadius: 50, height: 32, overflow: 'hidden', marginBottom: 14 },
  perfFill:   { height: '100%', borderRadius: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, minWidth: 48, transition: 'width 1s ease' },
  perfLegend: { display: 'flex', gap: 20, flexWrap: 'wrap' },

  spinner: { width: 44, height: 44, border: '4px solid #e5e7eb', borderTop: '4px solid #4338ca', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};

const spinCSS = `@keyframes spin { to { transform: rotate(360deg); } }`;

export default MyAttendance;