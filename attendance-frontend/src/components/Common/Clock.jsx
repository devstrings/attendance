import React, { useState, useEffect } from 'react';
import '../../styles/Common.css';

const Clock = ({ 
  showDate = true, 
  showSeconds = true,
  format12Hour = true,
  className = ''
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    const hours24 = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    if (format12Hour) {
      const hours12 = hours24 % 12 || 12;
      const ampm = hours24 >= 12 ? 'PM' : 'AM';
      const timeStr = showSeconds
        ? `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${ampm}`
        : `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
      return timeStr;
    } else {
      const timeStr = showSeconds
        ? `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        : `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      return timeStr;
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`clock-widget ${className}`}>
      <div className="clock-time">
        {formatTime(currentTime)}
      </div>
      {showDate && (
        <div className="clock-date">
          {formatDate(currentTime)}
        </div>
      )}
    </div>
  );
};

// Export different clock variants
export const DigitalClock = ({ showSeconds = true }) => (
  <div className="digital-clock">
    <Clock showDate={false} showSeconds={showSeconds} className="digital" />
  </div>
);

export const DateTimeClock = () => (
  <Clock showDate={true} showSeconds={true} />
);

export const SimpleClock = () => (
  <div className="simple-clock">
    <Clock showDate={false} showSeconds={false} className="simple" />
  </div>
);

export default Clock;