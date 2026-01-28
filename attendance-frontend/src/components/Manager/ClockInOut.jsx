import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ManagerNavbar from './ManagerNavbar';
import ManagerSidebar from './ManagerSidebar';
import managerService from '../../services/managerService';
import attendanceService from '../../services/attendanceService';
import '../../styles/Manager.css';

const ClockInOut = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClockingIn] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Real-time clock update
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // ✅ Initial fetch
    fetchTodayAttendance();

    // ✅ Auto-refresh every 5 seconds
    intervalRef.current = setInterval(() => {
      fetchTodayAttendance(true); // Silent refresh
    }, 5000);

    return () => {
      clearInterval(timer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchTodayAttendance = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      console.log('📥 Fetching today attendance...');
      
      // ✅ Get manager's employees
      const employeesResponse = await managerService.getMyEmployees();
      
      if (!employeesResponse.success || !employeesResponse.data.employees) {
        setTodayAttendance([]);
        if (!silent) setLoading(false);
        return;
      }

      const employees = employeesResponse.data.employees;
      console.log(`✅ Found ${employees.length} employees`);

      // ✅ Get today's attendance
      const today = new Date().toISOString().split('T')[0];
      const attendanceResponse = await attendanceService.getAllAttendance({ date: today });

      // ✅ Check if today is weekend
      const dayOfWeek = new Date().getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // ✅ Create attendance map
      const attendanceMap = {};
      if (attendanceResponse.success && attendanceResponse.data?.attendance) {
        attendanceResponse.data.attendance.forEach(record => {
          const empId = record.employeeId?._id || record.employeeId;
          if (empId) {
            attendanceMap[empId] = record;
          }
        });
      }

      // ✅ Combine data with weekend check
      const combinedData = employees.map(emp => {
        const attendance = attendanceMap[emp._id];
        
        return {
          id: emp._id,
          employeeId: emp.employeeCode || 'N/A',
          employeeName: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
          clockIn: attendance?.clockIn ? new Date(attendance.clockIn).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }) : null,
          clockOut: attendance?.clockOut ? new Date(attendance.clockOut).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }) : null,
          status: isWeekend ? 'weekend' : (attendance?.clockOut ? 'clocked-out' : attendance?.clockIn ? 'clocked-in' : 'not-clocked-in'),
          attendanceId: attendance?._id,
          isWeekend
        };
      });

      console.log('✅ Combined Data:', combinedData);
      setTodayAttendance(combinedData);
      
    } catch (error) {
      console.error('❌ Error fetching attendance:', error);
      setTodayAttendance([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[date.getDay()];
    const formatted = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    return `${formatted}${isWeekend ? ' (Weekend - Off)' : ''}`;
  };

  const handleClockIn = async (empId, employeeName) => {
    // ✅ Check if weekend
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (isWeekend) {
      alert('🏖️ Today is weekend (Saturday/Sunday). Office is closed!');
      return;
    }

    // ✅ Check office hours (10 AM - 7 PM)
    const now = new Date();
    const currentHour = now.getHours();
    
    if (currentHour < 10) {
      alert('⏰ Office opens at 10:00 AM. Please clock in after that.');
      return;
    }
    
    if (currentHour >= 19) {
      alert('⏰ Office hours ended at 7:00 PM. Cannot clock in now.');
      return;
    }

    if (window.confirm(`Clock in for ${employeeName}?`)) {
      setClockingIn(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const clockInTime = `${today}T${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

        const response = await attendanceService.createAttendance({
          employeeId: empId,
          date: today,
          clockIn: clockInTime,
          status: 'present'
        });
        
        if (response.success) {
          alert(`✅ ${employeeName} clocked in successfully at ${formatTime(now)}!`);
          await fetchTodayAttendance();
        }
      } catch (error) {
        console.error('❌ Error clocking in:', error);
        alert(error.response?.data?.message || 'Failed to clock in');
      } finally {
        setClockingIn(false);
      }
    }
  };

  const handleClockOut = async (attendanceId, employeeName) => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // ✅ Allow clock out anytime after clock in
    if (window.confirm(`Clock out for ${employeeName}?`)) {
      setClockingIn(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const clockOutTime = `${today}T${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
        
        const response = await attendanceService.updateAttendance(attendanceId, {
          clockOut: clockOutTime
        });
        
        if (response.success) {
          alert(`✅ ${employeeName} clocked out successfully at ${formatTime(now)}!`);
          await fetchTodayAttendance();
        }
      } catch (error) {
        console.error('❌ Error clocking out:', error);
        alert(error.response?.data?.message || 'Failed to clock out');
      } finally {
        setClockingIn(false);
      }
    }
  };

  const calculateWorkingHours = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return '-';

    try {
      const inTime = new Date(`2000-01-01 ${clockIn}`);
      const outTime = new Date(`2000-01-01 ${clockOut}`);
      const diff = (outTime - inTime) / (1000 * 60 * 60);
      
      return `${diff.toFixed(2)} hrs`;
    } catch {
      return '-';
    }
  };

  const stats = {
    total: todayAttendance.length,
    clockedIn: todayAttendance.filter(a => a.status === 'clocked-in').length,
    clockedOut: todayAttendance.filter(a => a.status === 'clocked-out').length,
    notYetIn: todayAttendance.filter(a => a.status === 'not-clocked-in').length
  };

  const dayOfWeek = new Date().getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (loading) {
    return (
      <div className="manager-container">
        <ManagerNavbar />
        <div className="manager-layout">
          <ManagerSidebar />
          <div className="manager-content">
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '400px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #667eea',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 20px'
                }} />
                <p style={{ color: '#666' }}>Loading attendance...</p>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
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
            <h1>Clock In/Out</h1>
            <small style={{ color: '#666', fontSize: '12px' }}>
              🔄 Auto-refreshing every 5 seconds
            </small>
          </div>

          {isWeekend && (
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <strong>🏖️ Weekend - Office Closed</strong>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                Saturday & Sunday are off days
              </p>
            </div>
          )}

          <div className="clock-display">
            <div className="digital-clock">
              <div className="clock-time">{formatTime(currentTime)}</div>
              <div className="clock-date">{formatDate(currentTime)}</div>
            </div>
          </div>

          <div className="stats-grid-small">
            <div className="stat-card-small blue">
              <span className="stat-label">Total Employees</span>
              <span className="stat-value">{stats.total}</span>
            </div>
            <div className="stat-card-small green">
              <span className="stat-label">Clocked In</span>
              <span className="stat-value">{stats.clockedIn}</span>
            </div>
            <div className="stat-card-small purple">
              <span className="stat-label">Clocked Out</span>
              <span className="stat-value">{stats.clockedOut}</span>
            </div>
            <div className="stat-card-small orange">
              <span className="stat-label">Not Yet In</span>
              <span className="stat-value">{stats.notYetIn}</span>
            </div>
          </div>

          <div className="table-container">
            <h2>Today's Clock Records</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Employee Name</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {todayAttendance.length > 0 ? (
                  todayAttendance.map((record) => (
                    <tr key={record.id}>
                      <td>{record.employeeId}</td>
                      <td><strong>{record.employeeName}</strong></td>
                      <td className={record.clockIn ? 'text-green' : 'text-muted'}>
                        {record.isWeekend ? 'Weekend' : (record.clockIn || 'Not clocked in')}
                      </td>
                      <td className={record.clockOut ? 'text-blue' : 'text-muted'}>
                        {record.isWeekend ? 'Off' : (record.clockOut || 'Not clocked out')}
                      </td>
                      <td>
                        {record.isWeekend ? '-' : calculateWorkingHours(record.clockIn, record.clockOut)}
                      </td>
                      <td>
                        <span className={`status-badge ${record.status}`}>
                          {record.status === 'weekend' && '🏖️ Weekend'}
                          {record.status === 'clocked-in' && '🟢 Working'}
                          {record.status === 'clocked-out' && '🔴 Finished'}
                          {record.status === 'not-clocked-in' && '⚪ Not Started'}
                        </span>
                      </td>
                      <td>
                        {record.isWeekend ? (
                          <span className="text-muted">Off Day</span>
                        ) : record.status === 'clocked-in' ? (
                          <button
                            className="btn-small danger"
                            onClick={() => handleClockOut(record.attendanceId, record.employeeName)}
                            disabled={clockingIn}
                          >
                            Clock Out
                          </button>
                        ) : record.status === 'not-clocked-in' ? (
                          <button
                            className="btn-small success"
                            onClick={() => handleClockIn(record.id, record.employeeName)}
                            disabled={clockingIn}
                          >
                            Clock In
                          </button>
                        ) : (
                          <span className="text-muted">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-data">
                      No employees found under your supervision
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="info-box">
            <h3>ℹ️ Clock In/Out Information</h3>
            <ul>
              <li>🕙 <strong>Office Hours:</strong> 10:00 AM - 7:00 PM</li>
              <li>📅 <strong>Working Days:</strong> Monday to Friday</li>
              <li>🏖️ <strong>Weekends:</strong> Saturday & Sunday (Automatic Off)</li>
              <li>⏰ Clock in time is recorded when employee arrives</li>
              <li>🚪 Clock out time is recorded when employee leaves</li>
              <li>📊 Working hours are automatically calculated</li>
              <li>🔄 Page refreshes every 5 seconds for real-time updates</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClockInOut;