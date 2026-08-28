import React, { useEffect, useState } from 'react';
import { getPlatformUsage } from '../../services/superAdminService';
import Shell from './Shell';

function PlatformUsage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlatformUsage()
      .then((res) => setData(res.data.data))
      .catch((err) => console.error('Failed to load platform usage', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Shell><div className="sa-empty">Loading…</div></Shell>;
  if (!data) return <Shell><div className="sa-empty">Could not load platform usage.</div></Shell>;

  return (
    <Shell>
      <div className="sa-toolbar">
        <div>
          <h1>Platform Usage</h1>
          <p className="sa-subtitle">A snapshot across every company on the platform</p>
        </div>
      </div>

      <div className="sa-usage-grid">
        <div className="sa-usage-card">
          <h3>Companies</h3>
          <div className="sa-usage-row"><span>Total</span><strong>{data.companies.total}</strong></div>
          <div className="sa-usage-row"><span>Active</span><strong className="sa-text-ok">{data.companies.active}</strong></div>
          <div className="sa-usage-row"><span>Suspended</span><strong className="sa-text-danger">{data.companies.suspended}</strong></div>
        </div>

        <div className="sa-usage-card">
          <h3>Users</h3>
          <div className="sa-usage-row"><span>Total</span><strong>{data.users.total}</strong></div>
          <div className="sa-usage-row"><span>Admins</span><strong>{data.users.admins}</strong></div>
          <div className="sa-usage-row"><span>Managers</span><strong>{data.users.managers}</strong></div>
          <div className="sa-usage-row"><span>Employees</span><strong>{data.users.employees}</strong></div>
        </div>

        <div className="sa-usage-card">
          <h3>Subscription plans</h3>
          {data.planBreakdown.length === 0 ? (
            <p className="sa-hint">No data yet.</p>
          ) : (
            data.planBreakdown.map((p) => (
              <div className="sa-usage-row" key={p._id}>
                <span style={{ textTransform: 'capitalize' }}>{p._id}</span>
                <strong>{p.count}</strong>
              </div>
            ))
          )}
        </div>
      </div>
    </Shell>
  );
}

export default PlatformUsage;
