import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import adminService from '../../services/adminService';
import '../../styles/Admin.css';

const AttendanceView = () => {
  const navigate = useNavigate();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  const departments = ['Software House', 'Sales', 'Marketing', 'IT', 'HR', 'Finance', 'Operations'];
 const statuses = ['present', 'absent', 'on-leave', 'holiday']; // ✅ Changed 'leave' to 'on-leave'

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  useEffect(() => {
    filterRecords();
  }, [searchTerm, filterStatus, filterDepartment, attendanceRecords]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await adminService.getAllAttendance({ date: selectedDate });
      if (response.success) {
        const formatted = response.data.attendance.map(record => ({
          id: record._id,
          employeeId: record.employeeId?.employeeCode || 'N/A',
          employeeName: `${record.employeeId?.firstName || ''} ${record.employeeId?.lastName || ''}`,
          department: record.employeeId?.department || 'N/A',
          status: record.status,
          clockIn: record.clockIn ? new Date(record.clockIn).toLocaleTimeString() : null,
          clockOut: record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : null,
          hoursWorked: record.hoursWorked || 0,
          notes: record.remarks || ''
        }));
        setAttendanceRecords(formatted);
      } else {
        setAttendanceRecords([]);
      }
    } catch (error) {
      console.error(error);
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...attendanceRecords];

    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employeeId.includes(searchTerm)
      );
    }

    if (filterStatus) {
      filtered = filtered.filter(record => record.status === filterStatus);
    }

    if (filterDepartment) {
      filtered = filtered.filter(record => record.department === filterDepartment);
    }

    setFilteredRecords(filtered);
  };

  const stats = {
  total: filteredRecords.length,
  present: filteredRecords.filter(r => r.status === 'present').length,
  absent: filteredRecords.filter(r => r.status === 'absent').length,
  leave: filteredRecords.filter(r => r.status === 'on-leave').length, // ✅ Changed 'leave' to 'on-leave'
  holiday: filteredRecords.filter(r => r.status === 'holiday').length
};

  const handleViewDetails = (id) => {
    navigate(`/admin/attendance-details/${id}`);
  };

  if (loading) {
    return (
      <div className="admin-container">
        <AdminNavbar />
        <div className="admin-layout">
          <AdminSidebar />
          <div className="admin-content loading-screen">
            <h3>Loading Attendance...</h3>
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
          <div className="page-header-modern">
            <h1>Attendance View</h1>
            <div className="date-selector-modern">
              <label>Select Date</label>
              <input
                type="date"
                value={selectedDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="stats-grid-modern">
            <div className="stat-card-modern stat-1">
              <div className="stat-label-modern">Total</div>
              <div className="stat-value-modern">{stats.total}</div>
            </div>
            <div className="stat-card-modern stat-2">
              <div className="stat-label-modern">Present</div>
              <div className="stat-value-modern">{stats.present}</div>
            </div>
            <div className="stat-card-modern stat-3">
              <div className="stat-label-modern">Absent</div>
              <div className="stat-value-modern">{stats.absent}</div>
            </div>
            <div className="stat-card-modern stat-4">
              <div className="stat-label-modern">Leave</div>
              <div className="stat-value-modern">{stats.leave}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-modern">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map((dept, i) => (
                <option key={i} value={dept}>{dept}</option>
              ))}
            </select>

            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              {statuses.map((s, i) => (
                <option key={i} value={s}>{s}</option>
              ))}
            </select>

            <button
              className="btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setFilterDepartment('');
                setFilterStatus('');
              }}
            >
              Clear Filters
            </button>
          </div>

          {/* Table */}
          <div className="table-container-modern">
            <table className="data-table-modern">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Hours</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length ? (
                  filteredRecords.map(record => (
                    <tr key={record.id}>
                      <td>{record.employeeId}</td>
                      <td>{record.employeeName}</td>
                      <td>{record.department}</td>
                      <td>
                        <span className={`status-badge ${record.status}`}>
                          {record.status}
                        </span>
                      </td>
                      <td>{record.clockIn || '-'}</td>
                      <td>{record.clockOut || '-'}</td>
                      <td>{record.hoursWorked} hrs</td>
                      <td>{record.notes || '-'}</td>
                      <td>
                        <button
                          className="btn-icon view"
                          onClick={() => handleViewDetails(record.id)}
                        >
                          👁
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="no-data">
                      No attendance found for {new Date(selectedDate).toLocaleDateString()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer-modern">
            Showing {filteredRecords.length} records
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceView;
