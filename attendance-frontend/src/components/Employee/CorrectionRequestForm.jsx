import React, { useState } from 'react';
import { createCorrectionRequest } from '../../services/correctionRequestService';
import { useNavigate } from 'react-router-dom';
import EmployeeNavbar from './EmployeeNavbar';
import './../../styles/NotificationStyles.css';

const CorrectionRequestForm = () => {
  const [formData, setFormData] = useState({
    attendanceDate: '',
    currentStatus: 'absent',
    requestedStatus: 'present',
    currentClockIn: '',
    currentClockOut: '',
    requestedClockIn: '',
    requestedClockOut: '',
    reason: '',
    issueType: 'wrong_status',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.attendanceDate || !formData.reason) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await createCorrectionRequest(formData);
      if (response.success) {
        setMessage({ type: 'success', text: 'Correction request submitted successfully!' });
        setTimeout(() => {
          navigate('/employee/my-requests');
        }, 2000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to submit correction request' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-container">
      <EmployeeNavbar />

      <div className="correction-request-form-container">
        <div className="page-header">
          <h1>⚠️ Report Attendance Issue</h1>
          <p>Request correction for attendance discrepancy</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="correction-form">
          <div className="form-section">
            <h3>Issue Details</h3>

            <div className="form-group">
              <label>Attendance Date *</label>
              <input
                type="date"
                name="attendanceDate"
                value={formData.attendanceDate}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label>Issue Type *</label>
              <select name="issueType" value={formData.issueType} onChange={handleChange} required>
                <option value="wrong_status">Wrong Status Marked</option>
                <option value="missed_clock_in">Missed Clock In</option>
                <option value="missed_clock_out">Missed Clock Out</option>
                <option value="wrong_time">Wrong Time Recorded</option>
                <option value="technical_issue">Technical Issue</option>
                <option value="other">Other Issue</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Current Status *</label>
                <select name="currentStatus" value={formData.currentStatus} onChange={handleChange} required>
                  <option value="absent">Absent</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="half-day">Half Day</option>
                  <option value="leave">Leave</option>
                </select>
              </div>
              <div className="form-group">
                <label>Requested Status *</label>
                <select name="requestedStatus" value={formData.requestedStatus} onChange={handleChange} required>
                  <option value="present">Present</option>
                  <option value="half-day">Half Day</option>
                  <option value="late">Late</option>
                  <option value="on-leave">On Leave</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Current Clock In</label>
                <input type="time" name="currentClockIn" value={formData.currentClockIn} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Current Clock Out</label>
                <input type="time" name="currentClockOut" value={formData.currentClockOut} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Requested Clock In</label>
                <input type="time" name="requestedClockIn" value={formData.requestedClockIn} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Requested Clock Out</label>
                <input type="time" name="requestedClockOut" value={formData.requestedClockOut} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-group">
              <label>Detailed Explanation *</label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows="6"
                placeholder="Please provide a detailed explanation of the issue..."
                required
              />
              <small>Explain what happened and why the correction is needed</small>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : '📤 Submit Correction Request'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/employee/my-requests')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CorrectionRequestForm;