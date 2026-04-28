import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import '../../styles/Admin.css'; // ✅ FIXED

const SummaryReport = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState([]);
  const [statistics, setStatistics] = useState({
    totalEmployees: 0,
    totalPresent: 0,
    totalAbsent: 0,
    totalLeave: 0,
    totalHours: 0,
    avgAttendance: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    department: '',
    employeeId: '',
    searchQuery: ''
  });

  useEffect(() => {
    fetchSummaryReport();
  }, [filters.startDate, filters.endDate, filters.department, filters.employeeId]);

  const fetchSummaryReport = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching summary report with filters:', filters);

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.department) params.append('department', filters.department);
      if (filters.employeeId) params.append('employeeId', filters.employeeId);

      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:5000/api/v1/admin/summary-report?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('📦 Summary Report Response:', data);

      if (data.success) {
        const records = data.data.records || [];
        
        // ✅ Filter out deleted employees
        const validRecords = records.filter(record => {
          if (!record.employeeId || !record.employeeId._id) {
            console.log('⚠️ Skipping deleted employee record:', record._id);
            return false;
          }
          if (!record.employeeId.userId) {
            console.log('⚠️ Skipping employee without user account:', record.employeeId.employeeCode);
            return false;
          }
          return true;
        });

        console.log(`✅ Valid records: ${validRecords.length} / ${records.length}`);

        // Group attendance by employee
        const employeeMap = {};
        
        validRecords.forEach(record => {
          const empId = record.employeeId._id;

          if (!employeeMap[empId]) {
            employeeMap[empId] = {
              employeeId: empId,
              employeeName: `${record.employeeId.firstName} ${record.employeeId.lastName}`,
              employeeCode: record.employeeId.employeeCode,
              department: record.employeeId.department,
              designation: record.employeeId.designation,
              email: record.employeeId.userId?.email || 'N/A',
              totalDays: 0,
              present: 0,
              absent: 0,
              leave: 0,
              late: 0,
              totalHours: 0
            };
          }

          employeeMap[empId].totalDays++;
          
          if (record.status === 'present' || record.status === 'half-day') {
            employeeMap[empId].present++;
          } else if (record.status === 'absent') {
            employeeMap[empId].absent++;
          } else if (record.status === 'on-leave') {
            employeeMap[empId].leave++;
          }

          if (record.isLate) {
            employeeMap[empId].late++;
          }

          if (record.workHours) {
            employeeMap[empId].totalHours += record.workHours;
          }
        });

        const employeeData = Object.values(employeeMap);

        // Recalculate statistics
        const totalPresent = validRecords.filter(r => r.status === 'present' || r.status === 'half-day').length;
        const totalAbsent = validRecords.filter(r => r.status === 'absent').length;
        const totalLeave = validRecords.filter(r => r.status === 'on-leave').length;
        const totalRecords = totalPresent + totalAbsent + totalLeave;

        setReportData(employeeData);
        setStatistics({
          totalEmployees: employeeData.length,
          totalPresent: totalPresent,
          totalAbsent: totalAbsent,
          totalLeave: totalLeave,
          totalHours: employeeData.reduce((sum, emp) => sum + emp.totalHours, 0),
          avgAttendance: totalRecords > 0 
            ? ((totalPresent / totalRecords) * 100).toFixed(1)
            : 0
        });
      }
    } catch (error) {
      console.error('❌ Error fetching summary report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      department: '',
      employeeId: '',
      searchQuery: ''
    });
  };

  const exportToPDF = () => {
    window.print();
  };

  const exportToExcel = () => {
    alert('Excel Export feature coming soon!');
  };

  const getAttendancePercentage = (present, total) => {
    if (total === 0) return 0;
    return ((present / total) * 100).toFixed(1);
  };

  const getPerformanceClass = (percentage) => {
    if (percentage >= 90) return 'high';
    if (percentage >= 75) return 'medium';
    return 'low';
  };

  const getInitials = (name) => {
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredData = reportData.filter(emp => {
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return emp.employeeName.toLowerCase().includes(query) ||
             emp.employeeCode.toLowerCase().includes(query);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="admin-container">
        <AdminNavbar />
        <div className="admin-layout">
          <AdminSidebar />
          <div className="admin-content">
            <div className="summary-loading">
              <div className="spinner"></div>
              <p>Loading summary report...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <AdminNavbar />
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <div className="summary-container">
            {/* ✅ Updated Header */}
            <div className="summary-header">
              <h1 className="summary-title">Active Employee Summary</h1>
              
              <div className="summary-actions">
                <div className="search-box-summary">
                  <input
                    type="text"
                    placeholder="Search by employee name or code..."
                    value={filters.searchQuery}
                    onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                  />
                </div>
                
                <div className="export-buttons">
                  <button onClick={exportToPDF} className="export-btn pdf">
                    📄 Export PDF
                  </button>
                  <button onClick={exportToExcel} className="export-btn excel">
                    📊 Export Excel
                  </button>
                </div>
              </div>
            </div>

            {/* ✅ Date Filters */}
            <div className="summary-table-section" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                alignItems: 'end'
              }}>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Department</label>
                  <select
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                  >
                    <option value="">All Departments</option>
                    <option value="IT">IT</option>
                    <option value="Software House">Software House</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                  </select>
                </div>

                <button onClick={clearFilters} className="btn-secondary">
                  Clear Filters
                </button>
              </div>
            </div>

            {/* ✅ Statistics Cards */}
            <div className="summary-stats-grid">
              <div className="summary-stat-card">
                <span className="summary-stat-icon">👥</span>
                <div className="summary-stat-label">Active Employees</div>
                <div className="summary-stat-value">{statistics.totalEmployees}</div>
                <div className="summary-stat-subtext">Currently active</div>
              </div>

              <div className="summary-stat-card">
                <span className="summary-stat-icon">✅</span>
                <div className="summary-stat-label">Total Present</div>
                <div className="summary-stat-value">{statistics.totalPresent}</div>
                <div className="summary-stat-subtext">Days present</div>
              </div>

              <div className="summary-stat-card">
                <span className="summary-stat-icon">❌</span>
                <div className="summary-stat-label">Total Absent</div>
                <div className="summary-stat-value">{statistics.totalAbsent}</div>
                <div className="summary-stat-subtext">Days absent</div>
              </div>

              <div className="summary-stat-card">
                <span className="summary-stat-icon">🏖️</span>
                <div className="summary-stat-label">Total Leave</div>
                <div className="summary-stat-value">{statistics.totalLeave}</div>
                <div className="summary-stat-subtext">Days on leave</div>
              </div>

              <div className="summary-stat-card">
                <span className="summary-stat-icon">⏱️</span>
                <div className="summary-stat-label">Total Hours</div>
                <div className="summary-stat-value">{statistics.totalHours.toFixed(0)}</div>
                <div className="summary-stat-subtext">Hours worked</div>
              </div>

              <div className="summary-stat-card">
                <span className="summary-stat-icon">📊</span>
                <div className="summary-stat-label">Avg Attendance</div>
                <div className="summary-stat-value">{statistics.avgAttendance}%</div>
                <div className="summary-stat-subtext">Overall average</div>
              </div>
            </div>

            {/* ✅ Summary Table */}
            <div className="summary-table-section">
              <div className="summary-table-header">
                <h2 className="summary-table-title">Employee Summary</h2>
              </div>

              {filteredData.length > 0 ? (
                <div className="summary-table-wrapper">
                  <table className="summary-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Total Days</th>
                        <th>Present</th>
                        <th>Absent</th>
                        <th>Leave</th>
                        <th>Total Hours</th>
                        <th>Avg Hours/Day</th>
                        <th>Attendance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((emp) => {
                        const attendancePercentage = getAttendancePercentage(emp.present, emp.totalDays);
                        const avgHoursPerDay = emp.totalDays > 0 ? (emp.totalHours / emp.totalDays).toFixed(1) : 0;

                        return (
                          <tr key={emp.employeeId}>
                            <td>
                              <div className="employee-cell">
                                <div className="employee-avatar-small">
                                  {getInitials(emp.employeeName)}
                                </div>
                                <div className="employee-info-small">
                                  <span className="employee-name-small">{emp.employeeName}</span>
                                  <span className="employee-code-small">{emp.employeeCode}</span>
                                </div>
                              </div>
                            </td>
                            <td>{emp.department}</td>
                            <td><strong>{emp.totalDays}</strong></td>
                            <td>
                              <span className="status-badge present">{emp.present}</span>
                            </td>
                            <td>
                              <span className="status-badge absent">{emp.absent}</span>
                            </td>
                            <td>
                              <span className="status-badge leave">{emp.leave}</span>
                            </td>
                            <td>
                              <span className="hours-display full-day">
                                {emp.totalHours.toFixed(0)} hrs
                              </span>
                            </td>
                            <td>{avgHoursPerDay} hrs</td>
                            <td>
                              <span className={`percentage-display ${getPerformanceClass(attendancePercentage)}`}>
                                {attendancePercentage}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="summary-empty-state">
                  <div className="empty-icon">📭</div>
                  <h3>No Data Available</h3>
                  <p>No active employee data available for the selected period.</p>
                  <p>Try adjusting your filters or add some employees.</p>
                </div>
              )}
            </div>

            {/* ✅ Performance Legend */}
            <div className="summary-table-section" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '700' }}>
                Performance Legend:
              </h3>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #48bb78, #38a169)'
                  }} />
                  <span><strong>Excellent:</strong> ≥90%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #f6ad55, #ed8936)'
                  }} />
                  <span><strong>Good:</strong> 75-89%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #fc8181, #e53e3e)'
                  }} />
                  <span><strong>Needs Improvement:</strong> &lt;75%</span>
                </div>
              </div>
            </div>

            {/* ✅ Info Note */}
            <div className="summary-table-section" style={{ 
              padding: '1.25rem', 
              marginTop: '1rem',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
              border: '2px solid rgba(102, 126, 234, 0.2)'
            }}>
              <p style={{ margin: 0, color: '#4a5568', fontSize: '0.95rem' }}>
                ℹ️ <strong>Note:</strong> This report shows only active employees. Deleted employees and their historical data are excluded.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryReport;