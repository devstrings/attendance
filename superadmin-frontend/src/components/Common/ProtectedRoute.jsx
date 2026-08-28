import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from '../../api';

function ProtectedRoute({ children }) {
  const user = getCurrentUser();

  if (!isAuthenticated() || user?.role !== 'superadmin') {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
