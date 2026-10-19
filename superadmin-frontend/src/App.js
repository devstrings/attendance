import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import './App.css';

import Login from './components/SuperAdmin/Login';
import Dashboard from './components/SuperAdmin/Dashboard';
import AuditLogs from './components/SuperAdmin/AuditLogs';
import PlatformUsage from './components/SuperAdmin/PlatformUsage';
import Workers from './components/SuperAdmin/Workers';
import Shell from './components/SuperAdmin/Shell';
import ProtectedRoute from './components/Common/ProtectedRoute';
import { isAuthenticated } from './api';

function RootRedirect() {
  return <Navigate to={isAuthenticated() ? '/dashboard' : '/login'} replace />;
}

function NoAccess() {
  return (
    <Shell>
      <div style={{ textAlign: 'center', padding: 60 }}>
        <h2>Access nahi hai</h2>
        <p>Is page ki permission aap ke account ko nahi mili. Superadmin se rabta karein.</p>
        <Link to="/login">Login page pe jao</Link>
      </div>
    </Shell>
  );
}

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute permission="companies:view">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute permission="auditlogs:view">
              <AuditLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/platform-usage"
          element={
            <ProtectedRoute permission="usage:view">
              <PlatformUsage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workers"
          element={
            <ProtectedRoute superAdminOnly>
              <Workers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/no-access"
          element={
            <ProtectedRoute>
              <NoAccess />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </div>
  );
}

export default App;