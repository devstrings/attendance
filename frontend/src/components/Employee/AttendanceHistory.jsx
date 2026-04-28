/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars, import/no-anonymous-default-export, jsx-a11y/anchor-is-valid */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeNavbar from './EmployeeNavbar';
import employeeService from '../../services/employeeService';
import '../../styles/Employee.css';

const AttendanceHistory = () => {
  const navigate = useNavigate();
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // Set default start date to 3 months ago
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    setDateRange(prev => ({
      ...prev,
      startDate: threeMonthsAgo.toISOString().split('T')[0]
    }));
  }, []);

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchHistory();
    }
  }, [dateRange]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      console.log('📥 Fetching real attendance history...');
      
      // ✅ REAL API CALL - No more dummy data!
      const response = await employeeService.getMyAttendance({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      if (response.success && response.data?.attendance) {
        console.log(`✅ Loaded ${response.data.attendance.length} real records`);
        setHistoryData(response.data.attendance);
      } else {
        setHistoryData([]);
      }
    } catch (error) {
      console.error('❌ Error fetching history:', error);
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateOverallStats = () => {
    const totalDays = historyData.length;
    const presentDays = historyData.filter(d => d.status === 'present').length;
    const absentDays = historyData.filter(d => d.status === 'absent').length;
    const leaveDays = historyData.filter(d => d.status === 'on-leave' || d.status === 'leave').length;
    const totalHours = historyData.reduce((sum, d) => sum + (d.workHours || 0), 0);
    const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;

    return { totalDays, presentDays, absentDays, leaveDays, totalHours: Math.round(totalHours), attendanceRate };
  };

  const getMonthlyBreakdown = () => {
    const monthlyData = {};
    
    historyData.forEach(record => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          total: 0,
          present: 0,
          absent: 0,
          leave: 0,
          hours: 0
        };
      }
      
      monthlyData[monthKey].total++;
      if (record.status === 'present') monthlyData[monthKey].present++;
      if (record.status === 'absent') monthlyData[monthKey].absent++;
      if (record.status === 'on-leave' || record.status === 'leave') monthlyData[monthKey].leave++;
      monthlyData[monthKey].hours += record.workHours || 0;
    });

    return Object.values(monthlyData).reverse();
  };

  const overallStats = calculateOverallStats();
  const monthlyBreakdown = getMonthlyBreakdown();

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
            <p>Loading history...</p>
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
          <h1>Attendance History</h1>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/employee/my-attendance')}
          >
            ← Back to Current Month
          </button>
        </div>

        <div className="date-range-selector">
          <div className="date-input-group">
            <label>From:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              max={dateRange.endDate}
            />
          </div>
          <div className="date-input-group">
            <label>To:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              min={dateRange.startDate}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{overallStats.totalDays}</h3>
              <p>Total Days</p>
            </div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{overallStats.presentDays}</h3>
              <p>Present Days</p>
            </div>
          </div>
          <div className="stat-card red">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <h3>{overallStats.absentDays}</h3>
              <p>Absent Days</p>
            </div>
          </div>
          <div className="stat-card orange">
            <div className="stat-icon">🏖️</div>
            <div className="stat-content">
              <h3>{overallStats.leaveDays}</h3>
              <p>Leave Days</p>
            </div>
          </div>
          <div className="stat-card purple">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <h3>{overallStats.totalHours}</h3>
              <p>Total Hours</p>
            </div>
          </div>
          <div className="stat-card teal">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{overallStats.attendanceRate}%</h3>
              <p>Attendance Rate</p>
            </div>
          </div>
        </div>

        <div className="monthly-breakdown-section">
          <h2>Monthly Breakdown</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total Days</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Leave</th>
                  <th>Total Hours</th>
                  <th>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdown.length > 0 ? (
                  monthlyBreakdown.map((month, index) => {
                    const rate = ((month.present / month.total) * 100).toFixed(1);
                    return (
                      <tr key={index}>
                        <td><strong>{month.month}</strong></td>
                        <td>{month.total}</td>
                        <td className="text-green">{month.present}</td>
                        <td className="text-red">{month.absent}</td>
                        <td className="text-orange">{month.leave}</td>
                        <td>{Math.round(month.hours)} hrs</td>
                        <td>
                          <span className={`attendance-percentage ${rate >= 90 ? 'excellent' : rate >= 80 ? 'good' : 'average'}`}>
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="no-data">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="detailed-history-section">
          <h2>Detailed History</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Status</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Hours</th>
                  <th>Late</th>
                </tr>
              </thead>
              <tbody>
                {historyData.length > 0 ? (
                  historyData.map((record, index) => {
                    const recordDate = new Date(record.date);
                    const dayName = recordDate.toLocaleDateString('en-US', { weekday: 'short' });
                    
                    return (
                      <tr key={record._id || index}>
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
                            <span className="late-badge">🔴 {record.lateMinutes || 0} min</span>
                          ) : (
                            <span className="ontime-badge">✅ On Time</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="no-data">
                      No records found for selected date range
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
          background: #fee;
          color: #c00;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .ontime-badge {
          background: #efe;
          color: #0a0;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default AttendanceHistory;
