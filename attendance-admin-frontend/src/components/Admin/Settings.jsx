import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import '../../styles/Admin.css';

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: 'Admin User',
    email: 'admin@example.com',
    phone: '+92 300 0000000',
    address: 'Faisalabad, Punjab, Pakistan'
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // System Settings State
  const [systemSettings, setSystemSettings] = useState({
    companyName: 'Attendance System',
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
    weekendDays: ['Saturday', 'Sunday'],
    overtimeRate: 1.5,
    lateMarkingMinutes: 15,
    emailNotifications: true,
    smsNotifications: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Fetch current settings from API or localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setProfileForm({
        name: user.name || 'Admin User',
        email: user.email || 'admin@example.com',
        phone: user.phone || '+92 300 0000000',
        address: user.address || 'Faisalabad, Punjab, Pakistan'
      });
    }
  }, []);

  // Profile Functions
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // API call karenge
      // await updateProfileAPI(profileForm);
      
      setTimeout(() => {
        localStorage.setItem('user', JSON.stringify(profileForm));
        alert('Profile updated successfully!');
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
      setLoading(false);
    }
  };

  // Password Functions
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) return;

    setLoading(true);

    try {
      // API call karenge
      // await updatePasswordAPI(passwordForm);
      
      setTimeout(() => {
        alert('Password updated successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Failed to update password. Please check your current password.');
      setLoading(false);
    }
  };

  // System Settings Functions
  const handleSystemChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSystemSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSystemSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // API call karenge
      // await updateSystemSettingsAPI(systemSettings);
      
      setTimeout(() => {
        alert('System settings updated successfully!');
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error updating system settings:', error);
      alert('Failed to update system settings');
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <AdminNavbar />
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <div className="page-header">
            <h1>Settings</h1>
          </div>

          <div className="tabs-container">
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                👤 Profile
              </button>
              <button
                className={`tab ${activeTab === 'password' ? 'active' : ''}`}
                onClick={() => setActiveTab('password')}
              >
                🔒 Password
              </button>
              <button
                className={`tab ${activeTab === 'system' ? 'active' : ''}`}
                onClick={() => setActiveTab('system')}
              >
                ⚙️ System
              </button>
            </div>
          </div>

          <div className="settings-content">
            {activeTab === 'profile' && (
              <div className="form-container">
                <h2>Profile Settings</h2>
                <form onSubmit={handleProfileSubmit} className="settings-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="name">Full Name *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={profileForm.name}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone Number *</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={profileForm.phone}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="address">Address</label>
                      <textarea
                        id="address"
                        name="address"
                        value={profileForm.address}
                        onChange={handleProfileChange}
                        rows="3"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="form-container">
                <h2>Change Password</h2>
                <form onSubmit={handlePasswordSubmit} className="settings-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="currentPassword">Current Password *</label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        className={errors.currentPassword ? 'error' : ''}
                      />
                      {errors.currentPassword && (
                        <span className="error-text">{errors.currentPassword}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="newPassword">New Password *</label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        className={errors.newPassword ? 'error' : ''}
                      />
                      {errors.newPassword && (
                        <span className="error-text">{errors.newPassword}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm New Password *</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        className={errors.confirmPassword ? 'error' : ''}
                      />
                      {errors.confirmPassword && (
                        <span className="error-text">{errors.confirmPassword}</span>
                      )}
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Change Password'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="form-container">
                <h2>System Settings</h2>
                <form onSubmit={handleSystemSubmit} className="settings-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="companyName">Company Name *</label>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={systemSettings.companyName}
                        onChange={handleSystemChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="workingHoursStart">Working Hours Start *</label>
                      <input
                        type="time"
                        id="workingHoursStart"
                        name="workingHoursStart"
                        value={systemSettings.workingHoursStart}
                        onChange={handleSystemChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="workingHoursEnd">Working Hours End *</label>
                      <input
                        type="time"
                        id="workingHoursEnd"
                        name="workingHoursEnd"
                        value={systemSettings.workingHoursEnd}
                        onChange={handleSystemChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="overtimeRate">Overtime Rate (multiplier) *</label>
                      <input
                        type="number"
                        id="overtimeRate"
                        name="overtimeRate"
                        value={systemSettings.overtimeRate}
                        onChange={handleSystemChange}
                        step="0.1"
                        min="1"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="lateMarkingMinutes">Late Marking (minutes) *</label>
                      <input
                        type="number"
                        id="lateMarkingMinutes"
                        name="lateMarkingMinutes"
                        value={systemSettings.lateMarkingMinutes}
                        onChange={handleSystemChange}
                        min="0"
                        required
                      />
                    </div>

                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="emailNotifications"
                          checked={systemSettings.emailNotifications}
                          onChange={handleSystemChange}
                        />
                        <span>Enable Email Notifications</span>
                      </label>
                    </div>

                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="smsNotifications"
                          checked={systemSettings.smsNotifications}
                          onChange={handleSystemChange}
                        />
                        <span>Enable SMS Notifications</span>
                      </label>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Settings'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;