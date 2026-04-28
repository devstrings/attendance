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
    // ✅ FIX: role determine karo agar pass nahi hua
    const currentRole = role || (() => {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) return 'admin';
      if (path.startsWith('/manager')) return 'manager';
      if (path.startsWith('/employee')) return 'employee';
      return null;
    })();

    if (currentRole) {
      // ✅ Sirf is role ka data hataao
      localStorage.removeItem(`${currentRole}_token`);
      localStorage.removeItem(`${currentRole}_user`);
      console.log(`🚪 Logged out: ${currentRole}`);
      setUser(null);
      // ✅ FIX: Login page pe bhejo, home pe nahi
      window.location.href = `/${currentRole}/login`;
    } else {
      // Fallback: sab clear karo
      localStorage.clear();
      setUser(null);
      window.location.href = '/';
    }
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