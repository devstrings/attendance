import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import api from '../../services/api';
import '../../styles/Admin.css';

const AttendanceDetails = () => {
  const navigate = useNavigate();
  const { attendanceId } = useParams(); // ✅ FIXED: Changed from recordId to attendanceId
  const [record, setRecord] = useState(null);
  const [employeeHistory, setEmployeeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (attendanceId) {
      fetchRecordDetails();
    }
  }, [attendanceId]);

  const fetchRecordDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching attendance ID:', attendanceId);
      
      // ✅ FIXED: Correct API endpoint
      const response = await api.get(`/attendance/${attendanceId}`);
      
      console.log('📥 Response:', response.data);
      
      if (response.data.success && response.data.data.attendance) {
        const att = response.data.data.attendance;
        
        setRecord({
          id: att._id,
          employeeId: att.employeeId?.employeeCode || 'N/A',
          employeeName: `${att.employeeId?.firstName || ''} ${att.employeeId?.lastName || ''}`.trim() || 'N/A',
          email: att.employeeId?.userId?.email || 'N/A',
          phone: att.employeeId?.phoneNumber || 'N/A',
          department: att.employeeId?.department || 'N/A',
          position: att.employeeId?.designation || 'N/A',
          date: att.date,
          status: att.status,
          clockIn: att.clockIn ? new Date(att.clockIn).toLocaleTimeString() : null,
          clockOut: att.clockOut ? new Date(att.clockOut).toLocaleTimeString() : null,
          hoursWorked: att.workHours || 0,
          notes: att.remarks || '',
          managedBy: att.managerId ? `${att.managerId.firstName || ''} ${att.managerId.lastName || ''}`.trim() : 'N/A'
        });

        // Fetch employee history
        if (att.employeeId?._id) {
          fetchEmployeeHistory(att.employeeId._id);
        } else {
          setHistoryLoading(false);
        }
      } else {
        setError('Attendance record not found');
      }
    } catch (error) {
      console.error('❌ Error fetching record:', error);
      setError(error.response?.data?.message || 'Failed to load attendance details');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeHistory = async (employeeId) => {
    try {
      setHistoryLoading(true);
      
      // Fetch last 30 days history
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      console.log('📊 Fetching history for employee:', employeeId);
      
      const response = await api.get('/attendance', {
        params: {
          employeeId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          limit: 100
        }
      });
      
      if (response.data.success) {
        const history = response.data.data.attendance.map(att => ({
          date: att.date,
          status: att.status,
          hoursWorked: att.workHours || 0
        }));
        
        setEmployeeHistory(history);
      }
    } catch (error) {
      console.error('❌ Error fetching history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return '✅';
      case 'absent': return '❌';
      case 'on-leave': return '🏖️';
      case 'leave': return '🏖️';
      case 'holiday': return '🎉';
      case 'late': return '⏰';
      case 'half-day': return '🕐';
      default: return '❓';
    }
  };

  const calculateMonthlyStats = () => {
    const totalDays = employeeHistory.length;
    const presentDays = employeeHistory.filter(h => h.status === 'present' || h.status === 'late').length;
    const absentDays = employeeHistory.filter(h => h.status === 'absent').length;
    const leaveDays = employeeHistory.filter(h => h.status === 'on-leave' || h.status === 'leave').length;
    const totalHours = employeeHistory.reduce((sum, h) => sum + (h.hoursWorked || 0), 0);

    return { totalDays, presentDays, absentDays, leaveDays, totalHours };
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
              <p>Loading attendance details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="admin-container">
        <AdminNavbar />
        <div className="admin-layout">
          <AdminSidebar />
          <div className="admin-content">
            <div className="error-container">
              <h2>❌ {error || 'Record Not Found'}</h2>
              <p>The attendance record you're looking for doesn't exist or has been removed.</p>
              <button 
                className="btn-primary"
                onClick={() => navigate('/admin/attendance-view')}
              >
                ← Back to Attendance View
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const monthlyStats = calculateMonthlyStats();

  return (
    <div className="admin-container">
      <AdminNavbar />
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <div className="page-header">
            <h1>Attendance Details</h1>
            <button 
              className="back-btn"
              onClick={() => navigate('/admin/attendance-view')}
            >
              ← Back to Attendance
            </button>
          </div>

          <div className="details-container">
            <div className="details-section">
              <h2>Employee Information</h2>
              <div className="details-grid">
                <div className="detail-item">
                  <label>Employee ID:</label>
                  <span>{record.employeeId}</span>
                </div>
                <div className="detail-item">
                  <label>Name:</label>
                  <span>{record.employeeName}</span>
                </div>
                <div className="detail-item">
                  <label>Email:</label>
                  <span>{record.email}</span>
                </div>
                <div className="detail-item">
                  <label>Phone:</label>
                  <span>{record.phone}</span>
                </div>
                <div className="detail-item">
                  <label>Department:</label>
                  <span>{record.department}</span>
                </div>
                <div className="detail-item">
                  <label>Position:</label>
                  <span>{record.position}</span>
                </div>
                <div className="detail-item">
                  <label>Manager:</label>
                  <span>{record.managedBy}</span>
                </div>
              </div>
            </div>

            <div className="details-section">
              <h2>Attendance Information</h2>
              <div className="details-grid">
                <div className="detail-item">
                  <label>Date:</label>
                  <span>{new Date(record.date).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <label>Status:</label>
                  <span className={`status-badge ${record.status}`}>
                    {getStatusIcon(record.status)} {record.status}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Clock In:</label>
                  <span>{record.clockIn || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Clock Out:</label>
                  <span>{record.clockOut || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Hours Worked:</label>
                  <span>{record.hoursWorked || 0} hours</span>
                </div>
                <div className="detail-item full-width">
                  <label>Notes:</label>
                  <span>{record.notes || 'No notes'}</span>
                </div>
              </div>
            </div>

            <div className="details-section">
              <h2>Monthly Summary (Last 30 Days)</h2>
              <div className="stats-grid-small">
                <div className="stat-card-small blue">
                  <span className="stat-label">Total Days</span>
                  <span className="stat-value">{monthlyStats.totalDays}</span>
                </div>
                <div className="stat-card-small green">
                  <span className="stat-label">Present</span>
                  <span className="stat-value">{monthlyStats.presentDays}</span>
                </div>
                <div className="stat-card-small red">
                  <span className="stat-label">Absent</span>
                  <span className="stat-value">{monthlyStats.absentDays}</span>
                </div>
                <div className="stat-card-small orange">
                  <span className="stat-label">Leave</span>
                  <span className="stat-value">{monthlyStats.leaveDays}</span>
                </div>
                <div className="stat-card-small purple">
                  <span className="stat-label">Total Hours</span>
                  <span className="stat-value">{monthlyStats.totalHours.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div className="details-section">
              <h2>Recent Attendance History</h2>
              {historyLoading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <p>Loading history...</p>
                </div>
              ) : employeeHistory.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Hours Worked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeHistory.map((history, index) => (
                        <tr key={index}>
                          <td>{new Date(history.date).toLocaleDateString()}</td>
                          <td>
                            <span className={`status-badge ${history.status}`}>
                              {getStatusIcon(history.status)} {history.status}
                            </span>
                          </td>
                          <td>{history.hoursWorked || 0} hours</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">No attendance history available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDetails;