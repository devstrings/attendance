import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ManagerNavbar from './ManagerNavbar';
import ManagerSidebar from './ManagerSidebar';
import managerService from '../../services/managerService';
import '../../styles/Manager.css';

const MyEmployees = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMyEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [searchTerm, employees]);

  const fetchMyEmployees = async () => {
    try {
      setLoading(true);
      const response = await managerService.getMyEmployees();
      
      if (response.success) {
        setEmployees(response.data.employees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      alert('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    if (!searchTerm) {
      setFilteredEmployees(employees);
      return;
    }

    const filtered = employees.filter(emp =>
      emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredEmployees(filtered);
  };

  const handleViewHistory = (employeeId) => {
    navigate(`/manager/attendance-history/${employeeId}`);
  };

  const calculateAttendanceRate = (employee) => {
    // TODO: Backend se actual rate fetch karein
    return 90; // Placeholder
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return 'excellent';
    if (rate >= 80) return 'good';
    if (rate >= 70) return 'average';
    return 'poor';
  };

  if (loading) {
    return (
      <div className="manager-container">
        <ManagerNavbar />
        <div className="manager-layout">
          <ManagerSidebar />
          <div className="manager-content">
            <div className="loader">Loading employees...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="manager-container">
      <ManagerNavbar />
      <div className="manager-layout">
        <ManagerSidebar />
        <div className="manager-content">
          <div className="page-header">
            <h1>My Employees</h1>
            <div className="employee-count">
              Total: {filteredEmployees.length}
            </div>
          </div>

          <div className="filters-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by name, email, or employee code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee Code</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Position</th>
                  <th>Joining Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee) => (
                    <tr key={employee._id}>
                      <td><strong>{employee.employeeCode}</strong></td>
                      <td>{employee.firstName} {employee.lastName}</td>
                      <td>{employee.userId?.email || 'N/A'}</td>
                      <td>{employee.phoneNumber}</td>
                      <td>{employee.designation}</td>
                      <td>{new Date(employee.joiningDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${employee.isActive ? 'active' : 'inactive'}`}>
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-icon view"
                          onClick={() => handleViewHistory(employee._id)}
                          title="View Attendance History"
                        >
                          📅
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="no-data">
                      No employees found under your supervision
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {employees.length > 0 && (
            <div className="stats-summary">
              <h3>Team Performance Summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Active Employees:</span>
                  <span className="summary-value">
                    {employees.filter(emp => emp.isActive).length}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Departments:</span>
                  <span className="summary-value">
                    {[...new Set(employees.map(emp => emp.department))].length}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Under You:</span>
                  <span className="summary-value">
                    {employees.length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyEmployees;