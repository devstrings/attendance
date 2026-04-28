import api from './api';

const managerService = {
  // Dashboard Stats
  getDashboardStats: async () => {
    try {
      const response = await api.get('/manager/dashboard');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ============ MY EMPLOYEES ============
  getMyEmployees: async (filters = {}) => {
    try {
      const response = await api.get('/manager/my-employees', { params: filters });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getEmployeeById: async (employeeId) => {
    try {
      const response = await api.get(`/manager/employee/${employeeId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ============ ATTENDANCE ============
  getAttendanceByDate: async ({ date } = {}) => {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      try {
        const response = await api.get('/manager/attendance', { params: { date: targetDate, limit: 100 } });
        return response.data;
      } catch (managerErr) {
        console.log('⚠️ Manager endpoint failed, trying general attendance...');
      }
      const response = await api.get('/attendance', { params: { date: targetDate, limit: 100 } });
      return response.data;
    } catch (error) {
      return { success: false, data: { attendance: [] } };
    }
  },

  getTodayAttendance: async (date) => {
    try {
      const response = await api.get('/attendance', {
        params: { date: date || new Date().toISOString().split('T')[0], limit: 100 }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  markAttendance: async (attendanceData) => {
    try {
      const response = await api.post('/manager/mark-attendance', attendanceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to mark attendance' };
    }
  },

  updateAttendance: async (attendanceId, updateData) => {
    try {
      const response = await api.put(`/manager/attendance/${attendanceId}`, updateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  bulkMarkAttendance: async (attendanceList) => {
    try {
      const response = await api.post('/attendance/bulk-mark', { attendanceData: attendanceList });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  clockInOut: async (action, location = null) => {
    try {
      const response = await api.post('/manager/clock-in-out', { action, location });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getMyAttendance: async (filters = {}) => {
    try {
      const response = await api.get('/manager/my-attendance', { params: filters });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getEmployeeAttendanceHistory: async (employeeId, filters = {}) => {
    try {
      const response = await api.get(`/manager/attendance-history/${employeeId}`, { params: filters });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ============ LEAVE MANAGEMENT ============
  getLeaveRequests: async (filters = {}) => {
    try {
      const response = await api.get('/manager/leave-requests', { params: filters });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateLeaveStatus: async (leaveId, status, rejectionReason = '') => {
    try {
      const response = await api.put(`/manager/leave/${leaveId}/status`, { status, rejectionReason });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ============ PROFILE ============
  getMyProfile: async () => {
    try {
      const response = await api.get('/manager/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateMyProfile: async (profileData) => {
    try {
      const response = await api.put('/manager/profile', profileData);
      const user = JSON.parse(localStorage.getItem('manager_user') || '{}');
      localStorage.setItem('manager_user', JSON.stringify({ ...user, ...profileData }));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ============ NOTIFICATIONS ============
  getNotifications: async (params = {}) => {
    try {
      const response = await api.get('/manager/notifications', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  markNotificationRead: async (id) => {
    try {
      const response = await api.patch(`/manager/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  markAllNotificationsRead: async () => {
    try {
      const response = await api.patch('/manager/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ============ REPORTS ============
  getTeamSummary: async (month, year) => {
    try {
      const response = await api.get('/report/monthly-attendance', { params: { month, year } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getEmployeeReport: async (employeeId, startDate, endDate) => {
    try {
      const response = await api.get('/report/employee-attendance-summary', { params: { employeeId, startDate, endDate } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ✅ NEW: Real office policy from SystemConfig
  // Route already exists: GET /admin/system-config/public (no admin auth required)
  getSystemConfig: async () => {
    try {
      const response = await api.get('/admin/system-config/public');
      return response.data;
    } catch (error) {
      console.error('❌ getSystemConfig error:', error);
      // Fallback default agar backend fail ho
      return {
        success: true,
        data: {
          config: {
            shiftStartTime: '09:00',
            shiftEndTime: '17:00',
            workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
          }
        }
      };
    }
  }
};

export default managerService;