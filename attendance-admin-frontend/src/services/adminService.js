import api from './api';

/**
 * Admin Service - All admin API calls
 */
const adminService = {
  /**
   * Get Dashboard Stats
   */
  getDashboard: async () => {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get Active Managers
   */
  getActiveManagers: async () => {
    try {
      console.log('📡 Fetching managers...');
      const response = await api.get('/admin/managers', {
        params: { page: 1, limit: 100 }
      });
      console.log('✅ Managers fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching managers:', error.response?.data || error);
      throw error.response?.data || { success: false, message: 'Failed to load managers' };
    }
  },

  /**
   * Create Employee
   */
  createEmployee: async (employeeData) => {
    try {
      console.log('📡 Creating employee:', employeeData);
      const response = await api.post('/admin/create-employee', employeeData);
      console.log('✅ Employee created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating employee:', error.response?.data || error);
      throw error.response?.data || { success: false, message: 'Failed to create employee' };
    }
  },

  /**
   * Create Manager
   */
  createManager: async (managerData) => {
    try {
      console.log('📡 Creating manager:', managerData);
      const response = await api.post('/admin/create-manager', managerData);
      console.log('✅ Manager created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating manager:', error.response?.data || error);
      throw error.response?.data || { success: false, message: 'Failed to create manager' };
    }
  },

  /**
   * Get All Employees
   */
  getAllEmployees: async (params = {}) => {
    try {
      const response = await api.get('/admin/employees', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get All Managers
   */
  getAllManagers: async (params = {}) => {
    try {
      const response = await api.get('/admin/managers', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * ✅ UNIVERSAL: Get User Details
   * Works with BOTH Employee._id and User._id
   */
  getUserDetails: async (userId, userType) => {
    try {
      console.log(`📡 Fetching ${userType} details:`, userId);
      const response = await api.get(`/admin/user/${userId}/${userType}`);
      console.log(`✅ ${userType} details fetched:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching ${userType}:`, error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get Employee Details (Wrapper)
   */
  getEmployeeDetails: async (employeeId) => {
    return adminService.getUserDetails(employeeId, 'employee');
  },

  /**
   * Get Manager Details (Wrapper)
   */
  getManagerDetails: async (managerId) => {
    return adminService.getUserDetails(managerId, 'manager');
  },

  /**
   * ✅ UNIVERSAL: Update User
   * Works with BOTH Employee._id and User._id
   */
  updateUser: async (userId, userType, updateData) => {
    try {
      console.log(`📡 Updating ${userType}:`, userId, updateData);
      const response = await api.put(`/admin/user/${userId}/${userType}`, updateData);
      console.log(`✅ ${userType} updated:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating ${userType}:`, error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  /**
   * Update Employee (Wrapper)
   */
  updateEmployee: async (employeeId, updateData) => {
    return adminService.updateUser(employeeId, 'employee', updateData);
  },

  /**
   * Update Manager (Wrapper)
   */
  updateManager: async (managerId, updateData) => {
    return adminService.updateUser(managerId, 'manager', updateData);
  },

  /**
   * ✅ UNIVERSAL: Delete User (PERMANENT)
   * Works with BOTH Employee._id and User._id
   */
  deleteUser: async (userId, userType) => {
    try {
      console.log(`🗑️ PERMANENTLY deleting ${userType}:`, userId);
      const response = await api.delete(`/admin/user/${userId}/${userType}`);
      console.log('✅ User permanently deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting user:', error.response?.data || error);
      throw error.response?.data || { success: false, message: 'Failed to delete user' };
    }
  },

  /**
   * Delete Manager (Wrapper)
   */
  deleteManager: async (managerId) => {
    return adminService.deleteUser(managerId, 'manager');
  },

  /**
   * Delete Employee (Wrapper)
   */
  deleteEmployee: async (employeeId) => {
    return adminService.deleteUser(employeeId, 'employee');
  },

  /**
   * Get All Attendance
   */
  getAllAttendance: async (params = {}) => {
    try {
      const response = await api.get('/admin/attendance', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get All Leaves
   */
  getAllLeaves: async (params = {}) => {
    try {
      const response = await api.get('/admin/leaves', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get Summary Report
   */
  getSummaryReport: async (params = {}) => {
    try {
      const response = await api.get('/admin/summary-report', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Manage Holiday
   */
  manageHoliday: async (holidayData, holidayId = null) => {
    try {
      if (holidayId) {
        const response = await api.put(`/admin/holiday/${holidayId}`, holidayData);
        return response.data;
      } else {
        const response = await api.post('/admin/holiday', holidayData);
        return response.data;
      }
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Create Holiday
   */
  createHoliday: async (holidayData) => {
    try {
      console.log('📡 Creating holiday:', holidayData);
      const response = await api.post('/admin/holiday', holidayData);
      console.log('✅ Holiday created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating holiday:', error.response?.data || error);
      throw error.response?.data || { success: false, message: 'Failed to create holiday' };
    }
  },

  /**
   * Get All Holidays
   */
  getAllHolidays: async (params = {}) => {
    try {
      const response = await api.get('/admin/holidays', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Delete Holiday
   */
  deleteHoliday: async (holidayId) => {
    try {
      const response = await api.delete(`/admin/holiday/${holidayId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get Monthly Config
   */
  getMonthlyConfig: async (params = {}) => {
    try {
      const response = await api.get('/admin/monthly-config', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update Monthly Config
   */
  updateMonthlyConfig: async (configData, configId = null) => {
    try {
      if (configId) {
        const response = await api.put(`/admin/monthly-config/${configId}`, configData);
        return response.data;
      } else {
        const response = await api.post('/admin/monthly-config', configData);
        return response.data;
      }
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get Settings
   */
  getSettings: async () => {
    try {
      const response = await api.get('/admin/settings');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * ✅ NEW: Get System Configuration
   */
  getSystemConfig: async () => {
    try {
      const response = await api.get('/admin/system-config');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * ✅ NEW: Create System Configuration
   */
  createSystemConfig: async (configData) => {
    try {
      console.log('📡 Creating system config:', configData);
      const response = await api.post('/admin/system-config', configData);
      console.log('✅ System config created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating system config:', error.response?.data || error);
      throw error.response?.data || { success: false, message: 'Failed to create system configuration' };
    }
  },

  correctAttendance: async (attendanceId, data) => {
    const response = await api.put(
      `/attendance/${attendanceId}/correct`,
      data
    );
    return response.data;
  },

  /**
   * ✅ NEW: Update System Configuration
   */
  updateSystemConfig: async (configId, configData) => {
    try {
      console.log('📡 Updating system config:', configId, configData);
      const response = await api.put(`/admin/system-config/${configId}`, configData);
      console.log('✅ System config updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating system config:', error.response?.data || error);
      throw error.response?.data || { success: false, message: 'Failed to update system configuration' };
    }
  }
};

export default adminService;