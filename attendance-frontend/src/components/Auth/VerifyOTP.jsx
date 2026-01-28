import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Auth.css';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Check if email exists in session
    const email = sessionStorage.getItem('reset_email');
    if (!email) {
      navigate('/forgot-password');
    }

    // Start resend timer
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    // Focus last filled input or next empty
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  const otpCode = otp.join('');
  const email = sessionStorage.getItem('reset_email');
  
  if (otpCode.length !== 6) {
    setError('Please enter the complete 6-digit code');
    return;
  }

  setLoading(true);

  try {
    const response = await fetch('http://localhost:5000/api/v1/auth/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp: otpCode })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Invalid OTP');
    }

    sessionStorage.setItem('otp_verified', 'true');
    navigate('/reset-password');
    setLoading(false);
  } catch (error) {
    console.error('OTP verification error:', error);
    setError(error.message || 'Invalid OTP code. Please try again.');
    setLoading(false);
  }
};

  const handleResend = async () => {
    if (!canResend) return;

    setLoading(true);
    setCanResend(false);
    setResendTimer(60);

    try {
      // API call karenge OTP resend karne ke liye
      // await resendOTPAPI();

      setTimeout(() => {
        alert('New OTP sent to your email!');
        setOtp(['', '', '', '', '', '']);
        setLoading(false);
        
        // Restart timer
        const timer = setInterval(() => {
          setResendTimer(prev => {
            if (prev <= 1) {
              setCanResend(true);
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, 1000);
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError('Failed to resend OTP. Please try again.');
      setLoading(false);
    }
  };

  const email = sessionStorage.getItem('reset_email');

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon">🔐</span>
          </div>
          <h1>Verify OTP</h1>
          <p>Enter the 6-digit code sent to</p>
          <p className="email-highlight">{email}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="otp-input-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`otp-input ${error ? 'error' : ''}`}
                autoFocus={index === 0}
              />
            ))}
          </div>
          
          {error && <span className="error-text center">{error}</span>}

          <div className="resend-section">
            {canResend ? (
              <button
                type="button"
                className="link-button"
                onClick={handleResend}
                disabled={loading}
              >
                Resend OTP
              </button>
            ) : (
              <p className="timer-text">
                Resend OTP in {resendTimer} seconds
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={loading || otp.join('').length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>

        <div className="auth-footer">
          <button
            className="link-button"
            onClick={() => navigate('/forgot-password')}
          >
            ← Change Email
          </button>
        </div>

        <div className="auth-info">
          <p className="note">
            Enter the 6-digit code from your email. The code expires in 10 minutes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;