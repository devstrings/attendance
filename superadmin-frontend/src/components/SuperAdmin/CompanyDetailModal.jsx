import React, { useState } from 'react';
import { createCompanyAdmin, resetCompanyAdminPassword } from '../../services/superAdminService';

function CompanyDetailModal({ data, onClose, showToast }) {
  const { company, stats } = data;
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: '', password: '', name: '', phoneNumber: '' });
  const [creating, setCreating] = useState(false);
  const [createdAdminId, setCreatedAdminId] = useState(null);

  const [resetUserId, setResetUserId] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await createCompanyAdmin(company._id, adminForm);
      setCreatedAdminId(res.data.data._id);
      showToast('Company admin created.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create admin', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetUserId) {
      showToast('Admin User ID is required.', 'error');
      return;
    }
    setResetting(true);
    try {
      await resetCompanyAdminPassword(resetUserId, resetPassword);
      showToast('Admin password reset.');
      setResetPassword('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset password', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal sa-modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2>{company.companyName}</h2>
        <p className="sa-subtitle">{company.companyCode} · {company.slug}</p>

        <div className="sa-stats-grid">
          <div className="sa-stat"><span>{stats.userCount}</span><label>Total users</label></div>
          <div className="sa-stat"><span>{stats.adminCount}</span><label>Admins</label></div>
          <div className="sa-stat"><span>{stats.managerCount}</span><label>Managers</label></div>
          <div className="sa-stat"><span>{stats.employeeCount}</span><label>Employees</label></div>
        </div>

        <hr className="sa-divider" />

        {!showCreateAdmin ? (
          <button className="sa-btn-secondary" onClick={() => setShowCreateAdmin(true)}>
            + Create company admin
          </button>
        ) : (
          <form onSubmit={handleCreateAdmin} className="sa-inline-form">
            <h3>New company admin</h3>
            <div className="sa-field-row">
              <label className="sa-field">
                <span>Name</span>
                <input value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} />
              </label>
              <label className="sa-field">
                <span>Phone</span>
                <input value={adminForm.phoneNumber} onChange={(e) => setAdminForm({ ...adminForm, phoneNumber: e.target.value })} />
              </label>
            </div>
            <label className="sa-field">
              <span>Email</span>
              <input type="email" required value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} />
            </label>
            <label className="sa-field">
              <span>Temporary password</span>
              <input type="text" required value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} />
            </label>
            <button type="submit" className="sa-btn-primary" disabled={creating}>
              {creating ? 'Creating…' : 'Create admin'}
            </button>

            {createdAdminId && (
              <div className="sa-note">
                Admin created. User ID (needed below for password resets): <code>{createdAdminId}</code>
              </div>
            )}
          </form>
        )}

        <hr className="sa-divider" />

        <form onSubmit={handleResetPassword} className="sa-inline-form">
          <h3>Reset admin password</h3>
          <p className="sa-hint">
            This portal doesn't yet list a company's existing admins — paste the admin's User ID
            (shown above right after creation, or copied from the database).
          </p>
          <label className="sa-field">
            <span>Admin User ID</span>
            <input value={resetUserId} onChange={(e) => setResetUserId(e.target.value)} />
          </label>
          <label className="sa-field">
            <span>New password</span>
            <input type="text" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} />
          </label>
          <button type="submit" className="sa-btn-secondary" disabled={resetting}>
            {resetting ? 'Resetting…' : 'Reset password'}
          </button>
        </form>

        <div className="sa-modal-actions">
          <button className="sa-btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default CompanyDetailModal;
