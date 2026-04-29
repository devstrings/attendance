import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import '../../styles/Admin.css';
import '../../styles/AdminProfile.css';

const AdminProfile = () => {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profilePic, setProfilePic] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfileData();
    // localStorage se saved pic load karo
    const savedPic = localStorage.getItem('admin_profile_pic');
    if (savedPic) setProfilePic(savedPic);
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
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Profile pic upload handler ──
  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size 2MB se kam honi chahiye');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setProfilePic(base64);
      localStorage.setItem('admin_profile_pic', base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePic = () => {
    setProfilePic(null);
    localStorage.removeItem('admin_profile_pic');
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
            <h1>📋 My Profile</h1>
            <button className="btn-primary" onClick={() => navigate('/admin/settings')}>
              ⚙️ Settings
            </button>
          </div>

          <div className="profile-container">
            {/* ── Header Section ── */}
            <div className="profile-header-section">
              
              {/* Profile Picture */}
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {profilePic ? (
                  <img
                    src={profilePic}
                    alt="Profile"
                    style={{
                      width: '100px', height: '100px', borderRadius: '50%',
                      objectFit: 'cover', border: '3px solid #6366f1',
                      cursor: 'pointer'
                    }}
                    onClick={() => fileInputRef.current.click()}
                  />
                ) : (
                  <div
                    className="profile-avatar-xl"
                    style={{ cursor: 'pointer' }}
                    onClick={() => fileInputRef.current.click()}
                  >
                    {adminData.name.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Camera icon overlay */}
                <div
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    position: 'absolute', bottom: '4px', right: '4px',
                    background: '#6366f1', borderRadius: '50%',
                    width: '28px', height: '28px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: '14px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                  }}
                >
                  📷
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePicChange}
                />
              </div>

              <div className="profile-header-info">
                <h2>{adminData.name}</h2>
                <p className="position">{adminData.role}</p>
                <span className={`status-badge ${adminData.status}`}>
                  • {adminData.status.toUpperCase()}
                </span>
                {profilePic && (
                  <button
                    onClick={handleRemovePic}
                    style={{
                      marginTop: '8px', display: 'block', background: 'none',
                      border: '1px solid #ef4444', color: '#ef4444',
                      borderRadius: '6px', padding: '4px 10px',
                      fontSize: '12px', cursor: 'pointer'
                    }}
                  >
                    🗑️ Remove Photo
                  </button>
                )}
              </div>
            </div>

            {/* ── Personal Info ── */}
            <div className="profile-sections">
              <div className="profile-section">
                <h3>Personal Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>ADMIN ID:</label>
                    <span>{adminData.id}</span>
                  </div>
                  <div className="info-item">
                    <label>FULL NAME:</label>
                    <span>{adminData.name}</span>
                  </div>
                  <div className="info-item">
                    <label>EMAIL:</label>
                    <span>{adminData.email}</span>
                  </div>
                  <div className="info-item">
                    <label>PHONE:</label>
                    <span>{adminData.phone}</span>
                  </div>
                  <div className="info-item full-width">
                    <label>ADDRESS:</label>
                    <span>{adminData.address}</span>
                  </div>
                </div>
              </div>

              {/* ── Role Details ── */}
              <div className="profile-section">
                <h3>Role Details</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>ROLE:</label>
                    <span>{adminData.role}</span>
                  </div>
                  <div className="info-item">
                    <label>DEPARTMENT:</label>
                    <span>{adminData.department}</span>
                  </div>
                  <div className="info-item">
                    <label>JOINING DATE:</label>
                    <span>{new Date(adminData.joiningDate).toLocaleDateString()}</span>
                  </div>
                  <div className="info-item">
                    <label>STATUS:</label>
                    <span className={`status-badge ${adminData.status}`}>
                      • {adminData.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Actions ── */}
            <div className="profile-actions">
              <button className="btn-primary" onClick={() => navigate('/admin/dashboard')}>
                🏠 Go to Dashboard
              </button>
              <button className="btn-secondary" onClick={() => navigate('/admin/settings')}>
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