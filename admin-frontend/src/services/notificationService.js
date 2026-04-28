/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars, import/no-anonymous-default-export, jsx-a11y/anchor-is-valid */
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// ✅ Admin-specific token
const getAuthHeader = () => {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

// ===== Get my notifications =====
export const getMyNotifications = async (limit = 20, unreadOnly = false) => {
  try {
    const response = await axios.get(
      `${API_URL}/notifications/my-notifications`,
      {
        headers: getAuthHeader(),
        params: { limit, unreadOnly }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ===== Get unread count =====
export const getUnreadCount = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/notifications/unread-count`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ===== Mark as read =====
export const markAsRead = async (notificationId) => {
  try {
    const response = await axios.patch(
      `${API_URL}/notifications/${notificationId}/read`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ===== Mark all as read =====
export const markAllAsRead = async () => {
  try {
    const response = await axios.patch(
      `${API_URL}/notifications/mark-all-read`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ===== Delete notification =====
export const deleteNotification = async (notificationId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/notifications/${notificationId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ===== Get ALL notifications (admin view) =====
export const getAllNotifications = async (page = 1, limit = 50, type = null, isRead = null) => {
  try {
    const response = await axios.get(
      `${API_URL}/notifications/admin/all`,
      {
        headers: getAuthHeader(),
        params: { page, limit, type, isRead }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ===== Send Broadcast =====
// ✅ FIX: response.data.count properly handled
export const sendBroadcast = async (updateType, updateDetails, affectedUsers = 'all') => {
  try {
    const response = await axios.post(
      `${API_URL}/notifications/admin/broadcast`,
      { updateType, updateDetails, affectedUsers },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ===== Delete Broadcast (bulk delete by IDs) =====
export const deleteBroadcast = async (ids) => {
  try {
    const response = await axios.delete(
      `${API_URL}/notifications/admin/broadcast/bulk`,
      {
        headers: getAuthHeader(),
        data: { ids }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getAllNotifications,
  sendBroadcast,
  deleteBroadcast
};
