import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';

const AlertSettings = () => {
  const [alertDay, setAlertDay]     = useState(26);
  const [alertTime, setAlertTime]   = useState('10:00');
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState('');
  const [currentConfig, setCurrentConfig] = useState(null);

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    try {
      const res = await adminService.getSystemConfig();
      if (res.success && res.data?.config) {
        setCurrentConfig(res.data.config);
        setAlertDay(res.data.config.alertDay || 26);
        setAlertTime(res.data.config.alertTime || '10:00');
      }
    } catch (err) {
      console.error('Config fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!alertDay || alertDay < 1 || alertDay > 28) {
      setError('Please enter a valid day between 1 and 28.');
      return;
    }
    setError(''); setSubmitting(true);
    try {
      const configData = {
        workingDays:            currentConfig?.workingDays,
        workingHours:           currentConfig?.workingHours,
        breakTime:              currentConfig?.breakTime,
        leavePolicy:            currentConfig?.leavePolicy,
        weekendDays:            currentConfig?.weekendDays,
        absenceDeductionAmount: currentConfig?.absenceDeductionAmount,
        alertDay:               parseInt(alertDay),
        alertTime:              alertTime,
      };
      let res;
      if (currentConfig?._id) {
        res = await adminService.updateSystemConfig(currentConfig._id, configData);
      } else {
        res = await adminService.createSystemConfig(configData);
      }
      if (res.success) {
        setSaved(true);
        fetchConfig();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 24, color: '#888' }}>Loading...</div>;

  const presets = [20, 22, 24, 25, 26, 27, 28];

  return (
    <div className="config-card">
      <h2>🔔 Monthly Absence Alert Settings</h2>
      <p className="card-description">
        Every month on this date, employees will automatically receive an alert if they have any absences.
        Both Email and Bell notifications will be sent.
      </p>

      {/* Presets */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>
          Quick Select
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {presets.map(p => (
            <button key={p} onClick={() => setAlertDay(p)}
              style={{
                padding: '6px 16px', borderRadius: 20, border: '2px solid',
                borderColor: parseInt(alertDay) === p ? '#667eea' : '#e5e7eb',
                background:  parseInt(alertDay) === p ? '#667eea' : 'white',
                color:       parseInt(alertDay) === p ? 'white'   : '#374151',
                fontWeight: 600, fontSize: 13, cursor: 'pointer'
              }}>
              {p}th
            </button>
          ))}
        </div>
      </div>

      {/* Time presets */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>
          Alert Time
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {['08:00','09:00','10:00','11:00','12:00'].map(t => (
            <button key={t} onClick={() => setAlertTime(t)}
              style={{
                padding: '6px 16px', borderRadius: 20, border: '2px solid',
                borderColor: alertTime === t ? '#667eea' : '#e5e7eb',
                background:  alertTime === t ? '#667eea' : 'white',
                color:       alertTime === t ? 'white'   : '#374151',
                fontWeight: 600, fontSize: 13, cursor: 'pointer'
              }}>
              {t}
            </button>
          ))}
        </div>
        <input type="time" value={alertTime}
          onChange={e => setAlertTime(e.target.value)}
          style={{ padding: '8px 12px', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: 14 }} />
      </div>

      {/* Custom input */}
      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label>📅 Alert Date (Day of Month)</label>
          <input type="number" value={alertDay} min="1" max="28"
            onChange={e => { setAlertDay(e.target.value); setError(''); }}
            placeholder="e.g. 26" />
          <small>From 1 to 28 — the alert will be sent on this date every month</small>
        </div>
      </div>

      {/* Preview */}
      <div className="info-box warning" style={{ marginBottom: 16 }}>
        <strong>⚠️ Preview:</strong> EVERY month on <strong>{alertDay} DATE</strong> at <strong>{alertTime}</strong>,
alerts will be sent to those employees who have any unauthorized absences in that month.
The message will also include the absence count and the expected deduction.
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, marginBottom: 12, fontSize: 13, fontWeight: 600 }}>
          ❌ {error}
        </div>
      )}

      {saved && (
        <div style={{ padding: '10px 14px', background: '#d1fae5', color: '#065f46', borderRadius: 8, marginBottom: 12, fontSize: 13, fontWeight: 600 }}>
          ✅ Alert date saved! Ab har mahine {alertDay} tarikh ko alert jaayega.
        </div>
      )}

      <button className="btn-submit-full" onClick={handleSave} disabled={submitting}>
        {submitting ? '⏳ Saving...' : '💾 Save Alert Settings'}
      </button>
    </div>
  );
};

export default AlertSettings;