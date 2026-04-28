import React from 'react';
import '../../styles/Common.css';

const Loader = ({ 
  message = 'Loading...', 
  size = 'medium',
  fullScreen = false 
}) => {
  const loaderClass = `loader-container ${size} ${fullScreen ? 'fullscreen' : ''}`;

  return (
    <div className={loaderClass}>
      <div className="loader-spinner">
        <div className="spinner"></div>
      </div>
      {message && <p className="loader-message">{message}</p>}
    </div>
  );
};

// Export different loader variants for convenience
export const SmallLoader = ({ message }) => (
  <Loader message={message} size="small" />
);

export const LargeLoader = ({ message }) => (
  <Loader message={message} size="large" />
);

export const FullScreenLoader = ({ message }) => (
  <Loader message={message} fullScreen={true} />
);

export default Loader;