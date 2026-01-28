import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ManagerNavbar from './ManagerNavbar';
import ManagerSidebar from './ManagerSidebar';
import managerService from '../../services/managerService';
import '../../styles/Manager.css';

const EmployeeAttendanceHistory = () => {
  const { employeeId } = useParams(); // ✅ Can be undefined if coming from sidebar
  const navigate = useNavigate();
  
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employeeId || '');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [statistics, setStatistics] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    totalLate: 0
  });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: ''
  });
  const [loading, setLoading] = useState(true);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  useEffect(() => {
    fetchMyEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      fetchAttendanceHistory();
    }
  }, [selectedEmployeeId, filters]);

  const fetchMyEmployees = async () => {
    try {
      setLoading(true);
      console.log('📥 Fetching manager employees...');
      
      const response = await managerService.getMyEmployees();
      
      if (response.success && response.data.employees) {
        setEmployees(response.data.employees);
        console.log(`✅ Loaded ${response.data.employees.length} employees`);
        
        // ✅ If employeeId from URL, set it as selected
        if (employeeId && response.data.employees.length > 0) {
          setSelectedEmployeeId(employeeId);
        } else if (response.data.employees.length > 0) {
          // ✅ Auto-select first employee if no specific ID
          setSelectedEmployeeId(response.data.employees[0]._id);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    if (!selectedEmployeeId) return;
    
    try {
      setFetchingHistory(true);
      console.log('📊 Fetching attendance for employee:', selectedEmployeeId);
      
      const response = await managerService.getEmployeeAttendanceHistory(
        selectedEmployeeId,
        filters
      );
      
      if (response.success) {
        setAttendanceRecords(response.data.attendance || []);
        setStatistics(response.data.statistics || {
          totalPresent: 0,
          totalAbsent: 0,
          totalLate: 0
        });
        console.log('✅ Attendance history loaded');
      }
    } catch (error) {
      console.error('❌ Error fetching attendance history:', error);
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    setSelectedEmployeeId(empId);
    console.log('👤 Selected employee:', empId);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: ''
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'present': return 'status-present';
      case 'absent': return 'status-absent';
      case 'leave': return 'status-leave';
      case 'half-day': return 'status-half-day';
      default: return '';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const selectedEmployee = employees.find(emp => emp._id === selectedEmployeeId);

  if (loading) {
    return (
      <div className="manager-container">
        <ManagerNavbar />
        <div className="manager-layout">
          <ManagerSidebar />
          <div className="manager-content">
            <div className="loader">Loading employees...</div>
          </div>
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="manager-container">
        <ManagerNavbar />
        <div className="manager-layout">
          <ManagerSidebar />
          <div className="manager-content">
            <div className="page-header">
              <h1>Attendance History</h1>
            </div>
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No Employees Found</h3>
              <p>You don't have any employees assigned yet.</p>
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
          <div className="page-header">
            <h1>📅 Attendance History</h1>
            <p>View detailed attendance records for your team members</p>
          </div>

          {/* Employee Selection & Filters */}
          <div className="filters-section">
            <div className="filter-row">
              <div className="filter-group">
                <label>Select Employee</label>
                <select 
                  value={selectedEmployeeId} 
                  onChange={handleEmployeeChange}
                  className="filter-select"
                >
                  <option value="">Choose Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} - {emp.employeeCode}
                    </option>
                  ))}
                </select>
              </div>

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
                <label>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Status</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="on-leave">On Leave</option> // ✅ Changed 'leave' to 'on-leave'
                  <option value="half-day">Half Day</option>
                </select>
              </div>

              <div className="filter-group">
                <button onClick={clearFilters} className="btn-secondary">
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          {selectedEmployee && (
            <>
              <div className="employee-info-card">
                <div className="employee-avatar">
                  {selectedEmployee.firstName.charAt(0)}{selectedEmployee.lastName.charAt(0)}
                </div>
                <div className="employee-details">
                  <h3>{selectedEmployee.firstName} {selectedEmployee.lastName}</h3>
                  <p>{selectedEmployee.employeeCode} • {selectedEmployee.department}</p>
                </div>
              </div>

              <div className="stats-grid-small">
                <div className="stat-card-small green">
                  <span className="stat-label">Total Present</span>
                  <span className="stat-value">{statistics.totalPresent}</span>
                </div>
                <div className="stat-card-small red">
                  <span className="stat-label">Total Absent</span>
                  <span className="stat-value">{statistics.totalAbsent}</span>
                </div>
                <div className="stat-card-small orange">
                  <span className="stat-label">Late Arrivals</span>
                  <span className="stat-value">{statistics.totalLate}</span>
                </div>
              </div>
            </>
          )}

          {/* Attendance Table */}
          <div className="table-container">
            <h2>Attendance Records</h2>
            {fetchingHistory ? (
              <div className="loader">Loading attendance records...</div>
            ) : attendanceRecords.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Working Hours</th>
                    <th>Late</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record) => (
                    <tr key={record._id}>
                      <td>{formatDate(record.date)}</td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td>{formatTime(record.clockIn)}</td>
                      <td>{formatTime(record.clockOut)}</td>
                      <td>{record.workHours ? `${record.workHours.toFixed(2)} hrs` : '-'}</td>
                      <td>
                        {record.isLate ? (
                          <span className="late-badge">🔴 Late ({record.lateMinutes} min)</span>
                        ) : (
                          <span className="ontime-badge">✅ On Time</span>
                        )}
                      </td>
                      <td>{record.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">
                <p>No attendance records found for the selected filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendanceHistory;