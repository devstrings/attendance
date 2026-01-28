import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Auth.css';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 'none', percentage: 0 };
    
    let strength = 0;
    
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;

    if (strength < 40) return { strength: 'weak', percentage: strength };
    if (strength < 70) return { strength: 'medium', percentage: strength };
    return { strength: 'strong', percentage: strength };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  setLoading(true);

  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch('http://localhost:5000/api/v1/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to change password');
    }

    alert('Password changed successfully!');
    
    // Reset form
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    // Navigate back based on user role
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'admin') {
      navigate('/admin/settings');
    } else if (user.role === 'manager') {
      navigate('/manager/dashboard');
    } else {
      navigate('/employee/profile-settings');
    }
    
    setLoading(false);
  } catch (error) {
    console.error('Change password error:', error);
    setErrors({ submit: error.message || 'Failed to change password. Please check your current password.' });
    setLoading(false);
  }
};

  const handleCancel = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'admin') {
      navigate('/admin/settings');
    } else if (user.role === 'manager') {
      navigate('/manager/dashboard');
    } else {
      navigate('/employee/profile-settings');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon">🔐</span>
          </div>
          <h1>Change Password</h1>
          <p>Update your account password</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <div className="password-input-wrapper">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                className={errors.currentPassword ? 'error' : ''}
                autoFocus
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.currentPassword && <span className="error-text">{errors.currentPassword}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password (min 6 characters)"
                className={errors.newPassword ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
            
            {formData.newPassword && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className={`strength-fill ${passwordStrength.strength}`}
                    style={{ width: `${passwordStrength.percentage}%` }}
                  />
                </div>
                <span className={`strength-label ${passwordStrength.strength}`}>
                  {passwordStrength.strength === 'weak' && 'Weak'}
                  {passwordStrength.strength === 'medium' && 'Medium'}
                  {passwordStrength.strength === 'strong' && 'Strong'}
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                className={errors.confirmPassword ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          {errors.submit && <span className="error-text center">{errors.submit}</span>}

          <div className="password-requirements">
            <h4>Password Requirements:</h4>
            <ul>
              <li className={formData.newPassword.length >= 6 ? 'valid' : ''}>
                At least 6 characters
              </li>
              <li className={/[a-z]/.test(formData.newPassword) && /[A-Z]/.test(formData.newPassword) ? 'valid' : ''}>
                Mix of uppercase and lowercase letters (recommended)
              </li>
              <li className={/\d/.test(formData.newPassword) ? 'valid' : ''}>
                At least one number (recommended)
              </li>
              <li className={/[^a-zA-Z0-9]/.test(formData.newPassword) ? 'valid' : ''}>
                At least one special character (recommended)
              </li>
              <li className={formData.newPassword && formData.newPassword !== formData.currentPassword ? 'valid' : ''}>
                Different from current password
              </li>
            </ul>
          </div>

          <div className="form-actions-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </form>

        <div className="auth-info">
          <div className="security-tips">
            <h4>Security Tips:</h4>
            <ul>
              <li>Use a unique password you don't use elsewhere</li>
              <li>Don't share your password with anyone</li>
              <li>Change your password regularly</li>
              <li>Use a mix of letters, numbers, and symbols</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;