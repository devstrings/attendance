import React, { useEffect, useState, useCallback } from 'react';
import { getAuditLogs, deleteAuditLog, clearAllAuditLogs } from '../../services/superAdminService';
import Shell from './Shell';

const ACTION_LABELS = {
  company_created: 'Company created',
  company_updated: 'Company updated',
  company_suspended: 'Company suspended',
  company_activated: 'Company activated',
  company_deleted: 'Company deleted',
  company_admin_created: 'Company admin created',
  company_admin_password_reset: 'Admin password reset',
};

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAuditLogs({ limit: 50, action: actionFilter || undefined });
      setLogs(res.data.data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (logId) => {
    if (!window.confirm('Delete this audit log entry?')) return;
    try {
      await deleteAuditLog(logId);
      load();
    } catch (err) {
      console.error('Failed to delete audit log entry', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear ALL audit log history? This cannot be undone.')) return;
    try {
      await clearAllAuditLogs();
      load();
    } catch (err) {
      console.error('Failed to clear audit logs', err);
    }
  };

  return (
    <Shell>
      <div className="sa-toolbar">
        <div>
          <h1>Audit Logs</h1>
          <p className="sa-subtitle">Every Super Admin action, recorded automatically</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select className="sa-field-select-inline" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="">All actions</option>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          {logs.length > 0 && (
            <button className="sa-link sa-link-danger" onClick={handleClearAll}>Clear All</button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="sa-empty">Loading…</div>
      ) : logs.length === 0 ? (
        <div className="sa-empty">No audit entries yet.</div>
      ) : (
        <table className="sa-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Target</th>
              <th>Performed by</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td><span className="sa-tag">{ACTION_LABELS[log.action] || log.action}</span></td>
                <td>{log.targetLabel || log.targetId}</td>
                <td>{log.performedByEmail}</td>
                <td>
                  <button className="sa-link sa-link-danger" onClick={() => handleDelete(log._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Shell>
  );
}

export default AuditLogs;