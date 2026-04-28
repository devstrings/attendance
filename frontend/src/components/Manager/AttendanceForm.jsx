import React, { useState } from 'react';
import '../../styles/Manager.css';

const AttendanceForm = ({ employee, date, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    status: 'present',
    clockIn: '',
    clockOut: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const attendanceData = {
      employeeId: employee.id,
      employeeName: employee.name,
      date: date,
      status: formData.status,
      clockIn: formData.status === 'present' ? formData.clockIn : null,
      clockOut: formData.status === 'present' ? formData.clockOut : null,
      notes: formData.notes,
      hoursWorked: calculateHours(formData.clockIn, formData.clockOut)
    };

    onSubmit(attendanceData);
  };

  const calculateHours = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return 0;

    const [inHour, inMinute] = clockIn.split(':').map(Number);
    const [outHour, outMinute] = clockOut.split(':').map(Number);

    const inTime = inHour * 60 + inMinute;
    const outTime = outHour * 60 + outMinute;

    const diffMinutes = outTime - inTime;
    return (diffMinutes / 60).toFixed(2);
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const setCurrentClockIn = () => {
    setFormData(prev => ({
      ...prev,
      clockIn: getCurrentTime()
    }));
  };

  const setCurrentClockOut = () => {
    setFormData(prev => ({
      ...prev,
      clockOut: getCurrentTime()
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Mark Attendance</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="employee-info-box">
            <div className="info-row">
              <strong>Employee:</strong> {employee.name}
            </div>
            <div className="info-row">
              <strong>Position:</strong> {employee.position}
            </div>
            <div className="info-row">
              <strong>Date:</strong> {new Date(date).toLocaleDateString()}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="attendance-form">
            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="leave">Leave</option>
                <option value="holiday">Holiday</option>
              </select>
            </div>

            {formData.status === 'present' && (
              <>
                <div className="form-group">
                  <label htmlFor="clockIn">Clock In Time *</label>
                  <div className="time-input-group">
                    <input
                      type="time"
                      id="clockIn"
                      name="clockIn"
                      value={formData.clockIn}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="btn-now"
                      onClick={setCurrentClockIn}
                    >
                      Now
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="clockOut">Clock Out Time</label>
                  <div className="time-input-group">
                    <input
                      type="time"
                      id="clockOut"
                      name="clockOut"
                      value={formData.clockOut}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="btn-now"
                      onClick={setCurrentClockOut}
                    >
                      Now
                    </button>
                  </div>
                </div>

                {formData.clockIn && formData.clockOut && (
                  <div className="hours-calculated">
                    <strong>Total Hours:</strong> {calculateHours(formData.clockIn, formData.clockOut)} hrs
                  </div>
                )}
              </>
            )}

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any notes..."
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Mark Attendance
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AttendanceForm;