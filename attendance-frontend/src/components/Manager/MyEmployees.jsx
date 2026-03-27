import React, { useState, useEffect } from 'react';
import ManagerNavbar from './ManagerNavbar';
import ManagerSidebar from './ManagerSidebar';
import managerService from '../../services/managerService';
import '../../styles/Manager.css';

const MyEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchMyEmployees(); }, []);
  useEffect(() => { filterEmployees(); }, [searchTerm, employees]);

  const fetchMyEmployees = async () => {
    try {
      setLoading(true);
      const response = await managerService.getMyEmployees();
      if (response.success) setEmployees(response.data.employees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      alert('Failed to fetch employees');
    } finally { setLoading(false); }
  };

  const filterEmployees = () => {
    if (!searchTerm) { setFilteredEmployees(employees); return; }
    const filtered = employees.filter(emp =>
      emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(filtered);
  };

  const getInitials = (emp) =>
    `${(emp.firstName || '')[0] || ''}${(emp.lastName || '')[0] || ''}`.toUpperCase();

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

  return (
    <div className="manager-container">
      <ManagerNavbar />
      <div className="manager-layout">
        <ManagerSidebar />
        <div className="manager-content">

          {/* Page Header */}
          <div style={S.pageHeader}>
            <div>
              <h1 style={S.pageTitle}>Employees</h1>
              <p style={S.pageSubtitle}>Manage and view your team members</p>
            </div>
            <div style={S.countBadge}>
              Total: <strong style={{ color: '#667eea', marginLeft: 6 }}>{filteredEmployees.length}</strong>
            </div>
          </div>

          {/* Search */}
          <div className="filters-section">
            <div style={S.searchBox}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>🔍</span>
              <input
                type="text"
                placeholder="Search by name or employee code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={S.searchInput}
              />
              {searchTerm && (
                <button style={S.clearBtn} onClick={() => setSearchTerm('')}>✕</button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="table-container" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr style={S.theadRow}>
                  <th style={S.th}>Employee</th>
                  <th style={S.th}>Employee Code</th>
                  <th style={S.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee) => (
                    <tr key={employee._id}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      {/* Name */}
                      <td style={S.td}>
                        <div style={S.empCell}>
                          <div style={S.avatar}>{getInitials(employee)}</div>
                          <div>
                            <div style={S.empName}>{employee.firstName} {employee.lastName}</div>
                            <div style={S.empDept}>{employee.department || 'N/A'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Code */}
                      <td style={S.td}>
                        <span style={S.codeBadge}>{employee.employeeCode}</span>
                      </td>

                      {/* Status */}
                      <td style={S.td}>
                        <span style={employee.isActive ? S.badgeActive : S.badgeInactive}>
                          {employee.isActive ? '✅ Active' : '❌ Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="no-data">
                      No employees found under your supervision
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Team Summary */}
          {employees.length > 0 && (
            <div style={S.summaryCard}>
              <h3 style={S.summaryTitle}>📊 Team Performance Summary</h3>
              <div style={S.summaryGrid}>
                <div style={S.summaryItem}>
                  <div style={{ ...S.summaryIcon, background: '#10b98115' }}>✅</div>
                  <div>
                    <span style={S.summaryLabel}>Active Employees</span>
                    <div style={S.summaryValue}>{employees.filter(emp => emp.isActive).length}</div>
                  </div>
                </div>
                <div style={S.summaryItem}>
                  <div style={{ ...S.summaryIcon, background: '#3b82f615' }}>🏢</div>
                  <div>
                    <span style={S.summaryLabel}>Departments</span>
                    <div style={S.summaryValue}>{[...new Set(employees.map(emp => emp.department))].length}</div>
                  </div>
                </div>
                <div style={S.summaryItem}>
                  <div style={{ ...S.summaryIcon, background: '#8b5cf615' }}>👥</div>
                  <div>
                    <span style={S.summaryLabel}>Total Under You</span>
                    <div style={S.summaryValue}>{employees.length}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      <style>{spinnerCSS}</style>
    </div>
  );
};

const spinnerCSS = `@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`;

const S = {
  loadingBox:   { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:400 },
  spinner:      { width:48, height:48, border:'4px solid #f3f3f3', borderTop:'4px solid #667eea', borderRadius:'50%', animation:'spin 1s linear infinite' },
  pageHeader:   { display:'flex', justifyContent:'space-between', alignItems:'center', background:'white', borderRadius:16, padding:'24px 28px', marginBottom:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', flexWrap:'wrap', gap:16 },
  pageTitle:    { fontSize:26, fontWeight:700, background:'linear-gradient(135deg,#667eea,#764ba2)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', margin:'0 0 4px 0' },
  pageSubtitle: { fontSize:14, color:'#6b7280', margin:0 },
  countBadge:   { padding:'10px 20px', background:'#f3f4f6', borderRadius:10, fontSize:14, fontWeight:600, color:'#374151', border:'1px solid #e5e7eb' },
  searchBox:    { display:'flex', alignItems:'center', gap:12 },
  searchInput:  { flex:1, border:'none', outline:'none', fontSize:14, color:'#374151', background:'transparent', width:'100%' },
  clearBtn:     { padding:'4px 10px', background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:6, cursor:'pointer', fontSize:13, color:'#6b7280' },
  theadRow:     { background:'linear-gradient(135deg,#667eea,#764ba2)' },
  th:           { padding:'14px 16px', textAlign:'left', color:'white', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap' },
  td:           { padding:'14px 16px', color:'#374151', verticalAlign:'middle', borderBottom:'1px solid #f3f4f6' },
  empCell:      { display:'flex', alignItems:'center', gap:12 },
  avatar:       { width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#667eea,#764ba2)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:13, flexShrink:0 },
  empName:      { fontWeight:600, color:'#111827', marginBottom:2 },
  empDept:      { fontSize:12, color:'#9ca3af' },
  codeBadge:    { padding:'3px 10px', background:'#ede9fe', color:'#7c3aed', borderRadius:20, fontSize:12, fontWeight:700 },
  badgeActive:  { display:'inline-flex', alignItems:'center', gap:4, padding:'4px 12px', background:'rgba(16,185,129,0.1)', color:'#059669', borderRadius:20, fontSize:12, fontWeight:600, border:'1px solid rgba(16,185,129,0.2)' },
  badgeInactive:{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 12px', background:'rgba(239,68,68,0.1)', color:'#dc2626', borderRadius:20, fontSize:12, fontWeight:600, border:'1px solid rgba(239,68,68,0.2)' },
  summaryCard:  { background:'white', borderRadius:16, padding:'24px 28px', boxShadow:'0 1px 3px rgba(0,0,0,0.08)', marginTop:24 },
  summaryTitle: { fontSize:18, fontWeight:700, color:'#111827', margin:'0 0 20px 0' },
  summaryGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16 },
  summaryItem:  { display:'flex', alignItems:'center', gap:16, padding:'16px 20px', background:'#f9fafb', borderRadius:12, border:'1px solid #e5e7eb' },
  summaryIcon:  { width:44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 },
  summaryLabel: { fontSize:12, color:'#6b7280', fontWeight:600, display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.3px' },
  summaryValue: { fontSize:28, fontWeight:800, color:'#111827' },
};

export default MyEmployees;