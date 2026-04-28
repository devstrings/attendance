/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars, import/no-anonymous-default-export, jsx-a11y/anchor-is-valid */
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

// Get SMTP settings
export const getSmtpSettings = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/smtp-settings`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Save SMTP settings
export const saveSmtpSettings = async (settings) => {
  try {
    const response = await axios.post(
      `${API_URL}/smtp-settings`,
      settings,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Test SMTP connection
export const testSmtpConnection = async () => {
  try {
    const response = await axios.post(
      `${API_URL}/smtp-settings/test-connection`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Send test email
export const sendTestEmail = async (recipientEmail) => {
  try {
    const response = await axios.post(
      `${API_URL}/smtp-settings/send-test`,
      { recipientEmail },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get SMTP status
export const getSmtpStatus = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/smtp-settings/status`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Toggle notification type
export const toggleNotificationType = async (notificationType, enabled) => {
  try {
    const response = await axios.patch(
      `${API_URL}/smtp-settings/toggle-notification`,
      { notificationType, enabled },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Delete SMTP settings
export const deleteSmtpSettings = async () => {
  try {
    const response = await axios.delete(
      `${API_URL}/smtp-settings`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  getSmtpSettings,
  saveSmtpSettings,
  testSmtpConnection,
  sendTestEmail,
  getSmtpStatus,
  toggleNotificationType,
  deleteSmtpSettings
};
