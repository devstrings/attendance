import axios from 'axios';

// ================================
// API CONFIGURATION
// ================================
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
const DEBUG = process.env.REACT_APP_DEBUG === 'true';

console.log('🔧 API Configuration:');
console.log('📡 Base URL:', API_BASE_URL);
console.log('🐛 Debug Mode:', DEBUG);

// ================================
// CREATE AXIOS INSTANCE
// ================================
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Important for CORS with credentials
});

// ================================
// REQUEST INTERCEPTOR
// ================================
api.interceptors.request.use(
  (config) => {
    // ✅ Get current role from URL path
    const path = window.location.pathname;
    let currentRole = null;

    if (path.startsWith('/admin')) {
      currentRole = 'admin';
    } else if (path.startsWith('/manager')) {
      currentRole = 'manager';
    } else if (path.startsWith('/employee')) {
      currentRole = 'employee';
    }

    // ✅ Get role-specific token
    if (currentRole) {
      const tokenKey = `${currentRole}_token`;
      const token = localStorage.getItem(tokenKey);
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        if (DEBUG) {
          console.log(`🔑 Using ${currentRole} token for: ${config.method?.toUpperCase()} ${config.url}`);
        }
      } else {
        if (DEBUG) {
          console.warn(`⚠️  No ${currentRole} token found`);
        }
      }
    } else {
      // ✅ Fallback: Try generic token
      const genericToken = localStorage.getItem('token');
      if (genericToken) {
        config.headers.Authorization = `Bearer ${genericToken}`;
        if (DEBUG) {
          console.log(`🔑 Using generic token for: ${config.method?.toUpperCase()} ${config.url}`);
        }
      }
    }

    // Log request in debug mode
    if (DEBUG) {
      console.log('📤 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        data: config.data,
        params: config.params
      });
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// ================================
// RESPONSE INTERCEPTOR
// ================================
api.interceptors.response.use(
  (response) => {
    // Log successful response in debug mode
    if (DEBUG) {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
    }

    return response;
  },
  (error) => {
    // Log error details
    if (DEBUG) {
      console.error('❌ API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.response?.data?.message || error.message,
        data: error.response?.data
      });
    }

    // ================================
    // HANDLE SPECIFIC ERROR CODES
    // ================================

    // 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      let role = 'admin'; // default

      // Determine role from current path
      if (path.startsWith('/manager')) {
        role = 'manager';
      } else if (path.startsWith('/employee')) {
        role = 'employee';
      } else if (path.startsWith('/admin')) {
        role = 'admin';
      }

      // Clear role-specific storage
      const tokenKey = `${role}_token`;
      const userKey = `${role}_user`;
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);

      // Also clear generic storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      console.warn('⚠️  Session expired. Redirecting to login...');
      
      // Show alert only if not already on login page
      if (!path.includes('/login')) {
        alert('Session expired. Please login again.');
        window.location.href = `/${role}/login`;
      }
    }

    // 403 Forbidden - Insufficient permissions
    if (error.response?.status === 403) {
      console.error('❌ Access Denied: Insufficient permissions');
      alert('Access Denied: You do not have permission to perform this action.');
    }

    // 404 Not Found
    if (error.response?.status === 404) {
      console.error('❌ 404 Error - Route not found:', error.config?.url);
      console.error('Full URL:', `${error.config?.baseURL}${error.config?.url}`);
    }

    // 500 Internal Server Error
    if (error.response?.status === 500) {
      console.error('❌ Server Error: Something went wrong on the server');
      alert('Server Error: Please try again later or contact support.');
    }

    // Network Error (no response)
    if (!error.response) {
      console.error('❌ Network Error:', error.message);
      console.error('⚠️  Possible causes:');
      console.error('   - Backend server is not running');
      console.error('   - Wrong API URL:', API_BASE_URL);
      console.error('   - CORS issues');
      console.error('   - Network connectivity problems');
      
      return Promise.reject({
        success: false,
        message: 'Network error. Please check if the backend server is running.',
        error: error.message
      });
    }

    return Promise.reject(error);
  }
);

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Get current auth token
 */
export const getToken = () => {
  const path = window.location.pathname;
  let role = null;

  if (path.startsWith('/admin')) role = 'admin';
  else if (path.startsWith('/manager')) role = 'manager';
  else if (path.startsWith('/employee')) role = 'employee';

  if (role) {
    return localStorage.getItem(`${role}_token`);
  }

  return localStorage.getItem('token');
};

/**
 * Get current user
 */
export const getCurrentUser = () => {
  const path = window.location.pathname;
  let role = null;

  if (path.startsWith('/admin')) role = 'admin';
  else if (path.startsWith('/manager')) role = 'manager';
  else if (path.startsWith('/employee')) role = 'employee';

  if (role) {
    const userStr = localStorage.getItem(`${role}_user`);
    return userStr ? JSON.parse(userStr) : null;
  }

  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Set auth token and user
 */
export const setAuthData = (token, user, role) => {
  if (role) {
    localStorage.setItem(`${role}_token`, token);
    localStorage.setItem(`${role}_user`, JSON.stringify(user));
  }
  
  // Also set generic for backward compatibility
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Clear auth data
 */
export const clearAuthData = (role) => {
  if (role) {
    localStorage.removeItem(`${role}_token`);
    localStorage.removeItem(`${role}_user`);
  }
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getToken();
};

// ================================
// EXPORT DEFAULT API INSTANCE
// ================================
export default api;