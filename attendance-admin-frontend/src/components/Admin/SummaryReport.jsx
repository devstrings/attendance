import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import '../../styles/Admin.css';

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

      // Build query parameters
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
        const stats = data.data.statistics || {};

        // ✅ CRITICAL FIX: Filter out deleted employees FIRST
        const validRecords = records.filter(record => {
          // Check if employee exists and is valid
          if (!record.employeeId || !record.employeeId._id) {
            console.log('⚠️ Skipping deleted employee record:', record._id);
            return false;
          }
          
          // Check if employee has valid user account
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

        console.log(`📊 Final employee data count: ${employeeData.length}`);

        // ✅ Recalculate statistics based on VALID records only
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
    alert('PDF Export feature coming soon!');
  };

  const exportToExcel = () => {
    alert('Excel Export feature coming soon!');
  };

  const getAttendancePercentage = (present, total) => {
    if (total === 0) return 0;
    return ((present / total) * 100).toFixed(1);
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 90) return '#10b981';
    if (percentage >= 75) return '#f59e0b';
    return '#ef4444';
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
            <div className="loader">Loading summary report...</div>
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
          {/* Header */}
          <div className="page-header">
            <div>
              <h1>📊 Summary Report - Devstrings</h1>
              <p>Comprehensive attendance summary for active employees only</p>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-section">
            <div className="filter-row">
              <div className="filter-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label>Department</label>
                <select
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="filter-select"
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

              <div className="filter-group">
                <button onClick={clearFilters} className="btn-secondary">
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="filter-row" style={{ marginTop: '15px' }}>
              <div className="filter-group" style={{ flex: 1 }}>
                <input
                  type="text"
                  placeholder="🔍 Search by employee name or code..."
                  value={filters.searchQuery}
                  onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                  className="filter-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <button onClick={exportToPDF} className="btn-success">
              📄 Export PDF
            </button>
            <button onClick={exportToExcel} className="btn-success">
              📊 Export Excel
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>{statistics.totalEmployees}</h3>
                <p>Active Employees</p>
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>{statistics.totalPresent}</h3>
                <p>Total Present</p>
              </div>
            </div>

            <div className="stat-card red">
              <div className="stat-icon">❌</div>
              <div className="stat-content">
                <h3>{statistics.totalAbsent}</h3>
                <p>Total Absent</p>
              </div>
            </div>

            <div className="stat-card orange">
              <div className="stat-icon">🏖️</div>
              <div className="stat-content">
                <h3>{statistics.totalLeave}</h3>
                <p>Total Leave</p>
              </div>
            </div>

            <div className="stat-card purple">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <h3>{statistics.totalHours.toFixed(0)}</h3>
                <p>Total Hours</p>
              </div>
            </div>

            <div className="stat-card teal">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>{statistics.avgAttendance}%</h3>
                <p>Avg Attendance</p>
              </div>
            </div>
          </div>

          {/* Summary Table */}
          <div className="table-container">
            <h2>Active Employee Summary</h2>
            {filteredData.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
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
                          <div>
                            <strong>{emp.employeeName}</strong>
                            <br />
                            <small style={{ color: '#666' }}>{emp.employeeCode}</small>
                          </div>
                        </td>
                        <td>{emp.department}</td>
                        <td><strong>{emp.totalDays}</strong></td>
                        <td className="text-green"><strong>{emp.present}</strong></td>
                        <td className="text-red"><strong>{emp.absent}</strong></td>
                        <td className="text-orange"><strong>{emp.leave}</strong></td>
                        <td><strong>{emp.totalHours.toFixed(0)} hrs</strong></td>
                        <td>{avgHoursPerDay} hrs</td>
                        <td>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'white',
                            background: getPerformanceColor(attendancePercentage)
                          }}>
                            {attendancePercentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="no-data">
                <p>📭 No active employee data available for the selected period.</p>
                <p>Try adjusting your filters or add some employees.</p>
              </div>
            )}
          </div>

          {/* Performance Legend */}
          <div className="info-box" style={{ marginTop: '20px' }}>
            <h3>Performance Legend:</h3>
            <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  background: '#10b981'
                }} />
                <span><strong>Excellent:</strong> ≥90%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  background: '#f59e0b'
                }} />
                <span><strong>Good:</strong> 75-89%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  background: '#ef4444'
                }} />
                <span><strong>Needs Improvement:</strong> &lt;75%</span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="info-box" style={{ marginTop: '15px', background: '#e3f2fd' }}>
            <p>
              ℹ️ <strong>Note:</strong> This report shows only active employees. Deleted employees and their historical data are excluded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryReport;