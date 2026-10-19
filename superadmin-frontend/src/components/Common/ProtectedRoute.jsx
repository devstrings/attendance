import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getCurrentUser, hasPermission } from '../../api';

/**
 * Props:
 *  - superAdminOnly: true  → sirf superadmin andar aa sakta hai
 *  - permission: 'companies:view' → worker ke paas ye permission honi chahiye
 *  (dono na do to superadmin aur worker, dono andar aa sakte hain)
 */
function ProtectedRoute({ children, permission, superAdminOnly = false }) {
  const user = getCurrentUser();

  if (!isAuthenticated() || !user || !['superadmin', 'worker'].includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  if (superAdminOnly && user.role !== 'superadmin') {
    return <Navigate to="/no-access" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/no-access" replace />;
  }

  return children;
}

export default ProtectedRoute;