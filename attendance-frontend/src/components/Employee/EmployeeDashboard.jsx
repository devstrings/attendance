import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeNavbar from './EmployeeNavbar';
import '../../styles/Employee.css';

import employeeService from '../../services/employeeService';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getDashboardStats();
      
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="employee-container">
        <EmployeeNavbar />
        <div className="employee-content">
          <div className="loader">Loading...</div>
        </div>
      </div>
    );
  }

  const employee = dashboardData?.employee || {};
  const monthlyStats = dashboardData?.monthlyStats || {};
  const recentAttendance = dashboardData?.recentAttendance || [];

  return (
    <div className="employee-container">
      <EmployeeNavbar />
      <div className="employee-content">
        <div className="welcome-section">
          <h1>Welcome back, {employee.firstName} {employee.lastName}!</h1>
          <p>Here's your attendance overview</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{monthlyStats.present + monthlyStats.absent + monthlyStats.onLeave || 0}</h3>
              <p>Working Days</p>
            </div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{monthlyStats.present || 0}</h3>
              <p>Present Days</p>
            </div>
          </div>
          <div className="stat-card red">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <h3>{monthlyStats.absent || 0}</h3>
              <p>Absent Days</p>
            </div>
          </div>
          <div className="stat-card orange">
            <div className="stat-icon">🏖️</div>
            <div className="stat-content">
              <h3>{monthlyStats.onLeave || 0}</h3>
              <p>On Leave</p>
            </div>
          </div>
          <div className="stat-card purple">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <h3>{monthlyStats.late || 0}</h3>
              <p>Late Days</p>
            </div>
          </div>
          <div className="stat-card teal">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <h3>{dashboardData?.pendingLeaves || 0}</h3>
              <p>Pending Leaves</p>
            </div>
          </div>
        </div>

        {/* Dashboard Actions */}
        <div className="dashboard-actions">
          <button 
            className="action-btn primary"
            onClick={() => navigate('/employee/my-attendance')}
          >
            📝 View My Attendance
          </button>
          <button 
            className="action-btn secondary"
            onClick={() => navigate('/employee/attendance-history')}
          >
            📅 Attendance History
          </button>
          <button 
            className="action-btn info"
            onClick={() => navigate('/employee/profile')}
          >
            👤 My Profile
          </button>
        </div>

        {/* Recent Attendance */}
        <div className="recent-attendance-section">
          <h2>Recent Attendance</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.length > 0 ? (
                  recentAttendance.map((record) => (
                    <tr key={record._id}>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${record.status}`}>
                          {record.status}
                        </span>
                      </td>
                      <td>
                        {record.clockIn 
                          ? new Date(record.clockIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                          : '-'
                        }
                      </td>
                      <td>
                        {record.clockOut 
                          ? new Date(record.clockOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                          : '-'
                        }
                      </td>
                      <td>{record.workHours || 0} hrs</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-data">No attendance records yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;