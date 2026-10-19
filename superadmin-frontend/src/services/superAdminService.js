import api from '../api';

// ===== AUTH =====
export const login = (email, password) => api.post('/auth/login', { email, password });

// ===== COMPANIES =====
export const getCompanies = (params) => api.get('/super-admin/companies', { params });
export const getCompanyById = (companyId) => api.get(`/super-admin/companies/${companyId}`);
export const createCompany = (data) => api.post('/super-admin/companies', data);
export const updateCompany = (companyId, data) => api.put(`/super-admin/companies/${companyId}`, data);
export const deleteCompany = (companyId) => api.delete(`/super-admin/companies/${companyId}`);
export const suspendCompany = (companyId, reason) =>
  api.patch(`/super-admin/companies/${companyId}/suspend`, { reason });
export const activateCompany = (companyId) =>
  api.patch(`/super-admin/companies/${companyId}/activate`);

// ===== COMPANY ADMIN =====
export const createCompanyAdmin = (companyId, data) =>
  api.post(`/super-admin/companies/${companyId}/admin`, data);
export const getCompanyAdmins = (companyId) =>
  api.get(`/super-admin/companies/${companyId}/admins`);   // ✅ NEW
export const resetCompanyAdminPassword = (userId, newPassword) =>
  api.patch(`/super-admin/admin/${userId}/reset-password`, { newPassword });

// ===== AUDIT & MONITORING =====
export const getAuditLogs = (params) => api.get('/super-admin/audit-logs', { params });
export const deleteAuditLog = (logId) => api.delete(`/super-admin/audit-logs/${logId}`);
export const clearAllAuditLogs = () => api.delete('/super-admin/audit-logs/clear-all');
export const getPlatformUsage = () => api.get('/super-admin/platform-usage');

// ===== WORKERS =====
export const getWorkers = () => api.get('/super-admin/workers');
export const createWorker = (data) => api.post('/super-admin/workers', data);
export const updateWorkerPermissions = (id, permissions) =>
  api.put(`/super-admin/workers/${id}/permissions`, { permissions });
export const toggleWorkerActive = (id) =>
  api.patch(`/super-admin/workers/${id}/toggle-active`);