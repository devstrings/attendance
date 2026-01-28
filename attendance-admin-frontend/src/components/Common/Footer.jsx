import React from 'react';
import '../../styles/Common.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="common-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>Attendance System</h4>
          <p>Manage your organization's attendance efficiently</p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/about">About Us</a></li>
            <li><a href="/help">Help Center</a></li>
            <li><a href="/contact">Contact</a></li>
            <li><a href="/privacy">Privacy Policy</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Support</h4>
          <ul>
            <li><a href="/docs">Documentation</a></li>
            <li><a href="/faq">FAQ</a></li>
            <li><a href="/terms">Terms of Service</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contact Us</h4>
          <p>📧 support@attendance.com</p>
          <p>📞 +92 300 1234567</p>
          <p>📍 Faisalabad, Punjab, Pakistan</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {currentYear} Attendance System. All rights reserved.</p>
        <p>Made with ❤️ in Pakistan</p>
      </div>
    </footer>
  );
};

export default Footer;