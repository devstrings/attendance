import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import adminService from '../../services/adminService';
import '../../styles/Admin.css';

const CreateEmployee = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeCode: '',
    password: '',
    confirmPassword: '',
    phone: '',
    salary: '',
    address: '',
    managerId: '',
    status: 'active'
  });

  const [managers, setManagers] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [apiError, setApiError] = useState('');

  const COMPANY_NAME = 'Devstrings';
  const DEPARTMENT = 'Software House';

  // ✅ Fetch managers on mount
  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      setLoadingManagers(true);
      setApiError('');
      
      console.log('📡 Fetching managers...');
      const response = await adminService.getActiveManagers();
      
      console.log('📥 Manager response:', response);

      if (response.success && response.data?.managers) {
        const activeManagers = response.data.managers.filter(
          manager => manager.isActive !== false && manager.userId?.isActive !== false
        );
        
        console.log('✅ Active managers:', activeManagers.length);
        setManagers(activeManagers);

        if (activeManagers.length === 0) {
          setApiError('No active managers found. Please create a manager first.');
        }
      } else {
        console.warn('⚠️ No managers in response');
        setApiError('No managers found. Please create a manager first.');
        setManagers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching managers:', error);
      setApiError(error.message || 'Failed to load managers. Please try again.');
      setManagers([]);
    } finally {
      setLoadingManagers(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    setApiError('');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.managerId) {
      newErrors.managerId = 'Please select a manager';
    }

    if (!formData.salary) {
      newErrors.salary = 'Salary is required';
    } else if (parseFloat(formData.salary) <= 0) {
      newErrors.salary = 'Salary must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      setApiError('Please fix all validation errors before submitting.');
      return;
    }

    setLoading(true);

    try {
      // ✅ Split name into first and last
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || firstName;

     const employeeData = {
  email: formData.email.trim(),
  password: formData.password,
  firstName: firstName,
  lastName: lastName,
  phoneNumber: formData.phone.trim(),
  department: DEPARTMENT,
  designation: 'Employee',
  salary: parseFloat(formData.salary),
  joiningDate: new Date().toISOString().split('T')[0],
  managerId: formData.managerId,
  address: formData.address.trim() || ''
  // ✅ CNIC field removed - backend will handle it
};

      console.log('📤 Submitting employee data:', employeeData);

      const response = await adminService.createEmployee(employeeData);
      
      console.log('✅ Employee created successfully:', response);

      if (response.success) {
        alert('✅ Employee created successfully!');
        navigate('/admin/employees');
      } else {
        throw new Error(response.message || 'Failed to create employee');
      }
    } catch (error) {
      console.error('❌ Error creating employee:', error);
      setApiError(error.message || 'Failed to create employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      employeeCode: '',
      password: '',
      confirmPassword: '',
      phone: '',
      salary: '',
      address: '',
      managerId: '',
      status: 'active'
    });
    setErrors({});
    setApiError('');
  };

  return (
    <div className="admin-container">
      <AdminNavbar />
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content" style={{ padding: '24px' }}>
          <div className="page-header">
            <h1>Create New Employee - {COMPANY_NAME}</h1>
            <button 
              className="back-btn"
              onClick={() => navigate('/admin/employees')}
            >
              ← Back to Employees
            </button>
          </div>

          {/* ✅ Global Error Message */}
          {apiError && (
            <div style={{
              background: '#fee',
              color: '#c00',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #fcc',
              fontSize: '14px'
            }}>
              <strong>⚠️ Error:</strong> {apiError}
            </div>
          )}

          <div className="form-container">
            <form onSubmit={handleSubmit} className="create-form">
              {/* Company Info */}
              <div className="company-info" style={{
                background: '#f0f4ff',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #d0d7de'
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#2563eb' }}>Company Information</h3>
                <p style={{ margin: '5px 0' }}><strong>Company Name:</strong> {COMPANY_NAME}</p>
                <p style={{ margin: '5px 0' }}><strong>Department:</strong> {DEPARTMENT}</p>
              </div>

              <div className="form-grid">
                {/* Full Name */}
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    className={errors.name ? 'error' : ''}
                    disabled={loading}
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                {/* Email */}
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="employee@example.com"
                    className={errors.email ? 'error' : ''}
                    disabled={loading}
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                {/* Phone Number */}
                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+92 300 1234567"
                    className={errors.phone ? 'error' : ''}
                    disabled={loading}
                  />
                  {errors.phone && <span className="error-text">{errors.phone}</span>}
                </div>

                {/* Salary */}
                <div className="form-group">
                  <label htmlFor="salary">Base Salary (PKR) *</label>
                  <input
                    type="number"
                    id="salary"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="50000"
                    min="0"
                    className={errors.salary ? 'error' : ''}
                    disabled={loading}
                  />
                  {errors.salary && <span className="error-text">{errors.salary}</span>}
                </div>

                {/* Assign Manager */}
                <div className="form-group">
                  <label htmlFor="managerId">Assign Manager *</label>
                  <select
                    id="managerId"
                    name="managerId"
                    value={formData.managerId}
                    onChange={handleChange}
                    className={errors.managerId ? 'error' : ''}
                    disabled={loadingManagers || loading}
                  >
                    <option value="">
                      {loadingManagers ? 'Loading managers...' : 'Select Manager'}
                    </option>
                    {managers.map((manager) => (
                      <option key={manager._id} value={manager._id}>
                        {manager.firstName} {manager.lastName}
                      </option>
                    ))}
                  </select>
                  {errors.managerId && <span className="error-text">{errors.managerId}</span>}
                  {!loadingManagers && managers.length === 0 && (
                    <span className="info-text">
                      No active managers found. 
                      <button 
                        type="button"
                        onClick={() => navigate('/admin/create-manager')}
                        style={{
                          marginLeft: '10px',
                          color: '#007bff',
                          background: 'none',
                          border: 'none',
                          textDecoration: 'underline',
                          cursor: 'pointer'
                        }}
                      >
                        Create Manager First
                      </button>
                    </span>
                  )}
                </div>

                {/* Password */}
                <div className="form-group">
                  <label htmlFor="password">Password *</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    className={errors.password ? 'error' : ''}
                    disabled={loading}
                  />
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>

                {/* Confirm Password */}
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password *</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    className={errors.confirmPassword ? 'error' : ''}
                    disabled={loading}
                  />
                  {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                </div>

                {/* Address - Full Width */}
                <div className="form-group full-width">
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter complete address"
                    rows="3"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Reset
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading || loadingManagers || managers.length === 0}
                >
                  {loading ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEmployee;