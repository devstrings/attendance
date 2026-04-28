import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = () => {
      try {
        // ✅ Check ALL role tokens
        const roles = ['admin', 'manager', 'employee'];
        let foundUser = null;
        let foundToken = null;

        for (const role of roles) {
          const token = localStorage.getItem(`${role}_token`);
          const userStr = localStorage.getItem(`${role}_user`);
          
          if (token && userStr) {
            foundUser = JSON.parse(userStr);
            foundToken = token;
            break;
          }
        }

        if (foundUser && foundToken) {
          setUser(foundUser);
          setIsAuthenticated(true);
          console.log('✅ Auth initialized:', foundUser.role);
        } else {
          console.log('ℹ️ No session found');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('❌ Auth init error:', error);
        localStorage.clear();
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear all role-specific storage
      const roles = ['admin', 'manager', 'employee'];
      roles.forEach(role => {
        localStorage.removeItem(`${role}_token`);
        localStorage.removeItem(`${role}_user`);
      });
    }
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    
    if (updatedUser.role) {
      const role = updatedUser.role.toLowerCase();
      localStorage.setItem(`${role}_user`, JSON.stringify(updatedUser));
    }
  };

  const hasRole = (role) => user?.role === role;
  const hasAnyRole = (roles) => roles.includes(user?.role);
  const getUserRole = () => user?.role || null;

  const refreshUser = async () => {
    return user;
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    hasRole,
    hasAnyRole,
    getUserRole,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;