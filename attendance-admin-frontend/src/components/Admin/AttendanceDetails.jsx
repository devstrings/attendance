// import React, { useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import AdminNavbar from './AdminNavbar';
// import AdminSidebar from './AdminSidebar';
// import api from '../../services/api';
// import '../../styles/Admin.css';

// const AttendanceDetails = () => {
//   const navigate = useNavigate();
//   const { attendanceId } = useParams();
//   const [record, setRecord] = useState(null);
//   const [employeeHistory, setEmployeeHistory] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [historyLoading, setHistoryLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [reportType, setReportType] = useState('weekly'); // weekly, monthly, custom
//   const [customDates, setCustomDates] = useState({
//     startDate: '',
//     endDate: ''
//   });

//   useEffect(() => {
//     if (attendanceId) {
//       fetchRecordDetails();
//     }
//   }, [attendanceId]);

//   useEffect(() => {
//     if (record) {
//       fetchEmployeeHistory();
//     }
//   }, [reportType, customDates]);

//   const fetchRecordDetails = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const response = await api.get(`/attendance/${attendanceId}`);
      
//       if (response.data.success && response.data.data.attendance) {
//         const att = response.data.data.attendance;
        
//         setRecord({
//           id: att._id,
//           employeeId: att.employeeId?._id,
//           employeeCode: att.employeeId?.employeeCode || 'N/A',
//           employeeName: `${att.employeeId?.firstName || ''} ${att.employeeId?.lastName || ''}`.trim() || 'N/A',
//           email: att.employeeId?.userId?.email || 'N/A',
//           phone: att.employeeId?.phoneNumber || 'N/A',
//           department: att.employeeId?.department || 'N/A',
//           position: att.employeeId?.designation || 'N/A',
//           date: att.date,
//           status: att.status,
//           clockIn: att.clockIn ? new Date(att.clockIn).toLocaleTimeString() : null,
//           clockOut: att.clockOut ? new Date(att.clockOut).toLocaleTimeString() : null,
//           hoursWorked: att.workHours || 0,
//           notes: att.remarks || '',
//           managedBy: att.managerId ? `${att.managerId.firstName || ''} ${att.managerId.lastName || ''}`.trim() : 'N/A'
//         });
//       } else {
//         setError('Attendance record not found');
//       }
//     } catch (error) {
//       console.error('❌ Error fetching record:', error);
//       setError(error.response?.data?.message || 'Failed to load attendance details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchEmployeeHistory = async () => {
//     if (!record?.employeeId) return;
    
//     try {
//       setHistoryLoading(true);
      
//       let startDate, endDate;
//       const today = new Date();
      
//       // Calculate date range based on report type
//       if (reportType === 'weekly') {
//         endDate = new Date(today);
//         startDate = new Date(today);
//         startDate.setDate(startDate.getDate() - 7);
//       } else if (reportType === 'monthly') {
//         endDate = new Date(today);
//         startDate = new Date(today);
//         startDate.setDate(startDate.getDate() - 30);
//       } else if (reportType === 'custom' && customDates.startDate && customDates.endDate) {
//         startDate = new Date(customDates.startDate);
//         endDate = new Date(customDates.endDate);
//       } else {
//         endDate = new Date(today);
//         startDate = new Date(today);
//         startDate.setDate(startDate.getDate() - 30);
//       }
      
//       const response = await api.get('/attendance', {
//         params: {
//           employeeId: record.employeeId,
//           startDate: startDate.toISOString().split('T')[0],
//           endDate: endDate.toISOString().split('T')[0],
//           limit: 100
//         }
//       });
      
//       if (response.data.success) {
//         const history = response.data.data.attendance.map(att => ({
//           date: att.date,
//           status: att.status,
//           clockIn: att.clockIn ? new Date(att.clockIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
//           clockOut: att.clockOut ? new Date(att.clockOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
//           hoursWorked: att.workHours || 0,
//           isLate: att.isLate || false,
//           remarks: att.remarks || '-'
//         }));
        
