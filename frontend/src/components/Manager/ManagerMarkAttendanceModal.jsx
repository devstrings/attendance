/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars, import/no-anonymous-default-export, jsx-a11y/anchor-is-valid */
import React, { useState, useEffect } from 'react';
import managerService from '../../services/managerService';

const ManagerMarkAttendanceModal = ({ selectedDate, onClose, onAttendanceMarked }) => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [leaveAlert, setLeaveAlert] = useState(null); // ✅ Leave alert
  const [attendanceData, setAttendanceData] = useState({
    status: '',
    clockIn: '',
    clockOut: '',
    remarks: ''
  });

  useEffect(() => { fetchEmployees(); }, []);
  useEffect(() => { filterEmployees(); }, [searchQuery, statusFilter, employees]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);

      // ✅ Fetch employees + today's attendance in parallel
      const [empRes, attRes] = await Promise.all([
        managerService.getMyEmployees(),
        managerService.getAttendanceByDate({ date: selectedDate })
      ]);

      if (empRes?.success && empRes.data?.employees) {
        const emps = empRes.data.employees;

        // ✅ Build attendance map by employeeId
        const attMap = {};
        const rawRecords =
          attRes?.data?.attendance ||
          attRes?.data?.records ||
          attRes?.attendance ||
          attRes?.records ||
          [];
        rawRecords.forEach(rec => {
          const empId = rec.employeeId?._id || rec.employeeId;
          if (empId) attMap[String(empId)] = rec;
        });

        // ✅ Merge leave/attendance info into each employee
        const merged = emps.map(emp => {
          const att = attMap[String(emp._id)];
          const isOnLeave = att?.status === 'leave' || att?.status === 'on-leave';
          return {
            ...emp,
            todayAttendance: att || null,
            isOnLeave,
            leaveType: isOnLeave ? (att?.leaveType || 'Leave') : null,
            leaveRemarks: isOnLeave ? (att?.remarks || '') : null,
          };
        });

        setEmployees(merged);
        setFilteredEmployees(merged);
      } else {
        setEmployees([]);
        setFilteredEmployees([]);
      }
    } catch (error) {
      console.error('❌ Error fetching employees:', error);
      setEmployees([]);
      setFilteredEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = [...employees];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(emp =>
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q) ||
        (emp.employeeCode || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter === 'present') {
      filtered = filtered.filter(emp => emp.todayAttendance && !emp.isOnLeave);
    } else if (statusFilter === 'leave') {
      filtered = filtered.filter(emp => emp.isOnLeave);
    } else if (statusFilter === 'absent') {
      filtered = filtered.filter(emp => !emp.todayAttendance);
    }
    setFilteredEmployees(filtered);
  };

  // ✅ Employee select - agar leave pe hai to alert dikhao, form block karo
  const handleEmployeeSelect = (employee) => {
    setLeaveAlert(null);
    setSelectedEmployee(employee);

    if (employee.isOnLeave) {
      // ✅ Alert set karo, form data clear karo
      setLeaveAlert({
        name: `${employee.firstName} ${employee.lastName}`,
        leaveType: employee.leaveType,
        remarks: employee.leaveRemarks,
      });
      setAttendanceData({ status: '', clockIn: '', clockOut: '', remarks: '' });
      return;
    }

    // Normal selection
    if (employee.todayAttendance && employee.todayAttendance.clockIn) {
      setAttendanceData({
        status: 'present',
        clockIn: new Date(employee.todayAttendance.clockIn).toTimeString().slice(0, 5),
        clockOut: '',
        remarks: employee.todayAttendance.remarks || ''
      });
    } else {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setAttendanceData({ status: '', clockIn: `${hh}:${mm}`, clockOut: '', remarks: '' });
    }
  };

  const handleTimeChange = (field, value) => {
    setAttendanceData(prev => ({ ...prev, [field]: value }));
  };

  const setNow = (field) => {
    const now = new Date();
    handleTimeChange(field, `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);
  };

  const calculateHours = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return '0.00';
    const [ih, im] = clockIn.split(':').map(Number);
    const [oh, om] = clockOut.split(':').map(Number);
    return ((oh * 60 + om - (ih * 60 + im)) / 60).toFixed(2);
  };

  const handleSubmit = async () => {
    if (!selectedEmployee) { alert('⚠️ Please select an employee'); return; }

    // ✅ Leave pe hai to bilkul block karo
    if (selectedEmployee.isOnLeave) {
      alert(
        `🏖️ ${selectedEmployee.firstName} ${selectedEmployee.lastName} is on APPROVED LEAVE today.\n\n` +
        `Leave Type: ${selectedEmployee.leaveType || 'Leave'}\n\n` +
        `❌ Attendance cannot be marked for an employee on approved leave.`
      );
      return;
    }

    if (!attendanceData.status && !selectedEmployee.todayAttendance) {
      alert('⚠️ Please select attendance status'); return;
    }

    const alreadyCheckedIn = selectedEmployee.todayAttendance?.clockIn;

    try {
      setMarking(true);

      if (alreadyCheckedIn) {
        if (!attendanceData.clockOut) { alert('⚠️ Please enter clock-out time'); setMarking(false); return; }
        const response = await managerService.updateAttendance(
          selectedEmployee.todayAttendance._id,
          { clockOut: `${selectedDate}T${attendanceData.clockOut}:00`, remarks: attendanceData.remarks }
        );
        if (response.success) { alert('✅ Check-out marked successfully!'); onAttendanceMarked(); }
        else alert(`❌ ${response.message || 'Failed'}`);
      } else {
        if (attendanceData.status === 'present' && !attendanceData.clockIn) {
          alert('⚠️ Please enter clock-in time'); setMarking(false); return;
        }
        let backendStatus = attendanceData.status;
        if (attendanceData.status === 'leave') backendStatus = 'on-leave';

        const payload = {
          employeeId: selectedEmployee._id,
          date: selectedDate,
          clockIn: `${selectedDate}T${attendanceData.clockIn}:00`,
          clockOut: attendanceData.clockOut ? `${selectedDate}T${attendanceData.clockOut}:00` : null,
          status: backendStatus,
          remarks: attendanceData.remarks
        };
        const response = await managerService.markAttendance(payload);
        if (response.success) { alert('✅ Attendance marked successfully!'); onAttendanceMarked(); }
        else alert(`❌ ${response.message || 'Failed'}`);
      }
    } catch (error) {
      console.error('❌', error);
      alert(error.message || 'Failed to mark attendance');
    } finally {
      setMarking(false);
    }
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>

        {/* ── Modal Header ── */}
        <div style={S.header}>
          <div>
            <h2 style={S.headerTitle}>
              <span style={{ fontSize: 28 }}>✓</span>
              Mark Attendance
            </h2>
            <p style={S.headerSub}>
              📅 {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            style={S.closeBtn}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >✕</button>
        </div>

        {/* ── Modal Body ── */}
        <div style={S.body}>
          <div style={{ display: 'grid', gridTemplateColumns: selectedEmployee ? '1fr 1fr' : '1fr', gap: 24, height: '100%' }}>

            {/* ── LEFT: Employee List ── */}
            <div style={S.panel}>
              <h3 style={S.panelTitle}>Select Employee ({filteredEmployees.length})</h3>

              <input
                type="text"
                placeholder="🔍 Search employees..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={S.searchInput}
              />

              {/* Filter Tabs - 4 tabs ab */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 16 }}>
                {[
                  { key: '', label: 'All' },
                  { key: 'present', label: '✅ Present' },
                  { key: 'absent', label: '❌ Absent' },
                  { key: 'leave', label: '🏖️ Leave' },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    style={{
                      ...S.filterBtn,
                      background: statusFilter === f.key
                        ? (f.key === 'present' ? '#10b981' : f.key === 'leave' ? '#f59e0b' : f.key === 'absent' ? '#ef4444' : '#667eea')
                        : 'white',
                      color: statusFilter === f.key ? 'white' : '#6b7280',
                    }}
                  >{f.label}</button>
                ))}
              </div>

              {/* Employee List */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <div style={S.spinner}></div>
                    <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                    <p>No employees found</p>
                  </div>
                ) : filteredEmployees.map(emp => (
                  <div
                    key={emp._id}
                    onClick={() => handleEmployeeSelect(emp)}
                    style={{
                      ...S.empRow,
                      // ✅ Leave employees: orange highlight
                      background: emp.isOnLeave
                        ? (selectedEmployee?._id === emp._id ? '#fef3c7' : '#fffbeb')
                        : (selectedEmployee?._id === emp._id ? '#667eea22' : 'white'),
                      border: `2px solid ${
                        emp.isOnLeave
                          ? '#f59e0b'
                          : selectedEmployee?._id === emp._id ? '#667eea' : '#e5e7eb'
                      }`,
                    }}
                    onMouseEnter={e => {
                      if (selectedEmployee?._id !== emp._id)
                        e.currentTarget.style.background = emp.isOnLeave ? '#fef3c7' : '#f3f4f6';
                    }}
                    onMouseLeave={e => {
                      if (selectedEmployee?._id !== emp._id)
                        e.currentTarget.style.background = emp.isOnLeave ? '#fffbeb' : 'white';
                    }}
                  >
                    <div style={{
                      ...S.empAvatar,
                      // ✅ Orange avatar for leave employees
                      background: emp.isOnLeave
                        ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                        : 'linear-gradient(135deg,#667eea,#764ba2)'
                    }}>
                      {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={S.empName}>{emp.firstName} {emp.lastName}</div>
                      <div style={S.empMeta}>
                        {emp.employeeCode}{emp.designation && ` • ${emp.designation}`}
                      </div>
                    </div>
                    {/* ✅ Status badges */}
                    {emp.isOnLeave && (
                      <span style={S.leaveBadge}>🏖️ Leave</span>
                    )}
                    {!emp.isOnLeave && emp.todayAttendance && (
                      <span style={S.checkedInBadge}>✅ In</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Attendance Form ── */}
            {selectedEmployee && (
              <div style={{ ...S.panel, overflowY: 'auto' }}>
                <h3 style={S.panelTitle}>Mark Attendance</h3>

                {/* Employee Info Card */}
                <div style={{
                  ...S.empInfoBox,
                  borderColor: selectedEmployee.isOnLeave ? '#f59e0b' : '#e5e7eb',
                  background: selectedEmployee.isOnLeave ? '#fffbeb' : 'white',
                }}>
                  <div style={{
                    ...S.empInfoAvatar,
                    background: selectedEmployee.isOnLeave
                      ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                      : 'linear-gradient(135deg,#667eea,#764ba2)'
                  }}>
                    {selectedEmployee.firstName.charAt(0)}{selectedEmployee.lastName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>
                      {selectedEmployee.employeeCode} • {selectedEmployee.department}
                    </div>
                  </div>
                </div>

                {/* ✅ LEAVE ALERT BOX - jab employee leave pe ho */}
                {leaveAlert ? (
                  <div style={S.leaveAlertBox}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>🏖️</div>
                    <div style={S.leaveAlertTitle}>Employee is on Approved Leave</div>
                    <div style={S.leaveAlertRow}>
                      <strong>Leave Type:</strong> {leaveAlert.leaveType || 'Leave'}
                    </div>
                    {leaveAlert.remarks && (
                      <div style={S.leaveAlertRow}>
                        <strong>Reason:</strong> {leaveAlert.remarks.replace('Leave approved: ', '')}
                      </div>
                    )}
                    <div style={S.leaveAlertWarning}>
                      ⚠️ Attendance cannot be marked for an employee on approved leave.
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Already Checked In Notice */}
                    {selectedEmployee.todayAttendance && (
                      <div style={S.checkedInBox}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#10b981', marginBottom: 4 }}>
                          ✓ Already Checked In
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                          Clock In: {new Date(selectedEmployee.todayAttendance.clockIn).toLocaleTimeString()}
                        </div>
                      </div>
                    )}

                    {/* Status Select */}
                    {!selectedEmployee.todayAttendance && (
                      <div style={{ marginBottom: 20 }}>
                        <label style={S.label}>Status *</label>
                        <select
                          value={attendanceData.status}
                          onChange={e => setAttendanceData(p => ({ ...p, status: e.target.value }))}
                          disabled={marking}
                          style={S.select}
                        >
                          <option value="">Select Status</option>
                          <option value="present">✅ Present</option>
                          <option value="absent">❌ Absent</option>
                          <option value="half-day">⏰ Half Day</option>
                        </select>
                      </div>
                    )}

                    {/* Time Fields */}
                    {(attendanceData.status === 'present' || attendanceData.status === 'half-day' || selectedEmployee.todayAttendance) && (
                      <div style={S.timeBox}>
                        <div style={{ display: 'grid', gridTemplateColumns: selectedEmployee.todayAttendance ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 12 }}>
                          {!selectedEmployee.todayAttendance && (
                            <div>
                              <label style={S.label}>Clock In *</label>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <input type="time" value={attendanceData.clockIn}
                                  onChange={e => handleTimeChange('clockIn', e.target.value)}
                                  disabled={marking} style={S.timeInput} />
                                <button onClick={() => setNow('clockIn')} disabled={marking} style={S.nowBtn}>Now</button>
                              </div>
                            </div>
                          )}
                          <div>
                            <label style={S.label}>Clock Out {selectedEmployee.todayAttendance ? '*' : ''}</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input type="time" value={attendanceData.clockOut}
                                onChange={e => handleTimeChange('clockOut', e.target.value)}
                                disabled={marking} style={S.timeInput} />
                              <button onClick={() => setNow('clockOut')} disabled={marking} style={S.nowBtn}>Now</button>
                            </div>
                          </div>
                        </div>
                        {attendanceData.clockIn && attendanceData.clockOut && (
                          <div style={S.hoursBox}>
                            <span style={{ fontSize: 18 }}>⏱️</span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                              Total Hours: {calculateHours(attendanceData.clockIn, attendanceData.clockOut)} hrs
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Remarks */}
                    <div style={{ marginBottom: 20 }}>
                      <label style={S.label}>Remarks</label>
                      <textarea
                        value={attendanceData.remarks}
                        onChange={e => handleTimeChange('remarks', e.target.value)}
                        placeholder="Add optional notes..."
                        rows="3"
                        disabled={marking}
                        style={S.textarea}
                      />
                    </div>

                    {/* Submit */}
                    <button
                      onClick={handleSubmit}
                      disabled={(!attendanceData.status && !selectedEmployee.todayAttendance) || marking}
                      style={{
                        ...S.submitBtn,
                        background: (attendanceData.status || selectedEmployee.todayAttendance) && !marking
                          ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#e5e7eb',
                        color: (attendanceData.status || selectedEmployee.todayAttendance) && !marking
                          ? 'white' : '#9ca3af',
                        cursor: (attendanceData.status || selectedEmployee.todayAttendance) && !marking
                          ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <span>{marking ? '⏳' : '✓'}</span>
                      {marking ? 'Marking...' : selectedEmployee.todayAttendance ? 'Mark Check-Out' : 'Mark Attendance'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

const S = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:20 },
  modal:   { background:'white', borderRadius:20, width:'100%', maxWidth:1100, maxHeight:'90vh', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', display:'flex', flexDirection:'column' },

  header:      { background:'linear-gradient(135deg, #667eea, #764ba2)', padding:'24px 28px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  headerTitle: { fontSize:24, fontWeight:700, color:'white', margin:'0 0 8px 0', display:'flex', alignItems:'center', gap:12 },
  headerSub:   { fontSize:14, color:'rgba(255,255,255,0.9)', margin:0 },
  closeBtn:    { background:'rgba(255,255,255,0.2)', border:'none', color:'white', fontSize:20, width:40, height:40, borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' },

  body:       { flex:1, overflowY:'auto', padding:24 },
  panel:      { background:'#f9fafb', borderRadius:16, padding:20, overflow:'hidden', display:'flex', flexDirection:'column' },
  panelTitle: { fontSize:18, fontWeight:700, color:'#111827', margin:'0 0 16px 0' },

  searchInput: { width:'100%', padding:'12px 16px', border:'2px solid #e5e7eb', borderRadius:10, fontSize:14, outline:'none', marginBottom:12, boxSizing:'border-box' },
  filterBtn:   { padding:'6px 8px', border:'2px solid #e5e7eb', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer' },

  empRow:    { borderRadius:12, padding:12, cursor:'pointer', transition:'background 0.15s', display:'flex', alignItems:'center', gap:12 },
  empAvatar: { width:40, height:40, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:14, fontWeight:700, flexShrink:0 },
  empName:   { fontSize:14, fontWeight:600, color:'#111827', marginBottom:2 },
  empMeta:   { fontSize:12, color:'#6b7280' },

  leaveBadge:     { padding:'4px 8px', borderRadius:6, fontSize:11, fontWeight:600, background:'#fef3c7', color:'#92400e', border:'1px solid #f59e0b', flexShrink:0 },
  checkedInBadge: { padding:'4px 8px', borderRadius:6, fontSize:11, fontWeight:600, background:'#10b98122', color:'#10b981', flexShrink:0 },

  empInfoBox:    { background:'white', borderRadius:12, padding:16, marginBottom:16, border:'2px solid #e5e7eb', display:'flex', alignItems:'center', gap:12 },
  empInfoAvatar: { width:48, height:48, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:16, fontWeight:700, flexShrink:0 },
  checkedInBox:  { padding:12, background:'#10b98111', borderRadius:8, border:'1px solid #10b98133', marginBottom:16 },

  // ✅ Leave Alert Styles
  leaveAlertBox:     { background:'#fffbeb', border:'2px solid #f59e0b', borderRadius:14, padding:'24px 20px', textAlign:'center' },
  leaveAlertTitle:   { fontSize:16, fontWeight:700, color:'#92400e', marginBottom:12 },
  leaveAlertRow:     { fontSize:13, color:'#78350f', marginBottom:6 },
  leaveAlertWarning: { marginTop:14, padding:'10px 14px', background:'#fef3c7', borderRadius:8, fontSize:12, color:'#92400e', fontWeight:600, border:'1px solid #f59e0b' },

  label:    { display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 },
  select:   { width:'100%', padding:12, border:'2px solid #e5e7eb', borderRadius:10, fontSize:14, outline:'none', cursor:'pointer', background:'white' },
  timeBox:  { background:'white', borderRadius:12, padding:16, marginBottom:20, border:'2px solid #e5e7eb' },
  timeInput:{ flex:1, padding:10, border:'2px solid #e5e7eb', borderRadius:8, fontSize:14, outline:'none' },
  nowBtn:   { padding:'8px 12px', background:'#667eea', color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' },
  hoursBox: { padding:12, background:'#f9fafb', borderRadius:8, display:'flex', alignItems:'center', gap:8 },

  textarea:  { width:'100%', padding:12, border:'2px solid #e5e7eb', borderRadius:10, fontSize:14, outline:'none', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' },
  submitBtn: { width:'100%', padding:14, border:'none', borderRadius:12, fontSize:15, fontWeight:700, transition:'all 0.3s', display:'flex', alignItems:'center', justifyContent:'center', gap:8 },
  spinner:   { width:40, height:40, border:'4px solid #f3f3f3', borderTop:'4px solid #667eea', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 16px' },
};

export default ManagerMarkAttendanceModal;
