import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/Admin.css';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const menuItems = [
    {
      title: 'Dashboard',
      icon: '🏠',
      path: '/admin/dashboard',
      color: 'blue'
    },
    {
      title: 'Reports',
      icon: '📈',
      path: '/admin/reports',
      color: 'green'
    },
    {
      title: 'Employees',
      icon: '👥',
      path: '/admin/employees',
      color: 'purple',
      submenu: [
        { title: 'Employee List', icon: '📋', path: '/admin/employees' },
        { title: 'Create Employee', icon: '➕', path: '/admin/create-employee' }
      ]
    },
    {
      title: 'Management',
      icon: '👔',
      path: '/admin/managers',
      color: 'orange',
      submenu: [
        { title: 'Manager List', icon: '📋', path: '/admin/managers' },
        { title: 'Create Manager', icon: '➕', path: '/admin/create-manager' }
      ]
    },
    // ✅ UPDATED - Removed submenu, only "Attendance" goes to view page
    {
      title: 'Attendance',
      icon: '📅',
      path: '/admin/attendance-view',
      color: 'teal'
      // ✅ NO SUBMENU - Mark Attendance hataya, sirf View Attendance rahega
    },
    {
      title: 'Management Panel',
      icon: '⚙️',
      path: '/admin/management-panel',
      color: 'red'
    }
  ];

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleSubmenu = (index) => {
    setOpenSubmenu(openSubmenu === index ? null : index);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth <= 768) {
      setMobileOpen(false);
    }
  };

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Toggle Button */}
        <button 
          className="sidebar-toggle-btn" 
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <span className="toggle-icon">
            {collapsed ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M12 4l-8 8 8 8V4z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 4l8 8-8 8V4z"/>
              </svg>
            )}
          </span>
        </button>

        {/* Menu Items */}
        <div className="sidebar-menu">
          {menuItems.map((item, index) => (
            <div key={index} className="menu-item-wrapper">
              {/* Main Menu Item */}
              <div
                className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => {
                  if (item.submenu) {
                    toggleSubmenu(index);
                  } else {
                    handleNavigation(item.path);
                  }
                }}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-text">{item.title}</span>
                {item.submenu && !collapsed && (
                  <span className={`submenu-arrow ${openSubmenu === index ? 'open' : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M4 6l4 4 4-4H4z"/>
                    </svg>
                  </span>
                )}
              </div>

              {/* Submenu */}
              {item.submenu && openSubmenu === index && !collapsed && (
                <div className="submenu">
                  {item.submenu.map((subItem, subIndex) => (
                    <div
                      key={subIndex}
                      className={`submenu-item ${isActive(subItem.path) ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigation(subItem.path);
                      }}
                    >
                      <span className="submenu-icon">{subItem.icon}</span>
                      <span className="submenu-title">{subItem.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;