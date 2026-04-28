/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars, import/no-anonymous-default-export, jsx-a11y/anchor-is-valid */
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const getAuthHeader = () => {
  const token =
    localStorage.getItem('employee_token') ||
    localStorage.getItem('manager_token') ||
    localStorage.getItem('admin_token') ||
    localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

// ─── Employee ─────────────────────────────────────────────────────────────────

export const createCorrectionRequest = async (requestData) => {
  try {
    const response = await axios.post(
      `${API_URL}/correction-requests`,
      requestData,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMyCorrectionRequests = async (status = null) => {
  try {
    const response = await axios.get(
      `${API_URL}/correction-requests/my-requests`,
      { headers: getAuthHeader(), params: { status } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

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

// ─── Admin/Manager ────────────────────────────────────────────────────────────

export const getAllCorrectionRequests = async (status = null, employeeId = null, priority = null, page = 1, limit = 20) => {
  try {
    const response = await axios.get(
      `${API_URL}/correction-requests`,
      { headers: getAuthHeader(), params: { status, employeeId, priority, page, limit } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

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
  getCorrectionRequestById,
  getAllCorrectionRequests,
  getOverdueRequests,
  approveCorrectionRequest,
  rejectCorrectionRequest,
  updatePriority,
};
