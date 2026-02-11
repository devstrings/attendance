import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// ✅ FIXED: Get token based on current role
const getAuthHeader = () => {
  // Check which role is logged in by checking URL or localStorage
  const path = window.location.pathname;
  let currentRole = null;

  if (path.startsWith('/admin')) {
    currentRole = 'admin';
  } else if (path.startsWith('/manager')) {
    currentRole = 'manager';
  } else if (path.startsWith('/employee')) {
    currentRole = 'employee';
  }

  // Get token for current role
  const tokenKey = currentRole ? `${currentRole}_token` : 'token';
  const token = localStorage.getItem(tokenKey);

  console.log('🔑 Using token from:', tokenKey, '| Token exists:', !!token);

  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get leave policy and employee balance
export const getLeavePolicy = async () => {
  try {
    console.log('📡 Fetching leave policy...');
    const response = await axios.get(
      `${API_URL}/leave-requests/policy`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Leave policy error:', error.response?.data || error);
    throw error.response?.data || error;
  }
};

// Create leave request
export const createLeaveRequest = async (leaveData) => {
  try {
    console.log('📡 Creating leave request:', leaveData);
    const response = await axios.post(
      `${API_URL}/leave-requests`,
      leaveData,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Create leave request error:', error.response?.data || error);
    throw error.response?.data || error;
  }
};

// Get my leave requests
export const getMyLeaveRequests = async (status = null, year = null) => {
  try {
    console.log('📡 Fetching my leave requests...');
    const response = await axios.get(
      `${API_URL}/leave-requests/my-requests`,
      {
        headers: getAuthHeader(),
        params: { status, year }
      }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Get my leave requests error:', error.response?.data || error);
    throw error.response?.data || error;
  }
};

// Get all leave requests (Admin/Manager)
export const getAllLeaveRequests = async (status = null, employeeId = null, page = 1, limit = 20) => {
  try {
    console.log('📡 Fetching all leave requests...');
    const response = await axios.get(
      `${API_URL}/leave-requests`,
      {
        headers: getAuthHeader(),
        params: { status, employeeId, page, limit }
      }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Get all leave requests error:', error.response?.data || error);
    throw error.response?.data || error;
  }
};

// Get leave request by ID
export const getLeaveRequestById = async (requestId) => {
  try {
    console.log('📡 Fetching leave request:', requestId);
    const response = await axios.get(
      `${API_URL}/leave-requests/${requestId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Get leave request error:', error.response?.data || error);
    throw error.response?.data || error;
  }
};

// Approve leave request (Admin/Manager)
export const approveLeaveRequest = async (requestId) => {
  try {
    console.log('📡 Approving leave request:', requestId);
    const response = await axios.patch(
      `${API_URL}/leave-requests/${requestId}/approve`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Approve leave request error:', error.response?.data || error);
    throw error.response?.data || error;
  }
};

// Reject leave request (Admin/Manager)
export const rejectLeaveRequest = async (requestId, rejectionReason) => {
  try {
    console.log('📡 Rejecting leave request:', requestId);
    const response = await axios.patch(
      `${API_URL}/leave-requests/${requestId}/reject`,
      { rejectionReason },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Reject leave request error:', error.response?.data || error);
    throw error.response?.data || error;
  }
};

// Cancel leave request (Employee)
export const cancelLeaveRequest = async (requestId) => {
  try {
    console.log('📡 Cancelling leave request:', requestId);
    const response = await axios.patch(
      `${API_URL}/leave-requests/${requestId}/cancel`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Cancel leave request error:', error.response?.data || error);
    throw error.response?.data || error;
  }
};

// Add comment to leave request
export const addComment = async (requestId, text) => {
  try {
    console.log('📡 Adding comment to leave request:', requestId);
    const response = await axios.post(
      `${API_URL}/leave-requests/${requestId}/comment`,
      { text },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Add comment error:', error.response?.data || error);
    throw error.response?.data || error;
  }
};

export default {
  getLeavePolicy,
  createLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  getLeaveRequestById,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  addComment
};