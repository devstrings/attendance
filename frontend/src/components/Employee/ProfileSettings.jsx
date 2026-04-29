import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeNavbar from './EmployeeNavbar';
import '../../styles/Employee.css';

const ProfileSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);

  // Personal Info State
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Password State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = () => {
    // Fetch from localStorage or API
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setPersonalInfo({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '+92 300 1234567',
        address: user.address || 'Street 123, Faisalabad, Punjab, Pakistan'
      });
    }
  };

  // Personal Info Handlers
  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePersonalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // API call karenge profile update karne ke liye
      // await updateProfileAPI(personalInfo);
      
      setTimeout(() => {
        localStorage.setItem('user', JSON.stringify(personalInfo));
        alert('Profile updated successfully!');
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
      setLoading(false);
    }
  };

  // Password Handlers
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
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
    const token = localStorage.getItem("employee_token");
    if (!token) {
      alert("Session expired. Please login again.");
      setLoading(false);
      return;
    }

    const response = await fetch("http://localhost:5000/api/v1/auth/change-password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        oldPassword: passwordForm.currentPassword,
        password: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      })
    });

    const data = await response.json();

    if (data.success) {
      alert("✅ Password changed successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      alert(data.message || "Failed to change password");
    }
  } catch (error) {
    alert(error.message || "Failed to change password");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="employee-container">
      <EmployeeNavbar />
      <div className="employee-content">
        <div className="page-header">
          <h1>Profile Settings</h1>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/employee/profile')}
          >
            ← Back to Profile
          </button>
        </div>

        <div className="tabs-container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              👤 Personal Info
            </button>
            <button
              className={`tab ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              🔒 Change Password
            </button>
          </div>
        </div>

        <div className="settings-content">
          {activeTab === 'personal' && (
            <div className="settings-section">
              <h2>Update Personal Information</h2>
              <p className="section-description">
                Update your personal details below. Changes will be reflected across the system.
              </p>
              
              <form onSubmit={handlePersonalSubmit} className="settings-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={personalInfo.name}
                      onChange={handlePersonalChange}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={personalInfo.email}
                      onChange={handlePersonalChange}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={personalInfo.phone}
                      onChange={handlePersonalChange}
                      placeholder="+92 300 1234567"
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="address">Address</label>
                    <textarea
                      id="address"
                      name="address"
                      value={personalInfo.address}
                      onChange={handlePersonalChange}
                      placeholder="Enter your complete address"
                      rows="3"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => navigate('/employee/profile')}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="settings-section">
              <h2>Change Password</h2>
              <p className="section-description">
                Ensure your password is strong and secure. Use a combination of letters, numbers, and symbols.
              </p>

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
                      placeholder="Enter current password"
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
                      placeholder="Enter new password (min 6 characters)"
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
                      placeholder="Confirm new password"
                      className={errors.confirmPassword ? 'error' : ''}
                    />
                    {errors.confirmPassword && (
                      <span className="error-text">{errors.confirmPassword}</span>
                    )}
                  </div>
                </div>

                <div className="password-requirements">
                  <h4>Password Requirements:</h4>
                  <ul>
                    <li>At least 6 characters long</li>
                    <li>Recommended: Include uppercase and lowercase letters</li>
                    <li>Recommended: Include numbers and special characters</li>
                  </ul>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => {
                      setPasswordForm({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                      setErrors({});
                    }}
                    disabled={loading}
                  >
                    Reset
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="info-box">
          <h3>ℹ️ Important Notes</h3>
          <ul>
            <li>Your personal information is private and secure</li>
            <li>Contact your manager if you need to update employment details</li>
            <li>Keep your password secure and don't share it with anyone</li>
            <li>If you forget your password, use the "Forgot Password" option on the login page</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;