//         setEmployeeHistory(history);
//       }
//     } catch (error) {
//       console.error('❌ Error fetching history:', error);
//     } finally {
//       setHistoryLoading(false);
//     }
//   };

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case 'present': return '✅';
//       case 'absent': return '❌';
//       case 'on-leave': return '🏖️';
//       case 'leave': return '🏖️';
//       case 'holiday': return '🎉';
//       case 'late': return '⏰';
//       case 'half-day': return '🕐';
//       default: return '❓';
//     }
//   };

//   const calculateStats = () => {
//     const totalDays = employeeHistory.length;
//     const presentDays = employeeHistory.filter(h => h.status === 'present' || h.status === 'late').length;
//     const absentDays = employeeHistory.filter(h => h.status === 'absent').length;
//     const leaveDays = employeeHistory.filter(h => h.status === 'on-leave' || h.status === 'leave').length;
//     const lateDays = employeeHistory.filter(h => h.isLate).length;
//     const totalHours = employeeHistory.reduce((sum, h) => sum + (h.hoursWorked || 0), 0);
//     const avgHours = totalDays > 0 ? (totalHours / totalDays).toFixed(1) : 0;

//     return { totalDays, presentDays, absentDays, leaveDays, lateDays, totalHours, avgHours };
//   };

//   const handleReportTypeChange = (type) => {
//     setReportType(type);
//     if (type !== 'custom') {
//       setCustomDates({ startDate: '', endDate: '' });
//     }
//   };

//   if (loading) {
//     return (
//       <div className="admin-container">
//         <AdminNavbar />
//         <div className="admin-layout">
//           <AdminSidebar />
//           <div className="admin-content">
//             <div className="loading-spinner">
//               <div className="spinner"></div>
//               <p>Loading attendance details...</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (error || !record) {
//     return (
//       <div className="admin-container">
//         <AdminNavbar />
//         <div className="admin-layout">
//           <AdminSidebar />
//           <div className="admin-content">
//             <div className="error-container">
//               <h2>❌ {error || 'Record Not Found'}</h2>
//               <p>The attendance record you're looking for doesn't exist or has been removed.</p>
//               <button 
//                 className="btn-primary"
//                 onClick={() => navigate('/admin/attendance-view')}
//               >
//                 ← Back to Attendance View
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const stats = calculateStats();

//   return (
//     <div className="admin-container">
//       <AdminNavbar />
//       <div className="admin-layout">
//         <AdminSidebar />
        
//         <div className="admin-content">
//           {/* Header */}
//           <div className="page-header">
//             <h1>📊 Attendance Details</h1>
//             <button 
//               className="back-btn"
//               onClick={() => navigate('/admin/attendance-view')}
//             >
//               ← Back to Attendance
//             </button>
//           </div>

//           {/* Employee Info Table */}
//           <div className="table-container">
//             <h2>👤 Employee Information</h2>
//             <table className="data-table">
//               <tbody>
//                 <tr>
//                   <td><strong>Employee ID</strong></td>
//                   <td>{record.employeeCode}</td>
//                   <td><strong>Full Name</strong></td>
//                   <td>{record.employeeName}</td>
//                 </tr>
//                 <tr>
//                   <td><strong>Email</strong></td>
//                   <td>{record.email}</td>
//                   <td><strong>Phone</strong></td>
//                   <td>{record.phone}</td>
//                 </tr>
//                 <tr>
//                   <td><strong>Department</strong></td>
//                   <td>{record.department}</td>
//                   <td><strong>Position</strong></td>
//                   <td>{record.position}</td>
//                 </tr>
//                 <tr>
//                   <td><strong>Manager</strong></td>
//                   <td colSpan="3">{record.managedBy}</td>
//                 </tr>
//               </tbody>
//             </table>
//           </div>

