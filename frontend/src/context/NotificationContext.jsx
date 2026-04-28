import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMyNotifications, getUnreadCount } from '../services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // ✅ Check if user is logged in (any role)
  const isLoggedIn = () => {
    return (
      localStorage.getItem('manager_token') ||
      localStorage.getItem('employee_token') ||
      localStorage.getItem('token')
    );
  };

  // ✅ Fetch notifications list
  const fetchNotifications = useCallback(async (limit = 20, unreadOnly = false) => {
    if (!isLoggedIn()) return;
    try {
      setLoading(true);
      const response = await getMyNotifications(limit, unreadOnly);
      if (response.success) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Fetch unread count only (lightweight)
  const fetchUnreadCount = useCallback(async () => {
    if (!isLoggedIn()) return;
    try {
      const response = await getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      setUnreadCount(0);
    }
  }, []);

  // ✅ Refresh both
  const refreshNotifications = useCallback(async () => {
    await Promise.all([
      fetchNotifications(20, false),
      fetchUnreadCount()
    ]);
  }, [fetchNotifications, fetchUnreadCount]);

  // ✅ Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isLoggedIn()) return;

    fetchUnreadCount(); // Initial load

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    refreshNotifications,
    setUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;