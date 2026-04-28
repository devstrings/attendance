import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Auth.css';

const Login = ({ userType }) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');

  // ✅ REMOVED: Auto-redirect check
  // Users should ALWAYS see login page when coming from landing
  // Only redirect to dashboard AFTER successful login

  const getPageConfig = () => {
    switch (userType) {
      case 'admin':
        return {
          title: 'Admin Login',
          subtitle: 'Sign in to Admin Portal',
          icon: '👨‍💼',
          color: '#dc3545',
          gradient: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
        };
      case 'manager':
        return {
          title: 'Manager Login',
          subtitle: 'Sign in to Manager Portal',
          icon: '👔',
          color: '#007bff',
          gradient: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)'
        };
      case 'employee':
        return {
          title: 'Employee Login',
          subtitle: 'Sign in to Employee Portal',
          icon: '👤',
          color: '#28a745',
          gradient: 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)'
        };
      default:
        return {
          title: 'Login',
          subtitle: 'Sign in',
          icon: '📊',
          color: '#6c757d',
          gradient: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)'
        };
    }
  };

  const pageConfig = getPageConfig();

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
    setApiError('');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      console.log(`🔄 Attempting ${userType} login with:`, formData.email);

      const response = await fetch('http://localhost:5000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log('📥 Server Response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (!data.success || !data.data) {
        throw new Error('Invalid response from server');
      }

      const { token, user } = data.data;

      if (!token || !user || !user.role) {
        throw new Error('Invalid login response - missing token or user data');
      }

      const userRole = user.role.toLowerCase();
      console.log('👤 User Role from server:', userRole);
      console.log('🎯 Expected Role:', userType);

      // ✅ STRICT ROLE VALIDATION
      if (userRole !== userType.toLowerCase()) {
        throw new Error(
          `Access Denied! This is ${userType.toUpperCase()} portal. Please use /${userRole}/login`
        );
      }

      // ✅ Save credentials for this role only
      const tokenKey = `${userRole}_token`;
      const userKey = `${userRole}_user`;
      
      localStorage.setItem(tokenKey, token);
      localStorage.setItem(userKey, JSON.stringify(user));

      console.log('✅ Login successful!');
      console.log(`💾 Credentials saved: ${tokenKey}, ${userKey}`);
      console.log('🔄 Redirecting to dashboard...');

      // ✅ Redirect to dashboard after successful login
      setTimeout(() => {
        navigate(`/${userRole}/dashboard`, { replace: true });
      }, 100);
      
    } catch (error) {
      console.error('❌ Login error:', error);
      setApiError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ 
      background: pageConfig.gradient,
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        maxWidth: '450px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ 
            background: pageConfig.color,
            fontSize: '3rem',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            {pageConfig.icon}
          </div>
          <h1 style={{ color: pageConfig.color, marginBottom: '10px', fontSize: '1.8rem' }}>
            {pageConfig.title}
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            {pageConfig.subtitle}
          </p>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button 
            onClick={() => navigate('/')}
            style={{
              padding: '8px 20px',
              background: 'transparent',
              color: pageConfig.color,
              border: `2px solid ${pageConfig.color}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = pageConfig.color;
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = pageConfig.color;
            }}
          >
            ← Back to Home
          </button>
        </div>

        {apiError && (
          <div style={{
            backgroundColor: '#fee',
            color: '#c00',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #fcc',
            fontSize: '14px'
          }}>
            <strong>⚠️</strong> {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
              disabled={loading}
              autoComplete="email"
              style={{
                width: '100%',
                padding: '12px',
                border: errors.email ? '1px solid #dc3545' : '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            {errors.email && <span style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.email}</span>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                disabled={loading}
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: errors.password ? '1px solid #dc3545' : '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  paddingRight: '40px'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && <span style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.password}</span>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#666', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading} 
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                color: pageConfig.color,
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'none'
              }}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              background: pageConfig.gradient,
              padding: '12px',
              fontSize: '16px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              width: '100%'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
            © 2025 Attendance System
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;