//           {/* Current Attendance Info Table */}
//           <div className="table-container">
//             <h2>📋 Today's Attendance</h2>
//             <table className="data-table">
//               <tbody>
//                 <tr>
//                   <td><strong>Date</strong></td>
//                   <td>{new Date(record.date).toLocaleDateString()}</td>
//                   <td><strong>Status</strong></td>
//                   <td>
//                     <span className={`status-badge ${record.status}`}>
//                       {getStatusIcon(record.status)} {record.status}
//                     </span>
//                   </td>
//                 </tr>
//                 <tr>
//                   <td><strong>Clock In</strong></td>
//                   <td>{record.clockIn || '-'}</td>
//                   <td><strong>Clock Out</strong></td>
//                   <td>{record.clockOut || '-'}</td>
//                 </tr>
//                 <tr>
//                   <td><strong>Hours Worked</strong></td>
//                   <td>{record.hoursWorked} hours</td>
//                   <td><strong>Notes</strong></td>
//                   <td>{record.notes || 'No notes'}</td>
//                 </tr>
//               </tbody>
//             </table>
//           </div>

//           {/* Report Type Selector */}
//           <div className="filters-modern">
//             <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
//               <label style={{ fontWeight: 600, color: '#2d3748' }}>Report Type:</label>
              
//               <button
//                 className={`btn-${reportType === 'weekly' ? 'primary' : 'secondary'}`}
//                 onClick={() => handleReportTypeChange('weekly')}
//                 style={{ padding: '0.75rem 1.5rem' }}
//               >
//                 📅 Weekly (7 Days)
//               </button>
              
//               <button
//                 className={`btn-${reportType === 'monthly' ? 'primary' : 'secondary'}`}
//                 onClick={() => handleReportTypeChange('monthly')}
//                 style={{ padding: '0.75rem 1.5rem' }}
//               >
//                 📆 Monthly (30 Days)
//               </button>
              
//               <button
//                 className={`btn-${reportType === 'custom' ? 'primary' : 'secondary'}`}
//                 onClick={() => handleReportTypeChange('custom')}
//                 style={{ padding: '0.75rem 1.5rem' }}
//               >
//                 📊 Custom Range
//               </button>
//             </div>

//             {reportType === 'custom' && (
//               <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
//                 <input
//                   type="date"
//                   value={customDates.startDate}
//                   onChange={(e) => setCustomDates({...customDates, startDate: e.target.value})}
//                   style={{ padding: '0.75rem', borderRadius: '8px', border: '2px solid #e2e8f0' }}
//                 />
//                 <span style={{ fontWeight: 600 }}>to</span>
//                 <input
//                   type="date"
//                   value={customDates.endDate}
//                   onChange={(e) => setCustomDates({...customDates, endDate: e.target.value})}
//                   style={{ padding: '0.75rem', borderRadius: '8px', border: '2px solid #e2e8f0' }}
//                 />
//                 <button
//                   className="btn-primary"
//                   onClick={() => fetchEmployeeHistory()}
//                   disabled={!customDates.startDate || !customDates.endDate}
//                 >
//                   Generate Report
//                 </button>
//               </div>
//             )}
//           </div>

//           {/* Stats Grid */}
//           <div className="stats-grid-modern">
//             <div className="stat-card-modern stat-1">
//               <div className="stat-label-modern">Total Days</div>
//               <div className="stat-value-modern">{stats.totalDays}</div>
//             </div>
//             <div className="stat-card-modern stat-2">
//               <div className="stat-label-modern">Present</div>
//               <div className="stat-value-modern">{stats.presentDays}</div>
//             </div>
//             <div className="stat-card-modern stat-3">
//               <div className="stat-label-modern">Absent</div>
//               <div className="stat-value-modern">{stats.absentDays}</div>
//             </div>
//             <div className="stat-card-modern stat-4">
//               <div className="stat-label-modern">Leave</div>
//               <div className="stat-value-modern">{stats.leaveDays}</div>
//             </div>
//             <div className="stat-card-modern stat-1">
//               <div className="stat-label-modern">Late Days</div>
//               <div className="stat-value-modern">{stats.lateDays}</div>
//             </div>
//             <div className="stat-card-modern stat-2">
//               <div className="stat-label-modern">Total Hours</div>
//               <div className="stat-value-modern">{stats.totalHours.toFixed(1)}</div>
//             </div>
//             <div className="stat-card-modern stat-3">
//               <div className="stat-label-modern">Avg Hours/Day</div>
//               <div className="stat-value-modern">{stats.avgHours}</div>
//             </div>
//           </div>

