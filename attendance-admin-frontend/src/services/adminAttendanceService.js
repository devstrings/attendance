import api from './api';

const adminAttendanceService = {
  // ============ EMPLOYEE MANAGEMENT ============
  
  /**
   * Get all employees in the organization (Admin only)
   * ✅ UPDATED: Now includes today's attendance status
   */
  getAllEmployees: async () => {
    try {
      const response = await api.get('/admin/employees');
      
      // ✅ Fetch today's attendance for all employees
      if (response.data.success && response.data.data.employees) {
        const employees = response.data.data.employees;
        const today = new Date().toISOString().split('T')[0];
        
        // Get all attendance records for today
        const attendanceResponse = await api.get('/attendance', {
          params: { date: today }
        });
        
        const todayAttendance = attendanceResponse.data.data?.attendance || [];
        
        // Map attendance to employees
        const employeesWithStatus = employees.map(emp => {
          const attendance = todayAttendance.find(
            att => att.employeeId?._id === emp._id || att.employeeId === emp._id
          );
          
          return {
            ...emp,
            todayAttendance: attendance || null,
            todayStatus: attendance ? attendance.status : null
          };
        });
        
        return {
          ...response.data,
          data: {
            ...response.data.data,
            employees: employeesWithStatus
          }
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Get all employees error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Get employee details by ID
   */
  getEmployeeById: async (employeeId) => {
    try {
      console.log('📡 Fetching employee by ID:', employeeId);
      const response = await api.get(`/admin/user/${employeeId}/employee`);
      console.log('✅ Employee fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching employee:', error.response?.data || error);
      throw error.response?.data || { success: false, message: 'Failed to fetch employee' };
    }
  },

  // ============ ATTENDANCE MANAGEMENT ============
  
  /**
   * Mark attendance for any employee (Admin privilege)
   */
  markAttendance: async (attendanceData) => {
    try {
      console.log('📤 Sending attendance data:', attendanceData);
      const response = await api.post('/attendance', attendanceData);
      console.log('✅ Attendance marked:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Mark attendance error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Get attendance records with filters
   */
  getAttendance: async (filters = {}) => {
    try {
      const response = await api.get('/attendance', { params: filters });
      return response.data;
    } catch (error) {
      console.error('❌ Get attendance error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Get attendance by ID
   */
  getAttendanceById: async (attendanceId) => {
    try {
      const response = await api.get(`/attendance/${attendanceId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Get attendance by ID error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Update attendance record
   */
  updateAttendance: async (attendanceId, updateData) => {
    try {
      const response = await api.put(`/attendance/${attendanceId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('❌ Update attendance error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Delete attendance record (Admin only)
   */
  deleteAttendance: async (attendanceId) => {
    try {
      const response = await api.delete(`/attendance/${attendanceId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Delete attendance error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Bulk mark attendance for multiple employees
   */
  bulkMarkAttendance: async (attendanceDataArray) => {
    try {
      const response = await api.post('/attendance/bulk-mark', {
        attendanceData: attendanceDataArray
      });
      return response.data;
    } catch (error) {
      console.error('❌ Bulk mark attendance error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  // ============ REPORTS & ANALYTICS ============
  
  /**
   * Get attendance summary for an employee or date range
   */
  getAttendanceSummary: async (filters = {}) => {
    try {
      const response = await api.get('/attendance/summary/stats', { params: filters });
      return response.data;
    } catch (error) {
      console.error('❌ Get attendance summary error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Get department-wise attendance statistics
   */
  getDepartmentStats: async (date) => {
    try {
      const response = await api.get('/admin/attendance/department-stats', {
        params: { date }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Get department stats error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Export attendance report
   */
  exportAttendanceReport: async (filters = {}) => {
    try {
      const response = await api.get('/admin/attendance/export', {
        params: filters,
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('❌ Export attendance error:', error);
      throw error.response?.data || { message: error.message };
    }
  }
};

export default adminAttendanceService;