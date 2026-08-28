import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './context/AuthContext';

// ✅ NEW — company-slug ko URL se detect karke basename set karta hai
// e.g. /devstringss/admin/dashboard → basename '/devstringss', route matches '/admin/dashboard'
// e.g. /admin/dashboard (koi company-slug nahi) → basename '', route matches as-is
const KNOWN_TOP_LEVEL_SEGMENTS = ['admin', 'forgot-password', 'verify-otp', 'reset-password'];

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
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();