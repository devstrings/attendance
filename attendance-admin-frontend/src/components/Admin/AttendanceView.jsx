import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import adminService from '../../services/adminService';
import adminAttendanceService from '../../services/adminAttendanceService'; // ✅ ADD THIS
import MarkAttendanceModal from './MarkAttendanceModal';
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
  const [showMarkAttendanceModal, setShowMarkAttendanceModal] = useState(false);
  const [totalEmployees, setTotalEmployees] = useState(0); // ✅ ADD THIS

  const statuses = ['present', 'absent', 'on-leave', 'holiday'];

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [selectedDate]);

  useEffect(() => {
    filterRecords();
    // eslint-disable-next-line
  }, [searchTerm, filterStatus, filterDepartment, attendanceRecords]);

  // ✅ UPDATED: Fetch both attendance and total employees
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch attendance records
      const attendanceResponse = await adminService.getAllAttendance({ date: selectedDate });
      
      // Fetch total employees
      const employeesResponse = await adminAttendanceService.getAllEmployees();
      
      if (attendanceResponse.success) {
        const formatted = attendanceResponse.data.attendance.map(record => ({
          id: record._id,
          employeeId: record.employeeId?.employeeCode || 'N/A',
          employeeName: `${record.employeeId?.firstName || ''} ${record.employeeId?.lastName || ''}`,
          department: record.employeeId?.department || 'N/A',
          status: record.status,
          clockIn: record.clockIn ? new Date(record.clockIn).toLocaleTimeString() : null,
          clockOut: record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : null,
          hoursWorked: record.workHours || 0,
          notes: record.remarks || ''
        }));
        setAttendanceRecords(formatted);
      } else {
        setAttendanceRecords([]);
      }

      // Set total employees count
      if (employeesResponse.success && employeesResponse.data.employees) {
        const realEmployees = employeesResponse.data.employees.filter(emp => 
          emp.firstName && 
          emp.lastName && 
          emp.employeeCode && 
          !emp.employeeCode.includes('TEST')
        );
        setTotalEmployees(realEmployees.length);
      } else {
        setTotalEmployees(0);
      }
    } catch (error) {
      console.error(error);
      setAttendanceRecords([]);
      setTotalEmployees(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    await fetchData();
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

  // ✅ FIXED: Stats calculation with proper variable definitions
  const presentCount = filteredRecords.filter(r => r.status === 'present').length;
  const leaveCount = filteredRecords.filter(r => r.status === 'on-leave').length;
  const holidayCount = filteredRecords.filter(r => r.status === 'holiday').length;
  const absentCount = Math.max(0, totalEmployees - presentCount - leaveCount - holidayCount);

  const stats = {
    total: totalEmployees,
    present: presentCount,
    absent: absentCount,
    leave: leaveCount,
    holiday: holidayCount
  };

  const handleViewDetails = (id) => {
    navigate(`/admin/attendance-details/${id}`);
  };

  const handleAttendanceMarked = () => {
    setShowMarkAttendanceModal(false);
    fetchAttendance();
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

          {/* Mark Attendance Button */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            marginBottom: '16px' 
          }}>
            <button
              className="btn-primary"
              onClick={() => setShowMarkAttendanceModal(true)}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '10px',
                border: 'none',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              }}
            >
              <span style={{ fontSize: '18px' }}>✓</span>
              Mark Attendance
            </button>
          </div>

          {/* Filters */}
          <div className="filters-modern">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

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
            Showing {filteredRecords.length} records out of {stats.total} total employees
          </div>
        </div>
      </div>

      {/* Mark Attendance Modal */}
      {showMarkAttendanceModal && (
        <MarkAttendanceModal
          selectedDate={selectedDate}
          onClose={() => setShowMarkAttendanceModal(false)}
          onAttendanceMarked={handleAttendanceMarked}
        />
      )}
    </div>
  );
};

export default AttendanceView;