//           {/* Attendance History Table */}
//           <div className="table-container-modern">
//             <h2>📅 Attendance History ({reportType === 'weekly' ? 'Last 7 Days' : reportType === 'monthly' ? 'Last 30 Days' : 'Custom Range'})</h2>
            
//             {historyLoading ? (
//               <div className="loading-spinner">
//                 <div className="spinner"></div>
//                 <p>Loading history...</p>
//               </div>
//             ) : employeeHistory.length > 0 ? (
//               <table className="data-table-modern">
//                 <thead>
//                   <tr>
//                     <th>Date</th>
//                     <th>Status</th>
//                     <th>Clock In</th>
//                     <th>Clock Out</th>
//                     <th>Hours</th>
//                     <th>Late</th>
//                     <th>Remarks</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {employeeHistory.map((history, index) => (
//                     <tr key={index}>
//                       <td>{new Date(history.date).toLocaleDateString()}</td>
//                       <td>
//                         <span className={`status-badge ${history.status}`}>
//                           {getStatusIcon(history.status)} {history.status}
//                         </span>
//                       </td>
//                       <td>{history.clockIn}</td>
//                       <td>{history.clockOut}</td>
//                       <td><strong>{history.hoursWorked} hrs</strong></td>
//                       <td>{history.isLate ? '⏰ Yes' : '✅ No'}</td>
//                       <td>{history.remarks}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             ) : (
//               <p className="no-data">No attendance records found for selected period</p>
//             )}
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// };

// export default AttendanceDetails;

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import api from '../../services/api';
import '../../styles/Admin.css';

