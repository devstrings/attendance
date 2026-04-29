import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Admin.css';
import NotificationCenter from './NotificationCenter';
import TokenExpiryWatcher from "../Common/TokenExpiryWatcher";


const AdminNavbar = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(false);
  const [adminName, setAdminName] = useState('Admin User');
const [user, setUser] = useState(null);
const [profilePic, setProfilePic] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // ✅ Naam aur pic load karo — function banao taake reuse ho sake
    const loadUserData = () => {
      const storedUser = localStorage.getItem('admin_user') || localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setAdminName(
            parsedUser.name ||
            (parsedUser.firstName && parsedUser.lastName
              ? `${parsedUser.firstName} ${parsedUser.lastName}`
              : null) ||
            parsedUser.email?.split('@')[0] ||
            'Admin'
          );
        } catch(e) {}
      }
      const pic = localStorage.getItem("admin_profile_pic");
      setProfilePic(pic || null);
    };

    loadUserData();

    // ✅ localStorage changes sun-o — dusri tab ya settings update se sync ho
    window.addEventListener('storage', loadUserData);

    return () => {
      clearInterval(timer);
      window.removeEventListener('storage', loadUserData);
    };
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
  // ✅ Admin ka data clear karo
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  sessionStorage.clear();
  console.log('🚪 Admin logged out');
  // ✅ Admin login page pe bhejo
  navigate('/admin/login');
};

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <>
    <TokenExpiryWatcher role="manager" />
    <nav className="admin-navbar">
      <div className="navbar-left">
        <div className="navbar-logo" onClick={() => navigate('/admin/dashboard')}>
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
        <div className="admin-badge">
          <span className="badge-icon">👑</span>
          <span className="badge-text">ADMIN</span>
        </div>

        <div style={{ marginRight: '8px' }}>
  <NotificationCenter />
</div>

        <div className="user-profile" onClick={toggleDropdown}>
          <div className="profile-avatar" style={{ overflow: 'hidden', padding: 0 }}>
  {profilePic
    ? <img src={profilePic} alt="pic"
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
    : adminName.charAt(0).toUpperCase()
  }
</div>
          <span className="profile-name">{adminName}</span>
          <span className="dropdown-arrow">▼</span>

          {showDropdown && (
            <div className="profile-dropdown">
              <div className="dropdown-item" onClick={() => navigate('/admin/settings')}>
                ⚙️ Settings
              </div>
              <div className="dropdown-item" onClick={() => navigate('/admin/profile')}>
                👤 My Profile
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item logout" onClick={handleLogout}>
                🚪 Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
    </>
  );
};

export default AdminNavbar;
