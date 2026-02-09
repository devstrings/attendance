import React, { useState, useEffect } from 'react';
import adminAttendanceService from '../../services/adminAttendanceService';
import '../../styles/Admin.css';

const MarkAttendanceModal = ({ selectedDate, onClose, onAttendanceMarked }) => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // present, leave, absent
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [attendanceData, setAttendanceData] = useState({
    status: '',
    clockIn: '',
    clockOut: '',
    remarks: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [searchQuery, statusFilter, employees]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await adminAttendanceService.getAllEmployees();
      
      if (response.success && response.data.employees) {
        // ✅ Filter REAL employees only (not test data)
        const realEmployees = response.data.employees.filter(emp => 
          emp.firstName && 
          emp.lastName && 
          emp.employeeCode && 
          !emp.employeeCode.includes('TEST')
        );
        
        setEmployees(realEmployees);
        setFilteredEmployees(realEmployees);
      } else {
        setEmployees([]);
        setFilteredEmployees([]);
      }
    } catch (error) {
      console.error('❌ Error fetching employees:', error);
      alert('Failed to fetch employees');
      setEmployees([]);
      setFilteredEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = [...employees];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(emp => {
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        const code = emp.employeeCode.toLowerCase();
        const query = searchQuery.toLowerCase();
        return fullName.includes(query) || code.includes(query);
      });
    }

    // Status filter: present, leave
    // ✅ If not present or leave, then ABSENT
    if (statusFilter === 'present') {
      filtered = filtered.filter(emp => emp.todayStatus === 'present');
    } else if (statusFilter === 'leave') {
      filtered = filtered.filter(emp => emp.todayStatus === 'leave');
    } else if (statusFilter === 'absent') {
      filtered = filtered.filter(emp => 
        !emp.todayStatus || 
        (emp.todayStatus !== 'present' && emp.todayStatus !== 'leave')
      );
    }

    setFilteredEmployees(filtered);
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    
    // ✅ Check if already checked in today
    if (employee.todayAttendance) {
      setAttendanceData({
        status: 'present',
        clockIn: employee.todayAttendance.clockIn || '',
        clockOut: '',
        remarks: employee.todayAttendance.remarks || ''
      });
    } else {
      // Fresh attendance
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      setAttendanceData({
        status: '',
        clockIn: `${hours}:${minutes}`,
        clockOut: '',
        remarks: ''
      });
    }
  };

  const handleStatusChange = (status) => {
    setAttendanceData(prev => ({
      ...prev,
      status
    }));
  };

  const handleTimeChange = (field, value) => {
    setAttendanceData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const setCurrentTime = (field) => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    handleTimeChange(field, `${hours}:${minutes}`);
  };

  const handleSubmit = async () => {
    if (!selectedEmployee) {
      alert('⚠️ Please select an employee');
      return;
    }

    if (!attendanceData.status) {
      alert('⚠️ Please select attendance status');
      return;
    }

    // ✅ Check if only check-out needed
    const alreadyCheckedIn = selectedEmployee.todayAttendance && selectedEmployee.todayAttendance.clockIn;

    if (alreadyCheckedIn) {
      // Only update clock-out
      if (!attendanceData.clockOut) {
        alert('⚠️ Please enter clock-out time');
        return;
      }

      try {
        setMarking(true);

        const clockOutDateTime = `${selectedDate}T${attendanceData.clockOut}:00`;

        const updatePayload = {
          clockOut: clockOutDateTime,
          remarks: attendanceData.remarks
        };

        const response = await adminAttendanceService.updateAttendance(
          selectedEmployee.todayAttendance._id,
          updatePayload
        );

        if (response.success) {
          alert('✅ Check-out marked successfully!');
          onAttendanceMarked();
        } else {
          alert(`❌ ${response.message || 'Failed to mark check-out'}`);
        }
      } catch (error) {
        console.error('❌ Error marking check-out:', error);
        alert(error.message || 'Failed to mark check-out');
      } finally {
        setMarking(false);
      }
    } else {
      // Fresh attendance - check-in required
      if (attendanceData.status === 'present' && !attendanceData.clockIn) {
        alert('⚠️ Please enter clock-in time');
        return;
      }

      try {
        setMarking(true);

        const clockInDateTime = `${selectedDate}T${attendanceData.clockIn}:00`;
        const clockOutDateTime = attendanceData.clockOut ? `${selectedDate}T${attendanceData.clockOut}:00` : null;

        // ✅ Map frontend status to backend
        let backendStatus = attendanceData.status;
        if (attendanceData.status === 'leave') {
          backendStatus = 'on-leave';
        }

        const attendancePayload = {
          employeeId: selectedEmployee._id,
          date: selectedDate,
          clockIn: clockInDateTime,
          clockOut: clockOutDateTime,
          status: backendStatus,
          remarks: attendanceData.remarks
        };

        const response = await adminAttendanceService.markAttendance(attendancePayload);

        if (response.success) {
          alert('✅ Attendance marked successfully!');
          onAttendanceMarked();
        } else {
          alert(`❌ ${response.message || 'Failed to mark attendance'}`);
        }
      } catch (error) {
        console.error('❌ Error marking attendance:', error);
        alert(error.message || 'Failed to mark attendance');
      } finally {
        setMarking(false);
      }
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

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'white',
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '28px' }}>✓</span>
              Mark Attendance
            </h2>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0
            }}>
              📅 {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: selectedEmployee ? '1fr 1fr' : '1fr',
            gap: '24px',
            height: '100%'
          }}>
            
            {/* Left Panel: Employee List */}
            <div style={{
              background: '#f9fafb',
              borderRadius: '16px',
              padding: '20px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#111827',
                margin: '0 0 16px 0'
              }}>
                Select Employee ({filteredEmployees.length})
              </h3>

              {/* Search & Filters */}
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="🔍 Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                    outline: 'none',
                    marginBottom: '12px'
                  }}
                />

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => setStatusFilter('')}
                    style={{
                      padding: '8px 12px',
                      background: statusFilter === '' ? '#667eea' : 'white',
                      color: statusFilter === '' ? 'white' : '#6b7280',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter('present')}
                    style={{
                      padding: '8px 12px',
                      background: statusFilter === 'present' ? '#10b981' : 'white',
                      color: statusFilter === 'present' ? 'white' : '#6b7280',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ✓ Present
                  </button>
                  <button
                    onClick={() => setStatusFilter('leave')}
                    style={{
                      padding: '8px 12px',
                      background: statusFilter === 'leave' ? '#f59e0b' : 'white',
                      color: statusFilter === 'leave' ? 'white' : '#6b7280',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    🏖️ Leave
                  </button>
                </div>
              </div>

              {/* Employee List */}
              <div style={{
                flex: 1,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      border: '4px solid #f3f3f3',
                      borderTop: '4px solid #667eea',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto'
                    }} />
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                    <p>No employees found</p>
                  </div>
                ) : (
                  filteredEmployees.map(employee => (
                    <div
                      key={employee._id}
                      onClick={() => handleEmployeeSelect(employee)}
                      style={{
                        background: selectedEmployee?._id === employee._id ? '#667eea22' : 'white',
                        border: selectedEmployee?._id === employee._id ? '2px solid #667eea' : '2px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedEmployee?._id !== employee._id) {
                          e.currentTarget.style.background = '#f3f4f6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedEmployee?._id !== employee._id) {
                          e.currentTarget.style.background = 'white';
                        }
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '700'
                        }}>
                          {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#111827',
                            marginBottom: '2px'
                          }}>
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#6b7280'
                          }}>
                            {employee.employeeCode}
                            {employee.designation && ` • ${employee.designation}`}
                          </div>
                        </div>
                        {employee.todayAttendance && (
                          <div style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: '#10b98122',
                            color: '#10b981'
                          }}>
                            Checked In
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Panel: Attendance Form */}
            {selectedEmployee && (
              <div style={{
                background: '#f9fafb',
                borderRadius: '16px',
                padding: '20px',
                overflow: 'auto'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#111827',
                  margin: '0 0 16px 0'
                }}>
                  Mark Attendance
                </h3>

                {/* Employee Info */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                  border: '2px solid #e5e7eb'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: '700'
                    }}>
                      {selectedEmployee.firstName.charAt(0)}{selectedEmployee.lastName.charAt(0)}
                    </div>
                    <div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#111827'
                      }}>
                        {selectedEmployee.firstName} {selectedEmployee.lastName}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#6b7280'
                      }}>
                        {selectedEmployee.employeeCode} • {selectedEmployee.department}
                      </div>
                    </div>
                  </div>

                  {selectedEmployee.todayAttendance && (
                    <div style={{
                      padding: '12px',
                      background: '#10b98111',
                      borderRadius: '8px',
                      border: '1px solid #10b98133'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#10b981',
                        marginBottom: '4px'
                      }}>
                        ✓ Already Checked In
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Clock In: {new Date(selectedEmployee.todayAttendance.clockIn).toLocaleTimeString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Selection - Only if NOT checked in */}
                {!selectedEmployee.todayAttendance && (
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
                      value={attendanceData.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={marking}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '14px',
                        outline: 'none',
                        cursor: 'pointer',
                        background: 'white'
                      }}
                    >
                      <option value="">Select Status</option>
                      <option value="present">✅ Present</option>
                      <option value="leave">🏖️ On Leave</option>
                    </select>
                  </div>
                )}

                {/* Time Fields */}
                {(attendanceData.status === 'present' || selectedEmployee.todayAttendance) && (
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px',
                    border: '2px solid #e5e7eb'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '16px',
                      marginBottom: '12px'
                    }}>
                      {/* Clock In */}
                      {!selectedEmployee.todayAttendance && (
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
                              value={attendanceData.clockIn}
                              onChange={(e) => handleTimeChange('clockIn', e.target.value)}
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
                              onClick={() => setCurrentTime('clockIn')}
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
                      )}

                      {/* Clock Out */}
                      <div style={{ gridColumn: selectedEmployee.todayAttendance ? '1 / -1' : 'auto' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#374151',
                          marginBottom: '8px'
                        }}>
                          Clock Out {selectedEmployee.todayAttendance ? '*' : ''}
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="time"
                            value={attendanceData.clockOut}
                            onChange={(e) => handleTimeChange('clockOut', e.target.value)}
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
                            onClick={() => setCurrentTime('clockOut')}
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
                    {attendanceData.clockIn && attendanceData.clockOut && (
                      <div style={{
                        padding: '12px',
                        background: '#f9fafb',
                        borderRadius: '8px',
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
                          Total Hours: {calculateHours(attendanceData.clockIn, attendanceData.clockOut)} hrs
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
                    value={attendanceData.remarks}
                    onChange={(e) => handleTimeChange('remarks', e.target.value)}
                    placeholder="Add optional notes..."
                    rows="3"
                    disabled={marking}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!attendanceData.status && !selectedEmployee.todayAttendance || marking}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: (attendanceData.status || selectedEmployee.todayAttendance) && !marking
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                      : '#e5e7eb',
                    color: (attendanceData.status || selectedEmployee.todayAttendance) && !marking ? 'white' : '#9ca3af',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: (attendanceData.status || selectedEmployee.todayAttendance) && !marking ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{marking ? '⏳' : '✓'}</span>
                  {marking ? 'Marking...' : selectedEmployee.todayAttendance ? 'Mark Check-Out' : 'Mark Attendance'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendanceModal;