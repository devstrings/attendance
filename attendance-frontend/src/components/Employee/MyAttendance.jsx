import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeNavbar from './EmployeeNavbar';
import employeeService from '../../services/employeeService';
import '../../styles/Employee.css';

const MyAttendance = () => {
  const navigate = useNavigate();
  const [attendanceData, setAttendanceData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedMonth, selectedYear]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const response = await employeeService.getAttendanceHistory(selectedMonth, selectedYear);
      
      if (response.success) {
        setAttendanceData(response.data.attendance || []);
        setStatistics(response.data.statistics || {});
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      alert('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (statistics) {
      const totalDays = statistics.totalDays || 0;
      const presentDays = statistics.present || 0;
      const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;

      return {
        totalDays,
        presentDays: statistics.present || 0,
        absentDays: statistics.absent || 0,
        leaveDays: statistics.onLeave || 0,
        totalHours: statistics.totalWorkHours || 0,
        attendanceRate
      };
    }

    // Fallback calculation from attendance data
    const totalDays = attendanceData.length;
    const presentDays = attendanceData.filter(d => d.status === 'present').length;
    const absentDays = attendanceData.filter(d => d.status === 'absent').length;
    const leaveDays = attendanceData.filter(d => d.status === 'on-leave' || d.status === 'leave').length;
    const totalHours = attendanceData.reduce((sum, d) => sum + (d.workHours || 0), 0);
    const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;

    return { totalDays, presentDays, absentDays, leaveDays, totalHours, attendanceRate };
  };

  const stats = calculateStats();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return '✅';
      case 'absent': return '❌';
      case 'on-leave':
      case 'leave': return '🏖️';
      case 'holiday': return '🎉';
      case 'half-day': return '🕐';
      default: return '❓';
    }
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return '-';
    return new Date(dateTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="employee-container">
        <EmployeeNavbar />
        <div className="employee-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading attendance...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-container">
      <EmployeeNavbar />
      <div className="employee-content">
        <div className="page-header">
          <h1>My Attendance</h1>
          <div className="month-selector">
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

        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{stats.totalDays}</h3>
              <p>Total Days</p>
            </div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.presentDays}</h3>
              <p>Present Days</p>
            </div>
          </div>
          <div className="stat-card red">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <h3>{stats.absentDays}</h3>
              <p>Absent Days</p>
            </div>
          </div>
          <div className="stat-card orange">
            <div className="stat-icon">🏖️</div>
            <div className="stat-content">
              <h3>{stats.leaveDays}</h3>
              <p>Leave Days</p>
            </div>
          </div>
          <div className="stat-card purple">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <h3>{Math.round(stats.totalHours)}</h3>
              <p>Total Hours</p>
            </div>
          </div>
          <div className="stat-card teal">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.attendanceRate}%</h3>
              <p>Attendance Rate</p>
            </div>
          </div>
        </div>

        <div className="table-container">
          <h2>Attendance Records - {months[selectedMonth - 1]} {selectedYear}</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Status</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Hours Worked</th>
                <th>Late</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.length > 0 ? (
                attendanceData.map((record) => {
                  const recordDate = new Date(record.date);
                  const dayName = recordDate.toLocaleDateString('en-US', { weekday: 'short' });
                  
                  return (
                    <tr key={record._id}>
                      <td>{recordDate.toLocaleDateString()}</td>
                      <td>{dayName}</td>
                      <td>
                        <span className={`status-badge ${record.status}`}>
                          {getStatusIcon(record.status)} {record.status}
                        </span>
                      </td>
                      <td>{formatTime(record.clockIn)}</td>
                      <td>{formatTime(record.clockOut)}</td>
                      <td>{record.workHours ? `${record.workHours.toFixed(1)} hrs` : '0 hrs'}</td>
                      <td>
                        {record.isLate ? (
                          <span className="late-badge">
                            🕐 {record.lateMinutes || 0} min
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">
                    No attendance records found for {months[selectedMonth - 1]} {selectedYear}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="performance-indicator">
          <h3>Performance Indicator</h3>
          <div className="performance-bar">
            <div 
              className={`performance-fill ${
                stats.attendanceRate >= 90 ? 'excellent' :
                stats.attendanceRate >= 80 ? 'good' :
                stats.attendanceRate >= 70 ? 'average' : 'poor'
              }`}
              style={{ width: `${stats.attendanceRate}%` }}
            >
              {stats.attendanceRate}%
            </div>
          </div>
          <div className="performance-legend">
            <span className="excellent">Excellent (90%+)</span>
            <span className="good">Good (80-89%)</span>
            <span className="average">Average (70-79%)</span>
            <span className="poor">Poor (&lt;70%)</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .late-badge {
          background: #fef3c7;
          color: #92400e;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .performance-fill.excellent {
          background: linear-gradient(90deg, #10b981, #059669);
        }

        .performance-fill.good {
          background: linear-gradient(90deg, #3b82f6, #2563eb);
        }

        .performance-fill.average {
          background: linear-gradient(90deg, #f59e0b, #d97706);
        }

        .performance-fill.poor {
          background: linear-gradient(90deg, #ef4444, #dc2626);
        }
      `}</style>
    </div>
  );
};

export default MyAttendance;