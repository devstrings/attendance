import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// ✅ Get token properly
const getAuthHeader = () => {
  // Try role-specific tokens first
  const roles = ['employee', 'manager', 'admin'];
  
  for (const role of roles) {
    const token = localStorage.getItem(`${role}_token`);
    if (token) {
      console.log(`🔑 Using ${role} token`);
      return { Authorization: `Bearer ${token}` };
    }
  }
  
  // Fallback to generic token
  const token = localStorage.getItem('token');
  if (token) {
    console.log('🔑 Using generic token');
    return { Authorization: `Bearer ${token}` };
  }
  
  console.error('❌ NO TOKEN FOUND!');
  return {};
};

// ✅ Get leave policy
export const getLeavePolicy = async () => {
  try {
    console.log('📡 Fetching leave policy...');
    const headers = getAuthHeader();
    console.log('📡 Request URL:', `${API_URL}/leave-requests/policy`);
    console.log('📡 Headers:', headers);
    
    const response = await axios.get(
      `${API_URL}/leave-requests/policy`,
      { headers }
    );
    
    console.log('✅ Policy response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Policy error:', error.response?.data || error);
    throw error.response?.data || { message: error.message };
  }
};

// ✅ Create leave request
export const createLeaveRequest = async (leaveData) => {
  try {
    console.log('📡 Creating leave request:', leaveData);
    const response = await axios.post(
      `${API_URL}/leave-requests`,
      leaveData,
      { headers: getAuthHeader() }
    );
    console.log('✅ Leave created:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Create error:', error.response?.data || error);
    throw error.response?.data || { message: error.message };
  }
};

// ✅ Get my leave requests
export const getMyLeaveRequests = async (status = null, year = null) => {
  try {
    console.log('📡 Fetching my requests...');
    const response = await axios.get(
      `${API_URL}/leave-requests/my-requests`,
      {
        headers: getAuthHeader(),
        params: { status, year }
      }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Get requests error:', error.response?.data || error);
    throw error.response?.data || { message: error.message };
  }
};

// ✅ Cancel leave request
export const cancelLeaveRequest = async (requestId) => {
  try {
    const response = await axios.patch(
      `${API_URL}/leave-requests/${requestId}/cancel`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

// ✅ Admin functions
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