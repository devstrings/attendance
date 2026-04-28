import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Common.css';

const Unauthorized = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    const userStr = localStorage.getItem('user');
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const role = user.role;
        
        if (role === 'admin') {
          navigate('/admin/dashboard');
        } else if (role === 'manager') {
          navigate('/manager/dashboard');
        } else if (role === 'employee') {
          navigate('/employee/dashboard');
        } else {
          navigate('/login');
        }
      } catch (error) {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="error-page">
      <div className="error-container">
        <div className="lock-animation">
          <div className="lock-body">
            <div className="lock-shackle"></div>
          </div>
        </div>
        
        <div className="error-code">403</div>
        <h1 className="error-title">Access Denied</h1>
        <p className="error-message">
          You don't have permission to access this page.
        </p>
        <p className="error-submessage">
          This area is restricted to authorized personnel only.
        </p>
        
        <div className="error-actions">
          <button 
            className="btn-primary"
            onClick={handleGoHome}
          >
            <span>🏠</span> Go to Dashboard
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate(-1)}
          >
            <span>←</span> Go Back
          </button>
        </div>

        <div className="error-suggestions">
          <h3>Why am I seeing this?</h3>
          <ul>
            <li>You may not have the required permissions</li>
            <li>This page is restricted to specific user roles</li>
            <li>Your session might have expired</li>
            <li>Contact your administrator for access</li>
          </ul>
        </div>

        <div className="security-note">
          <p>
            <strong>⚠️ Security Notice:</strong> Unauthorized access attempts are logged and monitored.
          </p>
        </div>
      </div>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .error-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #fc466b 0%, #3f5efb 100%);
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .error-container {
          background: white;
          border-radius: 24px;
          padding: 50px 40px;
          text-align: center;
          max-width: 550px;
          width: 100%;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.3);
          animation: fadeIn 0.6s ease-out;
          position: relative;
          overflow: hidden;
        }

        .error-container::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(252, 70, 107, 0.05), transparent);
          animation: rotate 6s linear infinite;
        }

        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .lock-animation {
          position: relative;
          margin: 0 auto 30px;
          width: 80px;
          height: 80px;
          animation: shake 0.8s ease-in-out, float 3s ease-in-out infinite 1s;
        }

        .lock-body {
          position: relative;
          width: 50px;
          height: 40px;
          background: linear-gradient(135deg, #fc466b 0%, #3f5efb 100%);
          border-radius: 8px;
          margin: 40px auto 0;
          box-shadow: 0 8px 20px rgba(252, 70, 107, 0.4);
        }

        .lock-body::before {
          content: '🔒';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 24px;
        }

        .lock-shackle {
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          width: 35px;
          height: 30px;
          border: 5px solid #fc466b;
          border-bottom: none;
          border-radius: 20px 20px 0 0;
        }

        .error-code {
          font-size: 72px;
          font-weight: 900;
          background: linear-gradient(135deg, #fc466b 0%, #3f5efb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 15px;
          animation: pulse 2s ease-in-out infinite;
          position: relative;
          z-index: 1;
        }

        .error-title {
          font-size: 32px;
          color: #1a202c;
          margin: 0 0 12px 0;
          font-weight: 700;
          animation: fadeIn 0.8s ease-out 0.2s both;
          position: relative;
          z-index: 1;
        }

        .error-message {
          font-size: 16px;
          color: #4a5568;
          margin: 0 0 8px 0;
          line-height: 1.6;
          animation: fadeIn 0.8s ease-out 0.3s both;
          position: relative;
          z-index: 1;
        }

        .error-submessage {
          font-size: 14px;
          color: #718096;
          margin: 0 0 25px 0;
          animation: fadeIn 0.8s ease-out 0.4s both;
          position: relative;
          z-index: 1;
        }

        .error-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 25px;
          animation: fadeIn 0.8s ease-out 0.5s both;
          position: relative;
          z-index: 1;
        }

        .btn-primary,
        .btn-secondary {
          padding: 12px 28px;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: inherit;
        }

        .btn-primary {
          background: linear-gradient(135deg, #fc466b 0%, #3f5efb 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(252, 70, 107, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(252, 70, 107, 0.4);
        }

        .btn-primary:active {
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: #f7fafc;
          color: #4a5568;
          border: 2px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
          transform: translateY(-2px);
        }

        .error-suggestions {
          background: #f7fafc;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          text-align: left;
          animation: slideIn 0.8s ease-out 0.6s both;
          position: relative;
          z-index: 1;
        }

        .error-suggestions h3 {
          font-size: 16px;
          color: #2d3748;
          margin: 0 0 12px 0;
          font-weight: 600;
        }

        .error-suggestions ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .error-suggestions li {
          font-size: 14px;
          color: #4a5568;
          padding: 6px 0;
          padding-left: 24px;
          position: relative;
        }

        .error-suggestions li::before {
          content: '•';
          position: absolute;
          left: 8px;
          color: #fc466b;
          font-weight: bold;
          font-size: 18px;
        }

        .security-note {
          background: linear-gradient(135deg, rgba(252, 70, 107, 0.1) 0%, rgba(63, 94, 251, 0.1) 100%);
          border-left: 4px solid #fc466b;
          border-radius: 8px;
          padding: 15px;
          animation: slideIn 0.8s ease-out 0.7s both;
          position: relative;
          z-index: 1;
        }

        .security-note p {
          font-size: 13px;
          color: #2d3748;
          margin: 0;
          text-align: left;
        }

        .security-note strong {
          color: #fc466b;
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .error-container {
            padding: 40px 25px;
          }

          .error-code {
            font-size: 56px;
          }

          .error-title {
            font-size: 26px;
          }

          .error-actions {
            flex-direction: column;
            width: 100%;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
            justify-content: center;
          }

          .lock-animation {
            width: 70px;
            height: 70px;
          }
        }
      `}</style>
    </div>
  );
};

export default Unauthorized;