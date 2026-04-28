// import api from './api';

// const managerService = {
//   // Dashboard Stats
//   getDashboardStats: async () => {
//     try {
//       const response = await api.get('/manager/dashboard');
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   // ============ MY EMPLOYEES ============
//   getMyEmployees: async (filters = {}) => {
//     try {
//       const response = await api.get('/manager/my-employees', { params: filters }); // ✅ FIXED
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   getEmployeeById: async (employeeId) => {
//     try {
//       const response = await api.get(`/manager/employee/${employeeId}`);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   // ============ ATTENDANCE ============
//   getTodayAttendance: async (date) => {
//     try {
//       const response = await api.get('/manager/attendance/today', {
//         params: { date }
//       });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   markAttendance: async (attendanceData) => {
//     try {
//       const response = await api.post('/manager/mark-attendance', attendanceData);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   updateAttendance: async (attendanceId, updateData) => {
//     try {
//       const response = await api.put(`/manager/attendance/${attendanceId}`, updateData);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   bulkMarkAttendance: async (attendanceList) => {
//     try {
//       const response = await api.post('/attendance/bulk-mark', {
//         attendanceData: attendanceList
//       });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   clockInOut: async (action, location = null) => {
//     try {
//       const response = await api.post('/manager/clock-in-out', {
//         action,
//         location
//       });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   getMyAttendance: async (filters = {}) => {
//     try {
//       const response = await api.get('/manager/my-attendance', {
//         params: filters
//       });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   getEmployeeAttendanceHistory: async (employeeId, filters = {}) => {
//     try {
//       const response = await api.get(`/manager/attendance-history/${employeeId}`, {
//         params: filters
//       });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   // ============ LEAVE MANAGEMENT ============
//   getLeaveRequests: async (filters = {}) => {
//     try {
//       const response = await api.get('/manager/leave-requests', {
//         params: filters
//       });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   updateLeaveStatus: async (leaveId, status, rejectionReason = '') => {
//     try {
//       const response = await api.put(`/manager/leave/${leaveId}/status`, {
//         status,
//         rejectionReason
//       });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   // ============ PROFILE ============
//   getMyProfile: async () => {
//     try {
//       const response = await api.get('/manager/profile');
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   updateMyProfile: async (profileData) => {
//     try {
//       const response = await api.put('/manager/profile', profileData);
      
//       const user = JSON.parse(localStorage.getItem('user') || '{}');
//       const updatedUser = { ...user, ...profileData };
//       localStorage.setItem('user', JSON.stringify(updatedUser));
      
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   // ============ REPORTS ============
//   getTeamSummary: async (month, year) => {
//     try {
//       const response = await api.get('/report/monthly-attendance', {
//         params: { month, year }
//       });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   getEmployeeReport: async (employeeId, startDate, endDate) => {
//     try {
//       const response = await api.get('/report/employee-attendance-summary', {
//         params: { employeeId, startDate, endDate }
//       });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }
// };

// export default managerService;




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
  getTodayAttendance: async (date) => {
    try {
      // ✅ Use attendance endpoint to get today's records
      const response = await api.get('/attendance', {
        params: { 
          date: date || new Date().toISOString().split('T')[0],
          limit: 100
        }
      });
      return response.data;
    } catch (error) {
      console.error('getTodayAttendance error:', error);
      throw error;
    }
  },

  markAttendance: async (attendanceData) => {
    try {
      const response = await api.post('/manager/mark-attendance', attendanceData);
      return response.data;
    } catch (error) {
      throw error;
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
      const response = await api.post('/attendance/bulk-mark', {
        attendanceData: attendanceList
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  clockInOut: async (action, location = null) => {
    try {
      const response = await api.post('/manager/clock-in-out', {
        action,
        location
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getMyAttendance: async (filters = {}) => {
    try {
      const response = await api.get('/manager/my-attendance', {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getEmployeeAttendanceHistory: async (employeeId, filters = {}) => {
    try {
      const response = await api.get(`/manager/attendance-history/${employeeId}`, {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ============ LEAVE MANAGEMENT ============
  getLeaveRequests: async (filters = {}) => {
    try {
      const response = await api.get('/manager/leave-requests', {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateLeaveStatus: async (leaveId, status, rejectionReason = '') => {
    try {
      const response = await api.put(`/manager/leave/${leaveId}/status`, {
        status,
        rejectionReason
      });
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
      const updatedUser = { ...user, ...profileData };
      localStorage.setItem('manager_user', JSON.stringify(updatedUser));
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ============ REPORTS ============
  getTeamSummary: async (month, year) => {
    try {
      const response = await api.get('/report/monthly-attendance', {
        params: { month, year }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  /**
 * Mark Attendance for Employee
 */
markAttendance: async (attendanceData) => {
  try {
    console.log('📝 Marking attendance:', attendanceData);
    const response = await api.post('/manager/mark-attendance', attendanceData);
    console.log('✅ Attendance marked:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error marking attendance:', error.response?.data || error);
    throw error.response?.data || { success: false, message: 'Failed to mark attendance' };
  }
},

  getEmployeeReport: async (employeeId, startDate, endDate) => {
    try {
      const response = await api.get('/report/employee-attendance-summary', {
        params: { employeeId, startDate, endDate }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default managerService;