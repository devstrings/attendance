import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleAdminLogin = () => {
    console.log('🔄 Navigating to admin login');
    navigate('/admin/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Shapes */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 0
      }}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: Math.random() * 100 + 50 + 'px',
              height: Math.random() * 100 + 50 + 'px',
              background: `rgba(255,255,255,${Math.random() * 0.1})`,
              borderRadius: '50%',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
              animationDelay: Math.random() * 5 + 's'
            }}
          />
        ))}
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: '50px 40px',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        position: 'relative',
        zIndex: 1,
        textAlign: 'center'
      }}>
        {/* Header */}
        <div style={{ 
          marginBottom: '40px',
          animation: 'slideDown 0.6s ease-out'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '20px',
            animation: 'bounce 2s ease-in-out infinite'
          }}>
            👨‍💼
          </div>
          <h1 style={{
            fontSize: '2.2rem',
            color: '#333',
            marginBottom: '10px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Admin Portal
          </h1>
          <p style={{
            fontSize: '1rem',
            color: '#666',
            margin: 0
          }}>
            Complete system management and control
          </p>
        </div>

        {/* Admin Login Card */}
        <div
          onClick={handleAdminLogin}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            background: isHovered 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
              : 'white',
            border: `2px solid ${isHovered ? 'transparent' : '#e0e0e0'}`,
            borderRadius: '16px',
            padding: '30px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
            boxShadow: isHovered 
              ? '0 16px 32px rgba(102, 126, 234, 0.4)' 
              : '0 4px 12px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}
        >
          <div style={{
            fontSize: '3rem',
            marginBottom: '15px',
            transition: 'transform 0.3s ease',
            transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)'
          }}>
            🔐
          </div>
          <h3 style={{
            color: isHovered ? 'white' : '#333',
            fontSize: '1.4rem',
            margin: '0 0 8px 0',
            fontWeight: '600',
            transition: 'color 0.3s ease'
          }}>
            Administrator Login
          </h3>
          <p style={{
            color: isHovered ? 'rgba(255,255,255,0.9)' : '#666',
            fontSize: '0.9rem',
            margin: 0,
            transition: 'color 0.3s ease'
          }}>
            Manage users, attendance, reports & settings
          </p>
        </div>

        {/* Features List */}
        <div style={{
          background: '#f8f9fa',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            fontSize: '0.85rem',
            color: '#666'
          }}>
            <div>✅ User Management</div>
            <div>✅ Attendance Control</div>
            <div>✅ Reports & Analytics</div>
            <div>✅ System Settings</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          paddingTop: '20px',
          borderTop: '1px solid #eee'
        }}>
          <p style={{
            color: '#888',
            fontSize: '0.85rem',
            margin: 0
          }}>
            © 2025 Attendance System - Admin Portal
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          33% {
            transform: translateY(-20px) translateX(10px);
          }
          66% {
            transform: translateY(-10px) translateX(-10px);
          }
        }

        * {
          box-sizing: border-box;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;