import React, { useState, useEffect } from 'react';
import { createLeaveRequest, getLeavePolicy } from '../../services/leaveRequestService';
import { useNavigate } from 'react-router-dom';
import './../../styles/NotificationStyles.css';

const LeaveRequestForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [policyLoading, setPolicyLoading] = useState(true);
  const [leavePolicy, setLeavePolicy] = useState(null);
  const [leaveDuration, setLeaveDuration] = useState('single'); // 'single' or 'multiple'
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    leaveType: 'casual',
    singleDate: '',
    fromDate: '',
    toDate: '',
    numberOfDays: 1,
    reason: ''
  });

  // Fetch leave policy on mount
  useEffect(() => {
    fetchLeavePolicy();
  }, []);

  const fetchLeavePolicy = async () => {
    try {
      setPolicyLoading(true);
      const response = await getLeavePolicy();
      
      if (response.success) {
        setLeavePolicy(response.data);
      }
    } catch (error) {
      console.error('Error fetching leave policy:', error);
      if (error.message === 'Invalid token' || error.message === 'Authentication required') {
        setMessage({ type: 'error', text: 'Session expired. Please login again.' });
        setTimeout(() => {
          localStorage.clear();
          navigate('/employee/login');
        }, 2000);
      }
    } finally {
      setPolicyLoading(false);
    }
  };

  // Auto-calculate days for multiple days
  useEffect(() => {
    if (leaveDuration === 'multiple' && formData.fromDate && formData.toDate) {
      const from = new Date(formData.fromDate);
      const to = new Date(formData.toDate);
      
      if (to >= from) {
        const diffTime = Math.abs(to - from);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setFormData(prev => ({ ...prev, numberOfDays: diffDays }));
      } else {
        setFormData(prev => ({ ...prev, numberOfDays: 0 }));
      }
    } else if (leaveDuration === 'single') {
      setFormData(prev => ({ ...prev, numberOfDays: 1 }));
    }
  }, [formData.fromDate, formData.toDate, leaveDuration]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDurationChange = (duration) => {
    setLeaveDuration(duration);
    setFormData(prev => ({
      ...prev,
      singleDate: '',
      fromDate: '',
      toDate: '',
      numberOfDays: duration === 'single' ? 1 : 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (leaveDuration === 'single') {
      if (!formData.singleDate || !formData.reason.trim()) {
        setMessage({ type: 'error', text: 'Please fill all required fields' });
        return;
      }
    } else {
      if (!formData.fromDate || !formData.toDate || !formData.reason.trim()) {
        setMessage({ type: 'error', text: 'Please fill all required fields' });
        return;
      }

      if (formData.numberOfDays <= 0) {
        setMessage({ type: 'error', text: 'Invalid date range' });
        return;
      }
    }

    // Check leave balance
    if (leavePolicy && leavePolicy.balance) {
      if (formData.numberOfDays > leavePolicy.balance.remaining) {
        setMessage({ 
          type: 'error', 
          text: `You only have ${leavePolicy.balance.remaining} leave day${leavePolicy.balance.remaining !== 1 ? 's' : ''} remaining!` 
        });
        return;
      }
    }

    // Prepare request
    const requestData = {
      leaveType: formData.leaveType,
      fromDate: leaveDuration === 'single' ? formData.singleDate : formData.fromDate,
      toDate: leaveDuration === 'single' ? formData.singleDate : formData.toDate,
      numberOfDays: formData.numberOfDays,
      reason: formData.reason
    };

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await createLeaveRequest(requestData);
      if (response.success) {
        setMessage({ type: 'success', text: 'Leave request submitted successfully!' });
        
        // Reset form
        setFormData({
          leaveType: 'casual',
          singleDate: '',
          fromDate: '',
          toDate: '',
          numberOfDays: leaveDuration === 'single' ? 1 : 0,
          reason: ''
        });

        // Refresh policy
        await fetchLeavePolicy();

        setTimeout(() => {
          navigate('/employee/my-requests');
        }, 2000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to submit leave request' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leave-request-form-container">
      <div className="page-header">
        <h1>🏖️ Request Leave</h1>
        <p>Submit a leave request for approval</p>
      </div>

      {/* Leave Policy Reminder */}
      <div className="leave-policy-reminder">
        {policyLoading ? (
          <div className="policy-loading">Loading policy...</div>
        ) : leavePolicy ? (
          <div className="policy-content">
            <div className="policy-icon">ℹ️</div>
            <div className="policy-text">
              <strong>Leave Policy:</strong> You are allowed <strong>{leavePolicy.policy.allowedLeavesPerMonth} leaves per month</strong>.
              {' '}You have used <strong className="used-count">{leavePolicy.balance.used}</strong> and have{' '}
              <strong className={leavePolicy.balance.remaining === 0 ? 'no-balance' : 'remaining-count'}>
                {leavePolicy.balance.remaining} {leavePolicy.balance.remaining === 1 ? 'day' : 'days'}
              </strong> remaining for {leavePolicy.balance.currentMonth}.
            </div>
          </div>
        ) : (
          <div className="policy-content">
            <div className="policy-icon">⚠️</div>
            <div className="policy-text">Could not load leave policy.</div>
          </div>
        )}
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="leave-form">
        <div className="form-section">
          <h3>Leave Details</h3>

          <div className="form-group">
            <label>Leave Type *</label>
            <select
              name="leaveType"
              value={formData.leaveType}
              onChange={handleChange}
              required
            >
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="annual">Annual Leave</option>
              <option value="emergency">Emergency Leave</option>
              <option value="unpaid">Unpaid Leave</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Duration Selection */}
          <div className="form-group">
            <label>Leave Duration *</label>
            <div className="duration-buttons">
              <button
                type="button"
                className={`duration-btn ${leaveDuration === 'single' ? 'active' : ''}`}
                onClick={() => handleDurationChange('single')}
              >
                📅 Single Day
              </button>
              <button
                type="button"
                className={`duration-btn ${leaveDuration === 'multiple' ? 'active' : ''}`}
                onClick={() => handleDurationChange('multiple')}
              >
                📆 Multiple Days
              </button>
            </div>
          </div>

          {/* Single Day */}
          {leaveDuration === 'single' && (
            <div className="form-group">
              <label>Leave Date *</label>
              <input
                type="date"
                name="singleDate"
                value={formData.singleDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              <small>Select the date you want to take leave</small>
            </div>
          )}

          {/* Multiple Days */}
          {leaveDuration === 'multiple' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>From Date *</label>
                  <input
                    type="date"
                    name="fromDate"
                    value={formData.fromDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>To Date *</label>
                  <input
                    type="date"
                    name="toDate"
                    value={formData.toDate}
                    onChange={handleChange}
                    min={formData.fromDate || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Total Days</label>
                <input
                  type="number"
                  name="numberOfDays"
                  value={formData.numberOfDays}
                  readOnly
                  className="readonly-input"
                />
                <small>Automatically calculated</small>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Reason for Leave *</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows="5"
              placeholder="Please provide a detailed reason for your leave request..."
              required
              maxLength="500"
            />
            <small>{formData.reason.length}/500 characters</small>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading || (leavePolicy && leavePolicy.balance.remaining === 0)}
          >
            {loading ? 'Submitting...' : '📤 Submit Leave Request'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/employee/my-requests')}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveRequestForm;