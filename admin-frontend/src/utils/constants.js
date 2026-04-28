// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee'
};

// Attendance Status
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LEAVE: 'leave',
  HOLIDAY: 'holiday',
  LATE: 'late',
  HALF_DAY: 'half_day'
};

// Leave Status
export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

// Employee Status
export const EMPLOYEE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  TERMINATED: 'terminated'
};

// Departments
export const DEPARTMENTS = [
  'Sales',
  'Marketing',
  'IT',
  'HR',
  'Finance',
  'Operations',
  'Customer Service',
  'Development'
];

// Days of Week
export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

// Months
export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

// Working Hours
export const WORKING_HOURS = {
  START: '09:00',
  END: '18:00',
  TOTAL: 9
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  API: 'YYYY-MM-DD',
  DATETIME: 'DD/MM/YYYY HH:mm:ss',
  TIME: 'HH:mm:ss'
};

// API Response Status
export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  LOADING: 'loading'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  FONT_SIZE: 'fontSize',
  SIDEBAR_COLLAPSED: 'sidebarCollapsed',
  LANGUAGE: 'language'
};

// Theme Options
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
};

// Font Sizes
export const FONT_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
};

// Report Types
export const REPORT_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  CUSTOM: 'custom'
};

// Export Formats
export const EXPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv'
};

// Notification Types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 50,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,
  OTP_LENGTH: 6
};

// Routes
export const ROUTES = {
  // Public Routes
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  VERIFY_OTP: '/verify-otp',
  RESET_PASSWORD: '/reset-password',
  
  // Admin Routes
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_EMPLOYEES: '/admin/employees',
  ADMIN_MANAGERS: '/admin/managers',
  ADMIN_ATTENDANCE: '/admin/attendance-view',
  ADMIN_REPORTS: '/admin/summary',
  ADMIN_SETTINGS: '/admin/settings',
  
  // Manager Routes
  MANAGER_DASHBOARD: '/manager/dashboard',
  MANAGER_EMPLOYEES: '/manager/my-employees',
  MANAGER_ATTENDANCE: '/manager/mark-attendance',
  MANAGER_CLOCK: '/manager/clock-in-out',
  
  // Employee Routes
  EMPLOYEE_DASHBOARD: '/employee/dashboard',
  EMPLOYEE_PROFILE: '/employee/profile',
  EMPLOYEE_ATTENDANCE: '/employee/my-attendance',
  EMPLOYEE_HISTORY: '/employee/attendance-history',
  
  // Error Routes
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/unauthorized'
};

// API Endpoints Base
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Messages
export const MESSAGES = {
  SUCCESS: {
    LOGIN: 'Login successful!',
    LOGOUT: 'Logged out successfully!',
    CREATED: 'Created successfully!',
    UPDATED: 'Updated successfully!',
    DELETED: 'Deleted successfully!',
    PASSWORD_CHANGED: 'Password changed successfully!',
    OTP_SENT: 'OTP sent to your email!',
    OTP_VERIFIED: 'OTP verified successfully!'
  },
  ERROR: {
    LOGIN_FAILED: 'Login failed. Please check your credentials.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'You are not authorized to access this resource.',
    NOT_FOUND: 'Resource not found.',
    SERVER_ERROR: 'Server error. Please try again later.',
    INVALID_OTP: 'Invalid OTP. Please try again.',
    EXPIRED_OTP: 'OTP has expired. Please request a new one.',
    PASSWORD_MISMATCH: 'Passwords do not match.',
    INVALID_EMAIL: 'Invalid email address.',
    REQUIRED_FIELD: 'This field is required.'
  },
  WARNING: {
    UNSAVED_CHANGES: 'You have unsaved changes. Are you sure you want to leave?',
    DELETE_CONFIRM: 'Are you sure you want to delete this item?',
    LOGOUT_CONFIRM: 'Are you sure you want to logout?'
  }
};

// Regex Patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\d\s\-\+\(\)]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,
  NUMBER: /^\d+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  NAME: /^[a-zA-Z\s]+$/
};

export default {
  USER_ROLES,
  ATTENDANCE_STATUS,
  LEAVE_STATUS,
  EMPLOYEE_STATUS,
  DEPARTMENTS,
  DAYS_OF_WEEK,
  MONTHS,
  WORKING_HOURS,
  PAGINATION,
  DATE_FORMATS,
  API_STATUS,
  STORAGE_KEYS,
  THEMES,
  FONT_SIZES,
  REPORT_TYPES,
  EXPORT_FORMATS,
  NOTIFICATION_TYPES,
  VALIDATION_RULES,
  ROUTES,
  API_BASE_URL,
  MESSAGES,
  REGEX_PATTERNS
};