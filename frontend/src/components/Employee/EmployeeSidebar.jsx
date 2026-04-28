// import React, { useState, useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import '../../styles/Employee.css';

// const EmployeeSidebar = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [collapsed, setCollapsed] = useState(false);
//   const [mobileOpen, setMobileOpen] = useState(false);

//   // Employee ke menu items
//   const menuItems = [
//     {
//       title: 'Dashboard',
//       icon: '🏠',
//       path: '/employee/dashboard',
//     },
//     {
//       title: 'My Attendance',
//       icon: '📝',
//       path: '/employee/my-attendance',
//     },
//     {
//       title: 'Attendance History',
//       icon: '📅',
//       path: '/employee/attendance-history',
//     },
//     {
//       title: 'Request Leave',
//       icon: '🏖️',
//       path: '/employee/request-leave',
//     },
//     {
//       title: 'Report Issue',
//       icon: '⚠️',
//       path: '/employee/report-issue',
//     },
//     {
//       title: 'My Requests',
//       icon: '📋',
//       path: '/employee/my-requests',
//     },
//     {
//       title: 'My Profile',
//       icon: '👤',
//       path: '/employee/profile',
//     }
//   ];

//   useEffect(() => {
//     const handleResize = () => {
//       if (window.innerWidth > 768) setMobileOpen(false);
//     };
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   useEffect(() => {
//     setMobileOpen(false);
//   }, [location.pathname]);

//   const isActive = (path) => location.pathname === path;

//   const handleNavigation = (path) => {
//     navigate(path);
//     if (window.innerWidth <= 768) setMobileOpen(false);
//   };

//   const toggleSidebar = () => {
//     if (window.innerWidth <= 768) {
//       setMobileOpen(!mobileOpen);
//     } else {
//       setCollapsed(!collapsed);
//     }
//   };

//   return (
//     <>
//       {/* Mobile Overlay */}
//       <div
//         className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
//         onClick={() => setMobileOpen(false)}
//       />

//       {/* Sidebar - Admin.css classes */}
//       <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>

//         {/* Toggle Button */}
//         <button
//           className="sidebar-toggle-btn"
//           onClick={toggleSidebar}
//           aria-label="Toggle Sidebar"
//         >
//           <span className="toggle-icon">
//             {collapsed ? (
//               <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
//                 <path d="M12 4l-8 8 8 8V4z" />
//               </svg>
//             ) : (
//               <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
//                 <path d="M8 4l8 8-8 8V4z" />
//               </svg>
//             )}
//           </span>
//         </button>

//         {/* Menu Items */}
//         <div className="sidebar-menu">
//           {menuItems.map((item, index) => (
//             <div key={index} className="menu-item-wrapper">
//               <div
//                 className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
//                 onClick={() => handleNavigation(item.path)}
//               >
//                 <span className="menu-icon">{item.icon}</span>
//                 <span className="menu-text">{item.title}</span>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Footer */}
//         {!collapsed && (
//           <div className="sidebar-footer">
//             <div className="footer-info">
//               <div className="footer-version">Employee Panel v1.0</div>
//               <div className="footer-copyright">© 2025 Attendance System</div>
//             </div>
//           </div>
//         )}
//       </aside>
//     </>
//   );
// };

// export default EmployeeSidebar;