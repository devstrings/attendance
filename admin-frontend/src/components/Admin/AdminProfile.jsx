import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import '../../styles/Admin.css';
import '../../styles/AdminProfile.css';


const AdminProfile = () => {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const storedUser = localStorage.getItem('admin_user') || localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;

      const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
      let realName  = user?.name || user?.email?.split('@')[0] || 'Admin';
      let realEmail = user?.email || '';
      let realPhone = user?.phoneNumber || user?.phone || '—';

      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/admin/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const u = data.data?.user || data.user || {};
          realName  = u.name || realName;
          realEmail = u.email || realEmail;
          realPhone = u.phoneNumber || u.phone || realPhone;
        }
      } catch(e) {}

      setAdminData({
        id: user?.userId || 'ADMIN001',
        name: realName,
        email: realEmail,
        phone: realPhone,
        role: 'Administrator',
        department: 'Management',
        address: user?.address || '—',
        joiningDate: '2024-01-01',
        status: 'active',
        permissions: [
          'Manage Users', 'Manage Attendance', 'View Reports',
          'System Settings', 'Holiday Management', 'Department Management'
        ]
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
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
            <div className="loader">Loading profile...</div>
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
            <h1>My Profile</h1>
            <button 
              className="btn-primary"
              onClick={() => navigate('/admin/settings')}
            >
              ⚙️ Settings
            </button>
          </div>

          <div className="profile-container">
            <div className="profile-header-section">
              <div className="profile-avatar-xl">
                {adminData.name.charAt(0).toUpperCase()}
              </div>
              <div className="profile-header-info">
                <h2>{adminData.name}</h2>
                <p className="position">{adminData.role}</p>
                <span className={`status-badge ${adminData.status}`}>
                  {adminData.status}
                </span>
              </div>
            </div>

            <div className="profile-sections">
              <div className="profile-section">
                <h3>Personal Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Admin ID:</label>
                    <span>{adminData.id}</span>
                  </div>
                  <div className="info-item">
                    <label>Full Name:</label>
                    <span>{adminData.name}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{adminData.email}</span>
                  </div>
                  <div className="info-item">
                    <label>Phone:</label>
                    <span>{adminData.phone}</span>
                  </div>
                  <div className="info-item full-width">
                    <label>Address:</label>
                    <span>{adminData.address}</span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h3>Role Details</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Role:</label>
                    <span>{adminData.role}</span>
                  </div>
                  <div className="info-item">
                    <label>Department:</label>
                    <span>{adminData.department}</span>
                  </div>
                  <div className="info-item">
                    <label>Joining Date:</label>
                    <span>{new Date(adminData.joiningDate).toLocaleDateString()}</span>
                  </div>
                  <div className="info-item">
                    <label>Status:</label>
                    <span className={`status-badge ${adminData.status}`}>
                      {adminData.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h3>Permissions</h3>
                <div className="permissions-grid">
                  {adminData.permissions.map((perm, index) => (
                    <div key={index} className="permission-badge">
                      ✅ {perm}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="profile-actions">
              <button 
                className="btn-primary"
                onClick={() => navigate('/admin/dashboard')}
              >
                🏠 Go to Dashboard
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/admin/settings')}
              >
                ⚙️ System Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;