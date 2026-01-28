import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import adminService from '../../services/adminService';
import '../../styles/Admin.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // ✅ State for dynamic data
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalManagers: 0,
    todayAttendance: 0,
    pendingLeaves: 0
  });
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching dashboard data...');
      
      const response = await adminService.getDashboard();
      
      console.log('✅ Dashboard data received:', response);
      
      if (response.success) {
        setStats({
          totalEmployees: response.data.stats.totalEmployees || 0,
          totalManagers: response.data.stats.totalManagers || 0,
          todayAttendance: response.data.stats.todayAttendance || 0,
          pendingLeaves: response.data.stats.pendingLeaves || 0
        });
        setRecentEmployees(response.data.recentEmployees || []);
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <AdminNavbar />
        <div className="admin-layout">
          <AdminSidebar />
          <div className="admin-content">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '400px',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p style={{ color: '#666' }}>Loading dashboard...</p>
            </div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
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
          <div className="dashboard-container-modern">
            {/* Dashboard Header */}
            <div className="dashboard-header-modern">
              <div className="header-top">
                <div className="welcome-section">
                  <h1>👋 Welcome to Devstrings Attendance System</h1>
                  <p>Overview of your organization's attendance data and quick actions</p>
                </div>
                <div className="header-actions">
                  <button className="action-btn btn-primary" onClick={() => navigate('/admin/create-employee')}>
                    <span>➕</span> Add Employee
                  </button>
                  <button className="action-btn btn-secondary" onClick={() => navigate('/admin/create-manager')}>
                    <span>👥</span> Add Manager
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Grid - ✅ NOW DYNAMIC */}
            <div className="stats-grid-modern">
              <div className="stat-card-modern stat-1">
                <div className="stat-header-modern">
                  <div className="stat-icon-modern">👥</div>
                  <div className="stat-info-modern">
                    <div className="stat-label-modern">Total Employees</div>
                    <div className="stat-value-modern">{stats.totalEmployees}</div>
                  </div>
                </div>
                <div className="stat-footer-modern">
                  <a href="#" className="stat-link-modern" onClick={(e) => { e.preventDefault(); navigate('/admin/employees'); }}>
                    View All →
                  </a>
                </div>
              </div>

              <div className="stat-card-modern stat-2">
                <div className="stat-header-modern">
                  <div className="stat-icon-modern">👔</div>
                  <div className="stat-info-modern">
                    <div className="stat-label-modern">Total Managers</div>
                    <div className="stat-value-modern">{stats.totalManagers}</div>
                  </div>
                </div>
                <div className="stat-footer-modern">
                  <a href="#" className="stat-link-modern" onClick={(e) => { e.preventDefault(); navigate('/admin/managers'); }}>
                    View All →
                  </a>
                </div>
              </div>

              <div className="stat-card-modern stat-3">
                <div className="stat-header-modern">
                  <div className="stat-icon-modern">✅</div>
                  <div className="stat-info-modern">
                    <div className="stat-label-modern">Present Today</div>
                    <div className="stat-value-modern">{stats.todayAttendance}</div>
                  </div>
                </div>
                <div className="stat-footer-modern">
                  <a href="#" className="stat-link-modern" onClick={(e) => { e.preventDefault(); navigate('/admin/attendance-view'); }}>
                    View Details →
                  </a>
                </div>
              </div>

              <div className="stat-card-modern stat-4">
                <div className="stat-header-modern">
                  <div className="stat-icon-modern">📋</div>
                  <div className="stat-info-modern">
                    <div className="stat-label-modern">Pending Leaves</div>
                    <div className="stat-value-modern">{stats.pendingLeaves}</div>
                  </div>
                </div>
                <div className="stat-footer-modern">
                  <a href="#" className="stat-link-modern">Review →</a>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="content-grid-modern">
              {/* Recent Employees - ✅ NOW DYNAMIC */}
              <div className="dashboard-section-modern">
                <div className="section-header-modern">
                  <h2 className="section-title-modern">Recent Employees</h2>
                  <a href="#" className="view-all-link-modern" onClick={(e) => { e.preventDefault(); navigate('/admin/employees'); }}>
                    View All Employees →
                  </a>
                </div>
                <div className="employee-list-modern">
                  {recentEmployees.length > 0 ? (
                    recentEmployees.map((employee) => (
                      <div key={employee._id} className="employee-item-modern">
                        <div className="employee-avatar-modern">
                          {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                        </div>
                        <div className="employee-details-modern">
                          <div className="employee-name-modern">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="employee-meta-modern">
                            <span>{employee.employeeCode}</span>
                            <span>•</span>
                            <span>{employee.userId?.email}</span>
                            {employee.managerId && (
                              <span className="employee-badge-modern">
                                Manager: {employee.managerId.firstName} {employee.managerId.lastName}
                              </span>
                            )}
                          </div>
                        </div>
                        <button 
                          className="action-button-modern"
                          onClick={() => navigate(`/admin/employee/${employee.userId?._id}`)}
                        >
                          View Details
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '40px', 
                      color: '#666',
                      background: '#f9fafb',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '10px' }}>👥</div>
                      <p>No employees yet</p>
                      <button 
                        onClick={() => navigate('/admin/create-employee')}
                        style={{
                          marginTop: '15px',
                          padding: '10px 20px',
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Add First Employee
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions-modern">
                <div className="quick-action-card-modern" onClick={() => navigate('/admin/summary')}>
                  <div className="quick-action-header-modern">
                    <div className="quick-action-icon-modern">📊</div>
                    <div className="quick-action-title-modern">View Reports</div>
                  </div>
                  <div className="quick-action-desc-modern">
                    Generate and download attendance reports for your organization
                  </div>
                </div>

                <div className="quick-action-card-modern" onClick={() => navigate('/admin/settings')}>
                  <div className="quick-action-header-modern">
                    <div className="quick-action-icon-modern">⚙️</div>
                    <div className="quick-action-title-modern">Settings</div>
                  </div>
                  <div className="quick-action-desc-modern">
                    Configure system settings and preferences
                  </div>
                </div>

                <div className="quick-action-card-modern" onClick={() => navigate('/admin/attendance-view')}>
                  <div className="quick-action-header-modern">
                    <div className="quick-action-icon-modern">📅</div>
                    <div className="quick-action-title-modern">Manage Attendance</div>
                  </div>
                  <div className="quick-action-desc-modern">
                    View and manage attendance records for all employees
                  </div>
                </div>

                <div className="quick-action-card-modern">
                  <div className="quick-action-header-modern">
                    <div className="quick-action-icon-modern">📝</div>
                    <div className="quick-action-title-modern">Leave Requests</div>
                  </div>
                  <div className="quick-action-desc-modern">
                    Review and approve pending leave applications
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;