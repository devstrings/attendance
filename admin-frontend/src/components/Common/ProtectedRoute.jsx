/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars, import/no-anonymous-default-export, jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [authStatus, setAuthStatus] = useState({
    isAuthenticated: false,
    hasAccess: false,
    redirectTo: null
  });

  useEffect(() => {
    checkAuthentication();
  }, [location.pathname]);

  const checkAuthentication = () => {
    try {
      console.log('🔍 Checking authentication for:', location.pathname);
      console.log('🎯 Required roles:', allowedRoles);

      // ✅ Get required role from URL or allowedRoles
      const requiredRole = allowedRoles[0]; // admin, manager, or employee
      
      // ✅ Role-specific storage keys
      const tokenKey = `${requiredRole}_token`;
      const userKey = `${requiredRole}_user`;
      
      const token = localStorage.getItem(tokenKey);
      const userStr = localStorage.getItem(userKey);

      console.log(`📦 Checking storage: ${tokenKey}, ${userKey}`);
      console.log(`🔑 Token exists: ${!!token}`);
      console.log(`👤 User exists: ${!!userStr}`);

      // ✅ No token found
      if (!token) {
        console.log(`❌ No ${requiredRole} token found - redirecting to login`);
        setAuthStatus({
          isAuthenticated: false,
          hasAccess: false,
          redirectTo: `/${requiredRole}/login`
        });
        setIsChecking(false);
        return;
      }

      // ✅ Parse user data
      let user;
      try {
        user = JSON.parse(userStr);
      } catch (parseError) {
        console.error('❌ Failed to parse user data:', parseError);
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(userKey);
        setAuthStatus({
          isAuthenticated: false,
          hasAccess: false,
          redirectTo: `/${requiredRole}/login`
        });
        setIsChecking(false);
        return;
      }

      // ✅ Validate user object
      if (!user || !user.role) {
        console.log('❌ Invalid user data - missing role');
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(userKey);
        setAuthStatus({
          isAuthenticated: false,
          hasAccess: false,
          redirectTo: `/${requiredRole}/login`
        });
        setIsChecking(false);
        return;
      }

      const userRole = user.role.toLowerCase();
      console.log(`👤 User role: ${userRole}`);

      // ✅ Check if user has required role
      if (!allowedRoles.includes(userRole)) {
        console.log(`❌ Access denied - User role: ${userRole}, Required: ${allowedRoles.join(', ')}`);
        setAuthStatus({
          isAuthenticated: true,
          hasAccess: false,
          redirectTo: '/unauthorized'
        });
        setIsChecking(false);
        return;
      }

      // ✅ All checks passed
      console.log(`✅ Authentication successful - Role: ${userRole}`);
      setAuthStatus({
        isAuthenticated: true,
        hasAccess: true,
        redirectTo: null
      });
      setIsChecking(false);

    } catch (error) {
      console.error('❌ Authentication check failed:', error);
      const requiredRole = allowedRoles[0];
      setAuthStatus({
        isAuthenticated: false,
        hasAccess: false,
        redirectTo: `/${requiredRole}/login`
      });
      setIsChecking(false);
    }
  };

  // ✅ Show loading state
  if (isChecking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e0e0e0',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p style={{ color: '#666', fontSize: '14px' }}>Verifying access...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // ✅ Redirect if needed
  if (authStatus.redirectTo) {
    console.log(`🔄 Redirecting to: ${authStatus.redirectTo}`);
    return <Navigate to={authStatus.redirectTo} replace />;
  }

  // ✅ Render protected content
  if (authStatus.isAuthenticated && authStatus.hasAccess) {
    console.log('✅ Rendering protected content');
    return children;
  }

  // ✅ Fallback (should not reach here)
  const requiredRole = allowedRoles[0];
  console.log('⚠️ Unexpected state - redirecting to login');
  return <Navigate to={`/${requiredRole}/login`} replace />;
};

export default ProtectedRoute;
