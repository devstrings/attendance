import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Common.css';

const Header = ({ 
  title = 'Page Title', 
  subtitle = '', 
  showBackButton = false,
  backPath = '/',
  actions = [] 
}) => {
  const navigate = useNavigate();

  return (
    <div className="common-header">
      <div className="header-left">
        {showBackButton && (
          <button 
            className="back-button"
            onClick={() => navigate(backPath)}
          >
            ← Back
          </button>
        )}
        <div className="header-text">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      {actions.length > 0 && (
        <div className="header-right">
          {actions.map((action, index) => (
            <button
              key={index}
              className={`header-action-btn ${action.variant || 'primary'}`}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.icon && <span className="action-icon">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Header;