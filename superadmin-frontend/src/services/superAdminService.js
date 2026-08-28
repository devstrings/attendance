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
export const resetCompanyAdminPassword = (userId, newPassword) =>
  api.patch(`/super-admin/admin/${userId}/reset-password`, { newPassword });

// ===== AUDIT & MONITORING =====
export const getAuditLogs = (params) => api.get('/super-admin/audit-logs', { params });
export const deleteAuditLog = (logId) => api.delete(`/super-admin/audit-logs/${logId}`);
export const clearAllAuditLogs = () => api.delete('/super-admin/audit-logs/clear-all');
export const getPlatformUsage = () => api.get('/super-admin/platform-usage');