import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import adminService from '../../services/adminService';
import '../../styles/Admin.css';

const EmployeeList = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  
  // ✅ SINGLE STATE: Only search when user clicks button or presses Enter
  const [searchInput, setSearchInput] = useState('');
  
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEmployees: 0
  });

  const departments = ['Software House', 'Sales', 'Marketing', 'IT', 'HR', 'Finance', 'Operations'];

  // ✅ Fetch only when filters or pagination change (NOT on typing)
  useEffect(() => {
    fetchEmployees();
  }, [filterDepartment, filterStatus, pagination.currentPage]);

  const fetchEmployees = async (searchQuery = '') => {
    try {
      setTableLoading(true);
      const response = await adminService.getAllEmployees({
        page: pagination.currentPage,
        limit: 10,
        search: searchQuery,
        department: filterDepartment
      });

      if (response.success) {
        const processedEmployees = (response.data.employees || []).map(emp => ({
          ...emp,
          email: emp.userId?.email || 'N/A',
          navigationId: emp._id
        }));

        setEmployees(processedEmployees);
        setPagination({
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages,
          totalEmployees: response.data.totalEmployees
        });
      }
    } catch (error) {
      console.error('❌ Error fetching employees:', error);
      alert('Failed to load employees');
    } finally {
      setTableLoading(false);
      setLoading(false);
    }
  };

  const handleDelete = async (employeeId, userName) => {
    if (!window.confirm(`⚠️ PERMANENT DELETE\n\nAre you sure you want to PERMANENTLY delete ${userName}?\n\nThis will:\n✓ Delete employee profile\n✓ Delete user account\n✓ Delete all attendance records\n✓ Remove from manager's list\n\nThis action CANNOT be undone!`)) {
      return;
    }

    try {
      const response = await adminService.deleteUser(employeeId, 'employee');
      
      if (response.success) {
        alert(`✅ ${userName} deleted permanently!`);
        fetchEmployees(searchInput);
      }
    } catch (error) {
      console.error('❌ Error deleting employee:', error);
      alert(error.message || 'Failed to delete employee. Please try again.');
    }
  };

  // ✅ MANUAL SEARCH: Only search when button clicked
  const handleSearchClick = () => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchEmployees(searchInput);
  };

  // ✅ Enter key support
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilterDepartment('');
    setFilterStatus('');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchEmployees(''); // ✅ Fetch all employees
  };

  if (loading) {
    return (
      <div className="admin-container">
        <AdminNavbar />
        <div className="admin-layout">
          <AdminSidebar />
          <div className="admin-content">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading employees...</p>
            </div>
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
          {/* Header */}
          <div className="page-header">
            <div>
              <h1>Employee Management</h1>
              <p>Manage all employees - Devstrings Software House</p>
            </div>
            <button 
              className="btn-primary"
              onClick={() => navigate('/admin/create-employee')}
            >
              + Add New Employee
            </button>
          </div>

          {/* ✅ SINGLE LINE FILTERS - NO AUTO-SEARCH */}
          <div className="filters-container-modern">
            <div className="search-group">
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="search-input-modern"
              />
              <button 
                className="search-btn-modern"
                onClick={handleSearchClick}
                title="Search"
              >
                🔍
              </button>
            </div>

            <select
              value={filterDepartment}
              onChange={(e) => {
                setFilterDepartment(e.target.value);
                setPagination(prev => ({ ...prev, currentPage: 1 }));
              }}
              className="filter-select-modern"
            >
              <option value="">All Departments</option>
              {departments.map((dept, index) => (
                <option key={index} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPagination(prev => ({ ...prev, currentPage: 1 }));
              }}
              className="filter-select-modern"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button onClick={clearFilters} className="clear-btn-modern">
              Clear Filters
            </button>
          </div>

          {/* Employee Table */}
          {tableLoading ? (
            <div className="table-loading">
              <div className="mini-spinner"></div>
              <p>Searching...</p>
            </div>
          ) : employees.length > 0 ? (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>NAME</th>
                      <th>EMAIL</th>
                      <th>PHONE</th>
                      <th>DEPARTMENT</th>
                      <th>POSITION</th>
                      <th>SALARY</th>
                      <th>MANAGER</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee._id}>
                        <td>
                          <div className="employee-name-cell">
                            <div className="avatar">
                              {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                            </div>
                            <div>
                              <div className="name">{employee.firstName} {employee.lastName}</div>
                              <div className="employee-code">{employee.employeeCode}</div>
                            </div>
                          </div>
                        </td>
                        <td>{employee.email}</td>
                        <td>{employee.phoneNumber}</td>
                        <td>{employee.department}</td>
                        <td>{employee.designation}</td>
                        <td>PKR {employee.salary?.toLocaleString() || '0'}</td>
                        <td>
                          {employee.managerId?.firstName} {employee.managerId?.lastName}
                        </td>
                        <td>
                          <span className={`status-badge ${employee.isActive ? 'active' : 'inactive'}`}>
                            {employee.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-view"
                              onClick={() => navigate(`/admin/employee/${employee.navigationId}`)}
                              title="View Details"
                            >
                              👁️
                            </button>
                            
                            <button
                              className="btn-edit"
                              onClick={() => navigate(`/admin/edit-employee/${employee.navigationId}`)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            
                            <button
                              className="btn-delete"
                              onClick={() => handleDelete(employee.navigationId, `${employee.firstName} ${employee.lastName}`)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={pagination.currentPage === 1}
                  className="btn-secondary"
                >
                  ← Previous
                </button>
                <span className="pagination-info">
                  Page {pagination.currentPage} of {pagination.totalPages} 
                  ({pagination.totalEmployees} total employees)
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="btn-secondary"
                >
                  Next →
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No Employees Found</h3>
              <p>Start by adding your first employee</p>
              <button 
                className="btn-primary"
                onClick={() => navigate('/admin/create-employee')}
              >
                + Add First Employee
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        /* ✅ MODERN SINGLE-LINE FILTERS */
        .filters-container-modern {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          align-items: center;
        }

        .search-group {
          display: flex;
          flex: 1;
          min-width: 300px;
          gap: 8px;
        }

        .search-input-modern {
          flex: 1;
          padding: 10px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          transition: all 0.3s ease;
          background: white;
        }

        .search-input-modern:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .search-btn-modern {
          padding: 10px 20px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
        }

        .search-btn-modern:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.35);
        }

        .filter-select-modern {
          padding: 10px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          min-width: 150px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .filter-select-modern:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .clear-btn-modern {
          padding: 10px 20px;
          background: white;
          color: #4a5568;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .clear-btn-modern:hover {
          background: #f7fafc;
          border-color: #cbd5e0;
          transform: translateY(-2px);
        }

        .table-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th {
          background: #f9fafb;
          padding: 14px 12px;
          text-align: left;
          font-weight: 700;
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e5e7eb;
        }

        .data-table td {
          padding: 14px 12px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 14px;
          color: #1f2937;
        }

        .data-table tbody tr {
          transition: all 0.2s ease;
        }

        .data-table tbody tr:hover {
          background: #f9fafb;
          transform: scale(1.001);
        }

        .employee-name-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }

        .name {
          font-weight: 600;
          color: #111827;
        }

        .employee-code {
          font-size: 12px;
          color: #9ca3af;
        }

        .status-badge {
          padding: 5px 14px;
          border-radius: 14px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.inactive {
          background: #fee2e2;
          color: #991b1b;
        }

        .action-buttons {
          display: flex;
          gap: 6px;
        }

        .btn-view, .btn-edit, .btn-delete {
          padding: 8px 12px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s ease;
        }

        .btn-view {
          background: #dbeafe;
          color: #1e40af;
        }

        .btn-edit {
          background: #fef3c7;
          color: #92400e;
        }

        .btn-delete {
          background: #fee2e2;
          color: #991b1b;
        }

        .btn-view:hover, .btn-edit:hover, .btn-delete:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .pagination-info {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .empty-icon {
          font-size: 72px;
          margin-bottom: 20px;
          opacity: 0.7;
        }

        .empty-state h3 {
          margin: 0 0 12px 0;
          color: #111827;
          font-size: 24px;
        }

        .empty-state p {
          margin: 0 0 24px 0;
          color: #6b7280;
          font-size: 16px;
        }

        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .table-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .mini-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f4f6;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin-bottom: 12px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .filters-container-modern {
            flex-direction: column;
            align-items: stretch;
          }

          .search-group {
            width: 100%;
            min-width: auto;
          }

          .filter-select-modern,
          .clear-btn-modern {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default EmployeeList;