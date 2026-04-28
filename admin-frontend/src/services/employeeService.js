import api from './api';

const employeeService = {
  // Dashboard Stats
  getDashboardStats: async () => {
    try {
      const response = await api.get('/employee/dashboard');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ============ PROFILE ============
  getMyProfile: async () => {
    try {
      const response = await api.get('/employee/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateMyProfile: async (profileData) => {
    try {
      const response = await api.put('/employee/profile', profileData);
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...user, ...profileData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ============ ATTENDANCE ============
  getMyAttendance: async (filters = {}) => {
    try {
      const response = await api.get('/employee/my-attendance', {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAttendanceHistory: async (month, year) => {
    try {
      const response = await api.get('/employee/attendance-history', {
        params: { month, year }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getTodayStatus: async () => {
    try {
      const response = await api.get('/employee/today-attendance');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ============ LEAVE ============
  getMyLeaveRequests: async (filters = {}) => {
    try {
      const response = await api.get('/employee/my-leaves', {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  requestLeave: async (leaveData) => {
    try {
      const response = await api.post('/employee/apply-leave', leaveData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  cancelLeaveRequest: async (leaveId) => {
    try {
      const response = await api.put(`/employee/leave/${leaveId}/cancel`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ============ SALARY ============
  getMySalary: async (filters = {}) => {
    try {
      const response = await api.get('/employee/my-salary', {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default employeeService;