import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationCenter from '../Common/NotificationCenter';
import '../../styles/Manager.css';
import TokenExpiryWatcher from "../Common/TokenExpiryWatcher";

const ManagerNavbar = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(false);
  const [managerName, setManagerName] = useState('Manager User');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const storedUser = localStorage.getItem('manager_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setManagerName(user.name || user.firstName || 'Manager User');
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('manager_token');
    localStorage.removeItem('manager_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    console.log('🚪 Manager logged out');
    navigate('/', { replace: true });
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <>
    <TokenExpiryWatcher role="manager" />
    <nav className="admin-navbar">
      <div className="navbar-left">
        <div className="navbar-logo" onClick={() => navigate('/manager/dashboard')}>
          <span className="logo-icon">📊</span>
          <span className="logo-text">Attendance System</span>
        </div>
      </div>

      <div className="navbar-center">
        <div className="datetime-display">
          <div className="current-time">{formatTime(currentTime)}</div>
          <div className="current-date">{formatDate(currentTime)}</div>
        </div>
      </div>

      <div className="navbar-right">
        {/* Manager Badge - Admin badge style mein */}
        <div className="admin-badge" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }}>
          <span className="badge-icon">👔</span>
          <span>MANAGER</span>
        </div>

        {/* Notification Bell */}
        <div style={{ marginRight: '8px' }}>
          <NotificationCenter userType="manager" />
        </div>

        {/* User Profile Dropdown */}
        <div className="user-profile" onClick={toggleDropdown}>
          <div className="profile-avatar">
            {managerName.charAt(0).toUpperCase()}
          </div>
          <span className="profile-name">{managerName}</span>
          <span className="dropdown-arrow">▼</span>

          {showDropdown && (
            <div className="profile-dropdown">
              <div className="dropdown-item" onClick={() => navigate('/manager/profile')}>
                <span>👤</span> My Profile
              </div>
              <div className="dropdown-item" onClick={() => navigate('/manager/mark-attendance')}>
                <span>📝</span> Mark Attendance
              </div>
              <div className="dropdown-item" onClick={() => navigate('/manager/my-employees')}>
                <span>👥</span> My Employees
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item logout" onClick={handleLogout}>
                <span>🚪</span> Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
    </>
  );
};

export default ManagerNavbar;