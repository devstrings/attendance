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

  // Fetch notifications
  const fetchNotifications = useCallback(async (limit = 20, unreadOnly = false) => {
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

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.unreadCount || 0);
        console.log('🔔 Unread notifications:', response.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      setUnreadCount(0);
    }
  }, []);

  // Refresh all
  const refreshNotifications = useCallback(async () => {
    await Promise.all([
      fetchNotifications(20, false),
      fetchUnreadCount()
    ]);
  }, [fetchNotifications, fetchUnreadCount]);

  const broadcastRefresh = useCallback(() => {
  // Custom event fire karo — NotificationHistory sun-ga
  window.dispatchEvent(new CustomEvent('requests-updated'));
  refreshNotifications();
}, [refreshNotifications]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchUnreadCount(); // Initial fetch
    
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
     refreshNotifications,   // ✅ comma add karo
    broadcastRefresh
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};