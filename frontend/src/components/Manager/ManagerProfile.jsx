/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars, import/no-anonymous-default-export, jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ManagerNavbar from './ManagerNavbar';
import ManagerSidebar from './ManagerSidebar';
import '../../styles/Manager.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const ManagerProfile = () => {
  const navigate = useNavigate();
  const [managerData, setManagerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profilePic, setProfilePic] = useState(null);
  const fileInputRef = useRef(null);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  const getToken = () => localStorage.getItem('manager_token') || localStorage.getItem('token');

  useEffect(() => {
    fetchProfileData();
    const pic = localStorage.getItem('manager_profile_pic');
    if (pic) setProfilePic(pic);
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const headers = { 'Authorization': `Bearer ${token}` };

      const res = await fetch(`${API}/managers/my-profile`, { headers });
      if (res.ok) {
        const data = await res.json();
        const mgr = data.data?.manager || data.data || data.manager || data;

        setManagerData({
          id: mgr.managerCode || mgr.employeeCode || mgr._id || '—',
          name: mgr.fullName || `${mgr.firstName || ''} ${mgr.lastName || ''}`.trim() || 'Manager',
          email: mgr.email || mgr.userId?.email || '—',
          phone: mgr.phone || mgr.phoneNumber || mgr.contactNumber || '—',
          address: mgr.address || mgr.homeAddress || '—',
          department: mgr.department || mgr.departmentName || '—',
          position: mgr.position || mgr.designation || mgr.jobTitle || 'Team Manager',
          joiningDate: mgr.joiningDate || mgr.hireDate || mgr.startDate || null,
          status: mgr.status || mgr.employmentStatus || 'active',
        });
      } else {
        const meRes = await fetch(`${API}/auth/me`, { headers });
        if (meRes.ok) {
          const md = await meRes.json();
          const u = md.data?.user || md.user || md.data || md;
          setManagerData({
            id: u.managerCode || u._id || '—',
            name: u.name || u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Manager',
            email: u.email || '—',
            phone: u.phone || u.phoneNumber || '—',
            address: u.address || '—',
            department: u.department || '—',
            position: u.position || u.designation || 'Team Manager',
            joiningDate: u.joiningDate || u.createdAt || null,
            status: u.status || 'active',
          });
        } else {
          const stored = localStorage.getItem('manager_user') || localStorage.getItem('user');
          const u = stored ? JSON.parse(stored) : {};
          setManagerData({
            id: u.userId || u._id || '—',
            name: u.name || u.fullName || 'Manager User',
            email: u.email || '—',
            phone: u.phone || '—',
            address: u.address || '—',
            department: u.department || '—',
            position: u.position || 'Team Manager',
            joiningDate: u.joiningDate || null,
            status: u.status || 'active',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching manager profile:', error);
      const stored = localStorage.getItem('manager_user') || localStorage.getItem('user');
      const u = stored ? JSON.parse(stored) : {};
      setManagerData({
        id: '—', name: u.name || 'Manager User', email: u.email || '—',
        phone: '—', address: '—', department: '—', position: 'Team Manager',
        joiningDate: null, status: 'active',
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Photo handlers
 const handlePicChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { alert('2MB se kam honi chahiye'); return; }
  const reader = new FileReader();
  reader.onload = (ev) => {
    const base64 = ev.target.result;
    setProfilePic(base64);
    const email = managerData?.email || 'manager';
    localStorage.setItem(`manager_profile_pic_${email}`, base64);
    localStorage.setItem('manager_profile_pic', base64); // ✅ navbar sync
  };
  reader.readAsDataURL(file);
};

  const handleRemovePic = () => {
    setProfilePic(null);
    localStorage.removeItem('manager_profile_pic');
  };

  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    if (pwErrors[name]) setPwErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validatePassword = () => {
    const errs = {};
    if (!passwordForm.currentPassword) errs.currentPassword = 'Current password is required';
    if (!passwordForm.newPassword) errs.newPassword = 'New password is required';
    else if (passwordForm.newPassword.length < 6) errs.newPassword = 'Minimum 6 characters';
    if (passwordForm.newPassword !== passwordForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setPwLoading(true);
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: passwordForm.currentPassword,
          password: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('✅ Password changed successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        alert('❌ ' + (data.message || 'Failed to change password'));
      }
    } catch (error) {
      alert('❌ Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="manager-container">
        <ManagerNavbar />
        <div className="manager-layout">
          <ManagerSidebar />
          <div className="manager-content">
            <div style={S.loadingBox}>
              <div style={S.spinner}></div>
              <p style={{ color: '#6b7280', marginTop: 12 }}>Loading profile...</p>
            </div>
          </div>
        </div>
        <style>{spinnerCSS}</style>
      </div>
    );
  }

  return (
    <div className="manager-container">
      <ManagerNavbar />
      <div className="manager-layout">
        <ManagerSidebar />
        <div className="manager-content" style={{ padding: 24, background: '#f9fafb' }}>

          <div style={S.pageHeader}>
            <div>
              <h1 style={S.pageTitle}>👤 My Profile</h1>
              <p style={S.pageSub}>Your personal and work information</p>
            </div>
          </div>

          <div style={S.card}>
            {/* ✅ Avatar ki jagah photo */}
            <div style={S.profileTop}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {profilePic ? (
                  <img src={profilePic} alt="Profile"
                    style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #667eea', cursor: 'pointer' }}
                    onClick={() => fileInputRef.current.click()}
                  />
                ) : (
                  <div style={{ ...S.avatarXl, cursor: 'pointer' }} onClick={() => fileInputRef.current.click()}>
                    {(managerData.name || 'M').charAt(0).toUpperCase()}
                  </div>
                )}
                <div onClick={() => fileInputRef.current.click()}
                  style={{ position: 'absolute', bottom: 4, right: 4, background: '#667eea', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                  📷
                </div>
                <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handlePicChange} />
              </div>
              <div>
                <h2 style={S.empName}>{managerData.name}</h2>
                <p style={S.empPosition}>{managerData.position}</p>
                <span style={S.activeBadge}>✅ {managerData.status}</span>
                {profilePic && (
                  <button onClick={handleRemovePic}
                    style={{ marginTop: 6, display: 'block', background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 6, padding: '3px 10px', fontSize: 12, cursor: 'pointer' }}>
                    🗑️ Remove Photo
                  </button>
                )}
              </div>
            </div>

            <div style={S.divider} />

            {/* Personal Information */}
            <div style={S.section}>
              <h3 style={S.sectionTitle}>👤 Personal Information</h3>
              <div style={S.infoGrid}>
                <div style={S.infoItem}>
                  <div style={S.infoLabel}>Manager ID</div>
                  <div style={S.infoValue}><span style={S.idBadge}>{managerData.id}</span></div>
                </div>
                <div style={S.infoItem}>
                  <div style={S.infoLabel}>Full Name</div>
                  <div style={S.infoValue}>{managerData.name}</div>
                </div>
                <div style={S.infoItem}>
                  <div style={S.infoLabel}>Email</div>
                  <div style={{ ...S.infoValue, color: '#667eea' }}>{managerData.email}</div>
                </div>
                <div style={S.infoItem}>
                  <div style={S.infoLabel}>Phone</div>
                  <div style={S.infoValue}>{managerData.phone}</div>
                </div>
                <div style={{ ...S.infoItem, gridColumn: '1 / -1' }}>
                  <div style={S.infoLabel}>Address</div>
                  <div style={S.infoValue}>{managerData.address}</div>
                </div>
              </div>
            </div>

            <div style={S.divider} />

            {/* Work Details */}
            <div style={S.section}>
              <h3 style={S.sectionTitle}>🏢 Work Details</h3>
              <div style={S.infoGrid}>
                <div style={S.infoItem}>
                  <div style={S.infoLabel}>Department</div>
                  <div style={S.infoValue}>{managerData.department}</div>
                </div>
                <div style={S.infoItem}>
                  <div style={S.infoLabel}>Position</div>
                  <div style={S.infoValue}>{managerData.position}</div>
                </div>
                <div style={S.infoItem}>
                  <div style={S.infoLabel}>Joining Date</div>
                  <div style={S.infoValue}>
                    {managerData.joiningDate ? new Date(managerData.joiningDate).toLocaleDateString('en-GB') : '—'}
                  </div>
                </div>
                <div style={S.infoItem}>
                  <div style={S.infoLabel}>Status</div>
                  <div style={S.infoValue}><span style={S.activeBadge}>✅ {managerData.status}</span></div>
                </div>
              </div>
            </div>

            <div style={S.divider} />

            {/* Change Password */}
            <div style={S.section}>
              <h3 style={S.sectionTitle}>🔒 Change Password</h3>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
                Keep your account secure with a strong password.
              </p>
              <form onSubmit={handlePasswordSubmit}>
                <div style={S.pwGrid}>
                  {[
                    { key: 'current', name: 'currentPassword', label: 'Current Password *', placeholder: 'Enter current password' },
                    { key: 'new', name: 'newPassword', label: 'New Password *', placeholder: 'Min 6 characters' },
                    { key: 'confirm', name: 'confirmPassword', label: 'Confirm Password *', placeholder: 'Confirm new password' },
                  ].map(({ key, name, label, placeholder }) => (
                    <div key={key} style={S.formGroup}>
                      <label style={S.label}>{label}</label>
                      <div style={S.inputWrap}>
                        <input
                          type={showPasswords[key] ? 'text' : 'password'}
                          name={name}
                          value={passwordForm[name]}
                          onChange={handlePwChange}
                          placeholder={placeholder}
                          style={{ ...S.input, borderColor: pwErrors[name] ? '#ef4444' : '#e5e7eb' }}
                        />
                        <button type="button" style={S.eyeBtn}
                          onClick={() => setShowPasswords(p => ({ ...p, [key]: !p[key] }))}>
                          {showPasswords[key] ? '🙈' : '👁️'}
                        </button>
                      </div>
                      {pwErrors[name] && <span style={S.errorText}>{pwErrors[name]}</span>}
                    </div>
                  ))}
                </div>

                <div style={S.pwRequirements}>
                  <div style={S.reqTitle}>Password Requirements:</div>
                  <div style={S.reqList}>
                    {[
                      { check: passwordForm.newPassword.length >= 6, label: 'At least 6 characters' },
                      { check: /[A-Z]/.test(passwordForm.newPassword), label: 'Uppercase letter' },
                      { check: /[0-9]/.test(passwordForm.newPassword), label: 'Number' },
                    ].map(({ check, label }) => (
                      <span key={label} style={{ color: check ? '#10b981' : '#9ca3af' }}>
                        {check ? '✅' : '○'} {label}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={S.pwActions}>
                  <button type="button" style={S.btnSecondary} disabled={pwLoading}
                    onClick={() => { setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPwErrors({}); }}>
                    Reset
                  </button>
                  <button type="submit" style={S.btnPrimary} disabled={pwLoading}>
                    {pwLoading ? '⏳ Changing...' : '🔒 Change Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
            <button style={S.btnPrimary} onClick={() => navigate('/manager/my-employees')}>👥 View My Team</button>
            <button style={S.btnSecondary} onClick={() => navigate('/manager/dashboard')}>🏠 Go to Dashboard</button>
          </div>

        </div>
      </div>
      <style>{spinnerCSS}</style>
    </div>
  );
};

const spinnerCSS = `@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`;

const S = {
  loadingBox:   { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400 },
  spinner:      { width: 48, height: 48, border: '4px solid #f3f3f3', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  pageHeader:   { marginBottom: 24 },
  pageTitle:    { fontSize: 26, fontWeight: 700, background: 'linear-gradient(135deg,#667eea,#764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 0 4px 0' },
  pageSub:      { fontSize: 14, color: '#6b7280', margin: 0 },
  card:         { background: 'white', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: 20 },
  profileTop:   { display: 'flex', alignItems: 'center', gap: 24, padding: '32px 32px 24px' },
  avatarXl:     { width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 32, fontWeight: 700, flexShrink: 0 },
  empName:      { fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 4px 0' },
  empPosition:  { fontSize: 15, color: '#6b7280', margin: '0 0 10px 0' },
  activeBadge:  { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: 'rgba(16,185,129,0.1)', color: '#059669', borderRadius: 20, fontSize: 12, fontWeight: 600, border: '1px solid rgba(16,185,129,0.2)', textTransform: 'capitalize' },
  divider:      { height: 1, background: '#f3f4f6', margin: '0 24px' },
  section:      { padding: '24px 32px' },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 20px 0' },
  infoGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 },
  infoItem:     { display: 'flex', flexDirection: 'column', gap: 6 },
  infoLabel:    { fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' },
  infoValue:    { fontSize: 15, fontWeight: 600, color: '#111827' },
  idBadge:      { display: 'inline-block', padding: '3px 10px', background: '#ede9fe', color: '#7c3aed', borderRadius: 20, fontSize: 13, fontWeight: 700 },
  pwGrid:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 20 },
  formGroup:    { display: 'flex', flexDirection: 'column', gap: 6 },
  label:        { fontSize: 13, fontWeight: 600, color: '#374151' },
  inputWrap:    { position: 'relative', display: 'flex', alignItems: 'center' },
  input:        { width: '100%', padding: '11px 44px 11px 14px', border: '2px solid', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  eyeBtn:       { position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4 },
  errorText:    { fontSize: 12, color: '#ef4444', marginTop: 2 },
  pwRequirements: { background: '#f9fafb', borderRadius: 10, padding: '14px 18px', marginBottom: 20, border: '1px solid #e5e7eb' },
  reqTitle:     { fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 },
  reqList:      { display: 'flex', gap: 20, flexWrap: 'wrap' },
  pwActions:    { display: 'flex', gap: 12, justifyContent: 'flex-end' },
  btnPrimary:   { padding: '11px 24px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSecondary: { padding: '11px 24px', background: 'white', color: '#667eea', border: '2px solid #667eea', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};

export default ManagerProfile;