import React, { useState, useEffect } from 'react';
import { 
  getSmtpSettings, 
  saveSmtpSettings, 
  testSmtpConnection, 
  sendTestEmail,
  getSmtpStatus,
  toggleNotificationType 
} from '../../services/smtpService';
import './../../styles/NotificationStyles.css';

const SmtpSettings = () => {
  const [settings, setSettings] = useState({
    host: '',
    port: 587,
    secure: false,
    encryption: 'TLS',
    username: '',
    password: '',
    fromAddress: '',
    fromName: 'Devstrings Attendance System',
    replyTo: '',
    notificationEmail: '',
    enableLeaveNotifications: true,
    enableCorrectionNotifications: true,
    enableSystemNotifications: true,
    enableAttendanceNotifications: false
  });

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchStatus();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await getSmtpSettings();
      if (response.success) {
        setSettings({
          ...response.data,
          password: '********' // Don't show actual password
        });
      }
    } catch (error) {
      if (error.message !== 'SMTP settings not configured yet') {
        showMessage('error', 'Failed to load SMTP settings');
      }
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await getSmtpStatus();
      if (response.success) {
        setStatus(response.data);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await saveSmtpSettings(settings);
      if (response.success) {
        showMessage('success', 'SMTP settings saved successfully');
        await fetchStatus();
      }
    } catch (error) {
      showMessage('error', error.message || 'Failed to save SMTP settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await testSmtpConnection();
      if (response.success) {
        showMessage('success', 'SMTP connection successful!');
        await fetchStatus();
      } else {
        showMessage('error', response.message || 'Connection failed');
      }
    } catch (error) {
      showMessage('error', error.message || 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      showMessage('error', 'Please enter a test email address');
      return;
    }

    setTesting(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await sendTestEmail(testEmail);
      if (response.success) {
        showMessage('success', `Test email sent to ${testEmail}`);
        setTestEmail('');
      }
    } catch (error) {
      showMessage('error', error.message || 'Failed to send test email');
    } finally {
      setTesting(false);
    }
  };

  const handleToggleNotification = async (type, enabled) => {
    try {
      await toggleNotificationType(type, enabled);
      showMessage('success', `${type} notifications ${enabled ? 'enabled' : 'disabled'}`);
      await fetchStatus();
    } catch (error) {
      showMessage('error', 'Failed to update notification settings');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  return (
    <div className="smtp-settings-container">
      <div className="page-header">
        <h1>📧 SMTP Email Settings</h1>
        <p>Configure email server for notifications</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {status && (
        <div className="smtp-status-card">
          <h3>Current Status</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Configuration:</span>
              <span className={`status-value ${status.configured ? 'success' : 'error'}`}>
                {status.configured ? '✅ Configured' : '❌ Not Configured'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Last Test:</span>
              <span className={`status-value ${status.lastTestStatus === 'success' ? 'success' : 'error'}`}>
                {status.lastTestStatus === 'success' ? '✅ Success' : 
                 status.lastTestStatus === 'failed' ? '❌ Failed' : '⚠️ Not Tested'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Total Emails Sent:</span>
              <span className="status-value">{status.totalEmailsSent || 0}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Last Email:</span>
              <span className="status-value">
                {status.lastEmailSent ? new Date(status.lastEmailSent).toLocaleString() : 'Never'}
              </span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="smtp-form">
        <div className="form-section">
          <h3>Server Configuration</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>SMTP Host *</label>
              <input
                type="text"
                name="host"
                value={settings.host}
                onChange={handleChange}
                placeholder="smtp.gmail.com"
                required
              />
              <small>e.g., smtp.gmail.com, smtp.office365.com</small>
            </div>

            <div className="form-group">
              <label>Port *</label>
              <input
                type="number"
                name="port"
                value={settings.port}
                onChange={handleChange}
                required
              />
              <small>587 (TLS) or 465 (SSL)</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Encryption</label>
              <select name="encryption" value={settings.encryption} onChange={handleChange}>
                <option value="TLS">TLS</option>
                <option value="SSL">SSL</option>
                <option value="NONE">None</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="secure"
                  checked={settings.secure}
                  onChange={handleChange}
                />
                Use Secure Connection (SSL)
              </label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Authentication</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Username / Email *</label>
              <input
                type="text"
                name="username"
                value={settings.username}
                onChange={handleChange}
                placeholder="your-email@gmail.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Password *</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={settings.password}
                  onChange={handleChange}
                  placeholder="App password or SMTP password"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <small>Use App Password for Gmail</small>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Email Settings</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>From Address *</label>
              <input
                type="email"
                name="fromAddress"
                value={settings.fromAddress}
                onChange={handleChange}
                placeholder="noreply@company.com"
                required
              />
            </div>

            <div className="form-group">
              <label>From Name *</label>
              <input
                type="text"
                name="fromName"
                value={settings.fromName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Reply-To Address</label>
              <input
                type="email"
                name="replyTo"
                value={settings.replyTo}
                onChange={handleChange}
                placeholder="support@company.com"
              />
            </div>

            <div className="form-group">
              <label>Admin Notification Email *</label>
              <input
                type="email"
                name="notificationEmail"
                value={settings.notificationEmail}
                onChange={handleChange}
                placeholder="admin@company.com"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Notification Types</h3>
          <div className="notification-toggles">
            <label className="toggle-item">
              <input
                type="checkbox"
                name="enableLeaveNotifications"
                checked={settings.enableLeaveNotifications}
                onChange={handleChange}
              />
              <span>Leave Request Notifications</span>
            </label>

            <label className="toggle-item">
              <input
                type="checkbox"
                name="enableCorrectionNotifications"
                checked={settings.enableCorrectionNotifications}
                onChange={handleChange}
              />
              <span>Attendance Correction Notifications</span>
            </label>

            <label className="toggle-item">
              <input
                type="checkbox"
                name="enableSystemNotifications"
                checked={settings.enableSystemNotifications}
                onChange={handleChange}
              />
              <span>System Update Notifications</span>
            </label>

            <label className="toggle-item">
              <input
                type="checkbox"
                name="enableAttendanceNotifications"
                checked={settings.enableAttendanceNotifications}
                onChange={handleChange}
              />
              <span>Daily Attendance Notifications</span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : '💾 Save Settings'}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleTestConnection}
            disabled={testing || !settings.host}
          >
            {testing ? 'Testing...' : '🔌 Test Connection'}
          </button>
        </div>
      </form>

      <div className="test-email-section">
        <h3>Send Test Email</h3>
        <div className="test-email-form">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Enter email address"
            className="test-email-input"
          />
          <button
            className="btn btn-primary"
            onClick={handleSendTestEmail}
            disabled={testing || !testEmail}
          >
            {testing ? 'Sending...' : '📧 Send Test Email'}
          </button>
        </div>
      </div>

      <div className="smtp-help">
        <h3>⚙️ Configuration Help</h3>
        <div className="help-grid">
          <div className="help-item">
            <h4>Gmail</h4>
            <p>Host: smtp.gmail.com</p>
            <p>Port: 587 (TLS)</p>
            <p>Enable 2FA and use App Password</p>
          </div>
          <div className="help-item">
            <h4>Outlook/Office365</h4>
            <p>Host: smtp.office365.com</p>
            <p>Port: 587 (TLS)</p>
          </div>
          <div className="help-item">
            <h4>Yahoo</h4>
            <p>Host: smtp.mail.yahoo.com</p>
            <p>Port: 465 (SSL) or 587 (TLS)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmtpSettings;