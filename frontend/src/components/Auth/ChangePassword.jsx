/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars, import/no-anonymous-default-export, jsx-a11y/anchor-is-valid */
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
  const [success, setSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ✅ Sahi token aur user get karo — role ke hisaab se
  const getTokenAndUser = () => {
    const path = window.location.pathname;
    let role = 'employee';
    if (path.startsWith('/admin')) role = 'admin';
    else if (path.startsWith('/manager')) role = 'manager';
    else if (path.startsWith('/employee')) role = 'employee';

    // Sab roles check karo
    for (const r of ['admin', 'manager', 'employee']) {
      const token = localStorage.getItem(`${r}_token`);
      const userStr = localStorage.getItem(`${r}_user`);
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          return { token, user, role: r };
        } catch (e) {}
      }
    }
    return { token: null, user: null, role: null };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setSuccess('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.currentPassword) newErrors.currentPassword = 'Current password is required';
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
      // ✅ Sahi token use karo
      const { token, user, role } = getTokenAndUser();

      if (!token) {
        setErrors({ submit: 'Session expired. Please login again.' });
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/v1/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword: formData.currentPassword,    // ✅ backend 'oldPassword' expect karta hai
          password: formData.newPassword,            // ✅ backend 'password' expect karta hai
          confirmPassword: formData.confirmPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      setSuccess('✅ Password changed successfully!');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });

      // ✅ Role ke hisaab se redirect
      setTimeout(() => {
        if (role === 'admin') navigate('/admin/profile');
        else if (role === 'manager') navigate('/manager/profile');
        else navigate('/employee/profile');
      }, 1500);

    } catch (error) {
      console.error('Change password error:', error);
      setErrors({ submit: error.message || 'Failed to change password. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        maxWidth: '450px',
        width: '100%'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔐</div>
          <h1 style={{ color: '#4f46e5', fontSize: '1.8rem', margin: '0 0 8px' }}>Change Password</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Enter your current password to set a new one</p>
        </div>

        {/* Success Message */}
        {success && (
          <div style={{
            background: '#d1fae5', color: '#065f46', padding: '12px',
            borderRadius: '8px', marginBottom: '20px', border: '1px solid #6ee7b7',
            textAlign: 'center', fontWeight: '500'
          }}>
            {success}
          </div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <div style={{
            background: '#fee2e2', color: '#991b1b', padding: '12px',
            borderRadius: '8px', marginBottom: '20px', border: '1px solid #fca5a5'
          }}>
            ⚠️ {errors.submit}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Current Password */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
              Current Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                disabled={loading}
                style={{
                  width: '100%', padding: '12px', paddingRight: '45px',
                  border: errors.currentPassword ? '1px solid #ef4444' : '1px solid #d1d5db',
                  borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'
                }}
              />
              <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>
                {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.currentPassword && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.currentPassword}</span>}
          </div>

          {/* New Password */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password (min 6 characters)"
                disabled={loading}
                style={{
                  width: '100%', padding: '12px', paddingRight: '45px',
                  border: errors.newPassword ? '1px solid #ef4444' : '1px solid #d1d5db',
                  borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'
                }}
              />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>
                {showNewPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.newPassword && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.newPassword}</span>}

            {/* Password Strength */}
            {formData.newPassword && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '2px', transition: 'all 0.3s',
                    width: `${passwordStrength.percentage}%`,
                    background: passwordStrength.strength === 'weak' ? '#ef4444' :
                                passwordStrength.strength === 'medium' ? '#f59e0b' : '#10b981'
                  }} />
                </div>
                <span style={{
                  fontSize: '12px', fontWeight: '500',
                  color: passwordStrength.strength === 'weak' ? '#ef4444' :
                         passwordStrength.strength === 'medium' ? '#f59e0b' : '#10b981'
                }}>
                  {passwordStrength.strength === 'weak' ? 'Weak' :
                   passwordStrength.strength === 'medium' ? 'Medium' : 'Strong'}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
              Confirm New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                disabled={loading}
                style={{
                  width: '100%', padding: '12px', paddingRight: '45px',
                  border: errors.confirmPassword ? '1px solid #ef4444' : '1px solid #d1d5db',
                  borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'
                }}
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.confirmPassword && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.confirmPassword}</span>}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={loading}
              style={{
                flex: 1, padding: '12px', background: '#f3f4f6', color: '#374151',
                border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px',
                fontWeight: '500', cursor: 'pointer'
              }}
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                flex: 2, padding: '12px',
                background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px',
                fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '⏳ Changing...' : '🔐 Change Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
