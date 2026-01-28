import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ManagerNavbar from './ManagerNavbar';
import ManagerSidebar from './ManagerSidebar';
import managerService from '../../services/managerService';
import attendanceService from '../../services/attendanceService';
import '../../styles/Manager.css';

const MarkAttendance = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    fetchMyEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      const initialData = {};
      employees.forEach(emp => {
        initialData[emp._id] = {
          status: '',
          clockIn: '09:00',
          clockOut: '',
          remarks: ''
        };
      });
      setAttendanceData(initialData);
    }
  }, [employees]);

  const fetchMyEmployees = async () => {
    try {
      setLoading(true);
      console.log('📥 Fetching manager employees...');
      
      const response = await managerService.getMyEmployees();
      console.log('📦 Employees Response:', response);
      
      if (response.success && response.data.employees) {
        setEmployees(response.data.employees);
        console.log(`✅ Loaded ${response.data.employees.length} real employees`);
      } else {
        console.warn('⚠️ No employees found');
        setEmployees([]);
      }
    } catch (error) {
      console.error('❌ Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (employeeId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        status
      }
    }));
  };

  const handleTimeChange = (employeeId, field, value) => {
    setAttendanceData(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value
      }
    }));
  };

  const setCurrentTime = (employeeId, field) => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    handleTimeChange(employeeId, field, `${hours}:${minutes}`);
  };

  const handleMarkAttendance = async (employeeId) => {
  const data = attendanceData[employeeId];
  
  if (!data.status) {
    alert('Please select attendance status');
    return;
  }

  if (data.status === 'present' && !data.clockIn) {
    alert('Please enter clock-in time');
    return;
  }

  try {
    setMarking(true);
    console.log('📝 Marking attendance:', { employeeId, selectedDate, ...data });

    // Combine date with clock times
    const clockInDateTime = `${selectedDate}T${data.clockIn}:00`;
    const clockOutDateTime = data.clockOut ? `${selectedDate}T${data.clockOut}:00` : null;

    // ✅ Map frontend status to backend status
    let backendStatus = data.status;
if (data.status === 'leave') {
  backendStatus = 'on-leave'; // Backend expects 'on-leave'
}

   const attendancePayload = {
  employeeId,
  date: selectedDate,
  clockIn: clockInDateTime,
  clockOut: clockOutDateTime,
  status: backendStatus, // ✅ Use mapped status
  remarks: data.remarks
};

    // ✅ Use correct service
    const response = await managerService.markAttendance(attendancePayload);
    
    if (response.success) {
      alert('✅ Attendance marked successfully!');
      
      // Reset form
      setAttendanceData(prev => ({
        ...prev,
        [employeeId]: {
          status: '',
          clockIn: '09:00',
          clockOut: '',
          remarks: ''
        }
      }));
      
      // ✅ Optionally refresh employees list
      // await fetchMyEmployees();
    } else {
      alert(`❌ ${response.message || 'Failed to mark attendance'}`);
    }
  } catch (error) {
    console.error('❌ Error marking attendance:', error);
    alert(error.message || 'Failed to mark attendance');
  } finally {
    setMarking(false);
  }
};

  const calculateHours = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return '0.00';
    
    const [inHour, inMinute] = clockIn.split(':').map(Number);
    const [outHour, outMinute] = clockOut.split(':').map(Number);
    
    const inTime = inHour * 60 + inMinute;
    const outTime = outHour * 60 + outMinute;
    
    const diffMinutes = outTime - inTime;
    const hours = (diffMinutes / 60).toFixed(2);
    
    return hours;
  };

  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const code = emp.employeeCode.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || code.includes(query);
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'present': return '#10b981';
      case 'absent': return '#ef4444';
      case 'leave': return '#f59e0b';
      case 'half-day': return '#3b82f6';
      default: return '#6b7280';
    }
  };

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
                <p style={{ color: '#666' }}>Loading employees...</p>
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
        <div className="manager-content" style={{ background: '#f9fafb' }}>
          {/* Header */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <h1 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#111827',
                  margin: '0 0 8px 0'
                }}>
                  📋 Mark Attendance
                </h1>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: 0
                }}>
                  Mark attendance for your {employees.length} team member{employees.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#f3f4f6',
                padding: '12px 16px',
                borderRadius: '12px'
              }}>
                <span style={{ fontSize: '20px' }}>📅</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Search */}
            <div style={{
              marginTop: '20px',
              position: 'relative'
            }}>
              <input
                type="text"
                placeholder="🔍 Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#e5e7eb',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Employee Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: '20px'
          }}>
            {filteredEmployees.map(employee => (
              <div key={employee._id} style={{
                background: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'all 0.3s',
                border: '2px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = '#667eea';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                {/* Card Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  position: 'relative'
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: '700',
                    color: 'white',
                    border: '3px solid rgba(255,255,255,0.3)'
                  }}>
                    {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: 'white',
                      margin: '0 0 4px 0'
                    }}>
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <p style={{
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.9)',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontWeight: '600'
                      }}>
                        {employee.employeeCode}
                      </span>
                      {employee.designation && (
                        <>
                          <span style={{ opacity: 0.5 }}>•</span>
                          <span>{employee.designation}</span>
                        </>
                      )}
                    </p>
                  </div>

                  {attendanceData[employee._id]?.status && (
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: `${getStatusColor(attendanceData[employee._id].status)}22`,
                      color: 'white',
                      border: '2px solid rgba(255,255,255,0.3)'
                    }}>
                      {attendanceData[employee._id].status.charAt(0).toUpperCase() + 
                       attendanceData[employee._id].status.slice(1)}
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div style={{ padding: '24px' }}>
                  {/* Status */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Status *
                    </label>
                    <select
                      value={attendanceData[employee._id]?.status || ''}
                      onChange={(e) => handleStatusChange(employee._id, e.target.value)}
                      disabled={marking}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '14px',
                        outline: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    >
                      <option value="">Select Status</option>
                      <option value="present">✅ Present</option>
                      <option value="absent">❌ Absent</option>
                      <option value="leave">🏖️ On Leave</option>
                      <option value="half-day">⏰ Half Day</option>
                    </select>
                  </div>

                  {/* Time Fields */}
                  {(attendanceData[employee._id]?.status === 'present' || 
                    attendanceData[employee._id]?.status === 'half-day') && (
                    <div style={{
                      background: '#f9fafb',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '20px'
                    }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                        marginBottom: '12px'
                      }}>
                        {/* Clock In */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '8px'
                          }}>
                            Clock In *
                          </label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="time"
                              value={attendanceData[employee._id]?.clockIn || '09:00'}
                              onChange={(e) => handleTimeChange(employee._id, 'clockIn', e.target.value)}
                              disabled={marking}
                              style={{
                                flex: 1,
                                padding: '10px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '14px',
                                outline: 'none'
                              }}
                            />
                            <button
                              onClick={() => setCurrentTime(employee._id, 'clockIn')}
                              disabled={marking}
                              style={{
                                padding: '8px 12px',
                                background: '#667eea',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Now
                            </button>
                          </div>
                        </div>

                        {/* Clock Out */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '8px'
                          }}>
                            Clock Out
                          </label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="time"
                              value={attendanceData[employee._id]?.clockOut || ''}
                              onChange={(e) => handleTimeChange(employee._id, 'clockOut', e.target.value)}
                              disabled={marking}
                              style={{
                                flex: 1,
                                padding: '10px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '14px',
                                outline: 'none'
                              }}
                            />
                            <button
                              onClick={() => setCurrentTime(employee._id, 'clockOut')}
                              disabled={marking}
                              style={{
                                padding: '8px 12px',
                                background: '#667eea',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Now
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Hours Display */}
                      {attendanceData[employee._id]?.clockIn && 
                       attendanceData[employee._id]?.clockOut && (
                        <div style={{
                          padding: '12px',
                          background: 'white',
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{ fontSize: '18px' }}>⏱️</span>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#111827'
                          }}>
                            Total Hours: {calculateHours(
                              attendanceData[employee._id].clockIn,
                              attendanceData[employee._id].clockOut
                            )} hrs
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Remarks */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Remarks
                    </label>
                    <textarea
                      value={attendanceData[employee._id]?.remarks || ''}
                      onChange={(e) => handleTimeChange(employee._id, 'remarks', e.target.value)}
                      placeholder="Add optional notes..."
                      rows="2"
                      disabled={marking}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        transition: 'all 0.3s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={() => handleMarkAttendance(employee._id)}
                    disabled={!attendanceData[employee._id]?.status || marking}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: attendanceData[employee._id]?.status && !marking
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                        : '#e5e7eb',
                      color: attendanceData[employee._id]?.status && !marking ? 'white' : '#9ca3af',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '700',
                      cursor: attendanceData[employee._id]?.status && !marking ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      if (attendanceData[employee._id]?.status && !marking) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <span>{marking ? '⏳' : '✓'}</span>
                    {marking ? 'Marking...' : 'Mark Attendance'}
                  </button>
                </div>
              </div>
            ))}

            {filteredEmployees.length === 0 && (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '60px 20px',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '64px', opacity: 0.5, marginBottom: '16px' }}>
                  {searchQuery ? '🔍' : '👥'}
                </div>
                <h3 style={{ fontSize: '20px', color: '#111827', margin: '0 0 8px 0' }}>
                  {searchQuery ? 'No Employees Found' : 'No Employees Assigned'}
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  {searchQuery 
                    ? 'No employees match your search criteria'
                    : 'No employees are currently assigned to you'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;