const AttendanceDetails = () => {
  const navigate = useNavigate();
  const { attendanceId, employeeId } = useParams(); // ✅ Both params ko support karo
  const [record, setRecord] = useState(null);
  const [employeeHistory, setEmployeeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('weekly');
  const [customDates, setCustomDates] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    // ✅ Agar attendanceId hai to specific record fetch karo
    if (attendanceId) {
      fetchRecordDetails();
    } 
    // ✅ Agar sirf employeeId hai to employee ki latest record fetch karo
    else if (employeeId) {
      fetchEmployeeLatestRecord();
    }
  }, [attendanceId, employeeId]);

  useEffect(() => {
    if (record) {
      fetchEmployeeHistory();
    }
  }, [reportType, customDates, record]);

  // ✅ Original function - specific attendance record ke liye
  const fetchRecordDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/attendance/${attendanceId}`);
      
      if (response.data.success && response.data.data.attendance) {
        const att = response.data.data.attendance;
        
        setRecord({
          id: att._id,
          employeeId: att.employeeId?._id,
          employeeCode: att.employeeId?.employeeCode || 'N/A',
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

  // ✅ NEW FUNCTION - Employee ki latest/today's record fetch karo
  const fetchEmployeeLatestRecord = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First get employee details
      const empResponse = await api.get(`/admin/employees/${employeeId}`);
      
      if (!empResponse.data.success) {
        setError('Employee not found');
        setLoading(false);
        return;
      }

      const employee = empResponse.data.data.employee;
      
      // Get today's attendance or latest record
      const today = new Date().toISOString().split('T')[0];
      const attResponse = await api.get('/attendance', {
        params: {
          employeeId: employeeId,
          startDate: today,
          endDate: today,
          limit: 1
        }
      });

      let todayRecord = null;
      if (attResponse.data.success && attResponse.data.data.attendance.length > 0) {
        todayRecord = attResponse.data.data.attendance[0];
      }

      // Set record with employee info and today's attendance (if exists)
      setRecord({
        id: todayRecord?._id || null,
        employeeId: employee._id,
        employeeCode: employee.employeeCode || 'N/A',
        employeeName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
        email: employee.userId?.email || 'N/A',
        phone: employee.phoneNumber || 'N/A',
        department: employee.department || 'N/A',
        position: employee.designation || 'N/A',
        date: todayRecord?.date || today,
        status: todayRecord?.status || 'No Record',
        clockIn: todayRecord?.clockIn ? new Date(todayRecord.clockIn).toLocaleTimeString() : null,
        clockOut: todayRecord?.clockOut ? new Date(todayRecord.clockOut).toLocaleTimeString() : null,
        hoursWorked: todayRecord?.workHours || 0,
        notes: todayRecord?.remarks || '',
        managedBy: todayRecord?.managerId ? `${todayRecord.managerId.firstName || ''} ${todayRecord.managerId.lastName || ''}`.trim() : 'N/A'
      });
      
    } catch (error) {
      console.error('❌ Error fetching employee record:', error);
      setError(error.response?.data?.message || 'Failed to load employee details');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeHistory = async () => {
    if (!record?.employeeId) return;
    
    try {
      setHistoryLoading(true);
      
      let startDate, endDate;
      const today = new Date();
      
      if (reportType === 'weekly') {
        endDate = new Date(today);
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
      } else if (reportType === 'monthly') {
        endDate = new Date(today);
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30);
      } else if (reportType === 'custom' && customDates.startDate && customDates.endDate) {
        startDate = new Date(customDates.startDate);
        endDate = new Date(customDates.endDate);
      } else {
        endDate = new Date(today);
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30);
      }
      
      const response = await api.get('/attendance', {
        params: {
          employeeId: record.employeeId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          limit: 100
        }
      });
      
      if (response.data.success) {
        const history = response.data.data.attendance.map(att => ({
          date: att.date,
          status: att.status,
          clockIn: att.clockIn ? new Date(att.clockIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
          clockOut: att.clockOut ? new Date(att.clockOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
          hoursWorked: att.workHours || 0,
          isLate: att.isLate || false,
          remarks: att.remarks || '-'
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

  const calculateStats = () => {
    const totalDays = employeeHistory.length;
    const presentDays = employeeHistory.filter(h => h.status === 'present' || h.status === 'late').length;
    const absentDays = employeeHistory.filter(h => h.status === 'absent').length;
    const leaveDays = employeeHistory.filter(h => h.status === 'on-leave' || h.status === 'leave').length;
    const lateDays = employeeHistory.filter(h => h.isLate).length;
    const totalHours = employeeHistory.reduce((sum, h) => sum + (h.hoursWorked || 0), 0);
    const avgHours = totalDays > 0 ? (totalHours / totalDays).toFixed(1) : 0;

    return { totalDays, presentDays, absentDays, leaveDays, lateDays, totalHours, avgHours };
  };

  const handleReportTypeChange = (type) => {
    setReportType(type);
    if (type !== 'custom') {
      setCustomDates({ startDate: '', endDate: '' });
    }
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
                onClick={() => navigate(-1)}
              >
                ← Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="admin-container">
      <AdminNavbar />
      <div className="admin-layout">
        <AdminSidebar />
        
        <div className="admin-content">
          {/* Header */}
          <div className="page-header">
            <h1>📊 Attendance Details</h1>
            <button 
              className="back-btn"
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>
          </div>

          {/* Employee Info Table */}
          <div className="table-container">
            <h2>👤 Employee Information</h2>
            <table className="data-table">
              <tbody>
                <tr>
                  <td><strong>Employee ID</strong></td>
                  <td>{record.employeeCode}</td>
                  <td><strong>Full Name</strong></td>
                  <td>{record.employeeName}</td>
                </tr>
                <tr>
                  <td><strong>Email</strong></td>
                  <td>{record.email}</td>
                  <td><strong>Phone</strong></td>
                  <td>{record.phone}</td>
                </tr>
                <tr>
                  <td><strong>Department</strong></td>
                  <td>{record.department}</td>
                  <td><strong>Position</strong></td>
                  <td>{record.position}</td>
                </tr>
                <tr>
                  <td><strong>Manager</strong></td>
                  <td colSpan="3">{record.managedBy}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Current Attendance Info Table */}
          <div className="table-container">
            <h2>📋 Today's Attendance</h2>
            <table className="data-table">
              <tbody>
                <tr>
                  <td><strong>Date</strong></td>
                  <td>{new Date(record.date).toLocaleDateString()}</td>
                  <td><strong>Status</strong></td>
                  <td>
                    <span className={`status-badge ${record.status}`}>
                      {getStatusIcon(record.status)} {record.status}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td><strong>Clock In</strong></td>
                  <td>{record.clockIn || '-'}</td>
                  <td><strong>Clock Out</strong></td>
                  <td>{record.clockOut || '-'}</td>
                </tr>
                <tr>
                  <td><strong>Hours Worked</strong></td>
                  <td>{record.hoursWorked} hours</td>
                  <td><strong>Notes</strong></td>
                  <td>{record.notes || 'No notes'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Report Type Selector */}
          <div className="filters-modern">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
              <label style={{ fontWeight: 600, color: '#2d3748' }}>Report Type:</label>
              
              <button
                className={`btn-${reportType === 'weekly' ? 'primary' : 'secondary'}`}
                onClick={() => handleReportTypeChange('weekly')}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                📅 Weekly (7 Days)
              </button>
              
              <button
                className={`btn-${reportType === 'monthly' ? 'primary' : 'secondary'}`}
                onClick={() => handleReportTypeChange('monthly')}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                📆 Monthly (30 Days)
              </button>
              
              <button
                className={`btn-${reportType === 'custom' ? 'primary' : 'secondary'}`}
                onClick={() => handleReportTypeChange('custom')}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                📊 Custom Range
              </button>
            </div>

            {reportType === 'custom' && (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                  type="date"
                  value={customDates.startDate}
                  onChange={(e) => setCustomDates({...customDates, startDate: e.target.value})}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '2px solid #e2e8f0' }}
                />
                <span style={{ fontWeight: 600 }}>to</span>
                <input
                  type="date"
                  value={customDates.endDate}
                  onChange={(e) => setCustomDates({...customDates, endDate: e.target.value})}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '2px solid #e2e8f0' }}
                />
                <button
                  className="btn-primary"
                  onClick={() => fetchEmployeeHistory()}
                  disabled={!customDates.startDate || !customDates.endDate}
                >
                  Generate Report
                </button>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="stats-grid-modern">
            <div className="stat-card-modern stat-1">
              <div className="stat-label-modern">Total Days</div>
              <div className="stat-value-modern">{stats.totalDays}</div>
            </div>
            <div className="stat-card-modern stat-2">
              <div className="stat-label-modern">Present</div>
              <div className="stat-value-modern">{stats.presentDays}</div>
            </div>
            <div className="stat-card-modern stat-3">
              <div className="stat-label-modern">Absent</div>
              <div className="stat-value-modern">{stats.absentDays}</div>
            </div>
            <div className="stat-card-modern stat-4">
              <div className="stat-label-modern">Leave</div>
              <div className="stat-value-modern">{stats.leaveDays}</div>
            </div>
            <div className="stat-card-modern stat-1">
              <div className="stat-label-modern">Late Days</div>
              <div className="stat-value-modern">{stats.lateDays}</div>
            </div>
            <div className="stat-card-modern stat-2">
              <div className="stat-label-modern">Total Hours</div>
              <div className="stat-value-modern">{stats.totalHours.toFixed(1)}</div>
            </div>
            <div className="stat-card-modern stat-3">
              <div className="stat-label-modern">Avg Hours/Day</div>
              <div className="stat-value-modern">{stats.avgHours}</div>
            </div>
          </div>

          {/* Attendance History Table */}
          <div className="table-container-modern">
            <h2>📅 Attendance History ({reportType === 'weekly' ? 'Last 7 Days' : reportType === 'monthly' ? 'Last 30 Days' : 'Custom Range'})</h2>
            
            {historyLoading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Loading history...</p>
              </div>
            ) : employeeHistory.length > 0 ? (
              <table className="data-table-modern">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Hours</th>
                    <th>Late</th>
                    <th>Remarks</th>
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
                      <td>{history.clockIn}</td>
                      <td>{history.clockOut}</td>
                      <td><strong>{history.hoursWorked} hrs</strong></td>
                      <td>{history.isLate ? '⏰ Yes' : '✅ No'}</td>
                      <td>{history.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">No attendance records found for selected period</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AttendanceDetails;