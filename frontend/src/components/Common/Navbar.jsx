import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Common.css';

const Navbar = ({ userRole = 'guest', userName = 'User' }) => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const getRoleBadge = () => {
    switch (userRole) {
      case 'admin':
        return { icon: '👑', text: 'ADMIN', color: 'admin' };
      case 'manager':
        return { icon: '👔', text: 'MANAGER', color: 'manager' };
      case 'employee':
        return { icon: '👤', text: 'EMPLOYEE', color: 'employee' };
      default:
        return { icon: '👤', text: 'GUEST', color: 'guest' };
    }
  };

  const badge = getRoleBadge();

  return (
    <nav className="common-navbar">
      <div className="navbar-left">
        <div className="navbar-logo" onClick={() => navigate(`/${userRole}/dashboard`)}>
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
        <div className={`role-badge ${badge.color}`}>
          <span className="badge-icon">{badge.icon}</span>
          <span className="badge-text">{badge.text}</span>
        </div>

        <div className="user-profile" onClick={toggleDropdown}>
          <div className="profile-avatar">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="profile-name">{userName}</span>
          <span className="dropdown-arrow">▼</span>

          {showDropdown && (
            <div className="profile-dropdown">
              <div className="dropdown-item" onClick={() => navigate(`/${userRole}/dashboard`)}>
                <span>🏠</span> Dashboard
              </div>
              <div className="dropdown-item" onClick={() => navigate(`/${userRole}/profile`)}>
                <span>👤</span> Profile
              </div>
              {userRole === 'admin' && (
                <div className="dropdown-item" onClick={() => navigate('/admin/settings')}>
                  <span>⚙️</span> Settings
                </div>
              )}
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

export default Navbar;