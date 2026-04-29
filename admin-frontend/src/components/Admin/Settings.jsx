/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars, import/no-anonymous-default-export, jsx-a11y/anchor-is-valid */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import adminService from "../../services/adminService";
import api from "../../services/api";
import "../../styles/Admin.css";


const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ── Profile Form ────────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  // ── Password Form ───────────────────────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ── System Settings ─────────────────────────────────────────────────────────
  const [systemSettings, setSystemSettings] = useState({
    companyName: "Attendance System",
    workingHoursStart: "09:00",
    workingHoursEnd: "18:00",
    weekendDays: ["Saturday", "Sunday"],
    overtimeRate: 1.5,
    lateMarkingMinutes: 15,
    emailNotifications: true,
    smsNotifications: false,
  });

  const [errors, setErrors] = useState({});

  // ── Load real admin profile on mount ────────────────────────────────────────
  useEffect(() => {
    loadAdminProfile();
  }, []);

  const loadAdminProfile = async () => {
    setProfileLoading(true);
    try {
      const response = await api.get("/admin/profile");
      if (response.data?.success) {
        const u = response.data.data?.user || response.data.data || {};
        setProfileForm({
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || u.phoneNumber || "",
          address: u.address || "",
        });
      }
    } catch (e) {
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem("admin_user");
        if (stored) {
          const u = JSON.parse(stored);
          setProfileForm({
            name: u.name || (u.firstName ? `${u.firstName} ${u.lastName}` : ""),
            email: u.email || "",
            phone: u.phone || u.phoneNumber || "",
            address: u.address || "",
          });
        }
      } catch (err) {
        console.error("localStorage parse error", err);
      }
    } finally {
      setProfileLoading(false); // ✅ har case mein false ho
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setErrorMsg("");
    setTimeout(() => setSuccessMsg(""), 3000);
  };
  const showError = (msg) => {
    setErrorMsg(msg);
    setSuccessMsg("");
    setTimeout(() => setErrorMsg(""), 4000);
  };

  // ── Profile handlers ────────────────────────────────────────────────────────
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.put("/admin/profile", profileForm);
      if (response.data?.success) {
        // Update localStorage so navbar/other components reflect new name
        const stored = localStorage.getItem("admin_user");
        if (stored) {
          const u = JSON.parse(stored);
          localStorage.setItem(
            "admin_user",
            JSON.stringify({ ...u, ...profileForm }),
          );
        }
        showSuccess("✅ Profile updated successfully!");
        window.dispatchEvent(new Event('storage'));

      } else {
        showError(response.data?.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      showError(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // ── Password handlers ───────────────────────────────────────────────────────
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    if (!passwordForm.currentPassword)
      newErrors.currentPassword = "Current password is required";
    if (!passwordForm.newPassword)
      newErrors.newPassword = "New password is required";
    else if (passwordForm.newPassword.length < 6)
      newErrors.newPassword = "Password must be at least 6 characters";
    if (passwordForm.newPassword !== passwordForm.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handlePasswordSubmit = async (e) => {
  e.preventDefault();
  if (!validatePasswordForm()) return;
  setLoading(true);
  try {
    // ✅ admin_token use karo
    const token = localStorage.getItem("admin_token");
    if (!token) {
      showError("Session expired. Please login again.");
      setLoading(false);
      return;
    }

    const response = await fetch("http://localhost:5000/api/v1/auth/change-password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        oldPassword: passwordForm.currentPassword,
        password: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      })
    });

    const data = await response.json();

    if (data.success) {
      showSuccess("✅ Password changed successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      showError(data.message || "Failed to change password");
    }
  } catch (error) {
    showError(error.message || "Failed to change password");
  } finally {
    setLoading(false);
  }
};

  // ── System Settings handlers ─────────────────────────────────────────────────
  const handleSystemChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSystemSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSystemSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.put("/admin/settings", systemSettings);
      if (response.data?.success) {
        showSuccess("✅ System settings saved!");
      } else {
        showError(response.data?.message || "Failed to save settings");
      }
    } catch (error) {
      showError(
        error.response?.data?.message || "Failed to save system settings",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="admin-container">
      <AdminNavbar />
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <div className="page-header">
            <h1>⚙️ Settings</h1>
          </div>

          {/* Success / Error banners */}
          {successMsg && <div style={banner("success")}>{successMsg}</div>}
          {errorMsg && <div style={banner("error")}>{errorMsg}</div>}

        <div style={breadcrumbContainer}>
  {[
    { key: "profile", label: "👤 Profile" },
    { key: "password", label: "🔒 Password" },
    { key: "system", label: "⚙️ System" },
  ].map((t, index, arr) => (
    <React.Fragment key={t.key}>
      <button
        onClick={() => setActiveTab(t.key)}
        style={breadcrumbBtn(activeTab === t.key)}
      >
        {t.label}
      </button>
      {index < arr.length - 1 && (
        <span style={arrowStyle}>›</span>
      )}
    </React.Fragment>
  ))}
</div>

          <div className="settings-content">
            {/* ── PROFILE TAB ── */}
            {activeTab === "profile" && (
              <div className="form-container">
                <h2>Profile Settings</h2>
                {profileLoading ? (
                  <div
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "#6b7280",
                    }}
                  >
                    Loading profile...
                  </div>
                ) : (
                  <form
                    onSubmit={handleProfileSubmit}
                    className="settings-form"
                  >
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={profileForm.name}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Email Address *</label>
                        <input
                          type="email"
                          name="email"
                          value={profileForm.email}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={profileForm.phone}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Address</label>
                        <textarea
                          name="address"
                          value={profileForm.address}
                          onChange={handleProfileChange}
                          rows="3"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                    >
                      {loading ? "Updating..." : "Update Profile"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ── PASSWORD TAB ── */}
            {activeTab === "password" && (
              <div className="form-container">
                <h2>Change Password</h2>
                <form onSubmit={handlePasswordSubmit} className="settings-form">
                  <div className="form-grid">
                    {[
                      { name: "currentPassword", label: "Current Password" },
                      { name: "newPassword", label: "New Password" },
                      {
                        name: "confirmPassword",
                        label: "Confirm New Password",
                      },
                    ].map((f) => (
                      <div className="form-group" key={f.name}>
                        <label>{f.label} *</label>
                        <input
                          type="password"
                          name={f.name}
                          value={passwordForm[f.name]}
                          onChange={handlePasswordChange}
                          className={errors[f.name] ? "error" : ""}
                        />
                        {errors[f.name] && (
                          <span className="error-text">{errors[f.name]}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Change Password"}
                  </button>
                </form>
              </div>
            )}

            {/* ── SYSTEM TAB ── */}
           {/* ── SYSTEM TAB ── */}
{activeTab === "system" && (
  <div className="form-container" style={{ textAlign: "center", padding: "60px 40px" }}>
    <div style={{ fontSize: "56px", marginBottom: "16px" }}>⚙️</div>
    <h2 style={{ color: "#1f2937", marginBottom: "8px" }}>System Settings</h2>
    <p style={{ color: "#6b7280", marginBottom: "32px", fontSize: "15px" }}>
      Working hours, holidays, leave policy aur deduction settings<br />
      Management Panel se configure hoti hain.
    </p>
    <button
      onClick={() => navigate("/admin/management-panel")}
      className="btn-primary"
      style={{
        padding: "14px 36px",
        fontSize: "15px",
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        border: "none",
        borderRadius: "10px",
        color: "white",
        cursor: "pointer",
        fontWeight: "600"
      }}
    >
      ⚙️ Go to Management Panel
    </button>
  </div>
)}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Inline banner styles ───────────────────────────────────────────────────────
const banner = (type) => ({
  padding: "12px 20px",
  marginBottom: "16px",
  borderRadius: "10px",
  fontWeight: "600",
  fontSize: "14px",
  background: type === "success" ? "#ecfdf5" : "#fef2f2",
  color: type === "success" ? "#065f46" : "#991b1b",
  border: `1px solid ${type === "success" ? "#a7f3d0" : "#fecaca"}`,
});
const breadcrumbContainer = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "4px",
  padding: "12px 20px",
  background: "#f9fafb",
  borderRadius: "12px",
  marginBottom: "20px",
  border: "1px solid #e5e7eb",
};

const breadcrumbBtn = (isActive) => ({
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: isActive ? "700" : "400",
  color: isActive ? "#4f46e5" : "#6b7280",
  padding: "4px 8px",
  borderRadius: "6px",
  transition: "all 0.2s",
});

const arrowStyle = {
  color: "#9ca3af",
  fontSize: "18px",
  fontWeight: "300",
  lineHeight: 1,
};

export default Settings;

