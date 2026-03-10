import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './../../styles/NotificationStyles.css';

const MyRequests = () => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
  const [activeTab, setActiveTab] = useState('leave');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [correctionRequests, setCorrectionRequests] = useState([]);
  const [leaveStats, setLeaveStats] = useState(null);
  const [correctionStats, setCorrectionStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cancelling, setCancelling] = useState(null); // ✅ Track cancellation
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, [activeTab, filter]);

  // ✅ AUTO-REFRESH every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRequests();
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTab, filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('employee_token');

      if (activeTab === 'leave') {
        // ✅ FIXED: Correct API endpoint
        const url = filter === 'all' 
          ? `${API_URL}/leave-requests/my-requests`
          : `${API_URL}/leave-requests/my-requests?status=${filter}`;

        console.log('📋 Fetching leave requests:', url);

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Leave requests response:', data);
          setLeaveRequests(data.data?.leaveRequests || []);
          setLeaveStats(data.data?.stats || null);
        } else {
          console.error('❌ Failed to fetch leave requests:', response.status);
        }
      } else {
        // ✅ FIXED: Correct API endpoint for correction requests
        const url = filter === 'all'
          ? `${API_URL}/correction-requests/my-requests`
          : `${API_URL}/correction-requests/my-requests?status=${filter}`;

        console.log('🔧 Fetching correction requests:', url);

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Correction requests response:', data);
          setCorrectionRequests(data.data?.correctionRequests || []);
          setCorrectionStats(data.data?.stats || null);
        } else {
          console.error('❌ Failed to fetch correction requests:', response.status);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelLeave = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }

    setCancelling(requestId);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('employee_token');
      
      const response = await fetch(`${API_URL}/leave-requests/${requestId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('✅ Leave request cancelled successfully');
        fetchRequests(); // ✅ Refresh list
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to cancel leave request');
      }
    } catch (error) {
      alert(error.message || 'Failed to cancel leave request');
    } finally {
      setCancelling(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444',
      cancelled: '#6b7280',
      resolved: '#8b5cf6'
    };
    return colors[status] || '#6b7280';
  };

  const getLeaveTypeColor = (type) => {
    const colors = {
      sick: '#ef4444',
      casual: '#3b82f6',
      annual: '#10b981',
      emergency: '#f59e0b',
      unpaid: '#6b7280',
      other: '#8b5cf6'
    };
    return colors[type] || '#6b7280';
  };

  return (
    <div className="my-requests-container">
      <div className="page-header">
        <h1>📋 My Requests</h1>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/employee/request-leave')}
          >
            🏖️ Request Leave
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/employee/report-issue')}
          >
            ⚠️ Report Issue
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {activeTab === 'leave' && leaveStats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-number">{leaveStats.totalApproved || 0}</span>
            <span className="stat-label">Approved Leaves</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{leaveStats.totalDays || 0}</span>
            <span className="stat-label">Total Days Taken</span>
          </div>
        </div>
      )}

      {activeTab === 'correction' && correctionStats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-number">{correctionStats.total || 0}</span>
            <span className="stat-label">Total Requests</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{correctionStats.pending || 0}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{correctionStats.approved || 0}</span>
            <span className="stat-label">Approved</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{correctionStats.approvalRate || 0}%</span>
            <span className="stat-label">Approval Rate</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button
            className={activeTab === 'leave' ? 'active' : ''}
            onClick={() => setActiveTab('leave')}
          >
            🏖️ Leave Requests ({leaveRequests.length})
          </button>
          <button
            className={activeTab === 'correction' ? 'active' : ''}
            onClick={() => setActiveTab('correction')}
          >
            ⚠️ Correction Requests ({correctionRequests.length})
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="filter-section">
        <div className="filter-tabs">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={filter === 'approved' ? 'active' : ''}
            onClick={() => setFilter('approved')}
          >
            Approved
          </button>
          <button 
            className={filter === 'rejected' ? 'active' : ''}
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-state">Loading requests...</div>
      ) : (
        <>
          {/* Leave Requests */}
          {activeTab === 'leave' && (
            <div className="requests-grid">
              {leaveRequests.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📭</span>
                  <h3>No leave requests found</h3>
                  <p>You haven't submitted any leave requests yet.</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/employee/request-leave')}
                  >
                    Request Leave Now
                  </button>
                </div>
              ) : (
                leaveRequests.map((request) => (
                  <div key={request._id} className="request-card">
                    <div className="request-header">
                      <span 
                        className="leave-type-badge" 
                        style={{ backgroundColor: getLeaveTypeColor(request.leaveType) }}
                      >
                        {request.leaveType}
                      </span>
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(request.status) }}
                      >
                        {request.status}
                      </span>
                    </div>

                    <div className="request-details">
                      <div className="detail-row">
                        <span className="detail-label">Duration:</span>
                        <span className="detail-value">{request.numberOfDays} day(s)</span>
                      </div>

                      <div className="detail-row">
                        <span className="detail-label">From:</span>
                        <span className="detail-value">
                          {new Date(request.fromDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="detail-row">
                        <span className="detail-label">To:</span>
                        <span className="detail-value">
                          {new Date(request.toDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="detail-row full-width">
                        <span className="detail-label">Reason:</span>
                        <p className="reason-text">{request.reason}</p>
                      </div>

                      {request.status !== 'pending' && request.approverName && (
                        <div className="detail-row full-width">
                          <span className="detail-label">
                            {request.status === 'approved' ? 'Approved' : 'Rejected'} by:
                          </span>
                          <span className="detail-value">
                            {request.approverName} on {new Date(request.approvedAt).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {request.rejectionReason && (
                        <div className="detail-row full-width rejection-reason">
                          <span className="detail-label">Rejection Reason:</span>
                          <p>{request.rejectionReason}</p>
                        </div>
                      )}
                    </div>

                    <div className="request-footer">
                      <span className="request-date">
                        Requested on {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                      {request.status === 'pending' && (
                        <button
                          className="btn btn-reject btn-small"
                          onClick={() => handleCancelLeave(request._id)}
                          disabled={cancelling === request._id}
                        >
                          {cancelling === request._id ? 'Cancelling...' : 'Cancel Request'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Correction Requests */}
          {activeTab === 'correction' && (
            <div className="requests-grid">
              {correctionRequests.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">✅</span>
                  <h3>No correction requests found</h3>
                  <p>You haven't reported any attendance issues.</p>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => navigate('/employee/report-issue')}
                  >
                    Report Issue
                  </button>
                </div>
              ) : (
                correctionRequests.map((request) => (
                  <div key={request._id} className="request-card correction-card">
                    <div className="request-header">
                      <div className="issue-info">
                        <span className="issue-type">
                          {request.issueType?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="badges">
                        <span 
                          className="status-badge" 
                          style={{ backgroundColor: getStatusColor(request.status) }}
                        >
                          {request.status}
                        </span>
                        {request.priority && (
                          <span 
                            className="priority-badge" 
                            style={{ backgroundColor: getStatusColor(request.priority) }}
                          >
                            {request.priority}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="request-details">
                      <div className="detail-row">
                        <span className="detail-label">Date:</span>
                        <span className="detail-value">
                          {new Date(request.attendanceDate).toLocaleDateString()}
                        </span>
                      </div>

                      {request.currentStatus && request.requestedStatus && (
                        <div className="status-change-row">
                          <div className="status-box current">
                            <span className="status-label">Current:</span>
                            <span className="status-value">{request.currentStatus}</span>
                          </div>
                          <div className="arrow">→</div>
                          <div className="status-box requested">
                            <span className="status-label">Requested:</span>
                            <span className="status-value">{request.requestedStatus}</span>
                          </div>
                        </div>
                      )}

                      <div className="detail-row full-width">
                        <span className="detail-label">Reason:</span>
                        <p className="reason-text">{request.reason}</p>
                      </div>

                      {request.status !== 'pending' && request.resolverName && (
                        <>
                          <div className="detail-row full-width">
                            <span className="detail-label">Resolved by:</span>
                            <span className="detail-value">
                              {request.resolverName} on {new Date(request.resolvedAt).toLocaleString()}
                            </span>
                          </div>
                          {request.resolution && (
                            <div className="detail-row full-width resolution">
                              <span className="detail-label">Resolution:</span>
                              <p>{request.resolution}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="request-footer">
                      <span className="request-date">
                        Requested on {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyRequests;