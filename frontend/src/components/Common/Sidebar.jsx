import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/Common.css';

const Sidebar = ({ menuItems = [], userRole = 'guest' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleSubmenu = (index) => {
    setOpenSubmenu(openSubmenu === index ? null : index);
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <aside className={`common-sidebar ${collapsed ? 'collapsed' : ''} ${userRole}`}>
      <div className="sidebar-toggle" onClick={toggleSidebar}>
        {collapsed ? '→' : '←'}
      </div>

      <div className="sidebar-menu">
        {menuItems.map((item, index) => (
          <div key={index} className="menu-item-wrapper">
            <div
              className={`menu-item ${isActive(item.path) ? 'active' : ''} ${item.color || 'default'}`}
              onClick={() => {
                if (item.submenu) {
                  toggleSubmenu(index);
                } else {
                  handleNavigation(item.path);
                }
              }}
            >
              <span className="menu-icon">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="menu-title">{item.title}</span>
                  {item.submenu && (
                    <span className="submenu-arrow">
                      {openSubmenu === index ? '▼' : '▶'}
                    </span>
                  )}
                </>
              )}
            </div>

            {!collapsed && item.submenu && openSubmenu === index && (
              <div className="submenu">
                {item.submenu.map((subItem, subIndex) => (
                  <div
                    key={subIndex}
                    className={`submenu-item ${isActive(subItem.path) ? 'active' : ''}`}
                    onClick={() => handleNavigation(subItem.path)}
                  >
                    <span className="submenu-dot">•</span>
                    <span className="submenu-title">{subItem.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {!collapsed && (
        <div className="sidebar-footer">
          <div className="footer-info">
            <p>{userRole.charAt(0).toUpperCase() + userRole.slice(1)} Panel v1.0</p>
            <p className="footer-copyright">© 2025 Attendance System</p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;