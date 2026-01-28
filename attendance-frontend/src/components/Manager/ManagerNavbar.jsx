import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Manager.css';

const ManagerNavbar = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(false);
  const [managerName, setManagerName] = useState('Manager User');

  useEffect(() => {
    // Current time update
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // ✅ FIXED: Get manager-specific user data
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
    console.log('🚪 Logging out manager...');
    
    // ✅ FIXED: Clear manager-specific storage
    localStorage.removeItem('manager_token');
    localStorage.removeItem('manager_user');
    
    console.log('✅ Manager session cleared');
    console.log('🔄 Redirecting to landing page...');
    
    // ✅ FIXED: Redirect to landing page instead of /login
    navigate('/', { replace: true });
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <nav className="manager-navbar">
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
        <div className="manager-badge">
          <span className="badge-icon">👔</span>
          <span className="badge-text">MANAGER</span>
        </div>

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
              <div className="dropdown-divider"></div>
              <div className="dropdown-item logout" onClick={handleLogout}>
                <span>🚪</span> Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default ManagerNavbar;