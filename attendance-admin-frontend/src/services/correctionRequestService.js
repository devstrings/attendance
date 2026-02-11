import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

// Get all correction requests (Admin/Manager)
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

// Get overdue correction requests
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
  getAllCorrectionRequests,
  getOverdueRequests,
  getCorrectionRequestById,
  approveCorrectionRequest,
  rejectCorrectionRequest,
  updatePriority
};