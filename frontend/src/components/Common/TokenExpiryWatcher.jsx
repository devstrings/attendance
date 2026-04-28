import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * TokenExpiryWatcher
 * - Har role ke liye kaam karta hai (admin, manager, employee)
 * - Token expire hone se 2 minute pehle warning modal dikhata hai
 * - 2 minute countdown ke baad auto logout
 * - Agar user "Stay Logged In" click kare to kuch nahi hota (token refresh nahi hai, sirf warning band hoti hai)
 */
const TokenExpiryWatcher = ({ role }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(120); // 2 minutes
  const countdownRef = useRef(null);
  const warningRef = useRef(null);

  const getLoginPath = useCallback(() => {
    if (role === 'admin') return '/admin/login';
    if (role === 'manager') return '/manager/login';
    return '/employee/login';
  }, [role]);

  const logout = useCallback(() => {
    // Clear all tokens for this role
    localStorage.removeItem(`${role}_token`);
    localStorage.removeItem(`${role}_user`);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();

    // Clear intervals
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    window.location.href = getLoginPath();
  }, [role, getLoginPath]);

  const getTokenExpiry = useCallback(() => {
    try {
      const token = localStorage.getItem(`${role}_token`);
      if (!token) return null;

      // JWT decode (middle part)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 : null; // convert to ms
    } catch {
      return null;
    }
  }, [role]);

  useEffect(() => {
    const checkToken = () => {
      const expiry = getTokenExpiry();
      if (!expiry) return;

      const now = Date.now();
      const timeLeft = expiry - now; // ms remaining

      // Already expired
      if (timeLeft <= 0) {
        logout();
        return;
      }

      // Less than 2 minutes left — show warning
      if (timeLeft <= 2 * 60 * 1000 && !showWarning) {
        const secondsLeft = Math.floor(timeLeft / 1000);
        setCountdown(secondsLeft);
        setShowWarning(true);
      }

      // Schedule warning exactly 2 minutes before expiry
      if (timeLeft > 2 * 60 * 1000) {
        const warningIn = timeLeft - 2 * 60 * 1000;
        warningRef.current = setTimeout(() => {
          setCountdown(120);
          setShowWarning(true);
        }, warningIn);
      }

      // Schedule auto logout at expiry
      setTimeout(() => {
        logout();
      }, timeLeft);
    };

    checkToken();

    // Also check every 30 seconds as safety net
    const interval = setInterval(checkToken, 30000);

    return () => {
      clearInterval(interval);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [getTokenExpiry, logout, showWarning]);

  // Countdown timer when warning is visible
  useEffect(() => {
    if (showWarning) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            logout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownRef.current) clearInterval(countdownRef.current);
    }

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [showWarning, logout]);

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getRoleColor = () => {
    if (role === 'admin') return '#667eea';
    if (role === 'manager') return '#8b5cf6';
    return '#10b981';
  };

  const getRoleLabel = () => {
    if (role === 'admin') return '👑 Admin';
    if (role === 'manager') return '👔 Manager';
    return '👤 Employee';
  };

  if (!showWarning) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={{ ...styles.header, background: getRoleColor() }}>
          <div style={styles.warningIcon}>⚠️</div>
          <h2 style={styles.title}>Session Expiring Soon</h2>
          <p style={styles.roleLabel}>{getRoleLabel()}</p>
        </div>

        {/* Body */}
        <div style={styles.body}>
          <p style={styles.message}>
            Your session will expire in
          </p>

          {/* Countdown */}
          <div style={{
            ...styles.countdownBox,
            borderColor: countdown <= 30 ? '#ef4444' : getRoleColor(),
            color: countdown <= 30 ? '#ef4444' : getRoleColor(),
          }}>
            {formatCountdown(countdown)}
          </div>

          <p style={styles.subMessage}>
            You will be automatically logged out when the timer reaches 0:00.
          </p>

          {/* Progress bar */}
          <div style={styles.progressTrack}>
            <div style={{
              ...styles.progressFill,
              width: `${(countdown / 120) * 100}%`,
              background: countdown <= 30
                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                : `linear-gradient(90deg, ${getRoleColor()}, ${getRoleColor()}cc)`,
              transition: 'width 1s linear',
            }} />
          </div>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button
            style={styles.logoutBtn}
            onClick={logout}
          >
            🚪 Logout Now
          </button>
          <button
            style={{ ...styles.stayBtn, background: getRoleColor() }}
            onClick={() => {
              // Just dismiss warning — user will be logged out when token actually expires
              setShowWarning(false);
              if (countdownRef.current) clearInterval(countdownRef.current);
            }}
          >
            ✓ Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16,
  },
  modal: {
    background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400,
    boxShadow: '0 25px 60px rgba(0,0,0,0.3)', overflow: 'hidden',
  },
  header: {
    padding: '24px 24px 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
  },
  warningIcon: { fontSize: 36 },
  title: { margin: 0, fontSize: 20, fontWeight: 700, color: '#fff' },
  roleLabel: { margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  body: { padding: '24px', textAlign: 'center' },
  message: { fontSize: 15, color: '#374151', margin: '0 0 16px 0', fontWeight: 500 },
  countdownBox: {
    display: 'inline-block', fontSize: 48, fontWeight: 800,
    border: '3px solid', borderRadius: 16,
    padding: '12px 32px', marginBottom: 16,
    fontVariantNumeric: 'tabular-nums',
    transition: 'color 0.3s, border-color 0.3s',
  },
  subMessage: { fontSize: 13, color: '#6b7280', margin: '0 0 16px 0' },
  progressTrack: { background: '#f3f4f6', borderRadius: 50, height: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 50 },
  actions: {
    display: 'flex', gap: 12, padding: '0 24px 24px',
  },
  logoutBtn: {
    flex: 1, padding: '11px', borderRadius: 8,
    border: '1px solid #e2e8f0', background: '#f8fafc',
    color: '#374151', cursor: 'pointer', fontSize: 14, fontWeight: 600,
  },
  stayBtn: {
    flex: 1, padding: '11px', borderRadius: 8,
    border: 'none', color: 'white',
    cursor: 'pointer', fontSize: 14, fontWeight: 700,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
};

export default TokenExpiryWatcher;