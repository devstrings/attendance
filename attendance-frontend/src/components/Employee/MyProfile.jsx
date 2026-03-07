import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeNavbar from './EmployeeNavbar';
import '../../styles/Employee.css';

const MyProfile = () => {
  const navigate = useNavigate();
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Change Password State ──
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false, new: false, confirm: false
  });

  useEffect(() => { fetchProfileData(); }, []);

  const fetchProfileData = async () => {
    try {
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

  // ── Password handlers ──
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
      // await changePasswordAPI(passwordForm);
      setTimeout(() => {
        alert('✅ Password changed successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPwLoading(false);
      }, 1000);
    } catch (error) {
      alert('❌ Failed to change password');
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="employee-container">
        <EmployeeNavbar />
        <div className="employee-content">
          <div style={S.loadingBox}>
            <div style={S.spinner}></div>
            <p style={{ color: '#6b7280', marginTop: 12 }}>Loading profile...</p>
          </div>
          <style>{spinnerCSS}</style>
        </div>
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="employee-container">
        <EmployeeNavbar />
        <div className="employee-content">
          <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Profile not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-container">
      <EmployeeNavbar />
      <div className="employee-content" style={S.content}>

        {/* ── Page Header ── */}
        <div style={S.pageHeader}>
          <div>
            <h1 style={S.pageTitle}>👤 My Profile</h1>
            <p style={S.pageSubtitle}>Your personal and employment information</p>
          </div>
        </div>

        {/* ── Profile Card ── */}
        <div style={S.card}>
          {/* Avatar + Name */}
          <div style={S.profileTop}>
            <div style={S.avatarXl}>{employeeData.name.charAt(0).toUpperCase()}</div>
            <div>
              <h2 style={S.empName}>{employeeData.name}</h2>
              <p style={S.empPosition}>{employeeData.position}</p>
              <span style={S.activeBadge}>✅ {employeeData.status}</span>
            </div>
          </div>

          <div style={S.divider}></div>

          {/* ── Personal Information ── */}
          <div style={S.section}>
            <h3 style={S.sectionTitle}>👤 Personal Information</h3>
            <div style={S.infoGrid}>
              <div style={S.infoItem}>
                <div style={S.infoLabel}>Employee ID</div>
                <div style={S.infoValue}><span style={S.idBadge}>{employeeData.id}</span></div>
              </div>
              <div style={S.infoItem}>
                <div style={S.infoLabel}>Full Name</div>
                <div style={S.infoValue}>{employeeData.name}</div>
              </div>
              <div style={S.infoItem}>
                <div style={S.infoLabel}>Email</div>
                <div style={{ ...S.infoValue, color: '#667eea' }}>{employeeData.email}</div>
              </div>
              <div style={S.infoItem}>
                <div style={S.infoLabel}>Phone</div>
                <div style={S.infoValue}>{employeeData.phone}</div>
              </div>
              <div style={{ ...S.infoItem, gridColumn: '1 / -1' }}>
                <div style={S.infoLabel}>Address</div>
                <div style={S.infoValue}>{employeeData.address}</div>
              </div>
            </div>
          </div>

          <div style={S.divider}></div>

          {/* ── Employment Details ── */}
          <div style={S.section}>
            <h3 style={S.sectionTitle}>🏢 Employment Details</h3>
            <div style={S.infoGrid}>
              <div style={S.infoItem}>
                <div style={S.infoLabel}>Department</div>
                <div style={S.infoValue}>{employeeData.department}</div>
              </div>
              <div style={S.infoItem}>
                <div style={S.infoLabel}>Position</div>
                <div style={S.infoValue}>{employeeData.position}</div>
              </div>
              <div style={S.infoItem}>
                <div style={S.infoLabel}>Manager</div>
                <div style={S.infoValue}>{employeeData.manager}</div>
              </div>
              <div style={S.infoItem}>
                <div style={S.infoLabel}>Joining Date</div>
                <div style={S.infoValue}>{new Date(employeeData.joiningDate).toLocaleDateString('en-GB')}</div>
              </div>
              <div style={S.infoItem}>
                <div style={S.infoLabel}>Base Salary</div>
                <div style={{ ...S.infoValue, color: '#10b981', fontWeight: 700 }}>
                  PKR {employeeData.baseSalary.toLocaleString()}
                </div>
              </div>
              <div style={S.infoItem}>
                <div style={S.infoLabel}>Status</div>
                <div style={S.infoValue}><span style={S.activeBadge}>✅ {employeeData.status}</span></div>
              </div>
            </div>
          </div>

          <div style={S.divider}></div>

          {/* ── Attendance Summary ── */}
          <div style={S.section}>
            <h3 style={S.sectionTitle}>📊 Attendance Summary (This Month)</h3>
            <div style={S.statsGrid}>
              <div style={{ ...S.statCard, borderTopColor: '#10b981' }}>
                <div style={S.statLabel}>Present</div>
                <div style={{ ...S.statValue, color: '#10b981' }}>{employeeData.totalPresent}</div>
              </div>
              <div style={{ ...S.statCard, borderTopColor: '#ef4444' }}>
                <div style={S.statLabel}>Absent</div>
                <div style={{ ...S.statValue, color: '#ef4444' }}>{employeeData.totalAbsent}</div>
              </div>
              <div style={{ ...S.statCard, borderTopColor: '#f59e0b' }}>
                <div style={S.statLabel}>Leave</div>
                <div style={{ ...S.statValue, color: '#f59e0b' }}>{employeeData.totalLeave}</div>
              </div>
              <div style={{ ...S.statCard, borderTopColor: '#667eea' }}>
                <div style={S.statLabel}>Attendance Rate</div>
                <div style={{ ...S.statValue, color: '#667eea' }}>{employeeData.attendanceRate}%</div>
              </div>
            </div>
          </div>

          <div style={S.divider}></div>

          {/* ── Change Password ── */}
          <div style={S.section}>
            <h3 style={S.sectionTitle}>🔒 Change Password</h3>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
              Keep your account secure. Use a strong combination of letters, numbers, and symbols.
            </p>

            <form onSubmit={handlePasswordSubmit}>
              <div style={S.pwGrid}>

                {/* Current Password */}
                <div style={S.formGroup}>
                  <label style={S.label}>Current Password *</label>
                  <div style={S.inputWrap}>
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePwChange}
                      placeholder="Enter current password"
                      style={{ ...S.input, borderColor: pwErrors.currentPassword ? '#ef4444' : '#e5e7eb' }}
                    />
                    <button type="button" style={S.eyeBtn} onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}>
                      {showPasswords.current ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {pwErrors.currentPassword && <span style={S.errorText}>{pwErrors.currentPassword}</span>}
                </div>

                {/* New Password */}
                <div style={S.formGroup}>
                  <label style={S.label}>New Password *</label>
                  <div style={S.inputWrap}>
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePwChange}
                      placeholder="Min 6 characters"
                      style={{ ...S.input, borderColor: pwErrors.newPassword ? '#ef4444' : '#e5e7eb' }}
                    />
                    <button type="button" style={S.eyeBtn} onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}>
                      {showPasswords.new ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {pwErrors.newPassword && <span style={S.errorText}>{pwErrors.newPassword}</span>}
                </div>

                {/* Confirm Password */}
                <div style={S.formGroup}>
                  <label style={S.label}>Confirm New Password *</label>
                  <div style={S.inputWrap}>
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePwChange}
                      placeholder="Confirm new password"
                      style={{ ...S.input, borderColor: pwErrors.confirmPassword ? '#ef4444' : '#e5e7eb' }}
                    />
                    <button type="button" style={S.eyeBtn} onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}>
                      {showPasswords.confirm ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {pwErrors.confirmPassword && <span style={S.errorText}>{pwErrors.confirmPassword}</span>}
                </div>

              </div>

              {/* Password Requirements */}
              <div style={S.pwRequirements}>
                <div style={S.reqTitle}>Password Requirements:</div>
                <div style={S.reqList}>
                  <span style={{ color: passwordForm.newPassword.length >= 6 ? '#10b981' : '#9ca3af' }}>
                    {passwordForm.newPassword.length >= 6 ? '✅' : '○'} At least 6 characters
                  </span>
                  <span style={{ color: /[A-Z]/.test(passwordForm.newPassword) ? '#10b981' : '#9ca3af' }}>
                    {/[A-Z]/.test(passwordForm.newPassword) ? '✅' : '○'} Uppercase letter
                  </span>
                  <span style={{ color: /[0-9]/.test(passwordForm.newPassword) ? '#10b981' : '#9ca3af' }}>
                    {/[0-9]/.test(passwordForm.newPassword) ? '✅' : '○'} Number
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div style={S.pwActions}>
                <button
                  type="button"
                  style={S.btnSecondary}
                  onClick={() => { setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPwErrors({}); }}
                  disabled={pwLoading}
                >
                  Reset
                </button>
                <button type="submit" style={S.btnPrimary} disabled={pwLoading}>
                  {pwLoading ? '⏳ Changing...' : '🔒 Change Password'}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* ── Action Buttons ── */}
        <div style={S.actionRow}>
          <button style={S.btnPrimary} onClick={() => navigate('/employee/my-attendance')}>
            📝 View My Attendance
          </button>
          <button style={S.btnSecondary} onClick={() => navigate('/employee/attendance-history')}>
            📅 Attendance History
          </button>
        </div>

      </div>
      <style>{spinnerCSS}</style>
    </div>
  );
};

