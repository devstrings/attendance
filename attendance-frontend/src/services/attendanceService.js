// import { apiService } from './api';

// const attendanceService = {
//   // ============ GENERAL ATTENDANCE ============
//   getAllAttendance: async (filters = {}) => {
//     try {
//       const response = await apiService.get('/attendance', {
//         params: filters
//       });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   getAttendanceById: async (attendanceId) => {
//     try {
//       const response = await apiService.get(`/attendance/${attendanceId}`);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   createAttendance: async (attendanceData) => {
//     try {
//       const response = await apiService.post('/attendance', attendanceData);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   updateAttendance: async (attendanceId, updateData) => {
//     try {
//       const response = await apiService.put(`/attendance/${attendanceId}`, updateData);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   deleteAttendance: async (attendanceId) => {
//     try {
//       const response = await apiService.delete(`/attendance/${attendanceId}`);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   // ============ CLOCK IN/OUT ============
//   clockIn: async (location = null) => {
//     try {
//       const response = await apiService.post('/attendance/clock-in', {
//         location
//       });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   clockOut: async (location = null) => {
//     try {
//       const response = await apiService.post('/attendance/clock-out', {
//         location
//       });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   getTodayClockStatus: async () => {
//     try {
//       const response = await apiService.get('/attendance/today/status');
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   // ============ STATISTICS & REPORTS ============
//   getAttendanceSummary: async (filters = {}) => {
//     try {
//       const response = await apiService.get('/attendance/summary/stats', {
//         params: filters
//       });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },

//   bulkMarkAttendance: async (attendanceData) => {
//     try {
//       const response = await apiService.post('/attendance/bulk-mark', {
//         attendanceData
//       });
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   }
// };

// export default attendanceService;



import api from './api'; // ✅ FIXED - default import

const attendanceService = {
  // ============ GENERAL ATTENDANCE ============
  getAllAttendance: async (filters = {}) => {
    try {
      const response = await api.get('/attendance', {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAttendanceById: async (attendanceId) => {
    try {
      const response = await api.get(`/attendance/${attendanceId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createAttendance: async (attendanceData) => {
    try {
      const response = await api.post('/attendance', attendanceData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateAttendance: async (attendanceId, updateData) => {
    try {
      const response = await api.put(`/attendance/${attendanceId}`, updateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteAttendance: async (attendanceId) => {
    try {
      const response = await api.delete(`/attendance/${attendanceId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ============ CLOCK IN/OUT ============
  clockIn: async (location = null) => {
    try {
      const response = await api.post('/attendance/clock-in', {
        location
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  clockOut: async (location = null) => {
    try {
      const response = await api.post('/attendance/clock-out', {
        location
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getTodayClockStatus: async () => {
    try {
      const response = await api.get('/attendance/today/status');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ============ STATISTICS & REPORTS ============
  getAttendanceSummary: async (filters = {}) => {
    try {
      const response = await api.get('/attendance/summary/stats', {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  bulkMarkAttendance: async (attendanceData) => {
    try {
      const response = await api.post('/attendance/bulk-mark', {
        attendanceData
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default attendanceService;