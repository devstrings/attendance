import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/Manager.css';

const ManagerSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // ✅ Manager menu items
  const menuItems = [
    {
      title: 'Dashboard',
      icon: '🏠',
      path: '/manager/dashboard',
      color: 'blue'
    },
    {
      title: 'Mark Attendance',
      icon: '📝',
      path: '/manager/mark-attendance',
      color: 'green'
    },
    {
      title: 'Clock In/Out',
      icon: '⏰',
      path: '/manager/clock-in-out',
      color: 'teal'
    },
    {
      title: 'My Employees',
      icon: '👥',
      path: '/manager/my-employees',
      color: 'purple'
    },
    {
      title: 'Attendance History',
      icon: '📅',
      path: '/manager/attendance-history', // ✅ FIXED: Correct path
      color: 'orange'
    }
  ];

  const isActive = (path) => {
    // ✅ Check if current path starts with menu item path
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleNavigation = (path) => {
    console.log(`🔄 Navigating to: ${path}`);
    navigate(path);
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <aside className={`manager-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-toggle" onClick={toggleSidebar}>
        {collapsed ? '→' : '←'}
      </div>

      <div className="sidebar-menu">
        {menuItems.map((item, index) => (
          <div key={index} className="menu-item-wrapper">
            <div
              className={`menu-item ${isActive(item.path) ? 'active' : ''} ${item.color}`}
              onClick={() => handleNavigation(item.path)}
            >
              <span className="menu-icon">{item.icon}</span>
              {!collapsed && (
                <span className="menu-title">{item.title}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {!collapsed && (
        <div className="sidebar-footer">
          <div className="footer-info">
            <p>Manager Panel v1.0</p>
            <p className="footer-copyright">© 2025 Attendance System</p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default ManagerSidebar;