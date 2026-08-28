import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Login from './components/SuperAdmin/Login';
import Dashboard from './components/SuperAdmin/Dashboard';
import AuditLogs from './components/SuperAdmin/AuditLogs';
import PlatformUsage from './components/SuperAdmin/PlatformUsage';
import ProtectedRoute from './components/Common/ProtectedRoute';
import { isAuthenticated } from './api';

function RootRedirect() {
  return <Navigate to={isAuthenticated() ? '/dashboard' : '/login'} replace />;
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
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute>
              <AuditLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/platform-usage"
          element={
            <ProtectedRoute>
              <PlatformUsage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </div>
  );
}

export default App;