const spinnerCSS = `@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`;

const S = {
  content:    { padding: 24, background: '#f9fafb', minHeight: 'calc(100vh - 80px)' },
  loadingBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400 },
  spinner:    { width: 48, height: 48, border: '4px solid #f3f3f3', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' },

  pageHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  pageTitle:   { fontSize: 26, fontWeight: 700, background: 'linear-gradient(135deg,#667eea,#764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 0 4px 0' },
  pageSubtitle:{ fontSize: 14, color: '#6b7280', margin: 0 },

  card:       { background: 'white', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: 20 },
  profileTop: { display: 'flex', alignItems: 'center', gap: 24, padding: '32px 32px 24px' },
  avatarXl:   { width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 32, fontWeight: 700, flexShrink: 0 },
  empName:    { fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 4px 0' },
  empPosition:{ fontSize: 15, color: '#6b7280', margin: '0 0 10px 0' },
  activeBadge:{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: 'rgba(16,185,129,0.1)', color: '#059669', borderRadius: 20, fontSize: 12, fontWeight: 600, border: '1px solid rgba(16,185,129,0.2)', textTransform: 'capitalize' },

  divider:    { height: 1, background: '#f3f4f6', margin: '0 24px' },
  section:    { padding: '24px 32px' },
  sectionTitle:{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8 },

  infoGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 },
  infoItem:   { display: 'flex', flexDirection: 'column', gap: 6 },
  infoLabel:  { fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' },
  infoValue:  { fontSize: 15, fontWeight: 600, color: '#111827' },
  idBadge:    { display: 'inline-block', padding: '3px 10px', background: '#ede9fe', color: '#7c3aed', borderRadius: 20, fontSize: 13, fontWeight: 700 },

  statsGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 },
  statCard:   { background: '#f9fafb', borderRadius: 12, padding: '16px 20px', textAlign: 'center', borderTop: '4px solid', border: '1px solid #e5e7eb' },
  statLabel:  { fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 },
  statValue:  { fontSize: 32, fontWeight: 800 },

  // Password form
  pwGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 20 },
  formGroup:  { display: 'flex', flexDirection: 'column', gap: 6 },
  label:      { fontSize: 13, fontWeight: 600, color: '#374151' },
  inputWrap:  { position: 'relative', display: 'flex', alignItems: 'center' },
  input:      { width: '100%', padding: '11px 44px 11px 14px', border: '2px solid', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  eyeBtn:     { position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4 },
  errorText:  { fontSize: 12, color: '#ef4444', marginTop: 2 },

  pwRequirements: { background: '#f9fafb', borderRadius: 10, padding: '14px 18px', marginBottom: 20, border: '1px solid #e5e7eb' },
  reqTitle:   { fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 },
  reqList:    { display: 'flex', gap: 20, flexWrap: 'wrap' },

  pwActions:  { display: 'flex', gap: 12, justifyContent: 'flex-end' },
  btnPrimary: { padding: '11px 24px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSecondary:{ padding: '11px 24px', background: 'white', color: '#667eea', border: '2px solid #667eea', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },

  actionRow:  { display: 'flex', gap: 12, flexWrap: 'wrap' },
};

export default MyProfile;