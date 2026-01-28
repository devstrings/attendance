import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = () => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid');
      return false;
    }
    return true;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  if (!validateEmail()) return;

  setLoading(true);

  try {
    const response = await fetch('http://localhost:5000/api/v1/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send reset email');
    }

    setEmailSent(true);
    sessionStorage.setItem('reset_email', email);
    setLoading(false);
  } catch (error) {
    console.error('Forgot password error:', error);
    setError(error.message || 'Failed to send reset email. Please try again.');
    setLoading(false);
  }
};

  const handleResendEmail = () => {
    setEmailSent(false);
    handleSubmit({ preventDefault: () => {} });
  };

  if (emailSent) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <div className="auth-header">
            <div className="success-icon">✅</div>
            <h1>Check Your Email</h1>
            <p>We've sent a verification code to</p>
            <p className="email-highlight">{email}</p>
          </div>

          <div className="auth-message">
            <p>Please check your email inbox and enter the OTP code to reset your password.</p>
            <p className="note">Didn't receive the email? Check your spam folder or try again.</p>
          </div>

          <div className="auth-actions">
            <button
              className="btn-submit"
              onClick={() => navigate('/verify-otp')}
            >
              Enter OTP Code
            </button>
            <button
              className="btn-secondary"
              onClick={handleResendEmail}
            >
              Resend Email
            </button>
          </div>

          <div className="auth-footer">
            <button
              className="link-button"
              onClick={() => navigate('/login')}
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon">🔒</span>
          </div>
          <h1>Forgot Password?</h1>
          <p>Enter your email to reset your password</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="your.email@example.com"
              className={error ? 'error' : ''}
              autoComplete="email"
              autoFocus
            />
            {error && <span className="error-text">{error}</span>}
          </div>

          <div className="info-message">
            <p>We'll send you an OTP (One-Time Password) to verify your identity.</p>
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>

        <div className="auth-footer">
          <button
            className="link-button"
            onClick={() => navigate('/login')}
          >
            ← Back to Login
          </button>
        </div>

        <div className="auth-info">
          <p>© 2025 Attendance System. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;