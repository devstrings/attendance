import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentUser, clearAuthData } from '../../api';

function Shell({ children }) {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    clearAuthData();
    navigate('/login');
  };

  return (
    <div className="sa-shell">
      <header className="sa-header">
        <div className="sa-header-left">
          <div className="sa-logo-badge sa-logo-badge-sm">SA</div>
          <span className="sa-header-title">Super Admin</span>
          <nav className="sa-nav">
            <Link to="/dashboard" className="sa-nav-link">Companies</Link>
            <Link to="/audit-logs" className="sa-nav-link">Audit Logs</Link>
            <Link to="/platform-usage" className="sa-nav-link">Platform Usage</Link>
          </nav>
        </div>
        <div className="sa-header-right">
          <span className="sa-user-name">{user?.email}</span>
          <button className="sa-btn-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="sa-main">{children}</main>
    </div>
  );
}

export default Shell;
