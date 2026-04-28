/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars, import/no-anonymous-default-export, jsx-a11y/anchor-is-valid */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import adminService from '../../services/adminService';
import '../../styles/Admin.css';

const EditUser = () => {
  const navigate = useNavigate();
  const { userId, userType } = useParams();
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    department: '',
    designation: '',
    salary: '',
    joiningDate: '',
    managerId: '',
    address: '',
    cnic: '',
    dateOfBirth: '',
    employeeCode: ''
  });

  const [errors, setErrors] = useState({});

  const departments = [
    'Software House', 'Sales', 'Marketing', 'IT', 'HR', 'Finance', 'Operations'
  ];

  useEffect(() => {
    fetchUserData();
    if (userType === 'employee') fetchManagers();
  }, [userId, userType]);

  const fetchUserData = async () => {
    try {
      setFetchLoading(true);
      let response;

      if (userType === 'employee') {
        response = await adminService.getEmployeeDetails(userId);
      } else {
        response = await adminService.getManagerDetails(userId);
      }

      if (response.success) {
        const profile = response.data.profile;
        const user = response.data.user;

        setFormData({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          email: user?.email || profile.userId?.email || '',
          phoneNumber: profile.phoneNumber || '',
          department: profile.department || '',
          designation: profile.designation || '',
          salary: profile.salary || '',
          joiningDate: profile.joiningDate
            ? new Date(profile.joiningDate).toISOString().split('T')[0]
            : '',
          managerId: profile.managerId?._id || profile.managerId || '',
          address: profile.address || '',
          cnic: profile.cnic || '',
          dateOfBirth: profile.dateOfBirth
            ? new Date(profile.dateOfBirth).toISOString().split('T')[0]
            : '',
          employeeCode: profile.employeeCode || ''
        });
      } else {
        setErrorMsg('Failed to load user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setErrorMsg('Failed to load user data. Please try again.');
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await adminService.getActiveManagers();
      if (response.success) {
        setManagers(response.data.managers || []);
      }
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setSuccessMsg('');
    setErrorMsg('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.designation.trim()) newErrors.designation = 'Designation is required';
    if (!formData.joiningDate) newErrors.joiningDate = 'Joining date is required';
    if (userType === 'employee') {
      if (!formData.salary || isNaN(formData.salary) || formData.salary <= 0)
        newErrors.salary = 'Valid salary is required';
      if (!formData.managerId) newErrors.managerId = 'Manager is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const updateData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        department: formData.department,
        designation: formData.designation.trim(),
        salary: parseFloat(formData.salary),
        joiningDate: formData.joiningDate,
        address: formData.address.trim(),
        cnic: formData.cnic.trim(),
        dateOfBirth: formData.dateOfBirth || null,
      };

      if (userType === 'employee') {
        updateData.managerId = formData.managerId;
      }

      const response = userType === 'employee'
        ? await adminService.updateEmployee(userId, updateData)
        : await adminService.updateManager(userId, updateData);

      if (response.success) {
        setSuccessMsg(`✅ ${userType === 'manager' ? 'Manager' : 'Employee'} updated successfully!`);
        setTimeout(() => {
          navigate(userType === 'manager' ? '/admin/managers' : '/admin/employees');
        }, 1500);
      } else {
        setErrorMsg(response.message || 'Update failed. Please try again.');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setErrorMsg(error.message || 'Failed to update. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="admin-container">
        <AdminNavbar />
        <div className="admin-layout">
          <AdminSidebar />
          <div className="admin-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 50, height: 50, border: '4px solid #f3f4f6', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
              <p style={{ color: '#6b7280' }}>Loading user data...</p>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <AdminNavbar />
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content" style={{ padding: 24, background: '#f9fafb', minHeight: '100vh' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
                ✏️ Edit {userType === 'manager' ? 'Manager' : 'Employee'}
              </h1>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
                Update {userType === 'manager' ? 'manager' : 'employee'} information
              </p>
            </div>
            <button
              onClick={() => navigate(userType === 'manager' ? '/admin/managers' : '/admin/employees')}
              style={{ padding: '10px 20px', background: '#fff', border: '2px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: '#374151' }}
            >
              ← Back
            </button>
          </div>

          {/* Success/Error Messages */}
          {successMsg && (
            <div style={{ padding: '14px 18px', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 10, marginBottom: 20, color: '#065f46', fontWeight: 600, fontSize: 14 }}>
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div style={{ padding: '14px 18px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, marginBottom: 20, color: '#991b1b', fontWeight: 600, fontSize: 14 }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Personal Info Card */}
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>👤 Personal Information</h3>
              <div style={gridStyle}>

                <div style={fieldStyle}>
                  <label style={labelStyle}>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    style={{ ...inputStyle, ...(errors.firstName ? errorInputStyle : {}) }}
                    placeholder="First name"
                  />
                  {errors.firstName && <span style={errorTextStyle}>{errors.firstName}</span>}
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    style={{ ...inputStyle, ...(errors.lastName ? errorInputStyle : {}) }}
                    placeholder="Last name"
                  />
                  {errors.lastName && <span style={errorTextStyle}>{errors.lastName}</span>}
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    style={{ ...inputStyle, background: '#f9fafb', color: '#9ca3af', cursor: 'not-allowed' }}
                    disabled
                  />
                  <small style={{ color: '#9ca3af', fontSize: 11 }}>Email cannot be changed</small>
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Phone Number *</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    style={{ ...inputStyle, ...(errors.phoneNumber ? errorInputStyle : {}) }}
                    placeholder="+92 300 1234567"
                  />
                  {errors.phoneNumber && <span style={errorTextStyle}>{errors.phoneNumber}</span>}
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>CNIC</label>
                  <input
                    type="text"
                    name="cnic"
                    value={formData.cnic}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="12345-1234567-1"
                  />
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    style={{ ...inputStyle, height: 80, resize: 'vertical' }}
                    placeholder="Complete address"
                  />
                </div>

              </div>
            </div>

            {/* Work Info Card */}
            <div style={{ ...cardStyle, marginTop: 20 }}>
              <h3 style={cardTitleStyle}>💼 Work Information</h3>
              <div style={gridStyle}>

                {userType === 'employee' && (
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Employee Code</label>
                    <input
                      type="text"
                      value={formData.employeeCode}
                      style={{ ...inputStyle, background: '#f9fafb', color: '#9ca3af', cursor: 'not-allowed' }}
                      disabled
                    />
                    <small style={{ color: '#9ca3af', fontSize: 11 }}>Cannot be changed</small>
                  </div>
                )}

                <div style={fieldStyle}>
                  <label style={labelStyle}>Department *</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    style={{ ...inputStyle, ...(errors.department ? errorInputStyle : {}) }}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept, i) => (
                      <option key={i} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {errors.department && <span style={errorTextStyle}>{errors.department}</span>}
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Designation *</label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    style={{ ...inputStyle, ...(errors.designation ? errorInputStyle : {}) }}
                    placeholder="e.g. Software Engineer"
                  />
                  {errors.designation && <span style={errorTextStyle}>{errors.designation}</span>}
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Salary (PKR) *</label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    style={{ ...inputStyle, ...(errors.salary ? errorInputStyle : {}) }}
                    placeholder="e.g. 50000"
                    min="0"
                  />
                  {errors.salary && <span style={errorTextStyle}>{errors.salary}</span>}
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Joining Date *</label>
                  <input
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleChange}
                    style={{ ...inputStyle, ...(errors.joiningDate ? errorInputStyle : {}) }}
                  />
                  {errors.joiningDate && <span style={errorTextStyle}>{errors.joiningDate}</span>}
                </div>

                {userType === 'employee' && (
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Assign Manager *</label>
                    <select
                      name="managerId"
                      value={formData.managerId}
                      onChange={handleChange}
                      style={{ ...inputStyle, ...(errors.managerId ? errorInputStyle : {}) }}
                    >
                      <option value="">Select Manager</option>
                      {managers.map((manager) => (
                        <option key={manager._id} value={manager._id}>
                          {manager.firstName} {manager.lastName}
                        </option>
                      ))}
                    </select>
                    {errors.managerId && <span style={errorTextStyle}>{errors.managerId}</span>}
                  </div>
                )}

              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => navigate(userType === 'manager' ? '/admin/managers' : '/admin/employees')}
                disabled={loading}
                style={{ padding: '12px 28px', background: '#fff', border: '2px solid #e5e7eb', borderRadius: 10, cursor: 'pointer', fontWeight: 600, color: '#374151', fontSize: 14 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{ padding: '12px 32px', background: loading ? '#9ca3af' : 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 12px rgba(102,126,234,0.3)' }}
              >
                {loading ? '⏳ Updating...' : '✅ Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// =====================================================
// STYLES
// =====================================================
const cardStyle = {
  background: '#fff',
  borderRadius: 16,
  padding: 24,
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
};

const cardTitleStyle = {
  fontSize: 16,
  fontWeight: 700,
  color: '#111827',
  margin: '0 0 20px',
  paddingBottom: 12,
  borderBottom: '2px solid #f3f4f6'
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 20
};

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: '#374151'
};

const inputStyle = {
  padding: '10px 14px',
  border: '2px solid #e5e7eb',
  borderRadius: 8,
  fontSize: 14,
  color: '#111827',
  background: '#fff',
  outline: 'none',
  transition: 'border-color 0.2s',
  width: '100%',
  boxSizing: 'border-box'
};

const errorInputStyle = {
  borderColor: '#ef4444'
};

const errorTextStyle = {
  fontSize: 12,
  color: '#ef4444',
  fontWeight: 500
};

export default EditUser;
