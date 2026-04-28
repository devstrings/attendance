import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import adminService from '../../services/adminService';
import api from '../../services/api';
import '../../styles/Admin.css';

const MonthlyReport = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const departments = ['Software House', 'Sales', 'Marketing', 'IT', 'HR', 'Finance', 'Operations'];

  useEffect(() => {
    fetchMonthlyReport();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    filterEmployeeData();
  }, [searchTerm, filterDepartment, employees]);

  const fetchMonthlyReport = async () => {
    setLoading(true);
    try {
      // Get all active employees
      const employeesResponse = await adminService.getAllEmployees({
        limit: 1000
      });

      if (!employeesResponse.success || !employeesResponse.data.employees) {
        setEmployees([]);
        setLoading(false);
        return;
      }

      const allEmployees = employeesResponse.data.employees;

      // Calculate date range for selected month
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0);

      // Fetch attendance for all employees in the selected month
      const attendanceResponse = await api.get('/admin/attendance', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      });

      const attendanceData = attendanceResponse.data.success 
        ? attendanceResponse.data.data.attendance 
        : [];

      // Calculate stats for each employee
      const employeeStats = allEmployees.map(emp => {
        const empAttendance = attendanceData.filter(
          att => att.employeeId?._id === emp._id
        );

        const totalDays = new Date(selectedYear, selectedMonth, 0).getDate();
        const presentDays = empAttendance.filter(a => a.status === 'present').length;
        const absentDays = empAttendance.filter(a => a.status === 'absent').length;
        const leaveDays = empAttendance.filter(a => a.status === 'on-leave').length; // ✅ Changed 'leave' to 'on-leave'
        const totalHours = empAttendance.reduce((sum, a) => sum + (a.hoursWorked || 0), 0);
        const attendanceRate = totalDays > 0 
          ? ((presentDays / totalDays) * 100).toFixed(1) 
          : 0;
        const avgHoursPerDay = presentDays > 0 
          ? (totalHours / presentDays).toFixed(1) 
          : 0;

        return {
          id: emp._id,
          name: `${emp.firstName} ${emp.lastName}`,
          department: emp.department,
          totalDays,
          presentDays,
          absentDays,
          leaveDays,
          totalHours,
          attendanceRate: parseFloat(attendanceRate),
          avgHoursPerDay: parseFloat(avgHoursPerDay)
        };
      });

      setEmployees(employeeStats);
    } catch (error) {
      console.error('Error fetching monthly report:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const filterEmployeeData = () => {
    let filtered = [...employees];

    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterDepartment) {
      filtered = filtered.filter(emp => emp.department === filterDepartment);
    }

    setFilteredEmployees(filtered);
  };

  const calculateTotals = () => {
    const totalEmployees = filteredEmployees.length;
    const totalPresent = filteredEmployees.reduce((sum, emp) => sum + emp.presentDays, 0);
    const totalAbsent = filteredEmployees.reduce((sum, emp) => sum + emp.absentDays, 0);
    const totalLeave = filteredEmployees.reduce((sum, emp) => sum + emp.leaveDays, 0);
    const totalHours = filteredEmployees.reduce((sum, emp) => sum + emp.totalHours, 0);
    const avgAttendance = filteredEmployees.length > 0
      ? (filteredEmployees.reduce((sum, emp) => sum + emp.attendanceRate, 0) / filteredEmployees.length).toFixed(1)
      : 0;

    return { totalEmployees, totalPresent, totalAbsent, totalLeave, totalHours, avgAttendance };
  };

  const totals = calculateTotals();

  const handleExportPDF = () => {
    alert('Export to PDF functionality will be implemented soon');
  };

  const handleExportExcel = () => {
    // Simple CSV export
    const csvContent = [
      ['Employee Name', 'Department', 'Total Days', 'Present', 'Absent', 'Leave', 'Total Hours', 'Avg Hours/Day', 'Attendance %'],
      ...filteredEmployees.map(emp => [
        emp.name,
        emp.department,
        emp.totalDays,
        emp.presentDays,
        emp.absentDays,
        emp.leaveDays,
        emp.totalHours,
        emp.avgHoursPerDay,
        emp.attendanceRate
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-report-${months[selectedMonth - 1]}-${selectedYear}.csv`;
    a.click();
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return 'excellent';
    if (rate >= 80) return 'good';
    if (rate >= 70) return 'average';
    return 'poor';
  };

  if (loading) {
    return (
      <div className="admin-container">
        <AdminNavbar />
        <div className="admin-layout">
          <AdminSidebar />
          <div className="admin-content">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading monthly report...</p>
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
          <div className="page-header">
            <h1>Monthly Report - Devstrings</h1>
            <div className="report-controls">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              >
                {months.map((month, index) => (
                  <option key={index} value={index + 1}>{month}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="report-actions">
            <button className="btn-success" onClick={handleExportPDF}>
              📄 Export PDF
            </button>
            <button className="btn-success" onClick={handleExportExcel}>
              📊 Export Excel
            </button>
          </div>

          <div className="stats-grid-small">
            <div className="stat-card-small blue">
              <span className="stat-label">Employees</span>
              <span className="stat-value">{totals.totalEmployees}</span>
            </div>
            <div className="stat-card-small green">
              <span className="stat-label">Total Present</span>
              <span className="stat-value">{totals.totalPresent}</span>
            </div>
            <div className="stat-card-small red">
              <span className="stat-label">Total Absent</span>
              <span className="stat-value">{totals.totalAbsent}</span>
            </div>
            <div className="stat-card-small orange">
              <span className="stat-label">Total Leave</span>
              <span className="stat-value">{totals.totalLeave}</span>
            </div>
            <div className="stat-card-small purple">
              <span className="stat-label">Total Hours</span>
              <span className="stat-value">{totals.totalHours}</span>
            </div>
            <div className="stat-card-small teal">
              <span className="stat-label">Avg Attendance</span>
              <span className="stat-value">{totals.avgAttendance}%</span>
            </div>
          </div>

          <div className="filters-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by employee name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map((dept, index) => (
                  <option key={index} value={dept}>{dept}</option>
                ))}
              </select>

              <button 
                className="btn-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setFilterDepartment('');
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {filteredEmployees.length > 0 ? (
            <div className="table-container">
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
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id}>
                      <td><strong>{employee.name}</strong></td>
                      <td>{employee.department}</td>
                      <td>{employee.totalDays}</td>
                      <td className="text-green">{employee.presentDays}</td>
                      <td className="text-red">{employee.absentDays}</td>
                      <td className="text-orange">{employee.leaveDays}</td>
                      <td>{employee.totalHours} hrs</td>
                      <td>{employee.avgHoursPerDay} hrs</td>
                      <td>
                        <span className={`attendance-percentage ${getAttendanceColor(employee.attendanceRate)}`}>
                          {employee.attendanceRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>No Data Available</h3>
              <p>No employees found for {months[selectedMonth - 1]} {selectedYear}</p>
            </div>
          )}

          <div className="report-footer">
            <div className="legend">
              <h3>Performance Legend:</h3>
              <div className="legend-items">
                <span className="legend-item">
                  <span className="legend-color excellent"></span> Excellent (90%+)
                </span>
                <span className="legend-item">
                  <span className="legend-color good"></span> Good (80-89%)
                </span>
                <span className="legend-item">
                  <span className="legend-color average"></span> Average (70-79%)
                </span>
                <span className="legend-item">
                  <span className="legend-color poor"></span> Poor (&lt;70%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReport;