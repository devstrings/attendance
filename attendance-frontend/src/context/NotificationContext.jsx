import React, { createContext, useState, useEffect, useContext } from 'react';
import { getUnreadCount, getMyNotifications } from '../services/notificationService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // ✅ FIXED: Get token based on current role
  const getToken = () => {
    const path = window.location.pathname;
    let currentRole = null;

    if (path.startsWith('/admin')) {
      currentRole = 'admin';
    } else if (path.startsWith('/manager')) {
      currentRole = 'manager';
    } else if (path.startsWith('/employee')) {
      currentRole = 'employee';
    }

    const tokenKey = currentRole ? `${currentRole}_token` : 'token';
    return localStorage.getItem(tokenKey);
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async (limit = 20, unreadOnly = false) => {
    setLoading(true);
    try {
      const response = await getMyNotifications(limit, unreadOnly);
      if (response.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshNotifications = async () => {
    await Promise.all([fetchUnreadCount(), fetchNotifications()]);
  };

  useEffect(() => {
    // ✅ FIXED: Use role-based token
    const token = getToken();
    
    if (token) {
      console.log('✅ Notification context initialized with token');
      fetchUnreadCount();
      fetchNotifications();

      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    } else {
      console.log('ℹ️ No token found, skipping notification fetch');
    }
  }, []); // Empty dependency array - only run once on mount

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

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export default NotificationContext;