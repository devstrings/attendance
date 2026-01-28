import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeNavbar from './EmployeeNavbar';
import '../../styles/Employee.css';

const MyProfile = () => {
  const navigate = useNavigate();
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      // API call karenge profile data fetch karne ke liye
      // const response = await getMyProfileAPI();
      
      // Mock data
      setTimeout(() => {
        const storedUser = localStorage.getItem('user');
        const user = storedUser ? JSON.parse(storedUser) : null;

        setEmployeeData({
          id: '101',
          name: user?.name || 'Employee User',
          email: user?.email || 'employee@example.com',
          phone: '+92 300 1234567',
          address: 'Street 123, Faisalabad, Punjab, Pakistan',
          department: 'IT',
          position: 'Software Developer',
          baseSalary: 50000,
          joiningDate: '2024-01-15',
          manager: 'John Manager',
          status: 'active',
          attendanceRate: 85.7,
          totalPresent: 18,
          totalAbsent: 2,
          totalLeave: 1
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="employee-container">
        <EmployeeNavbar />
        <div className="employee-content">
          <div className="loader">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="employee-container">
        <EmployeeNavbar />
        <div className="employee-content">
          <div className="error-message">Profile not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-container">
      <EmployeeNavbar />
      <div className="employee-content">
        <div className="page-header">
          <h1>My Profile</h1>
          <button 
            className="btn-primary"
            onClick={() => navigate('/employee/profile-settings')}
          >
            ⚙️ Edit Profile
          </button>
        </div>

        <div className="profile-container">
          <div className="profile-header-section">
            <div className="profile-avatar-xl">
              {employeeData.name.charAt(0).toUpperCase()}
            </div>
            <div className="profile-header-info">
              <h2>{employeeData.name}</h2>
              <p className="position">{employeeData.position}</p>
              <span className={`status-badge ${employeeData.status}`}>
                {employeeData.status}
              </span>
            </div>
          </div>

          <div className="profile-sections">
            <div className="profile-section">
              <h3>Personal Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Employee ID:</label>
                  <span>{employeeData.id}</span>
                </div>
                <div className="info-item">
                  <label>Full Name:</label>
                  <span>{employeeData.name}</span>
                </div>
                <div className="info-item">
                  <label>Email:</label>
                  <span>{employeeData.email}</span>
                </div>
                <div className="info-item">
                  <label>Phone:</label>
                  <span>{employeeData.phone}</span>
                </div>
                <div className="info-item full-width">
                  <label>Address:</label>
                  <span>{employeeData.address}</span>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3>Employment Details</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Department:</label>
                  <span>{employeeData.department}</span>
                </div>
                <div className="info-item">
                  <label>Position:</label>
                  <span>{employeeData.position}</span>
                </div>
                <div className="info-item">
                  <label>Manager:</label>
                  <span>{employeeData.manager}</span>
                </div>
                <div className="info-item">
                  <label>Joining Date:</label>
                  <span>{new Date(employeeData.joiningDate).toLocaleDateString()}</span>
                </div>
                <div className="info-item">
                  <label>Base Salary:</label>
                  <span>PKR {employeeData.baseSalary.toLocaleString()}</span>
                </div>
                <div className="info-item">
                  <label>Status:</label>
                  <span className={`status-badge ${employeeData.status}`}>
                    {employeeData.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3>Attendance Summary (This Month)</h3>
              <div className="stats-grid-small">
                <div className="stat-card-small green">
                  <span className="stat-label">Present</span>
                  <span className="stat-value">{employeeData.totalPresent}</span>
                </div>
                <div className="stat-card-small red">
                  <span className="stat-label">Absent</span>
                  <span className="stat-value">{employeeData.totalAbsent}</span>
                </div>
                <div className="stat-card-small orange">
                  <span className="stat-label">Leave</span>
                  <span className="stat-value">{employeeData.totalLeave}</span>
                </div>
                <div className="stat-card-small teal">
                  <span className="stat-label">Attendance Rate</span>
                  <span className="stat-value">{employeeData.attendanceRate}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button 
              className="btn-primary"
              onClick={() => navigate('/employee/my-attendance')}
            >
              📝 View My Attendance
            </button>
            <button 
              className="btn-secondary"
              onClick={() => navigate('/employee/attendance-history')}
            >
              📅 Attendance History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;