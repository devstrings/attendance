import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// ✅ NEW — company-slug ko URL se detect karke basename set karta hai
const KNOWN_TOP_LEVEL_SEGMENTS = ['manager', 'employee', 'forgot-password', 'verify-otp', 'reset-password', 'unauthorized'];

function getBasename() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  if (!firstSegment || KNOWN_TOP_LEVEL_SEGMENTS.includes(firstSegment)) {
    return '';
  }
  return `/${firstSegment}`;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter basename={getBasename()}>
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);