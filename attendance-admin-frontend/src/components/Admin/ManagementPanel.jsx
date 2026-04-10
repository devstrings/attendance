import React, { useState, useEffect } from "react";
import DeductionConfig from "./DeductionConfig";
import AlertSettings from './AlertSettings';
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import adminService from "../../services/adminService";
import "../../styles/Admin.css";
import "./ManagementPanel.css";

const ManagementPanel = () => {
  // States
  const [activeTab, setActiveTab] = useState("holidays");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Holidays State
  const [holidays, setHolidays] = useState([]);
  const [holidayForm, setHolidayForm] = useState({
    holidayDate: "",
    holidayName: "",
  });
  const [holidayErrors, setHolidayErrors] = useState({});

  // System Config State
  const [systemConfig, setSystemConfig] = useState(null);
  const [configForm, setConfigForm] = useState({
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    startTime: "10:00",
    endTime: "19:00",
    lateEntryTime: "10:30",
    breakTime: 60,
    allowedLeaves: 2,
    autoAbsentOnExceed: true,
    weekendDays: ["Saturday", "Sunday"],
  });
  const [customWorkingDays, setCustomWorkingDays] = useState(false);

  const allDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchHolidays(), fetchSystemConfig()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ===== HOLIDAYS FUNCTIONS =====
  const fetchHolidays = async () => {
    try {
      const response = await adminService.getAllHolidays();
      if (response.success && response.data && response.data.holidays) {
        setHolidays(response.data.holidays);
      } else {
        setHolidays([]);
      }
    } catch (error) {
      console.error("Error fetching holidays:", error);
      setHolidays([]);
    }
  };

  const handleHolidayChange = (e) => {
    const { name, value } = e.target;
    setHolidayForm((prev) => ({ ...prev, [name]: value }));
    if (holidayErrors[name]) {
      setHolidayErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateHolidayForm = () => {
    const errors = {};
    if (!holidayForm.holidayDate)
      errors.holidayDate = "Holiday date is required";
    if (!holidayForm.holidayName.trim())
      errors.holidayName = "Holiday name is required";
    setHolidayErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleHolidaySubmit = async (e) => {
    e.preventDefault();
    if (!validateHolidayForm()) return;

    setSubmitting(true);
    try {
      const holidayData = {
        name: holidayForm.holidayName,
        date: new Date(holidayForm.holidayDate),
        year: new Date(holidayForm.holidayDate).getFullYear(),
        month: new Date(holidayForm.holidayDate).getMonth() + 1,
        isRecurring: false,
      };

      const response = await adminService.createHoliday(holidayData);
      if (response.success) {
        alert("Holiday added successfully!");
        setHolidayForm({ holidayDate: "", holidayName: "" });
        fetchHolidays();
      }
    } catch (error) {
      console.error("Error adding holiday:", error);
      alert(error.message || "Failed to add holiday");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHoliday = async (holidayId) => {
    if (!window.confirm("Are you sure you want to delete this holiday?"))
      return;

    try {
      const response = await adminService.deleteHoliday(holidayId);
      if (response.success) {
        alert("Holiday deleted successfully!");
        fetchHolidays();
      }
    } catch (error) {
      console.error("Error deleting holiday:", error);
      alert("Failed to delete holiday");
    }
  };

  // ===== SYSTEM CONFIG FUNCTIONS =====
  const fetchSystemConfig = async () => {
    try {
      const response = await adminService.getSystemConfig();
      if (response.success && response.data && response.data.config) {
        const config = response.data.config;
        setSystemConfig(config);
        setConfigForm({
          workingDays: config.workingDays || [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
          ],
          startTime: config.workingHours?.startTime || "10:00",
          endTime: config.workingHours?.endTime || "19:00",
          lateEntryTime: config.workingHours?.lateEntryTime || "10:30",
          breakTime: config.breakTime || 60,
          allowedLeaves: config.leavePolicy?.allowedLeaves || 2,
          autoAbsentOnExceed: config.leavePolicy?.autoAbsentOnExceed !== false,
          weekendDays: config.weekendDays || ["Saturday", "Sunday"],
        });
      }
    } catch (error) {
      console.error("Error fetching system config:", error);
    }
  };

  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfigForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? parseInt(value)
            : value,
    }));
  };

  const handleWorkingDayToggle = (day) => {
    setConfigForm((prev) => {
      const currentDays = [...prev.workingDays];
      const index = currentDays.indexOf(day);

      if (index > -1) {
        currentDays.splice(index, 1);
      } else {
        currentDays.push(day);
      }

      return { ...prev, workingDays: currentDays };
    });
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const configData = {
        workingDays: configForm.workingDays,
        workingHours: {
          startTime: configForm.startTime,
          endTime: configForm.endTime,
          lateEntryTime: configForm.lateEntryTime,
        },
        breakTime: configForm.breakTime,
        leavePolicy: {
          allowedLeaves: configForm.allowedLeaves,
          autoAbsentOnExceed: configForm.autoAbsentOnExceed,
        },
        weekendDays: configForm.weekendDays,
      };

      let response;
      if (systemConfig && systemConfig._id) {
        response = await adminService.updateSystemConfig(
          systemConfig._id,
          configData,
        );
      } else {
        response = await adminService.createSystemConfig(configData);
      }

      if (response.success) {
        alert(
          "System configuration saved successfully! ✅\nChanges will apply to all employees.",
        );
        fetchSystemConfig();
      }
    } catch (error) {
      console.error("Error saving system config:", error);
      alert(error.message || "Failed to save system configuration");
    } finally {
      setSubmitting(false);
    }
  };

  const setDefaultWorkingDays = () => {
    setConfigForm((prev) => ({
      ...prev,
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      weekendDays: ["Saturday", "Sunday"],
    }));
    setCustomWorkingDays(false);
  };

  // Utility functions
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getMonthName = (date) => {
    return new Date(date).toLocaleDateString("en-US", { month: "long" });
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
        <div className="admin-content management-panel">
          {/* Header */}
          <div className="page-header-modern">
            <div>
              <h1>🎛️ Management Panel</h1>
              <p>Configure system settings, holidays, and work policies</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs-container">
            <button
              className={`tab-btn ${activeTab === "holidays" ? "active" : ""}`}
              onClick={() => setActiveTab("holidays")}
            >
              🎉 Holidays
            </button>
            <button
              className={`tab-btn ${activeTab === "working-days" ? "active" : ""}`}
              onClick={() => setActiveTab("working-days")}
            >
              📅 Working Days
            </button>
            <button
              className={`tab-btn ${activeTab === "working-hours" ? "active" : ""}`}
              onClick={() => setActiveTab("working-hours")}
            >
              ⏰ Working Hours
            </button>
            <button
              className={`tab-btn ${activeTab === "leave-policy" ? "active" : ""}`}
              onClick={() => setActiveTab("leave-policy")}
            >
              📋 Leave Policy
            </button>

            <button
              className={`tab-btn ${activeTab === "deduction-policy" ? "active" : ""}`}
              onClick={() => setActiveTab("deduction-policy")}
            >
              💰 Deduction Policy
            </button>

            <button
  className={`tab-btn ${activeTab === 'alert-settings' ? 'active' : ''}`}
  onClick={() => setActiveTab('alert-settings')}
>
  🔔 Alert Settings
</button>

          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* HOLIDAYS TAB */}
            {activeTab === "holidays" && (
              <div className="tab-panel">
                {/* Add Holiday Form */}
                <div className="config-card">
                  <h2>➕ Add New Holiday</h2>
                  <form onSubmit={handleHolidaySubmit} className="config-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Holiday Date *</label>
                        <input
                          type="date"
                          name="holidayDate"
                          value={holidayForm.holidayDate}
                          onChange={handleHolidayChange}
                          onClick={(e) => e.target.showPicker?.()}
                          className={holidayErrors.holidayDate ? "error" : ""}
                        />
                        {holidayErrors.holidayDate && (
                          <span className="error-text">
                            {holidayErrors.holidayDate}
                          </span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Holiday Name *</label>
                        <input
                          type="text"
                          name="holidayName"
                          value={holidayForm.holidayName}
                          onChange={handleHolidayChange}
                          placeholder="e.g. Independence Day"
                          className={holidayErrors.holidayName ? "error" : ""}
                        />
                        {holidayErrors.holidayName && (
                          <span className="error-text">
                            {holidayErrors.holidayName}
                          </span>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="btn-submit"
                        disabled={submitting}
                      >
                        {submitting ? "⏳ Adding..." : "➕ Add Holiday"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Holidays List */}
                <div className="config-card">
                  <h2>📋 Existing Holidays ({holidays.length})</h2>
                  {holidays.length > 0 ? (
                    <div className="holidays-grid">
                      {holidays.map((holiday) => (
                        <div key={holiday._id} className="holiday-card">
                          <div className="holiday-date">
                            <div className="date-day">
                              {new Date(holiday.date).getDate()}
                            </div>
                            <div className="date-month">
                              {getMonthName(holiday.date)}
                            </div>
                          </div>
                          <div className="holiday-info">
                            <h3>{holiday.name}</h3>
                            <p>
                              {formatDate(holiday.date)} • {holiday.year}
                            </p>
                          </div>
                          <button
                            className="btn-delete-icon"
                            onClick={() => handleDeleteHoliday(holiday._id)}
                            title="Delete Holiday"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>
                        📅 No holidays configured. Add your first holiday above!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* WORKING DAYS TAB */}
            {activeTab === "working-days" && (
              <div className="tab-panel">
                <form onSubmit={handleConfigSubmit}>
                  <div className="config-card">
                    <h2>📅 Configure Working Days</h2>
                    <p className="card-description">
                      Select which days are working days. Changes apply to all
                      employees.
                    </p>

                    <div className="toggle-option">
                      <label className="toggle-label">
                        <input
                          type="checkbox"
                          checked={!customWorkingDays}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDefaultWorkingDays();
                            } else {
                              setCustomWorkingDays(true);
                            }
                          }}
                        />
                        <span>Use Default (Monday - Friday)</span>
                      </label>
                    </div>

                    {customWorkingDays && (
                      <div className="days-selector">
                        <h3>Custom Working Days</h3>
                        <div className="days-grid">
                          {allDays.map((day) => (
                            <label key={day} className="day-checkbox">
                              <input
                                type="checkbox"
                                checked={configForm.workingDays.includes(day)}
                                onChange={() => handleWorkingDayToggle(day)}
                              />
                              <span
                                className={
                                  configForm.workingDays.includes(day)
                                    ? "selected"
                                    : ""
                                }
                              >
                                {day}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="info-box">
                      <strong>Selected Working Days:</strong>{" "}
                      {configForm.workingDays.join(", ")}
                    </div>

                    <button
                      type="submit"
                      className="btn-submit-full"
                      disabled={submitting}
                    >
                      {submitting ? "⏳ Saving..." : "💾 Save Working Days"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* WORKING HOURS TAB */}
            {activeTab === "working-hours" && (
              <div className="tab-panel">
                <form onSubmit={handleConfigSubmit}>
                  <div className="config-card">
                    <h2>⏰ Configure Working Hours</h2>
                    <p className="card-description">
                      Set office timing, late entry threshold, and break
                      duration.
                    </p>

                    <div className="form-grid">
                      <div className="form-group">
                        <label>🕐 Office Start Time</label>
                        <input
                          type="time"
                          name="startTime"
                          value={configForm.startTime}
                          onChange={handleConfigChange}
                          onClick={(e) => e.target.showPicker?.()}
                        />
                        <small>When office hours begin</small>
                      </div>

                      <div className="form-group">
                        <label>🕐 Late Entry After</label>
                        <input
                          type="time"
                          name="lateEntryTime"
                          value={configForm.lateEntryTime}
                          onClick={(e) => e.target.showPicker?.()}
                          onChange={handleConfigChange}
                        />
                        <small>Mark as late after this time</small>
                      </div>

                      <div className="form-group">
                        <label>🕐 Office End Time</label>
                        <input
                          type="time"
                          name="endTime"
                          value={configForm.endTime}
                          onChange={handleConfigChange}
                          onClick={(e) => e.target.showPicker?.()}
                        />
                        <small>When office hours end</small>
                      </div>

                      <div className="form-group">
                        <label>☕ Break Time (minutes)</label>
                        <input
                          type="number"
                          name="breakTime"
                          value={configForm.breakTime}
                          onChange={handleConfigChange}
                          min="0"
                          max="180"
                        />
                        <small>Daily break duration</small>
                      </div>
                    </div>

                    <div className="info-box">
                      <strong>Summary:</strong> Office hours{" "}
                      {configForm.startTime} - {configForm.endTime}(
                      {(
                        (new Date(`1970-01-01T${configForm.endTime}`) -
                          new Date(`1970-01-01T${configForm.startTime}`)) /
                        (1000 * 60 * 60)
                      ).toFixed(1)}{" "}
                      hours) with {configForm.breakTime} min break
                    </div>

                    <button
                      type="submit"
                      className="btn-submit-full"
                      disabled={submitting}
                    >
                      {submitting ? "⏳ Saving..." : "💾 Save Working Hours"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* LEAVE POLICY TAB */}
            {activeTab === "leave-policy" && (
              <div className="tab-panel">
                <form onSubmit={handleConfigSubmit}>
                  <div className="config-card">
                    <h2>📋 Leave Policy Configuration</h2>
                    <p className="card-description">
                      Set monthly leave limits and absence rules.
                    </p>

                    <div className="form-grid">
                      <div className="form-group">
                        <label>📅 Allowed Leaves Per Month</label>
                        <input
                          type="number"
                          name="allowedLeaves"
                          value={configForm.allowedLeaves}
                          onChange={handleConfigChange}
                          min="0"
                          max="10"
                        />
                        <small>Maximum leaves allowed per month</small>
                      </div>

                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            name="autoAbsentOnExceed"
                            checked={configForm.autoAbsentOnExceed}
                            onChange={handleConfigChange}
                          />
                          <span>Auto-mark as Absent after exceeding limit</span>
                        </label>
                        <small>
                          Automatically mark as absent if leaves exceed the
                          limit
                        </small>
                      </div>
                    </div>

                    <div className="info-box warning">
                      <strong>⚠️ Policy:</strong> Employees can take{" "}
                      {configForm.allowedLeaves} leave(s) per month.
                      {configForm.autoAbsentOnExceed &&
                        ` Leave #${configForm.allowedLeaves + 1} onwards will be marked as Absent.`}
                    </div>

                    <button
                      type="submit"
                      className="btn-submit-full"
                      disabled={submitting}
                    >
                      {submitting ? "⏳ Saving..." : "💾 Save Leave Policy"}
                    </button>
                  </div>
                </form>
              </div>
            )}
            {/* DEDUCTION POLICY TAB */}
            {activeTab === "deduction-policy" && (
              <div className="tab-panel">
                <DeductionConfig onSaved={() => {}} />
              </div>
            )}

            {/* ALERT SETTINGS TAB */}
{activeTab === 'alert-settings' && (
  <div className="tab-panel">
    <AlertSettings />
  </div>
)}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagementPanel;
