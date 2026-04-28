import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import adminService from '../../services/adminService';
import '../../styles/Admin.css';

const ManagerList = () => {
  const navigate = useNavigate();
  const [managers, setManagers] = useState([]);
  const [filteredManagers, setFilteredManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const debounceTimer = useRef(null);
  const departments = ['Software House'];

  useEffect(() => { fetchManagers(); }, []);
  useEffect(() => { filterManagerList(); }, [searchTerm, filterDepartment, filterStatus, managers]);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setSearchTerm(searchInput), 800);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [searchInput]);

  const fetchManagers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllManagers();
      if (response.success && response.data.managers) {
        const formattedManagers = response.data.managers.map(mgr => ({
          ...mgr,
          email: mgr.userId?.email || 'N/A',
          navigationId: mgr._id
        }));
        setManagers(formattedManagers);
      } else {
        setManagers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching managers:', error);
      setManagers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterManagerList = () => {
    setTableLoading(true);
    setTimeout(() => {
      let filtered = [...managers];
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(mgr =>
          `${mgr.firstName} ${mgr.lastName}`.toLowerCase().includes(term) ||
          mgr.email.toLowerCase().includes(term) ||
          mgr.phoneNumber?.toLowerCase().includes(term)
        );
      }
      if (filterDepartment) filtered = filtered.filter(mgr => mgr.department === filterDepartment);
      if (filterStatus) {
        const isActive = filterStatus === 'active';
        filtered = filtered.filter(mgr => mgr.isActive === isActive);
      }
      setFilteredManagers(filtered);
      setTableLoading(false);
    }, 100);
  };

  const handleDelete = async (managerId, managerName) => {
    if (!window.confirm(`⚠️ PERMANENT DELETE\n\nAre you sure you want to PERMANENTLY delete ${managerName}?\n\nThis action CANNOT be undone!`)) return;
    try {
      const response = await adminService.deleteUser(managerId, 'manager');
      if (response.success) {
        alert(`✅ ${managerName} deleted permanently!`);
        fetchManagers();
      }
    } catch (error) {
      alert(error.message || 'Failed to delete manager.');
    }
  };

  const handleSearchClick = () => setSearchTerm(searchInput);
  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearchClick(); };
  const clearFilters = () => { setSearchInput(''); setSearchTerm(''); setFilterDepartment(''); setFilterStatus(''); };

  if (loading) {
    return (
      <div className="admin-container">
        <AdminNavbar /><div className="admin-layout"><AdminSidebar />
          <div className="admin-content">
            <div className="loading-spinner"><div className="spinner"></div><p>Loading managers...</p></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <AdminNavbar />
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <div className="page-header">
            <h1>Manager List - Devstrings</h1>
            <button className="btn-primary" onClick={() => navigate('/admin/create-manager')}>
              + Add New Manager
            </button>
          </div>

          <div className="filters-container-modern">
            <div className="search-group">
              <input type="text" placeholder="Search by name, email, or phone..."
                value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress} className="search-input-modern" />
              <button className="search-btn-modern" onClick={handleSearchClick} title="Search">🔍</button>
            </div>
            <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="filter-select-modern">
              <option value="">All Departments</option>
              {departments.map((dept, i) => <option key={i} value={dept}>{dept}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select-modern">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button onClick={clearFilters} className="clear-btn-modern">Clear Filters</button>
          </div>

          {tableLoading ? (
            <div className="table-loading"><div className="mini-spinner"></div><p>Searching...</p></div>
          ) : filteredManagers.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>NAME</th><th>EMAIL</th><th>PHONE</th><th>DEPARTMENT</th>
                    <th>POSITION</th><th>EMPLOYEES</th><th>JOINING DATE</th><th>STATUS</th><th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredManagers.map((manager) => (
                    <tr key={manager._id}>
                      <td>
                        <div className="manager-name-cell">
                          <div className="avatar-manager">
                            {manager.firstName?.charAt(0)}{manager.lastName?.charAt(0)}
                          </div>
                          <strong>{manager.firstName} {manager.lastName}</strong>
                        </div>
                      </td>
                      <td>{manager.email}</td>
                      <td>{manager.phoneNumber}</td>
                      <td>{manager.department}</td>
                      <td>{manager.designation}</td>
                      <td><span className="employee-count">{manager.employeesUnder?.length || 0} employees</span></td>
                      <td>{new Date(manager.joiningDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${manager.isActive ? 'active' : 'inactive'}`}>
                          {manager.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {/* ✅ FIXED: Correct routes */}
                          <button className="btn-icon view"
                            onClick={() => navigate(`/admin/view-user/${manager.navigationId}/manager`)}
                            title="View Details">👁️</button>
                          <button className="btn-icon edit"
                            onClick={() => navigate(`/admin/edit-user/${manager.navigationId}/manager`)}
                            title="Edit">✏️</button>
                          <button className="btn-icon delete"
                            onClick={() => handleDelete(manager.navigationId, `${manager.firstName} ${manager.lastName}`)}
                            title="Delete">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">👔</div>
              <h3>No Managers Found</h3>
              <p>Start by adding your first manager</p>
              <button className="btn-primary" onClick={() => navigate('/admin/create-manager')}>+ Add First Manager</button>
            </div>
          )}

          <div className="table-footer">
            <p>Total Managers: <strong>{filteredManagers.length}</strong></p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .filters-container-modern { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; align-items: center; }
        .search-group { display: flex; flex: 1; min-width: 300px; gap: 8px; }
        .search-input-modern { flex: 1; padding: 10px 16px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 14px; background: white; }
        .search-input-modern:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.1); }
        .search-btn-modern { padding: 10px 20px; background: linear-gradient(135deg,#667eea,#764ba2); color: white; border: none; border-radius: 10px; font-size: 18px; cursor: pointer; }
        .filter-select-modern { padding: 10px 16px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 14px; min-width: 150px; background: white; cursor: pointer; }
        .clear-btn-modern { padding: 10px 20px; background: white; color: #4a5568; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; }
        .loading-spinner { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; }
        .spinner { width: 50px; height: 50px; border: 4px solid #f3f4f6; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 0.8s linear infinite; }
        .table-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; background: white; border-radius: 12px; }
        .mini-spinner { width: 40px; height: 40px; border: 3px solid #f3f4f6; border-top: 3px solid #667eea; border-radius: 50%; animation: spin 0.6s linear infinite; margin-bottom: 12px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .table-container { background: white; border-radius: 12px; overflow-x: auto; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { background: #f9fafb; padding: 14px 12px; text-align: left; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb; }
        .data-table td { padding: 14px 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
        .data-table tbody tr:hover { background: #f9fafb; }
        .manager-name-cell { display: flex; align-items: center; gap: 12px; }
        .avatar-manager { width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg,#f59e0b,#d97706); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
        .employee-count { background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .status-badge { padding: 5px 14px; border-radius: 14px; font-size: 12px; font-weight: 600; }
        .status-badge.active { background: #d1fae5; color: #065f46; }
        .status-badge.inactive { background: #fee2e2; color: #991b1b; }
        .action-buttons { display: flex; gap: 6px; }
        .btn-icon { padding: 8px 12px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.2s ease; }
        .btn-icon.view { background: #dbeafe; color: #1e40af; }
        .btn-icon.edit { background: #fef3c7; color: #92400e; }
        .btn-icon.delete { background: #fee2e2; color: #991b1b; }
        .btn-icon:hover { transform: scale(1.15); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .empty-state { text-align: center; padding: 80px 20px; background: white; border-radius: 12px; }
        .empty-icon { font-size: 72px; margin-bottom: 20px; opacity: 0.7; }
        .table-footer { margin-top: 20px; padding: 16px; text-align: right; color: #6b7280; font-size: 14px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        @media (max-width: 1024px) { .filters-container-modern { flex-direction: column; align-items: stretch; } .search-group { width: 100%; min-width: auto; } .filter-select-modern, .clear-btn-modern { width: 100%; } }
      `}</style>
    </div>
  );
};

export default ManagerList;