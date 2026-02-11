import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

// Get all leave requests (Admin/Manager)
export const getAllLeaveRequests = async (status = null, employeeId = null, page = 1, limit = 20) => {
  try {
    const response = await axios.get(
      `${API_URL}/leave-requests`,
      {
        headers: getAuthHeader(),
        params: { status, employeeId, page, limit }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get leave request by ID
export const getLeaveRequestById = async (requestId) => {
  try {
    const response = await axios.get(
      `${API_URL}/leave-requests/${requestId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Approve leave request
export const approveLeaveRequest = async (requestId) => {
  try {
    const response = await axios.patch(
      `${API_URL}/leave-requests/${requestId}/approve`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Reject leave request
export const rejectLeaveRequest = async (requestId, rejectionReason) => {
  try {
    const response = await axios.patch(
      `${API_URL}/leave-requests/${requestId}/reject`,
      { rejectionReason },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Add comment to leave request
export const addComment = async (requestId, text) => {
  try {
    const response = await axios.post(
      `${API_URL}/leave-requests/${requestId}/comment`,
      { text },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  getAllLeaveRequests,
  getLeaveRequestById,
  approveLeaveRequest,
  rejectLeaveRequest,
  addComment
};