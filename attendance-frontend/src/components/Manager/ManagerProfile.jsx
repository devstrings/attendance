import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ManagerNavbar from './ManagerNavbar';
import ManagerSidebar from './ManagerSidebar';
import '../../styles/Manager.css';

const ManagerProfile = () => {
  const navigate = useNavigate();
  const [managerData, setManagerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setTimeout(() => {
        const storedUser = localStorage.getItem('user') || localStorage.getItem('manager_user');
        const user = storedUser ? JSON.parse(storedUser) : null;

        setManagerData({
          id: user?.userId || 'MGR001',
          name: user?.name || 'Manager User',
          email: user?.email || 'manager@devstrings.com',
          phone: '+92 300 1234567',
          address: 'Office Address, Faisalabad',
          department: 'Software House',
          position: 'Team Manager',
          joiningDate: '2024-01-15',
          status: 'active',
          employeeCount: 5,
          totalPresent: 12,
          totalAbsent: 1
        });
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="manager-container">
        <ManagerNavbar />
        <div className="manager-layout">
          <ManagerSidebar />
          <div className="manager-content">
            <div className="loader">Loading profile...</div>
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
            <h1>My Profile</h1>
          </div>

          <div className="profile-container">
            <div className="profile-header-section">
              <div className="profile-avatar-xl">
                {managerData.name.charAt(0).toUpperCase()}
              </div>
              <div className="profile-header-info">
                <h2>{managerData.name}</h2>
                <p className="position">{managerData.position}</p>
                <span className={`status-badge ${managerData.status}`}>
                  {managerData.status}
                </span>
              </div>
            </div>

            <div className="profile-sections">
              <div className="profile-section">
                <h3>Personal Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Manager ID:</label>
                    <span>{managerData.id}</span>
                  </div>
                  <div className="info-item">
                    <label>Full Name:</label>
                    <span>{managerData.name}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{managerData.email}</span>
                  </div>
                  <div className="info-item">
                    <label>Phone:</label>
                    <span>{managerData.phone}</span>
                  </div>
                  <div className="info-item full-width">
                    <label>Address:</label>
                    <span>{managerData.address}</span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h3>Work Details</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Department:</label>
                    <span>{managerData.department}</span>
                  </div>
                  <div className="info-item">
                    <label>Position:</label>
                    <span>{managerData.position}</span>
                  </div>
                  <div className="info-item">
                    <label>Employees Under:</label>
                    <span>{managerData.employeeCount} employees</span>
                  </div>
                  <div className="info-item">
                    <label>Joining Date:</label>
                    <span>{new Date(managerData.joiningDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h3>Team Summary (This Month)</h3>
                <div className="stats-grid-small">
                  <div className="stat-card-small blue">
                    <span className="stat-label">Team Size</span>
                    <span className="stat-value">{managerData.employeeCount}</span>
                  </div>
                  <div className="stat-card-small green">
                    <span className="stat-label">Present</span>
                    <span className="stat-value">{managerData.totalPresent}</span>
                  </div>
                  <div className="stat-card-small red">
                    <span className="stat-label">Absent</span>
                    <span className="stat-value">{managerData.totalAbsent}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-actions">
              <button 
                className="btn-primary"
                onClick={() => navigate('/manager/my-employees')}
              >
                👥 View My Team
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/manager/dashboard')}
              >
                🏠 Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerProfile;