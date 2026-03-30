import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const getAuthHeader = () => {
  // Works for both employee and manager tokens
  const token =
    localStorage.getItem('employee_token') ||
    localStorage.getItem('manager_token') ||
    localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

// ✅ Employee: Create correction request
export const createCorrectionRequest = async (data) => {
  try {
    const response = await axios.post(
      `${API_URL}/correction-requests`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ✅ Employee: Get my correction requests
export const getMyCorrectionRequests = async (status = null) => {
  try {
    const response = await axios.get(
      `${API_URL}/correction-requests/my-requests`,
      {
        headers: getAuthHeader(),
        params: { status }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Admin/Manager: Get all correction requests
export const getAllCorrectionRequests = async (status = null, employeeId = null, priority = null, page = 1, limit = 20) => {
  try {
    const response = await axios.get(
      `${API_URL}/correction-requests`,
      {
        headers: getAuthHeader(),
        params: { status, employeeId, priority, page, limit }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Admin/Manager: Get overdue correction requests
export const getOverdueRequests = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/correction-requests/admin/overdue`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get correction request by ID
export const getCorrectionRequestById = async (requestId) => {
  try {
    const response = await axios.get(
      `${API_URL}/correction-requests/${requestId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Approve correction request
export const approveCorrectionRequest = async (requestId, resolution, adminNotes, updateAttendance = true) => {
  try {
    const response = await axios.patch(
      `${API_URL}/correction-requests/${requestId}/approve`,
      { resolution, adminNotes, updateAttendance },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Reject correction request
export const rejectCorrectionRequest = async (requestId, resolution, adminNotes) => {
  try {
    const response = await axios.patch(
      `${API_URL}/correction-requests/${requestId}/reject`,
      { resolution, adminNotes },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update priority
export const updatePriority = async (requestId, priority) => {
  try {
    const response = await axios.patch(
      `${API_URL}/correction-requests/${requestId}/priority`,
      { priority },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  createCorrectionRequest,
  getMyCorrectionRequests,
  getAllCorrectionRequests,
  getOverdueRequests,
  getCorrectionRequestById,
  approveCorrectionRequest,
  rejectCorrectionRequest,
  updatePriority
};