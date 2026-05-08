import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/Admin.css';
import { useSidebar } from '../../context/SidebarContext';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, mobileOpen, closeMobile } = useSidebar();
  const [openSubmenu, setOpenSubmenu] = React.useState(null);

  const menuItems = [
    { title: 'Dashboard', icon: '🏠', path: '/admin/dashboard' },
    { title: 'Reports', icon: '📈', path: '/admin/reports' },
    {
      title: 'Employees', icon: '👥', path: '/admin/employees',
      submenu: [
        { title: 'Employee List', icon: '📋', path: '/admin/employees' },
        { title: 'Create Employee', icon: '➕', path: '/admin/create-employee' }
      ]
    },
    {
      title: 'Management', icon: '👔', path: '/admin/managers',
      submenu: [
        { title: 'Manager List', icon: '📋', path: '/admin/managers' },
        { title: 'Create Manager', icon: '➕', path: '/admin/create-manager' }
      ]
    },
    { title: 'Attendance', icon: '📅', path: '/admin/attendance-view' },
    { title: 'Overtime & Corrections', icon: '⏱️', path: '/admin/overtime' },
    { title: 'Management Panel', icon: '⚙️', path: '/admin/management-panel' }
  ];

  useEffect(() => {
    closeMobile();
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  const toggleSubmenu = (index) => {
    setOpenSubmenu(openSubmenu === index ? null : index);
  };

  const handleNavigation = (path) => {
    navigate(path);
    closeMobile();
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={closeMobile}
      />

      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-menu">
          {menuItems.map((item, index) => (
            <div key={index} className="menu-item-wrapper">
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