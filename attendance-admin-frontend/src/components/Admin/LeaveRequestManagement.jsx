import React, { useState, useEffect } from 'react';
import { 
  getAllLeaveRequests, 
  approveLeaveRequest, 
  rejectLeaveRequest,
  addComment 
} from '../../services/leaveRequestService';
import { useNavigate } from 'react-router-dom';
import './../../styles/NotificationStyles.css';

const LeaveRequestManagement = () => {
  const [requests, setRequests] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await getAllLeaveRequests(filter === 'all' ? null : filter);
      if (response.success) {
        setRequests(response.data.leaveRequests);
        setPendingCount(response.data.pendingCount);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Are you sure you want to approve this leave request?')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await approveLeaveRequest(requestId);
      if (response.success) {
        alert('Leave request approved successfully');
        fetchRequests();
        setShowModal(false);
      }
    } catch (error) {
      alert(error.message || 'Failed to approve leave request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      const response = await rejectLeaveRequest(requestId, rejectionReason);
      if (response.success) {
        alert('Leave request rejected');
        setRejectionReason('');
        fetchRequests();
        setShowModal(false);
      }
    } catch (error) {
      alert(error.message || 'Failed to reject leave request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async (requestId) => {
    if (!comment.trim()) return;

    try {
      await addComment(requestId, comment);
      setComment('');
      alert('Comment added successfully');
      if (selectedRequest && selectedRequest._id === requestId) {
        // Refresh selected request
        const updated = requests.find(r => r._id === requestId);
        setSelectedRequest(updated);
      }
    } catch (error) {
      alert('Failed to add comment');
    }
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

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: '#f59e0b', text: 'Pending' },
      approved: { color: '#10b981', text: 'Approved' },
      rejected: { color: '#ef4444', text: 'Rejected' },
      cancelled: { color: '#6b7280', text: 'Cancelled' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className="status-badge" style={{ backgroundColor: badge.color }}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="leave-management-container">
      <div className="page-header">
        <h1>🏖️ Leave Request Management</h1>
        <div className="header-stats">
          <div className="stat-card pending">
            <span className="stat-number">{pendingCount}</span>
            <span className="stat-label">Pending Requests</span>
          </div>
        </div>
      </div>

      <div className="filter-section">
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

      {loading ? (
        <div className="loading-state">Loading leave requests...</div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <h3>No leave requests found</h3>
          <p>There are no {filter !== 'all' ? filter : ''} leave requests at the moment.</p>
        </div>
      ) : (
        <div className="requests-grid">
          {requests.map((request) => (
            <div key={request._id} className="request-card">
              <div className="request-header">
                <div className="employee-info">
                  <h3>{request.employeeName}</h3>
                  <span className="employee-email">{request.employeeEmail}</span>
                </div>
                {getStatusBadge(request.status)}
              </div>

              <div className="request-details">
                <div className="detail-row">
                  <span className="detail-label">Leave Type:</span>
                  <span 
                    className="leave-type-badge" 
                    style={{ backgroundColor: getLeaveTypeColor(request.leaveType) }}
                  >
                    {request.leaveType}
                  </span>
                </div>

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

                {request.status !== 'pending' && (
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
                      onClick={() => handleApprove(request._id)}
                      disabled={actionLoading}
                    >
                      ✅ Approve
                    </button>
                    <button
                      className="btn btn-reject"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowModal(true);
                      }}
                      disabled={actionLoading}
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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for detailed view */}
      {showModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Leave Request Details</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="modal-section">
                <h3>Employee Information</h3>
                <p><strong>Name:</strong> {selectedRequest.employeeName}</p>
                <p><strong>Email:</strong> {selectedRequest.employeeEmail}</p>
              </div>

              <div className="modal-section">
                <h3>Leave Details</h3>
                <p><strong>Type:</strong> {selectedRequest.leaveType}</p>
                <p><strong>From:</strong> {new Date(selectedRequest.fromDate).toLocaleDateString()}</p>
                <p><strong>To:</strong> {new Date(selectedRequest.toDate).toLocaleDateString()}</p>
                <p><strong>Duration:</strong> {selectedRequest.numberOfDays} day(s)</p>
                <p><strong>Reason:</strong> {selectedRequest.reason}</p>
              </div>

              {selectedRequest.status === 'pending' && (
                <div className="modal-section">
                  <h3>Reject Leave Request</h3>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter rejection reason..."
                    rows="4"
                    className="rejection-textarea"
                  />
                  <div className="modal-actions">
                    <button
                      className="btn btn-approve"
                      onClick={() => handleApprove(selectedRequest._id)}
                      disabled={actionLoading}
                    >
                      Approve Leave
                    </button>
                    <button
                      className="btn btn-reject"
                      onClick={() => handleReject(selectedRequest._id)}
                      disabled={actionLoading || !rejectionReason.trim()}
                    >
                      Reject with Reason
                    </button>
                  </div>
                </div>
              )}

              <div className="modal-section">
                <h3>Add Comment</h3>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows="3"
                  className="comment-textarea"
                />
                <button
                  className="btn btn-primary"
                  onClick={() => handleAddComment(selectedRequest._id)}
                  disabled={!comment.trim()}
                >
                  Add Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequestManagement;