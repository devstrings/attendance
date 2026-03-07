// import React, { useState } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import '../../styles/Manager.css';

// const ManagerSidebar = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [collapsed, setCollapsed] = useState(false);

//   // ✅ Manager menu items
//   const menuItems = [
//     {
//       title: 'Dashboard',
//       icon: '🏠',
//       path: '/manager/dashboard',
//       color: 'blue'
//     },
//     {
//       title: 'Mark Attendance',
//       icon: '📝',
//       path: '/manager/mark-attendance',
//       color: 'green'
//     },
//     {
//       title: 'Clock In/Out',
//       icon: '⏰',
//       path: '/manager/clock-in-out',
//       color: 'teal'
//     },
//     {
//       title: 'My Employees',
//       icon: '👥',
//       path: '/manager/my-employees',
//       color: 'purple'
//     },
//     {
//       title: 'Attendance History',
//       icon: '📅',
//       path: '/manager/attendance-history', // ✅ FIXED: Correct path
//       color: 'orange'
//     }
//   ];

//   const isActive = (path) => {
//     // ✅ Check if current path starts with menu item path
//     return location.pathname === path || location.pathname.startsWith(path + '/');
//   };

//   const handleNavigation = (path) => {
//     console.log(`🔄 Navigating to: ${path}`);
//     navigate(path);
//   };

//   const toggleSidebar = () => {
//     setCollapsed(!collapsed);
//   };

//   return (
//     <aside className={`manager-sidebar ${collapsed ? 'collapsed' : ''}`}>
//       <div className="sidebar-toggle" onClick={toggleSidebar}>
//         {collapsed ? '→' : '←'}
//       </div>

//       <div className="sidebar-menu">
//         {menuItems.map((item, index) => (
//           <div key={index} className="menu-item-wrapper">
//             <div
//               className={`menu-item ${isActive(item.path) ? 'active' : ''} ${item.color}`}
//               onClick={() => handleNavigation(item.path)}
//             >
//               <span className="menu-icon">{item.icon}</span>
//               {!collapsed && (
//                 <span className="menu-title">{item.title}</span>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>

//       {!collapsed && (
//         <div className="sidebar-footer">
//           <div className="footer-info">
//             <p>Manager Panel v1.0</p>
//             <p className="footer-copyright">© 2025 Attendance System</p>
//           </div>
//         </div>
//       )}
//     </aside>
//   );
// };

// export default ManagerSidebar;





import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/Manager.css';

const ManagerSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('manager_sidebar_collapsed') === 'true'
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { title: 'Dashboard',          icon: '🏠', path: '/manager/dashboard' },
    { title: 'Mark Attendance',    icon: '📝', path: '/manager/mark-attendance' },
    { title: 'Clock In/Out',       icon: '⏰', path: '/manager/clock-in-out' },
    { title: 'My Employees',       icon: '👥', path: '/manager/my-employees' },
    { title: 'Attendance History', icon: '📅', path: '/manager/attendance-history' },
  ];

  // Sync collapsed state to DOM — all pages will read this
  useEffect(() => {
    localStorage.setItem('manager_sidebar_collapsed', collapsed);
    // Add/remove class on body so any page's content div can react
    if (collapsed) {
      document.body.setAttribute('data-sidebar', 'collapsed');
    } else {
      document.body.setAttribute('data-sidebar', 'expanded');
    }
  }, [collapsed]);

  // On mount, set initial body attribute
  useEffect(() => {
    const isCollapsed = localStorage.getItem('manager_sidebar_collapsed') === 'true';
    document.body.setAttribute('data-sidebar', isCollapsed ? 'collapsed' : 'expanded');
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth <= 768) setMobileOpen(false);
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
      <div
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>

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

        <div className="sidebar-menu">
          {menuItems.map((item, index) => (
            <div key={index} className="menu-item-wrapper">
              <div
                className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
                title={collapsed ? item.title : ''}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-text">{item.title}</span>
              </div>
            </div>
          ))}
        </div>

        {!collapsed && (
          <div className="sidebar-footer">
            <div className="footer-info">
              <div className="footer-version">Manager Panel v1.0</div>
              <div className="footer-copyright">© 2025 Attendance System</div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default ManagerSidebar;