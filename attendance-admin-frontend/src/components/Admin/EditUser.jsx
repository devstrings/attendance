import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import adminService from '../../services/adminService';
import '../../styles/Admin.css';

const EditUser = () => {
  const navigate = useNavigate();
  const { userId, userType } = useParams();
  
  // ✅ Auto-detect userType if not in URL
  const [detectedUserType, setDetectedUserType] = useState(userType || null);
  const [managers, setManagers] = useState([]);
  const [userData, setUserData] = useState(null);
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
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  const departments = [
    'Software House',
    'Sales',
    'Marketing',
    'IT',
    'HR',
    'Finance',
    'Operations'
  ];

  useEffect(() => {
    fetchUserData();
    fetchManagers();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setFetchLoading(true);
      
      // ✅ Try employee first, then manager
      let response;
      let type = detectedUserType;
      
      if (!type) {
        // Auto-detect: try employee first
        try {
          response = await adminService.getEmployeeDetails(userId);
          type = 'employee';
        } catch {
          try {
            response = await adminService.getManagerDetails(userId);
            type = 'manager';
          } catch (error) {
            throw new Error('User not found');
          }
        }
        setDetectedUserType(type);
      } else {
        // Use provided userType
        if (type === 'employee') {
          response = await adminService.getEmployeeDetails(userId);
        } else {
          response = await adminService.getManagerDetails(userId);
        }
      }

      if (response.success) {
        const profile = response.data.profile;
        const user = response.data.user;
        
        setUserData(profile);
        setFormData({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          email: user.email || '',
          phoneNumber: profile.phoneNumber || '',
          department: profile.department || '',
          designation: profile.designation || '',
          salary: profile.salary || '',
          joiningDate: profile.joiningDate ? new Date(profile.joiningDate).toISOString().split('T')[0] : '',
          managerId: profile.managerId?._id || '',
          address: profile.address || '',
          cnic: profile.cnic || '',
          dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
          employeeCode: profile.employeeCode || ''
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      alert('Failed to load user data');
      navigate('/admin/employees');
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
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.designation.trim()) newErrors.designation = 'Designation is required';
    
    if (detectedUserType === 'employee') {
      if (!formData.salary) {
        newErrors.salary = 'Salary is required';
      } else if (isNaN(formData.salary) || formData.salary <= 0) {
        newErrors.salary = 'Invalid salary amount';
      }
      if (!formData.managerId) newErrors.managerId = 'Manager is required';
    }

    if (!formData.joiningDate) newErrors.joiningDate = 'Joining date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        department: formData.department,
        designation: formData.designation,
        salary: parseFloat(formData.salary),
        joiningDate: formData.joiningDate,
        address: formData.address,
        cnic: formData.cnic,
        dateOfBirth: formData.dateOfBirth
      };

      if (detectedUserType === 'employee') {
        updateData.managerId = formData.managerId;
        updateData.employeeCode = formData.employeeCode;
      }

      const response = detectedUserType === 'employee'
        ? await adminService.updateEmployee(userId, updateData)
        : await adminService.updateManager(userId, updateData);

      if (response.success) {
        alert(`${detectedUserType === 'manager' ? 'Manager' : 'Employee'} updated successfully!`);
        navigate(detectedUserType === 'manager' ? '/admin/managers' : '/admin/employees');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert(error.response?.data?.message || 'Failed to update user');
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
          <div className="admin-content">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading user data...</p>
            </div>
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
        <div className="admin-content">
          <div className="page-header">
            <h1>Edit {detectedUserType === 'manager' ? 'Manager' : 'Employee'}</h1>
            <button 
              className="back-btn"
              onClick={() => navigate(detectedUserType === 'manager' ? '/admin/managers' : '/admin/employees')}
            >
              ← Back to {detectedUserType === 'manager' ? 'Managers' : 'Employees'}
            </button>
          </div>

          <div className="form-container">
            <form onSubmit={handleSubmit} className="create-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    className={errors.firstName ? 'error' : ''}
                  />
                  {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    className={errors.lastName ? 'error' : ''}
                  />
                  {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    disabled
                    className={errors.email ? 'error' : ''}
                  />
                  <small style={{color: '#6b7280'}}>Email cannot be changed</small>
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number *</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="+92 300 1234567"
                    className={errors.phoneNumber ? 'error' : ''}
                  />
                  {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
                </div>

                {detectedUserType === 'employee' && (
                  <div className="form-group">
                    <label htmlFor="employeeCode">Employee Code *</label>
                    <input
                      type="text"
                      id="employeeCode"
                      name="employeeCode"
                      value={formData.employeeCode}
                      onChange={handleChange}
                      placeholder="EMP-001"
                      disabled
                    />
                    <small style={{color: '#6b7280'}}>Cannot be changed</small>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="cnic">CNIC</label>
                  <input
                    type="text"
                    id="cnic"
                    name="cnic"
                    value={formData.cnic}
                    onChange={handleChange}
                    placeholder="12345-1234567-1"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="department">Department *</label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className={errors.department ? 'error' : ''}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept, index) => (
                      <option key={index} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {errors.department && <span className="error-text">{errors.department}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="designation">Designation *</label>
                  <input
                    type="text"
                    id="designation"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="Designation"
                    className={errors.designation ? 'error' : ''}
                  />
                  {errors.designation && <span className="error-text">{errors.designation}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="salary">Salary (PKR) *</label>
                  <input
                    type="number"
                    id="salary"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="50000"
                    className={errors.salary ? 'error' : ''}
                  />
                  {errors.salary && <span className="error-text">{errors.salary}</span>}
                </div>

                {detectedUserType === 'employee' && (
                  <div className="form-group">
                    <label htmlFor="managerId">Assign Manager *</label>
                    <select
                      id="managerId"
                      name="managerId"
                      value={formData.managerId}
                      onChange={handleChange}
                      className={errors.managerId ? 'error' : ''}
                    >
                      <option value="">Select Manager</option>
                      {managers.map((manager) => (
                        <option key={manager._id} value={manager._id}>
                          {manager.firstName} {manager.lastName}
                        </option>
                      ))}
                    </select>
                    {errors.managerId && <span className="error-text">{errors.managerId}</span>}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="joiningDate">Joining Date *</label>
                  <input
                    type="date"
                    id="joiningDate"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleChange}
                    className={errors.joiningDate ? 'error' : ''}
                  />
                  {errors.joiningDate && <span className="error-text">{errors.joiningDate}</span>}
                </div>

                <div className="form-group full-width">
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter complete address"
                    rows="3"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => navigate(detectedUserType === 'manager' ? '/admin/managers' : '/admin/employees')}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUser;