import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ManagerNavbar from './ManagerNavbar';
import ManagerSidebar from './ManagerSidebar';
import managerService from '../../services/managerService';
import '../../styles/Manager.css';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayAttendance: 0,
    pendingLeaves: 0,
    absentToday: 0
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [systemConfig, setSystemConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    // ✅ Initial fetch
    fetchDashboardData();
    fetchSystemConfig();

    // ✅ Auto-refresh every 5 seconds for real-time updates
    intervalRef.current = setInterval(() => {
      fetchDashboardData(true); // Silent refresh
    }, 5000);

    // ✅ Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const response = await managerService.getDashboardStats();
      
      console.log('📊 Dashboard Stats Updated:', response);
      
      if (response.success) {
        setStats(response.data.stats);
        setRecentAttendance(response.data.recentAttendance || []);
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchSystemConfig = async () => {
    try {
      const response = await managerService.getSystemConfig();
      if (response.success) {
        setSystemConfig(response.data.config);
        console.log('✅ System config loaded:', response.data.config);
      }
    } catch (error) {
      console.error('❌ Error fetching system config:', error);
    }
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const StatCard = ({ title, value, icon, color, onClick }) => (
    <div className={`stat-card ${color}`} onClick={onClick}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return '✅';
      case 'absent': return '❌';
      case 'leave': return '🏖️';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="manager-container">
        <ManagerNavbar />
        <div className="manager-layout">
          <ManagerSidebar />
          <div className="manager-content">
            <div className="loader">Loading...</div>
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
          <div className="dashboard-header">
            <h1>Manager Dashboard</h1>
            <p>Manage your team's attendance and performance</p>
            <small style={{ color: '#666', fontSize: '12px' }}>
              🔄 Auto-refreshing every 5 seconds
            </small>
          </div>

          <div className="stats-grid">
            <StatCard
              title="My Employees"
              value={stats.totalEmployees}
              icon="👥"
              color="blue"
              onClick={() => navigate('/manager/my-employees')}
            />
            <StatCard
              title="Present Today"
              value={stats.todayAttendance}
              icon="✅"
              color="green"
              onClick={() => navigate('/manager/mark-attendance')}
            />
            <StatCard
              title="Absent Today"
              value={stats.absentToday}
              icon="❌"
              color="red"
              onClick={() => navigate('/manager/mark-attendance')}
            />
            <StatCard
              title="Pending Leaves"
              value={stats.pendingLeaves}
              icon="📝"
              color="orange"
              onClick={() => navigate('/manager/my-employees')}
            />
          </div>

          <div className="dashboard-actions">
            <button 
              className="action-btn primary"
              onClick={() => navigate('/manager/mark-attendance')}
            >
              📝 Mark Attendance
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => navigate('/manager/my-employees')}
            >
              👥 View My Employees
            </button>
            <button 
              className="action-btn info"
              onClick={() => navigate('/manager/clock-in-out')}
            >
              ⏰ Clock In/Out
            </button>
          </div>

          <div className="recent-activity">
            <h2>Recent Attendance</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Clock In</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttendance.length > 0 ? (
                    recentAttendance.map((record) => (
                      <tr key={record._id}>
                        <td>
                          <strong>
                            {record.employeeId?.firstName} {record.employeeId?.lastName}
                          </strong>
                        </td>
                        <td>
                          <span className={`status-badge ${record.status}`}>
                            {getStatusIcon(record.status)} {record.status}
                          </span>
                        </td>
                        <td>{new Date(record.date).toLocaleDateString()}</td>
                        <td>
                          {record.clockIn 
                            ? new Date(record.clockIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                            : '-'
                          }
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="no-data">No recent attendance records</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ✅ DYNAMIC SYSTEM SETTINGS */}
          <div className="quick-tips">
            <h3>📋 Office Hours & Policy</h3>
            {systemConfig ? (
              <ul>
                <li>
                  🕙 <strong>Office Hours:</strong> {formatTime(systemConfig.workingHours?.startTime)} - {formatTime(systemConfig.workingHours?.endTime)}
                </li>
                <li>
                  ⏰ <strong>Late Entry After:</strong> {formatTime(systemConfig.workingHours?.lateEntryTime)}
                </li>
                <li>
                  📅 <strong>Working Days:</strong> {systemConfig.workingDays?.join(', ') || 'Monday to Friday'}
                </li>
                <li>
                  🏖️ <strong>Weekends:</strong> {systemConfig.weekendDays?.join(', ') || 'Saturday & Sunday'}
                </li>
                <li>
                  ☕ <strong>Break Time:</strong> {systemConfig.breakTime || 60} minutes
                </li>
                <li>
                  📝 <strong>Monthly Leaves:</strong> {systemConfig.leavePolicy?.allowedLeaves || 2} days
                </li>
              </ul>
            ) : (
              <p style={{ textAlign: 'center', color: '#999' }}>Loading system settings...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;