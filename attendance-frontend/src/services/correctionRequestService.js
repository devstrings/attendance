import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

// Employee: Create correction request
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

// Employee: Get my correction requests
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

export default {
  createCorrectionRequest,
  getMyCorrectionRequests,
  getCorrectionRequestById
};