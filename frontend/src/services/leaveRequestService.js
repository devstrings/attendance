/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars, import/no-anonymous-default-export, jsx-a11y/anchor-is-valid */
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// ✅ Get token properly
const getAuthHeader = () => {
  const roles = ['employee', 'manager', 'admin'];
  for (const role of roles) {
    const token = localStorage.getItem(`${role}_token`);
    if (token) return { Authorization: `Bearer ${token}` };
  }
  const token = localStorage.getItem('token');
  if (token) return { Authorization: `Bearer ${token}` };
  console.error('❌ NO TOKEN FOUND!');
  return {};
};

// ✅ Get leave policy
export const getLeavePolicy = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/leave-requests/policy`,  // ✅ FIXED: /leave-requests/policy
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Get leave policy error:', error);
    throw error.response?.data || { message: error.message };
  }
};

// ✅ Create leave request
export const createLeaveRequest = async (leaveData) => {
  try {
    console.log('📤 Creating leave request:', leaveData);
    const response = await axios.post(
      `${API_URL}/leave-requests`,  // ✅ FIXED: /leave-requests
      leaveData,
      { headers: getAuthHeader() }
    );
    console.log('✅ Leave request created:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Create leave request error:', error);
    throw error.response?.data || { message: error.message };
  }
};

// ✅ Get my leave requests (Employee)
export const getMyLeaveRequests = async (status = null, year = null) => {
  try {
    console.log('📡 Fetching my leave requests - Status:', status);
    const response = await axios.get(
      `${API_URL}/leave-requests/my-requests`,  // ✅ FIXED: /leave-requests/my-requests
      {
        headers: getAuthHeader(),
        params: { status, year }
      }
    );
    console.log('✅ My leave requests:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Get my leave requests error:', error);
    throw error.response?.data || { message: error.message };
  }
};

// ✅ Cancel leave request
export const cancelLeaveRequest = async (requestId) => {
  try {
    console.log('📤 Cancelling leave request:', requestId);
    const response = await axios.patch(
      `${API_URL}/leave-requests/${requestId}/cancel`,  // ✅ FIXED: PATCH /leave-requests/:id/cancel
      {},
      { headers: getAuthHeader() }
    );
    console.log('✅ Leave request cancelled:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Cancel leave request error:', error);
    throw error.response?.data || { message: error.message };
  }
};

// ✅ Get ALL leave requests (Admin/Manager)
export const getAllLeaveRequests = async (status = null, employeeId = null, page = 1, limit = 20) => {
  try {
    console.log('📡 Fetching all leave requests - Status:', status);
    const response = await axios.get(
      `${API_URL}/leave-requests`,  // ✅ FIXED: /leave-requests
      {
        headers: getAuthHeader(),
        params: { status, employeeId, page, limit }
      }
    );
    console.log('✅ All leave requests:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Get all leave requests error:', error);
    throw error.response?.data || error;
  }
};

// ✅ Get leave request by ID
export const getLeaveRequestById = async (requestId) => {
  try {
    const response = await axios.get(
      `${API_URL}/leave-requests/${requestId}`,  // ✅ FIXED: /leave-requests/:id
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Get leave request by ID error:', error);
    throw error.response?.data || error;
  }
};

// ✅ Approve leave request
export const approveLeaveRequest = async (requestId) => {
  try {
    console.log('📤 Approving leave request:', requestId);
    const response = await axios.patch(
      `${API_URL}/leave-requests/${requestId}/approve`,  // ✅ FIXED: PATCH /leave-requests/:id/approve
      {},
      { headers: getAuthHeader() }
    );
    console.log('✅ Leave request approved:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Approve leave request error:', error);
    throw error.response?.data || error;
  }
};

// ✅ Reject leave request
export const rejectLeaveRequest = async (requestId, rejectionReason) => {
  try {
    console.log('📤 Rejecting leave request:', requestId);
    const response = await axios.patch(
      `${API_URL}/leave-requests/${requestId}/reject`,  // ✅ FIXED: PATCH /leave-requests/:id/reject
      { rejectionReason },
      { headers: getAuthHeader() }
    );
    console.log('✅ Leave request rejected:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Reject leave request error:', error);
    throw error.response?.data || error;
  }
};

// ✅ Add comment
export const addComment = async (requestId, text) => {
  try {
    const response = await axios.post(
      `${API_URL}/leave-requests/${requestId}/comment`,  // ✅ FIXED: /leave-requests/:id/comment
      { text },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Add comment error:', error);
    throw error.response?.data || error;
  }
};

export default {
  getLeavePolicy,
  createLeaveRequest,
  getMyLeaveRequests,
  cancelLeaveRequest,
  getAllLeaveRequests,
  getLeaveRequestById,
  approveLeaveRequest,
  rejectLeaveRequest,
  addComment
};
