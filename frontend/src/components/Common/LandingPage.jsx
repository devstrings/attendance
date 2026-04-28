import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  const loginOptions = [
    {
      type: 'manager',
      title: 'Manager',
      icon: '👔',
      color: '#007bff',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      description: 'Manage team attendance & reports'
    },
    {
      type: 'employee',
      title: 'Employee',
      icon: '👤',
      color: '#28a745',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      description: 'View your attendance records'
    }
  ];

  const handleRoleClick = (roleType) => {
    console.log(`🔄 Navigating to ${roleType} login`);
    navigate(`/${roleType}/login`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 0
      }}>
        {[...Array(15)].map((_, i) => (
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
        padding: '40px',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '35px',
          animation: 'slideDown 0.6s ease-out'
        }}>
          <div style={{
            fontSize: '3.5rem',
            marginBottom: '15px',
            animation: 'bounce 2s ease-in-out infinite'
          }}>
            📊
          </div>
          <h1 style={{
            fontSize: '2rem',
            color: '#333',
            marginBottom: '8px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Attendance Portal
          </h1>
          <p style={{
            fontSize: '0.95rem',
            color: '#666',
            margin: 0
          }}>
            Select your role to continue
          </p>
        </div>

        {/* Login Options */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '25px'
        }}>
          {loginOptions.map((option, index) => (
            <div
              key={option.type}
              onClick={() => handleRoleClick(option.type)}
              onMouseEnter={() => setHoveredCard(option.type)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: hoveredCard === option.type ? option.gradient : 'white',
                border: `2px solid ${hoveredCard === option.type ? 'transparent' : '#e0e0e0'}`,
                borderRadius: '16px',
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hoveredCard === option.type ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                boxShadow: hoveredCard === option.type 
                  ? '0 12px 24px rgba(0,0,0,0.15)' 
                  : '0 2px 8px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                animation: `slideUp 0.4s ease-out ${index * 0.1}s backwards`
              }}
            >
              <div style={{
                fontSize: '2.5rem',
                transition: 'transform 0.3s ease',
                transform: hoveredCard === option.type ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)'
              }}>
                {option.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  color: hoveredCard === option.type ? 'white' : '#333',
                  fontSize: '1.2rem',
                  margin: '0 0 4px 0',
                  fontWeight: '600',
                  transition: 'color 0.3s ease'
                }}>
                  {option.title}
                </h3>
                <p style={{
                  color: hoveredCard === option.type ? 'rgba(255,255,255,0.9)' : '#666',
                  fontSize: '0.85rem',
                  margin: 0,
                  transition: 'color 0.3s ease'
                }}>
                  {option.description}
                </p>
              </div>
              <div style={{
                fontSize: '1.5rem',
                color: hoveredCard === option.type ? 'white' : '#ccc',
                transition: 'all 0.3s ease',
                transform: hoveredCard === option.type ? 'translateX(4px)' : 'translateX(0)'
              }}>
                →
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          paddingTop: '20px',
          borderTop: '1px solid #eee'
        }}>
          <p style={{
            color: '#888',
            fontSize: '0.85rem',
            margin: 0
          }}>
            © 2025 Attendance System
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-20px) translateX(10px); }
          66% { transform: translateY(-10px) translateX(-10px); }
        }
        * {
          box-sizing: border-box;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;