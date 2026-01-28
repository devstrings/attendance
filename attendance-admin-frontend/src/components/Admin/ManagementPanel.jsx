import React, { useState, useEffect } from 'react';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import adminService from '../../services/adminService';
import '../../styles/Admin.css';

const ManagementPanel = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    holidayDate: '',
    holidayName: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      // Don't filter by year - get all holidays
      const response = await adminService.getAllHolidays();
      
      console.log('Holidays Response:', response);
      
      if (response.success && response.data && response.data.holidays) {
        const holidaysList = Array.isArray(response.data.holidays) 
          ? response.data.holidays 
          : [];
        console.log('Total Holidays:', holidaysList.length);
        setHolidays(holidaysList);
      } else {
        setHolidays([]);
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
      setHolidays([]);
    } finally {
      setLoading(false);
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

    if (!formData.holidayDate) {
      newErrors.holidayDate = 'Holiday date is required';
    }

    if (!formData.holidayName.trim()) {
      newErrors.holidayName = 'Holiday name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const holidayData = {
        name: formData.holidayName,
        date: new Date(formData.holidayDate),
        year: new Date(formData.holidayDate).getFullYear(),
        month: new Date(formData.holidayDate).getMonth() + 1,
        isRecurring: false
      };

      const response = await adminService.createHoliday(holidayData);
      
      if (response.success) {
        alert('Holiday added successfully!');
        setFormData({
          holidayDate: '',
          holidayName: ''
        });
        fetchHolidays(); // Refresh list
      }
    } catch (error) {
      console.error('Error adding holiday:', error);
      alert(error.response?.data?.message || 'Failed to add holiday');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (holidayId) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) {
      return;
    }

    try {
      const response = await adminService.deleteHoliday(holidayId);
      
      if (response.success) {
        alert('Holiday deleted successfully!');
        fetchHolidays(); // Refresh list
      }
    } catch (error) {
      console.error('Error deleting holiday:', error);
      alert('Failed to delete holiday');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getMonthName = (date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'long' });
  };

  if (loading) {
    return (
      <div className="admin-container">
        <AdminNavbar />
        <div className="admin-layout">
          <AdminSidebar />
          <div className="admin-content">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading management panel...</p>
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
            <h1>Management Panel</h1>
            <p>Manage holidays and system configurations</p>
          </div>

          {/* Add Holiday Form */}
          <div className="form-container">
            <h2>Add New Holiday</h2>
            <form onSubmit={handleSubmit} className="holiday-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="holidayDate">Holiday Date *</label>
                  <input
                    type="date"
                    id="holidayDate"
                    name="holidayDate"
                    value={formData.holidayDate}
                    onChange={handleChange}
                    className={errors.holidayDate ? 'error' : ''}
                  />
                  {errors.holidayDate && (
                    <span className="error-text">{errors.holidayDate}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="holidayName">Holiday Name *</label>
                  <input
                    type="text"
                    id="holidayName"
                    name="holidayName"
                    value={formData.holidayName}
                    onChange={handleChange}
                    placeholder="e.g. Independence Day"
                    className={errors.holidayName ? 'error' : ''}
                  />
                  {errors.holidayName && (
                    <span className="error-text">{errors.holidayName}</span>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Holiday'}
                </button>
              </div>
            </form>
          </div>

          {/* Existing Holidays */}
          <div className="section-container">
            <h2>Existing Holidays</h2>
            
            {holidays.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>DATE</th>
                      <th>HOLIDAY NAME</th>
                      <th>MONTH</th>
                      <th>YEAR</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holidays.map((holiday) => (
                      <tr key={holiday._id}>
                        <td>{formatDate(holiday.date)}</td>
                        <td><strong>{holiday.name}</strong></td>
                        <td>{getMonthName(holiday.date)}</td>
                        <td>{holiday.year}</td>
                        <td>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDelete(holiday._id)}
                            title="Delete Holiday"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <p>No holidays found. Add your first holiday above.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .form-container {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 25px;
        }

        .form-container h2 {
          margin: 0 0 20px 0;
          font-size: 20px;
          color: #1a202c;
        }

        .holiday-form {
          width: 100%;
        }

        .form-row {
          display: flex;
          gap: 15px;
          align-items: flex-end;
        }

        .form-group {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 8px;
        }

        .form-group input {
          padding: 10px 15px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .form-group input.error {
          border-color: #ef4444;
        }

        .error-text {
          color: #ef4444;
          font-size: 12px;
          margin-top: 5px;
        }

        .btn-primary {
          padding: 10px 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .section-container {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .section-container h2 {
          margin: 0 0 20px 0;
          font-size: 20px;
          color: #1a202c;
        }

        .btn-icon.delete {
          padding: 8px 12px;
          background: #fee2e2;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 18px;
        }

        .btn-icon.delete:hover {
          background: #fecaca;
          transform: scale(1.1);
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .form-row {
            flex-direction: column;
            align-items: stretch;
          }

          .btn-primary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ManagementPanel;