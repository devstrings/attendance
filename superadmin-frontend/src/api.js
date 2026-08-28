import axios from 'axios';

// ================================
// API CONFIGURATION
// ================================
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// ================================
// REQUEST INTERCEPTOR
// ================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('superadmin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ================================
// RESPONSE INTERCEPTOR
// ================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('superadmin_token');
      localStorage.removeItem('superadmin_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ================================
// AUTH HELPERS
// ================================
export const setAuthData = (token, user) => {
  localStorage.setItem('superadmin_token', token);
  localStorage.setItem('superadmin_user', JSON.stringify(user));
};

export const clearAuthData = () => {
  localStorage.removeItem('superadmin_token');
  localStorage.removeItem('superadmin_user');
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('superadmin_user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = () => !!localStorage.getItem('superadmin_token');

export default api;
