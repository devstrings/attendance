import React, { useEffect, useState, useCallback } from 'react';
import Shell from './Shell';
import {
  getWorkers,
  createWorker,
  updateWorkerPermissions,
  toggleWorkerActive
} from '../../services/superAdminService';

const PERMISSIONS = [
  { key: 'companies:view', label: 'Companies dekhna' },
  { key: 'usage:view', label: 'Platform usage dekhna' },
  { key: 'auditlogs:view', label: 'Audit logs dekhna' },
  { key: 'companies:suspend', label: 'Company suspend / activate' }
];

const cardStyle = {
  background: '#fff',
  borderRadius: 12,
  padding: 20,
  marginBottom: 20,
  boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #d0d5dd',
  borderRadius: 8,
  fontSize: 14,
  boxSizing: 'border-box'
};

function Workers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', password: '', permissions: [] });
  const [edits, setEdits] = useState({}); // { workerId: [permissions] }

  const loadWorkers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getWorkers();
      setWorkers(res.data.workers || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Workers load nahi ho sakay.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkers();
  }, [loadWorkers]);

  const toggleInList = (list, key) =>
    list.includes(key) ? list.filter((p) => p !== key) : [...list, key];

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (form.password.length < 8) {
      setError('Password kam az kam 8 characters ka ho.');
      return;
    }

    try {
      setSaving(true);
      await createWorker(form);
      setMessage('Worker ban gaya.');
      setForm({ name: '', email: '', password: '', permissions: [] });
      await loadWorkers();
    } catch (err) {
      setError(err.response?.data?.message || 'Worker nahi ban saka.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePermissions = async (worker) => {
    setError('');
    setMessage('');
    try {
      await updateWorkerPermissions(worker._id, edits[worker._id]);
      setMessage('Permissions update ho gayin.');
      setEdits((prev) => {
        const copy = { ...prev };
        delete copy[worker._id];
        return copy;
      });
      await loadWorkers();
    } catch (err) {
      setError(err.response?.data?.message || 'Permissions update nahi hui.');
    }
  };

  const handleToggleActive = async (worker) => {
    setError('');
    setMessage('');
    try {
      await toggleWorkerActive(worker._id);
      setMessage(worker.isActive ? 'Worker inactive kar diya.' : 'Worker active kar diya.');
      await loadWorkers();
    } catch (err) {
      setError(err.response?.data?.message || 'Status badal nahi saka.');
    }
  };

  return (
    <Shell>
      <h2 style={{ marginBottom: 16 }}>Workers</h2>

      {error && <div className="sa-error-banner">{error}</div>}
      {message && (
        <div style={{ background: '#ecfdf3', color: '#067647', padding: 10, borderRadius: 8, marginBottom: 16 }}>
          {message}
        </div>
      )}

      {/* ===== Naya worker ===== */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Naya Worker Banao</h3>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <input
              style={inputStyle}
              placeholder="Naam"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              style={inputStyle}
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              style={inputStyle}
              type="password"
              placeholder="Password (kam az kam 8)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <strong style={{ fontSize: 14 }}>Permissions</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8 }}>
              {PERMISSIONS.map((p) => (
                <label key={p.key} style={{ fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(p.key)}
                    onChange={() =>
                      setForm({ ...form, permissions: toggleInList(form.permissions, p.key) })
                    }
                  />{' '}
                  {p.label}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="sa-btn-primary" style={{ marginTop: 16 }} disabled={saving}>
            {saving ? 'Ban raha hai…' : 'Worker Banao'}
          </button>
        </form>
      </div>

      {/* ===== Workers ki list ===== */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Saare Workers</h3>

        {loading ? (
          <p>Load ho raha hai…</p>
        ) : workers.length === 0 ? (
          <p>Abhi koi worker nahi hai.</p>
        ) : (
          workers.map((w) => {
            const current = edits[w._id] ?? w.permissions ?? [];
            const changed = edits[w._id] !== undefined;

            return (
              <div
                key={w._id}
                style={{ borderTop: '1px solid #eaecf0', padding: '14px 0' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <strong>{w.name || '(naam nahi)'}</strong>
                    <div style={{ fontSize: 13, color: '#667085' }}>{w.email}</div>
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: 12,
                        padding: '4px 10px',
                        borderRadius: 20,
                        background: w.isActive ? '#ecfdf3' : '#fef3f2',
                        color: w.isActive ? '#067647' : '#b42318'
                      }}
                    >
                      {w.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 10 }}>
                  {PERMISSIONS.map((p) => (
                    <label key={p.key} style={{ fontSize: 14 }}>
                      <input
                        type="checkbox"
                        checked={current.includes(p.key)}
                        onChange={() =>
                          setEdits({ ...edits, [w._id]: toggleInList(current, p.key) })
                        }
                      />{' '}
                      {p.label}
                    </label>
                  ))}
                </div>

                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  {changed && (
                    <button className="sa-btn-primary" onClick={() => handleSavePermissions(w)}>
                      Permissions Save Karo
                    </button>
                  )}
                  <button className="sa-btn-ghost" onClick={() => handleToggleActive(w)}>
                    {w.isActive ? 'Inactive Karo' : 'Active Karo'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Shell>
  );
}

export default Workers;