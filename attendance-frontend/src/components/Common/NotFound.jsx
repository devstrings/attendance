import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import '../../styles/Common.css';

const NotFound = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    if (!user) {
      navigate('/login');
    } else if (user.role === 'admin') {
      navigate('/admin/dashboard');
    } else if (user.role === 'manager') {
      navigate('/manager/dashboard');
    } else if (user.role === 'employee') {
      navigate('/employee/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="error-page">
      <div className="error-container">
        <div className="error-code">404</div>
        <div className="error-icon">🔍</div>
        <h1 className="error-title">Page Not Found</h1>
        <p className="error-message">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <p className="error-submessage">
          It might have been removed, renamed, or did not exist in the first place.
        </p>
        
        <div className="error-actions">
          <button 
            className="btn-primary"
            onClick={handleGoBack}
          >
            🏠 Go to Dashboard
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate(-1)}
          >
            ← Go Back
          </button>
        </div>
      </div>

      <style jsx>{`
        .error-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .error-container {
          background: white;
          border-radius: 20px;
          padding: 60px 40px;
          text-align: center;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .error-code {
          font-size: 120px;
          font-weight: bold;
          color: #667eea;
          line-height: 1;
          margin-bottom: 20px;
        }

        .error-icon {
          font-size: 80px;
          margin-bottom: 20px;
        }

        .error-title {
          font-size: 36px;
          color: #1a202c;
          margin: 0 0 15px 0;
        }

        .error-message {
          font-size: 18px;
          color: #4a5568;
          margin: 0 0 10px 0;
          line-height: 1.6;
        }

        .error-submessage {
          font-size: 14px;
          color: #718096;
          margin: 0 0 30px 0;
        }

        .error-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-primary,
        .btn-secondary {
          padding: 12px 30px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: #e2e8f0;
          color: #4a5568;
        }

        .btn-secondary:hover {
          background: #cbd5e0;
        }

        @media (max-width: 640px) {
          .error-container {
            padding: 40px 20px;
          }

          .error-code {
            font-size: 80px;
          }

          .error-icon {
            font-size: 60px;
          }

          .error-title {
            font-size: 28px;
          }

          .error-actions {
            flex-direction: column;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default NotFound;