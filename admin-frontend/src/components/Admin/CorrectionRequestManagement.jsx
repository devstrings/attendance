import React, { useState, useEffect } from 'react';
import { 
  getAllCorrectionRequests, 
  approveCorrectionRequest, 
  rejectCorrectionRequest,
  updatePriority,
  getOverdueRequests
} from '../../services/correctionRequestService';
import './../../styles/NotificationStyles.css';

const CorrectionRequestManagement = () => {
  const [requests, setRequests] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [overdueRequests, setOverdueRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [resolution, setResolution] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updateAttendance, setUpdateAttendance] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchOverdue();
  }, [filter, priorityFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await getAllCorrectionRequests(
        filter === 'all' ? null : filter,
        null,
        priorityFilter === 'all' ? null : priorityFilter
      );
      if (response.success) {
        setRequests(response.data.correctionRequests);
        setPendingCount(response.data.pendingCount);
      }
    } catch (error) {
      console.error('Error fetching correction requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverdue = async () => {
    try {
      const response = await getOverdueRequests();
      if (response.success) {
        setOverdueRequests(response.data.overdueRequests);
      }
    } catch (error) {
      console.error('Error fetching overdue requests:', error);
    }
  };

  const handleApprove = async () => {
    if (!resolution.trim()) {
      alert('Please provide a resolution note');
      return;
    }

    setActionLoading(true);
    try {
      const response = await approveCorrectionRequest(
        selectedRequest._id,
        resolution,
        adminNotes,
        updateAttendance
      );
      if (response.success) {
        alert('Correction request approved and attendance updated');
        setResolution('');
        setAdminNotes('');
        fetchRequests();
        setShowModal(false);
      }
    } catch (error) {
      alert(error.message || 'Failed to approve correction request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!resolution.trim()) {
      alert('Please provide a resolution note');
      return;
    }

    setActionLoading(true);
    try {
      const response = await rejectCorrectionRequest(
        selectedRequest._id,
        resolution,
        adminNotes
      );
      if (response.success) {
        alert('Correction request rejected');
        setResolution('');
        setAdminNotes('');
        fetchRequests();
        setShowModal(false);
      }
    } catch (error) {
      alert(error.message || 'Failed to reject correction request');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePriorityChange = async (requestId, newPriority) => {
    try {
      await updatePriority(requestId, newPriority);
      fetchRequests();
      alert('Priority updated successfully');
    } catch (error) {
      alert('Failed to update priority');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444'
    };
    return colors[priority] || '#6b7280';
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: '#f59e0b', text: 'Pending' },
      approved: { color: '#10b981', text: 'Approved' },
      rejected: { color: '#ef4444', text: 'Rejected' },
      resolved: { color: '#8b5cf6', text: 'Resolved' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className="status-badge" style={{ backgroundColor: badge.color }}>
        {badge.text}
      </span>
    );
  };

  const getIssueTypeIcon = (type) => {
    const icons = {
      wrong_status: '❌',
      missed_clock_in: '⏰',
      missed_clock_out: '⏱️',
      wrong_time: '🕐',
      technical_issue: '🔧',
      other: '📝'
    };
    return icons[type] || '📝';
  };

  return (
    <div className="correction-management-container">
      <div className="page-header">
        <h1>⚠️ Attendance Correction Requests</h1>
        <div className="header-stats">
          <div className="stat-card pending">
            <span className="stat-number">{pendingCount}</span>
            <span className="stat-label">Pending Requests</span>
          </div>
          <div className="stat-card overdue">
            <span className="stat-number">{overdueRequests.length}</span>
            <span className="stat-label">Overdue (3+ days)</span>
          </div>
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-group">
          <label>Status:</label>
          <div className="filter-tabs">
            <button 
              className={filter === 'pending' ? 'active' : ''}
              onClick={() => setFilter('pending')}
            >
              Pending ({pendingCount})
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
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All
            </button>
          </div>
        </div>

        <div className="filter-group">
          <label>Priority:</label>
          <div className="filter-tabs">
            <button 
              className={priorityFilter === 'all' ? 'active' : ''}
              onClick={() => setPriorityFilter('all')}
            >
              All
            </button>
            <button 
              className={priorityFilter === 'high' ? 'active' : ''}
              onClick={() => setPriorityFilter('high')}
            >
              High
            </button>
            <button 
              className={priorityFilter === 'medium' ? 'active' : ''}
              onClick={() => setPriorityFilter('medium')}
            >
              Medium
            </button>
            <button 
              className={priorityFilter === 'low' ? 'active' : ''}
              onClick={() => setPriorityFilter('low')}
            >
              Low
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading correction requests...</div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">✅</span>
          <h3>No correction requests found</h3>
          <p>There are no {filter !== 'all' ? filter : ''} correction requests.</p>
        </div>
      ) : (
        <div className="requests-grid">
          {requests.map((request) => (
            <div key={request._id} className="request-card correction-card">
              <div className="request-header">
                <div className="employee-info">
                  <h3>{request.employeeName}</h3>
                  <span className="employee-email">{request.employeeEmail}</span>
                </div>
                <div className="badges">
                  {getStatusBadge(request.status)}
                  <span 
                    className="priority-badge" 
                    style={{ backgroundColor: getPriorityColor(request.priority) }}
                  >
                    {request.priority}
                  </span>
                </div>
              </div>

              <div className="request-details">
                <div className="detail-row">
                  <span className="detail-label">
                    {getIssueTypeIcon(request.issueType)} Issue Type:
                  </span>
                  <span className="detail-value">{request.issueType.replace('_', ' ')}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Attendance Date:</span>
                  <span className="detail-value">
                    {new Date(request.attendanceDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="status-change-row">
                  <div className="status-box current">
                    <span className="status-label">Current Status:</span>
                    <span className="status-value">{request.currentStatus}</span>
                    {request.currentClockIn && (
                      <span className="time-value">
                        In: {request.currentClockIn} | Out: {request.currentClockOut || 'N/A'}
                      </span>
                    )}
                  </div>
                  <div className="arrow">→</div>
                  <div className="status-box requested">
                    <span className="status-label">Requested Status:</span>
                    <span className="status-value">{request.requestedStatus}</span>
                    {request.requestedClockIn && (
                      <span className="time-value">
                        In: {request.requestedClockIn} | Out: {request.requestedClockOut || 'N/A'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="detail-row full-width">
                  <span className="detail-label">Reason:</span>
                  <p className="reason-text">{request.reason}</p>
                </div>

                {request.status !== 'pending' && (
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

                {request.status === 'pending' && (
                  <div className="priority-selector">
                    <label>Priority:</label>
                    <select
                      value={request.priority}
                      onChange={(e) => handlePriorityChange(request._id, e.target.value)}
                      className="priority-select"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="request-actions">
                <button
                  className="btn btn-view"
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowModal(true);
                  }}
                >
                  View Details
                </button>

                {request.status === 'pending' && (
                  <>
                    <button
                      className="btn btn-approve"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowModal(true);
                      }}
                    >
                      ✅ Approve & Update
                    </button>
                    <button
                      className="btn btn-reject"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowModal(true);
                      }}
                    >
                      ❌ Reject
                    </button>
                  </>
                )}
              </div>

              <div className="request-footer">
                <span className="request-date">
                  Requested on {new Date(request.createdAt).toLocaleDateString()}
                </span>
                {request.status === 'pending' && 
                 Math.floor((Date.now() - new Date(request.createdAt)) / (1000 * 60 * 60 * 24)) > 3 && (
                  <span className="overdue-badge">⚠️ Overdue</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for detailed view */}
      {showModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Correction Request Details</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="modal-section">
                <h3>Employee Information</h3>
                <p><strong>Name:</strong> {selectedRequest.employeeName}</p>
                <p><strong>Email:</strong> {selectedRequest.employeeEmail}</p>
              </div>

              <div className="modal-section">
                <h3>Request Details</h3>
                <p><strong>Date:</strong> {new Date(selectedRequest.attendanceDate).toLocaleDateString()}</p>
                <p><strong>Issue Type:</strong> {selectedRequest.issueType.replace('_', ' ')}</p>
                <p><strong>Current Status:</strong> {selectedRequest.currentStatus}</p>
                <p><strong>Requested Status:</strong> {selectedRequest.requestedStatus}</p>
                {selectedRequest.currentClockIn && (
                  <>
                    <p><strong>Current Clock In:</strong> {selectedRequest.currentClockIn}</p>
                    <p><strong>Current Clock Out:</strong> {selectedRequest.currentClockOut || 'N/A'}</p>
                  </>
                )}
                {selectedRequest.requestedClockIn && (
                  <>
                    <p><strong>Requested Clock In:</strong> {selectedRequest.requestedClockIn}</p>
                    <p><strong>Requested Clock Out:</strong> {selectedRequest.requestedClockOut || 'N/A'}</p>
                  </>
                )}
                <p><strong>Reason:</strong></p>
                <p className="reason-detail">{selectedRequest.reason}</p>
              </div>

              {selectedRequest.status === 'pending' && (
                <div className="modal-section">
                  <h3>Resolution</h3>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Enter resolution details (required)..."
                    rows="4"
                    className="resolution-textarea"
                  />

                  <h3>Admin Notes (Optional)</h3>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Internal notes (not visible to employee)..."
                    rows="3"
                    className="notes-textarea"
                  />

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={updateAttendance}
                      onChange={(e) => setUpdateAttendance(e.target.checked)}
                    />
                    Update attendance record automatically
                  </label>

                  <div className="modal-actions">
                    <button
                      className="btn btn-approve"
                      onClick={handleApprove}
                      disabled={actionLoading || !resolution.trim()}
                    >
                      {actionLoading ? 'Processing...' : '✅ Approve & Update Attendance'}
                    </button>
                    <button
                      className="btn btn-reject"
                      onClick={handleReject}
                      disabled={actionLoading || !resolution.trim()}
                    >
                      {actionLoading ? 'Processing...' : '❌ Reject Request'}
                    </button>
                  </div>
                </div>
              )}

              {selectedRequest.status !== 'pending' && (
                <div className="modal-section">
                  <h3>Resolution Details</h3>
                  <p><strong>Status:</strong> {selectedRequest.status}</p>
                  <p><strong>Resolved by:</strong> {selectedRequest.resolverName}</p>
                  <p><strong>Resolved at:</strong> {new Date(selectedRequest.resolvedAt).toLocaleString()}</p>
                  <p><strong>Resolution:</strong></p>
                  <p className="resolution-detail">{selectedRequest.resolution}</p>
                  {selectedRequest.adminNotes && (
                    <>
                      <p><strong>Admin Notes:</strong></p>
                      <p className="notes-detail">{selectedRequest.adminNotes}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorrectionRequestManagement;