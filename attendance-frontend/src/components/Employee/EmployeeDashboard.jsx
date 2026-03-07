import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeNavbar from './EmployeeNavbar';
import '../../styles/Employee.css';
import employeeService from '../../services/employeeService';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [systemConfig, setSystemConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchSystemConfig();
    
    // ✅ Auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(() => {
      fetchDashboardData(true); // Silent refresh
    }, 10000);
    
    setRefreshInterval(interval);
    
    // Cleanup on unmount
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await employeeService.getDashboardStats();
      
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchSystemConfig = async () => {
    try {
      const response = await employeeService.getSystemConfig();
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
          <small style={{ color: '#666', fontSize: '12px' }}>
            🔄 Auto-refreshing every 10 seconds
          </small>
        </div>

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
        </div>

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
                📝 <strong>Monthly Leaves Allowed:</strong> {systemConfig.leavePolicy?.allowedLeaves || 2} days
              </li>
              {systemConfig.leavePolicy?.autoAbsentOnExceed ? (
                <li>
                  ⚠️ <strong>Policy:</strong> Exceeding {systemConfig.leavePolicy?.allowedLeaves} leaves will mark you as Absent
                </li>
              ) : (
                <li>
                  ✅ <strong>Policy:</strong> No auto-absent on exceeding leave limit
                </li>
              )}
            </ul>
          ) : (
            <p style={{ textAlign: 'center', color: '#999' }}>Loading system settings...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;




// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import EmployeeNavbar from './EmployeeNavbar';
// import EmployeeSidebar from './EmployeeSidebar';
// import employeeService from '../../services/employeeService';
// import '../../styles/Employee.css';

// /**
//  * EmployeeDashboard Component
//  * Admin Dashboard jaisa style - same layout, same cards
//  * Employee-specific data aur actions ke saath
//  */
// const EmployeeDashboard = () => {
//   const navigate = useNavigate();

//   const [dashboardData, setDashboardData] = useState(null);
//   const [systemConfig, setSystemConfig] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchDashboardData();
//     fetchSystemConfig();

//     // Auto-refresh every 10 seconds
//     const interval = setInterval(() => {
//       fetchDashboardData(true);
//     }, 10000);

//     return () => clearInterval(interval);
//   }, []);

//   const fetchDashboardData = async (silent = false) => {
//     try {
//       if (!silent) setLoading(true);
//       const response = await employeeService.getDashboardStats();
//       if (response.success) {
//         setDashboardData(response.data);
//       }
//     } catch (error) {
//       console.error('❌ Dashboard error:', error);
//     } finally {
//       if (!silent) setLoading(false);
//     }
//   };

//   const fetchSystemConfig = async () => {
//     try {
//       const response = await employeeService.getSystemConfig();
//       if (response.success) {
//         setSystemConfig(response.data.config);
//       }
//     } catch (error) {
//       console.error('❌ System config error:', error);
//     }
//   };

//   const formatTime = (time) => {
//     if (!time) return 'N/A';
//     const [hours, minutes] = time.split(':');
//     const hour = parseInt(hours);
//     const ampm = hour >= 12 ? 'PM' : 'AM';
//     const displayHour = hour % 12 || 12;
//     return `${displayHour}:${minutes} ${ampm}`;
//   };

//   const getAttendancePercentage = () => {
//     const ms = monthlyStats;
//     const total = (ms.present || 0) + (ms.absent || 0) + (ms.onLeave || 0);
//     if (total === 0) return 0;
//     return Math.round(((ms.present || 0) / total) * 100);
//   };

//   // ─── Loading Screen ──────────────────────────────────────────
//   if (loading) {
//     return (
//       <div className="admin-container">
//         <EmployeeNavbar />
//         <div className="admin-layout">
//           <EmployeeSidebar />
//           <div className="admin-content">
//             <div style={styles.loadingContainer}>
//               <div style={styles.spinner}></div>
//               <p style={styles.loadingText}>Loading dashboard...</p>
//             </div>
//             <style>{spinnerAnimation}</style>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const employee = dashboardData?.employee || {};
//   const monthlyStats = dashboardData?.monthlyStats || {};
//   const recentAttendance = dashboardData?.recentAttendance || [];
//   const totalDays = (monthlyStats.present || 0) + (monthlyStats.absent || 0) + (monthlyStats.onLeave || 0);

//   // ─── Main Dashboard ──────────────────────────────────────────
//   return (
//     <div className="admin-container">
//       <EmployeeNavbar />
//       <div className="admin-layout">
//         <EmployeeSidebar />
//         <div className="admin-content" style={styles.content}>

//           {/* ── Header Section ── */}
//           <div style={styles.header}>
//             <div style={styles.welcomeSection}>
//               <h1 style={styles.title}>
//                 <span style={styles.emoji}>👋</span>
//                 Welcome back, {employee.firstName} {employee.lastName}!
//               </h1>
//               <p style={styles.subtitle}>
//                 Here's your attendance overview for this month
//               </p>
//               <small style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px', display: 'block' }}>
//                 🔄 Auto-refreshing every 10 seconds
//               </small>
//             </div>
//             <div style={styles.headerActions}>
//               <button style={styles.primaryButton} onClick={() => navigate('/employee/my-attendance')}>
//                 <span>📝</span> My Attendance
//               </button>
//               <button style={styles.secondaryButton} onClick={() => navigate('/employee/request-leave')}>
//                 <span>🏖️</span> Request Leave
//               </button>
//             </div>
//           </div>

//           {/* ── Stats Cards ── */}
//           <div style={styles.statsGrid}>

//             {/* Working Days */}
//             <div style={{ ...styles.statCard, borderLeftColor: '#3b82f6' }}>
//               <div style={styles.statHeader}>
//                 <div style={{ ...styles.statIcon, background: '#3b82f615' }}>📅</div>
//                 <div style={styles.statInfo}>
//                   <div style={styles.statLabel}>WORKING DAYS</div>
//                   <div style={styles.statValue}>{totalDays}</div>
//                 </div>
//               </div>
//               <div style={styles.statFooter}>
//                 <a href="#" style={styles.statLink}
//                   onClick={(e) => { e.preventDefault(); navigate('/employee/attendance-history'); }}>
//                   View History →
//                 </a>
//               </div>
//             </div>

//             {/* Present Days */}
//             <div style={{ ...styles.statCard, borderLeftColor: '#10b981' }}>
//               <div style={styles.statHeader}>
//                 <div style={{ ...styles.statIcon, background: '#10b98115' }}>✅</div>
//                 <div style={styles.statInfo}>
//                   <div style={styles.statLabel}>PRESENT DAYS</div>
//                   <div style={styles.statValue}>{monthlyStats.present || 0}</div>
//                 </div>
//               </div>
//               <div style={styles.statFooter}>
//                 <a href="#" style={styles.statLink}
//                   onClick={(e) => { e.preventDefault(); navigate('/employee/my-attendance'); }}>
//                   View Details →
//                 </a>
//               </div>
//             </div>

//             {/* Absent Days */}
//             <div style={{ ...styles.statCard, borderLeftColor: '#ef4444' }}>
//               <div style={styles.statHeader}>
//                 <div style={{ ...styles.statIcon, background: '#ef444415' }}>❌</div>
//                 <div style={styles.statInfo}>
//                   <div style={styles.statLabel}>ABSENT DAYS</div>
//                   <div style={styles.statValue}>{monthlyStats.absent || 0}</div>
//                 </div>
//               </div>
//               <div style={styles.statFooter}>
//                 <a href="#" style={styles.statLink}
//                   onClick={(e) => { e.preventDefault(); navigate('/employee/my-attendance'); }}>
//                   View Details →
//                 </a>
//               </div>
//             </div>

//             {/* On Leave */}
//             <div style={{ ...styles.statCard, borderLeftColor: '#f59e0b' }}>
//               <div style={styles.statHeader}>
//                 <div style={{ ...styles.statIcon, background: '#f59e0b15' }}>🏖️</div>
//                 <div style={styles.statInfo}>
//                   <div style={styles.statLabel}>ON LEAVE</div>
//                   <div style={styles.statValue}>{monthlyStats.onLeave || 0}</div>
//                 </div>
//               </div>
//               <div style={styles.statFooter}>
//                 <a href="#" style={styles.statLink}
//                   onClick={(e) => { e.preventDefault(); navigate('/employee/my-requests'); }}>
//                   My Requests →
//                 </a>
//               </div>
//             </div>

//             {/* Late Days */}
//             <div style={{ ...styles.statCard, borderLeftColor: '#8b5cf6' }}>
//               <div style={styles.statHeader}>
//                 <div style={{ ...styles.statIcon, background: '#8b5cf615' }}>⏰</div>
//                 <div style={styles.statInfo}>
//                   <div style={styles.statLabel}>LATE DAYS</div>
//                   <div style={styles.statValue}>{monthlyStats.late || 0}</div>
//                 </div>
//               </div>
//               <div style={styles.statFooter}>
//                 <a href="#" style={styles.statLink}
//                   onClick={(e) => { e.preventDefault(); navigate('/employee/attendance-history'); }}>
//                   View Details →
//                 </a>
//               </div>
//             </div>

//           </div>

//           {/* ── Widgets Grid ── */}
//           <div style={styles.widgetsGrid}>

//             {/* Attendance Rate Widget */}
//             <div style={styles.widget}>
//               <div style={styles.widgetHeader}>
//                 <h3 style={styles.widgetTitle}>
//                   <span style={styles.widgetIcon}>📊</span>
//                   My Attendance Rate
//                 </h3>
//               </div>
//               <div style={styles.widgetContent}>
//                 <div style={styles.attendanceCircle}>
//                   <div style={styles.circleProgress}>
//                     <svg width="150" height="150">
//                       <circle cx="75" cy="75" r="60" fill="none" stroke="#e5e7eb" strokeWidth="12" />
//                       <circle
//                         cx="75" cy="75" r="60"
//                         fill="none" stroke="#10b981" strokeWidth="12"
//                         strokeDasharray={`${(getAttendancePercentage() / 100) * 377} 377`}
//                         strokeLinecap="round"
//                         transform="rotate(-90 75 75)"
//                       />
//                     </svg>
//                     <div style={styles.circleText}>
//                       <div style={styles.percentageText}>{getAttendancePercentage()}%</div>
//                       <div style={styles.percentageLabel}>Present</div>
//                     </div>
//                   </div>
//                 </div>
//                 <div style={styles.attendanceDetails}>
//                   <div style={styles.detailItem}>
//                     <span style={styles.detailDot('green')}>●</span>
//                     <span style={styles.detailText}>Present: {monthlyStats.present || 0}</span>
//                   </div>
//                   <div style={styles.detailItem}>
//                     <span style={styles.detailDot('red')}>●</span>
//                     <span style={styles.detailText}>Absent: {monthlyStats.absent || 0}</span>
//                   </div>
//                   <div style={styles.detailItem}>
//                     <span style={styles.detailDot('orange')}>●</span>
//                     <span style={styles.detailText}>On Leave: {monthlyStats.onLeave || 0}</span>
//                   </div>
//                   <div style={styles.detailItem}>
//                     <span style={styles.detailDot('purple')}>●</span>
//                     <span style={styles.detailText}>Late: {monthlyStats.late || 0}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Quick Actions Widget */}
//             <div style={styles.widget}>
//               <div style={styles.widgetHeader}>
//                 <h3 style={styles.widgetTitle}>
//                   <span style={styles.widgetIcon}>⚡</span>
//                   Quick Actions
//                 </h3>
//               </div>
//               <div style={styles.widgetContent}>
//                 <div style={styles.quickActionsList}>

//                   <div style={styles.quickActionItem} onClick={() => navigate('/employee/my-attendance')}>
//                     <div style={{ ...styles.actionIcon, background: '#10b98115', color: '#10b981' }}>📝</div>
//                     <div style={styles.actionInfo}>
//                       <div style={styles.actionTitle}>View My Attendance</div>
//                       <div style={styles.actionDesc}>Check today's status</div>
//                     </div>
//                     <div style={styles.actionArrow}>→</div>
//                   </div>

//                   <div style={styles.quickActionItem} onClick={() => navigate('/employee/attendance-history')}>
//                     <div style={{ ...styles.actionIcon, background: '#3b82f615', color: '#3b82f6' }}>📅</div>
//                     <div style={styles.actionInfo}>
//                       <div style={styles.actionTitle}>Attendance History</div>
//                       <div style={styles.actionDesc}>View past records</div>
//                     </div>
//                     <div style={styles.actionArrow}>→</div>
//                   </div>

//                   <div style={styles.quickActionItem} onClick={() => navigate('/employee/request-leave')}>
//                     <div style={{ ...styles.actionIcon, background: '#f59e0b15', color: '#f59e0b' }}>🏖️</div>
//                     <div style={styles.actionInfo}>
//                       <div style={styles.actionTitle}>Request Leave</div>
//                       <div style={styles.actionDesc}>Apply for time off</div>
//                     </div>
//                     <div style={styles.actionArrow}>→</div>
//                   </div>

//                   <div style={styles.quickActionItem} onClick={() => navigate('/employee/report-issue')}>
//                     <div style={{ ...styles.actionIcon, background: '#ef444415', color: '#ef4444' }}>⚠️</div>
//                     <div style={styles.actionInfo}>
//                       <div style={styles.actionTitle}>Report Issue</div>
//                       <div style={styles.actionDesc}>Flag attendance problem</div>
//                     </div>
//                     <div style={styles.actionArrow}>→</div>
//                   </div>

//                 </div>
//               </div>
//             </div>

//           </div>

//           {/* ── Recent Attendance Table ── */}
//           <div style={{ ...styles.widget, marginTop: '24px' }}>
//             <div style={styles.widgetHeader}>
//               <h3 style={styles.widgetTitle}>
//                 <span style={styles.widgetIcon}>📋</span>
//                 Recent Attendance
//               </h3>
//             </div>
//             <div style={{ overflowX: 'auto' }}>
//               <table style={styles.table}>
//                 <thead>
//                   <tr style={styles.tableHeadRow}>
//                     <th style={styles.th}>Date</th>
//                     <th style={styles.th}>Status</th>
//                     <th style={styles.th}>Clock In</th>
//                     <th style={styles.th}>Clock Out</th>
//                     <th style={styles.th}>Hours</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {recentAttendance.length > 0 ? (
//                     recentAttendance.map((record) => (
//                       <tr key={record._id} style={styles.tableRow}>
//                         <td style={styles.td}>{new Date(record.date).toLocaleDateString()}</td>
//                         <td style={styles.td}>
//                           <span style={{
//                             ...styles.statusBadge,
//                             ...(record.status === 'present' ? styles.badgePresent :
//                               record.status === 'absent' ? styles.badgeAbsent :
//                               record.status === 'late' ? styles.badgeLate :
//                                 styles.badgeLeave)
//                           }}>
//                             {record.status === 'present' ? '✅' :
//                               record.status === 'absent' ? '❌' :
//                               record.status === 'late' ? '⏰' : '🏖️'} {record.status}
//                           </span>
//                         </td>
//                         <td style={styles.td}>
//                           {record.clockIn
//                             ? new Date(record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//                             : '-'}
//                         </td>
//                         <td style={styles.td}>
//                           {record.clockOut
//                             ? new Date(record.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//                             : '-'}
//                         </td>
//                         <td style={styles.td}>{record.workHours || 0} hrs</td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td colSpan="5" style={styles.noData}>No attendance records yet</td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           {/* ── Office Hours & Policy ── */}
//           <div style={{ ...styles.widget, marginTop: '24px' }}>
//             <div style={styles.widgetHeader}>
//               <h3 style={styles.widgetTitle}>
//                 <span style={styles.widgetIcon}>📋</span>
//                 Office Hours & Policy
//               </h3>
//             </div>
//             <div style={styles.widgetContent}>
//               {systemConfig ? (
//                 <div style={styles.policyGrid}>
//                   <div style={styles.policyItem}>
//                     <span style={styles.policyIcon}>🕙</span>
//                     <div>
//                       <div style={styles.policyLabel}>Office Hours</div>
//                       <div style={styles.policyValue}>
//                         {formatTime(systemConfig.workingHours?.startTime)} - {formatTime(systemConfig.workingHours?.endTime)}
//                       </div>
//                     </div>
//                   </div>
//                   <div style={styles.policyItem}>
//                     <span style={styles.policyIcon}>⏰</span>
//                     <div>
//                       <div style={styles.policyLabel}>Late Entry After</div>
//                       <div style={styles.policyValue}>{formatTime(systemConfig.workingHours?.lateEntryTime)}</div>
//                     </div>
//                   </div>
//                   <div style={styles.policyItem}>
//                     <span style={styles.policyIcon}>📅</span>
//                     <div>
//                       <div style={styles.policyLabel}>Working Days</div>
//                       <div style={styles.policyValue}>{systemConfig.workingDays?.join(', ') || 'Monday to Friday'}</div>
//                     </div>
//                   </div>
//                   <div style={styles.policyItem}>
//                     <span style={styles.policyIcon}>🏖️</span>
//                     <div>
//                       <div style={styles.policyLabel}>Weekends</div>
//                       <div style={styles.policyValue}>{systemConfig.weekendDays?.join(', ') || 'Saturday & Sunday'}</div>
//                     </div>
//                   </div>
//                   <div style={styles.policyItem}>
//                     <span style={styles.policyIcon}>☕</span>
//                     <div>
//                       <div style={styles.policyLabel}>Break Time</div>
//                       <div style={styles.policyValue}>{systemConfig.breakTime || 60} minutes</div>
//                     </div>
//                   </div>
//                   <div style={styles.policyItem}>
//                     <span style={styles.policyIcon}>📝</span>
//                     <div>
//                       <div style={styles.policyLabel}>Monthly Leaves Allowed</div>
//                       <div style={styles.policyValue}>{systemConfig.leavePolicy?.allowedLeaves || 2} days</div>
//                     </div>
//                   </div>
//                   {systemConfig.leavePolicy?.autoAbsentOnExceed ? (
//                     <div style={{ ...styles.policyItem, gridColumn: '1 / -1', borderColor: '#fecaca', background: '#fff5f5' }}>
//                       <span style={styles.policyIcon}>⚠️</span>
//                       <div>
//                         <div style={{ ...styles.policyLabel, color: '#dc2626' }}>Leave Policy</div>
//                         <div style={{ ...styles.policyValue, color: '#dc2626' }}>
//                           Exceeding {systemConfig.leavePolicy?.allowedLeaves} leaves will mark you as Absent
//                         </div>
//                       </div>
//                     </div>
//                   ) : (
//                     <div style={{ ...styles.policyItem, gridColumn: '1 / -1', borderColor: '#bbf7d0', background: '#f0fdf4' }}>
//                       <span style={styles.policyIcon}>✅</span>
//                       <div>
//                         <div style={{ ...styles.policyLabel, color: '#059669' }}>Leave Policy</div>
//                         <div style={{ ...styles.policyValue, color: '#059669' }}>
//                           No auto-absent on exceeding leave limit
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               ) : (
//                 <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
//                   Loading system settings...
//                 </p>
//               )}
//             </div>
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// };

// // ─── Styles (same as Admin/Manager Dashboard) ────────────────────────────────

// const styles = {
//   content: {
//     padding: '24px',
//     background: '#f9fafb',
//     minHeight: '100vh'
//   },
//   header: {
//     background: 'white',
//     borderRadius: '16px',
//     padding: '24px',
//     marginBottom: '24px',
//     boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     flexWrap: 'wrap',
//     gap: '20px'
//   },
//   welcomeSection: { flex: 1, minWidth: '300px' },
//   title: {
//     fontSize: '28px',
//     fontWeight: '700',
//     color: '#111827',
//     margin: '0 0 8px 0',
//     display: 'flex',
//     alignItems: 'center',
//     gap: '12px'
//   },
//   emoji: { fontSize: '32px' },
//   subtitle: { fontSize: '14px', color: '#6b7280', margin: 0 },
//   headerActions: {
//     display: 'flex',
//     gap: '12px',
//     flexWrap: 'wrap',
//     alignItems: 'center'
//   },
//   primaryButton: {
//     padding: '12px 24px',
//     background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//     color: 'white',
//     border: 'none',
//     borderRadius: '10px',
//     fontSize: '14px',
//     fontWeight: '600',
//     cursor: 'pointer',
//     display: 'flex',
//     alignItems: 'center',
//     gap: '8px',
//     boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
//   },
//   secondaryButton: {
//     padding: '12px 24px',
//     background: 'white',
//     color: '#667eea',
//     border: '2px solid #667eea',
//     borderRadius: '10px',
//     fontSize: '14px',
//     fontWeight: '600',
//     cursor: 'pointer',
//     display: 'flex',
//     alignItems: 'center',
//     gap: '8px'
//   },

//   // Stats - 5 cards for employee
//   statsGrid: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
//     gap: '20px',
//     marginBottom: '24px'
//   },
//   statCard: {
//     background: 'white',
//     borderRadius: '12px',
//     padding: '20px',
//     boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
//     borderLeft: '4px solid',
//     transition: 'all 0.3s',
//     cursor: 'pointer'
//   },
//   statHeader: {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '16px',
//     marginBottom: '16px'
//   },
//   statIcon: {
//     width: '48px',
//     height: '48px',
//     borderRadius: '12px',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     fontSize: '24px'
//   },
//   statInfo: { flex: 1 },
//   statLabel: {
//     fontSize: '11px',
//     color: '#6b7280',
//     marginBottom: '4px',
//     fontWeight: '600',
//     letterSpacing: '0.5px'
//   },
//   statValue: { fontSize: '32px', fontWeight: '700', color: '#111827' },
//   statFooter: { borderTop: '1px solid #e5e7eb', paddingTop: '12px' },
//   statLink: { color: '#667eea', textDecoration: 'none', fontSize: '13px', fontWeight: '600' },

//   // Widgets
//   widgetsGrid: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
//     gap: '24px'
//   },
//   widget: {
//     background: 'white',
//     borderRadius: '16px',
//     boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
//     overflow: 'hidden'
//   },
//   widgetHeader: {
//     padding: '20px 24px',
//     borderBottom: '1px solid #e5e7eb'
//   },
//   widgetTitle: {
//     fontSize: '16px',
//     fontWeight: '700',
//     color: '#111827',
//     margin: 0,
//     display: 'flex',
//     alignItems: 'center',
//     gap: '10px'
//   },
//   widgetIcon: { fontSize: '20px' },
//   widgetContent: { padding: '24px' },

//   // Circle
//   attendanceCircle: { display: 'flex', justifyContent: 'center', marginBottom: '20px' },
//   circleProgress: { position: 'relative' },
//   circleText: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     transform: 'translate(-50%, -50%)',
//     textAlign: 'center'
//   },
//   percentageText: { fontSize: '32px', fontWeight: '700', color: '#111827' },
//   percentageLabel: { fontSize: '12px', color: '#6b7280', marginTop: '4px' },
//   attendanceDetails: { display: 'flex', flexDirection: 'column', gap: '8px' },
//   detailItem: { display: 'flex', alignItems: 'center', gap: '8px' },
//   detailDot: (color) => ({
//     fontSize: '16px',
//     color: color === 'green' ? '#10b981' :
//            color === 'orange' ? '#f59e0b' :
//            color === 'purple' ? '#8b5cf6' : '#ef4444'
//   }),
//   detailText: { fontSize: '14px', color: '#374151' },

//   // Quick Actions
//   quickActionsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
//   quickActionItem: {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '12px',
//     padding: '12px',
//     background: '#f9fafb',
//     borderRadius: '10px',
//     cursor: 'pointer',
//     transition: 'all 0.3s',
//     border: '2px solid transparent'
//   },
//   actionIcon: {
//     width: '40px',
//     height: '40px',
//     borderRadius: '10px',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     fontSize: '18px'
//   },
//   actionInfo: { flex: 1 },
//   actionTitle: { fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '2px' },
//   actionDesc: { fontSize: '12px', color: '#6b7280' },
//   actionArrow: { fontSize: '18px', color: '#9ca3af' },

//   // Table
//   table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
//   tableHeadRow: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
//   th: {
//     padding: '14px 16px',
//     textAlign: 'left',
//     color: 'white',
//     fontWeight: '700',
//     fontSize: '12px',
//     textTransform: 'uppercase',
//     letterSpacing: '0.5px'
//   },
//   tableRow: { borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' },
//   td: { padding: '14px 16px', color: '#374151' },
//   noData: { textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px' },
//   statusBadge: {
//     display: 'inline-flex',
//     alignItems: 'center',
//     gap: '4px',
//     padding: '4px 10px',
//     borderRadius: '20px',
//     fontSize: '12px',
//     fontWeight: '600',
//     textTransform: 'capitalize'
//   },
//   badgePresent: {
//     background: 'rgba(16, 185, 129, 0.1)',
//     color: '#059669',
//     border: '1px solid rgba(16,185,129,0.3)'
//   },
//   badgeAbsent: {
//     background: 'rgba(239, 68, 68, 0.1)',
//     color: '#dc2626',
//     border: '1px solid rgba(239,68,68,0.3)'
//   },
//   badgeLate: {
//     background: 'rgba(139, 92, 246, 0.1)',
//     color: '#7c3aed',
//     border: '1px solid rgba(139,92,246,0.3)'
//   },
//   badgeLeave: {
//     background: 'rgba(245, 158, 11, 0.1)',
//     color: '#d97706',
//     border: '1px solid rgba(245,158,11,0.3)'
//   },

//   // Policy
//   policyGrid: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
//     gap: '16px'
//   },
//   policyItem: {
//     display: 'flex',
//     alignItems: 'flex-start',
//     gap: '12px',
//     padding: '14px',
//     background: '#f9fafb',
//     borderRadius: '10px',
//     border: '1px solid #e5e7eb'
//   },
//   policyIcon: { fontSize: '22px', marginTop: '2px' },
//   policyLabel: { fontSize: '11px', color: '#6b7280', fontWeight: '600', letterSpacing: '0.3px', marginBottom: '4px' },
//   policyValue: { fontSize: '14px', color: '#111827', fontWeight: '600' },

//   // Loading
//   loadingContainer: {
//     display: 'flex',
//     justifyContent: 'center',
//     alignItems: 'center',
//     height: '400px',
//     flexDirection: 'column',
//     gap: '20px'
//   },
//   spinner: {
//     width: '50px',
//     height: '50px',
//     border: '4px solid #f3f3f3',
//     borderTop: '4px solid #667eea',
//     borderRadius: '50%',
//     animation: 'spin 1s linear infinite'
//   },
//   loadingText: { color: '#666', fontSize: '14px' }
// };

// const spinnerAnimation = `
//   @keyframes spin {
//     0% { transform: rotate(0deg); }
//     100% { transform: rotate(360deg); }
//   }
// `;

// export default EmployeeDashboard;