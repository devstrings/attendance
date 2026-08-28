import React, { useState } from 'react';
import { createCompany, updateCompany } from '../../services/superAdminService';

function CompanyFormModal({ company, onClose, onSaved, showToast }) {
  const isEdit = !!company;
  const [form, setForm] = useState({
    companyName: company?.companyName || '',
    companyCode: company?.companyCode || '',
    slug: company?.slug || '',
    email: company?.email || '',
    phone: company?.phone || '',
    country: company?.country || '',
    subscriptionPlan: company?.subscriptionPlan || 'trial',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await updateCompany(company._id, form);
      } else {
        await createCompany(form);
      }
      onSaved();
    } catch (err) {
      showToast(err.response?.data?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{isEdit ? 'Edit company' : 'New company'}</h2>
        <form onSubmit={handleSubmit}>
          <label className="sa-field">
            <span>Company name</span>
            <input value={form.companyName} onChange={handleChange('companyName')} required />
          </label>
          <div className="sa-field-row">
            <label className="sa-field">
              <span>Company code</span>
              <input value={form.companyCode} onChange={handleChange('companyCode')} required disabled={isEdit} />
            </label>
            <label className="sa-field">
              <span>Slug</span>
              <input value={form.slug} onChange={handleChange('slug')} required disabled={isEdit} />
            </label>
          </div>
          <label className="sa-field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={handleChange('email')} required />
          </label>
          <div className="sa-field-row">
            <label className="sa-field">
              <span>Phone</span>
              <input value={form.phone} onChange={handleChange('phone')} />
            </label>
            <label className="sa-field">
              <span>Country</span>
              <input value={form.country} onChange={handleChange('country')} />
            </label>
          </div>
          <label className="sa-field">
            <span>Subscription plan</span>
            <select value={form.subscriptionPlan} onChange={handleChange('subscriptionPlan')}>
              <option value="trial">Trial</option>
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </label>

          <div className="sa-modal-actions">
            <button type="button" className="sa-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="sa-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompanyFormModal;
