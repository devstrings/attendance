import { useState, useEffect } from 'react';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkAuth();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const checkAuth = () => {
    try {
      // ✅ Check which role is logged in by checking current URL
      const path = window.location.pathname;
      let currentRole = null;

      if (path.startsWith('/admin')) {
        currentRole = 'admin';
      } else if (path.startsWith('/manager')) {
        currentRole = 'manager';
      } else if (path.startsWith('/employee')) {
        currentRole = 'employee';
      }

      if (currentRole) {
        const tokenKey = `${currentRole}_token`;
        const userKey = `${currentRole}_user`;
        
        const token = localStorage.getItem(tokenKey);
        const userStr = localStorage.getItem(userKey);

        if (token && userStr) {
          const userData = JSON.parse(userStr);
          setUser(userData);
          console.log(`✅ Auth initialized: ${userData.role}`);
        } else {
          console.log(`ℹ️ No ${currentRole} auth data found`);
        }
      }
    } catch (error) {
      console.error('❌ Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = (role) => {
    if (role) {
      // ✅ Logout specific role
      const tokenKey = `${role}_token`;
      const userKey = `${role}_user`;
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);
      console.log(`🚪 Logged out: ${role}`);
    } else {
      // ✅ Logout all roles
      localStorage.clear();
      console.log('🚪 Logged out: all roles');
    }
    
    setUser(null);
    window.location.href = '/';
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
    checkAuth
  };
};

export default useAuth;