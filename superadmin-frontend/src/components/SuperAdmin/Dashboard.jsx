  import React, { useEffect, useState, useCallback } from 'react';
  import { getCompanies, getCompanyById, suspendCompany, activateCompany, deleteCompany } from '../../services/superAdminService';
  import CompanyFormModal from './CompanyFormModal';
  import CompanyDetailModal from './CompanyDetailModal';
  import Shell from './Shell';

  function Dashboard() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState(null);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [detailCompany, setDetailCompany] = useState(null);

    const showToast = (message, type = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3500);
    };

    const loadCompanies = useCallback(async () => {
      setLoading(true);
      try {
        const res = await getCompanies({ search, limit: 50 });
        setCompanies(res.data.data);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to load companies', 'error');
      } finally {
        setLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    useEffect(() => {
      loadCompanies();
    }, [loadCompanies]);

    const handleSuspend = async (company) => {
      const reason = window.prompt(`Suspend "${company.companyName}"? Enter a reason:`);
      if (reason === null) return;
      try {
        await suspendCompany(company._id, reason);
        showToast(`${company.companyName} suspended.`);
        loadCompanies();
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to suspend company', 'error');
      }
    };

    const handleActivate = async (company) => {
      try {
        await activateCompany(company._id);
        showToast(`${company.companyName} activated.`);
        loadCompanies();
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to activate company', 'error');
      }
    };

    const handleDelete = async (company) => {
      if (!window.confirm(`Permanently delete "${company.companyName}"? This cannot be undone.`)) return;
      try {
        await deleteCompany(company._id);
        showToast(`${company.companyName} deleted.`);
        loadCompanies();
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete company', 'error');
      }
    };

    const openDetail = async (company) => {
      try {
        const res = await getCompanyById(company._id);
        setDetailCompany(res.data.data);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to load company details', 'error');
      }
    };

    return (
      <Shell>
          <div className="sa-toolbar">
            <div>
              <h1>Companies</h1>
              <p className="sa-subtitle">{companies.length} compan{companies.length === 1 ? 'y' : 'ies'} on the platform</p>
            </div>
            <button className="sa-btn-primary" onClick={() => setShowCreateModal(true)}>
              + New Company
            </button>
          </div>

          <input
            className="sa-search"
            placeholder="Search companies by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {loading ? (
            <div className="sa-empty">Loading…</div>
          ) : companies.length === 0 ? (
            <div className="sa-empty">No companies yet. Create the first one to get started.</div>
          ) : (
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Code</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <button className="sa-link" onClick={() => openDetail(c)}>{c.companyName}</button>
                      <div className="sa-cell-sub">{c.email}</div>
                    </td>
                    <td>{c.companyCode}</td>
                    <td><span className="sa-tag">{c.subscriptionPlan}</span></td>
                    <td>
                      <span className={`sa-status ${c.isActive ? 'sa-status-active' : 'sa-status-suspended'}`}>
                        {c.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="sa-row-actions">
                      <button className="sa-link" onClick={() => setEditingCompany(c)}>Edit</button>
                      {c.isActive ? (
                        <button className="sa-link sa-link-warn" onClick={() => handleSuspend(c)}>Suspend</button>
                      ) : (
                        <button className="sa-link sa-link-ok" onClick={() => handleActivate(c)}>Activate</button>
                      )}
                      <button className="sa-link sa-link-danger" onClick={() => handleDelete(c)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        {showCreateModal && (
          <CompanyFormModal
            onClose={() => setShowCreateModal(false)}
            onSaved={() => { setShowCreateModal(false); loadCompanies(); showToast('Company created.'); }}
            showToast={showToast}
          />
        )}

        {editingCompany && (
          <CompanyFormModal
            company={editingCompany}
            onClose={() => setEditingCompany(null)}
            onSaved={() => { setEditingCompany(null); loadCompanies(); showToast('Company updated.'); }}
            showToast={showToast}
          />
        )}

        {detailCompany && (
          <CompanyDetailModal
            data={detailCompany}
            onClose={() => setDetailCompany(null)}
            showToast={showToast}
          />
        )}

        {toast && <div className={`sa-toast sa-toast-${toast.type}`}>{toast.message}</div>}
      </Shell>
    );
  }

  export default Dashboard;
