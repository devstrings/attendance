import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';

const DeductionConfig = () => {
  const [amount, setAmount]         = useState(500);
  const [saved, setSaved]           = useState(false);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [currentConfig, setCurrentConfig] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await adminService.getSystemConfig();
      if (response.success && response.data?.config) {
        const config = response.data.config;
        setCurrentConfig(config);
        setAmount(config.absenceDeductionAmount || 500);
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!amount || parseInt(amount) < 0) {
      setError('Please enter a valid amount (0 or more)');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const configData = {
        workingDays:   currentConfig?.workingDays,
        workingHours:  currentConfig?.workingHours,
        breakTime:     currentConfig?.breakTime,
        leavePolicy:   currentConfig?.leavePolicy,
        weekendDays:   currentConfig?.weekendDays,
        absenceDeductionAmount: parseInt(amount)
      };

      let response;
      if (currentConfig?._id) {
        response = await adminService.updateSystemConfig(currentConfig._id, configData);
      } else {
        response = await adminService.createSystemConfig(configData);
      }

      if (response.success) {
  setSaved(true);
  fetchConfig();
  setTimeout(() => setSaved(false), 3000);
  // Notification + email trigger
  try {
    await adminService.broadcastAnnouncement({
      title: '💰 Deduction Policy Updated',
      message: `The absence deduction amount has been updated: Rs. ${amount} per unauthorized absence. This will be applied in the next monthly summary.`
    });
  } catch (e) {
    console.error('Broadcast error:', e);
  }
}
    } catch (err) {
      console.error('Error saving deduction config:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>
        Loading...
      </div>
    );
  }

  const presets = [100, 200, 300, 500, 750, 1000];

  return (
    <div className="config-card">
      <h2>💰 Absence Deduction Policy</h2>
      <p className="card-description">
        How much amount will be deducted from salary for each unauthorized absence?
This amount will be automatically applied in the monthly summary.
      </p>

      {/* Quick Presets */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>
          Quick Presets
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {presets.map(p => (
            <button
              key={p}
              onClick={() => setAmount(p)}
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                border: '2px solid',
                borderColor: parseInt(amount) === p ? '#667eea' : '#e5e7eb',
                background: parseInt(amount) === p ? '#667eea' : 'white',
                color: parseInt(amount) === p ? 'white' : '#374151',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Rs. {p}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount Input */}
      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label>💵 Custom Deduction Per Absence (Rs.)</label>
          <input
            type="number"
            value={amount}
            onChange={e => { setAmount(e.target.value); setError(''); }}
            min="0"
            max="50000"
            step="50"
            placeholder="e.g. 500"
          />
          <small>You can set any amount — from 0 to 50,000</small>
        </div>
      </div>

      {/* Live Preview */}
      <div className="info-box warning" style={{ marginBottom: 16 }}>
        <strong>⚠️ Preview:</strong> If an employee has 3 unauthorized absences,
then <strong>Rs. {(parseInt(amount) || 0) * 3}</strong> will be deducted from the salary
({parseInt(amount) || 0} × 3)
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '10px 14px', background: '#fee2e2', color: '#991b1b',
          borderRadius: 8, marginBottom: 12, fontSize: 13, fontWeight: 600
        }}>
          ❌ {error}
        </div>
      )}

      {/* Success */}
      {saved && (
        <div style={{
          padding: '10px 14px', background: '#d1fae5', color: '#065f46',
          borderRadius: 8, marginBottom: 12, fontSize: 13, fontWeight: 600
        }}>
          ✅ Deduction amount saved successfully! Monthly summaries will use Rs. {amount} per absence.
        </div>
      )}

      <button
        className="btn-submit-full"
        onClick={handleSave}
        disabled={submitting}
      >
        {submitting ? '⏳ Saving...' : '💾 Save Deduction Policy'}
      </button>
    </div>
  );
};

export default DeductionConfig;