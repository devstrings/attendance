/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars, import/no-anonymous-default-export, jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeNavbar from "./EmployeeNavbar";
import "../../styles/Employee.css";
import { formatDate } from "../../utils/dateUtils";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";

const MyProfile = () => {
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState(null);
  const fileInputRef = useRef(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const getToken = () =>
    localStorage.getItem("employee_token") || localStorage.getItem("token");

  useEffect(() => {
    fetchProfileData();
    const pic = localStorage.getItem("employee_profile_pic");
    const fetchPic = async () => {
  try {
    const token = getToken();
    const res = await fetch(`${API}/admin/profile-picture`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.profilePicture) {
        setProfilePic(data.profilePicture);
        localStorage.setItem("employee_profile_pic", data.profilePicture);
      }
    }
  } catch (e) {}
};
fetchPic();
    if (pic) setProfilePic(pic);
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const res = await fetch(`${API}/employee/profile`, { headers });
      if (res.ok) {
        const data = await res.json();
        const emp = data.data?.employee || data.data || data.employee || data;

        let stats = {
          totalPresent: 0,
          totalAbsent: 0,
          totalLeave: 0,
          attendanceRate: 0,
        };
        try {
          const statsRes = await fetch(`${API}/attendance/my-stats`, {
            headers,
          });
          if (statsRes.ok) {
            const sd = await statsRes.json();
            stats = sd.data || sd.stats || stats;
          }
        } catch (e) {}

        setEmployeeData({
          id: emp.employeeCode || emp._id || "—",
          name:
            emp.fullName ||
            `${emp.firstName || ""} ${emp.lastName || ""}`.trim() ||
            "Employee",
          email: emp.email || emp.userId?.email || "—",
          phone: emp.phone || emp.phoneNumber || emp.contactNumber || "—",
          address: emp.address || emp.homeAddress || "—",
          department: emp.department || emp.departmentName || "—",
          position: emp.position || emp.designation || emp.jobTitle || "—",
          baseSalary: emp.salary || emp.baseSalary || emp.monthlySalary || 0,
          joiningDate: emp.joiningDate || emp.hireDate || emp.startDate || null,
          manager:
            emp.managerName || emp.manager?.name || emp.manager?.firstName
              ? `${emp.manager?.firstName || ""} ${emp.manager?.lastName || ""}`.trim()
              : emp.managerName || "—",
          status: emp.status || emp.employmentStatus || "active",
          attendanceRate: stats.attendanceRate || stats.rate || 0,
          totalPresent: stats.totalPresent || stats.present || 0,
          totalAbsent: stats.totalAbsent || stats.absent || 0,
          totalLeave: stats.totalLeave || stats.leave || 0,
        });
      } else {
        const meRes = await fetch(`${API}/auth/me`, { headers });
        if (meRes.ok) {
          const md = await meRes.json();
          const u = md.data?.user || md.user || md.data || md;
          setEmployeeData({
            id: u.employeeCode || u._id || "—",
            name:
              u.name ||
              u.fullName ||
              `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
              "Employee",
            email: u.email || "—",
            phone: u.phone || u.phoneNumber || "—",
            address: u.address || "—",
            department: u.department || "—",
            position: u.position || u.designation || u.role || "—",
            baseSalary: u.salary || u.baseSalary || 0,
            joiningDate: u.joiningDate || u.createdAt || null,
            manager: u.managerName || "—",
            status: u.status || u.isActive ? "active" : "inactive",
            attendanceRate: 0,
            totalPresent: 0,
            totalAbsent: 0,
            totalLeave: 0,
          });
        } else {
          const stored = localStorage.getItem("user");
          const u = stored ? JSON.parse(stored) : {};
          setEmployeeData({
            id: u.employeeCode || "—",
            name: u.name || u.fullName || "Employee User",
            email: u.email || "—",
            phone: u.phone || "—",
            address: u.address || "—",
            department: u.department || "—",
            position: u.position || u.role || "—",
            baseSalary: u.salary || 0,
            joiningDate: u.joiningDate || null,
            manager: u.managerName || "—",
            status: u.status || "active",
            attendanceRate: 0,
            totalPresent: 0,
            totalAbsent: 0,
            totalLeave: 0,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      const stored = localStorage.getItem("user");
      const u = stored ? JSON.parse(stored) : {};
      setEmployeeData({
        id: "—",
        name: u.name || "Employee User",
        email: u.email || "—",
        phone: "—",
        address: "—",
        department: "—",
        position: u.role || "—",
        baseSalary: 0,
        joiningDate: null,
        manager: "—",
        status: "active",
        attendanceRate: 0,
        totalPresent: 0,
        totalAbsent: 0,
        totalLeave: 0,
      });
    } finally {
      setLoading(false);
    }
  };
 const handlePicChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { alert("2MB se kam honi chahiye"); return; }
  const reader = new FileReader();
  reader.onload = async (ev) => {
    const base64 = ev.target.result;
    setProfilePic(base64);
    localStorage.setItem("employee_profile_pic", base64);

    try {
      const token = getToken();
      await fetch(
        `${API}/admin/profile-picture`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ profilePicture: base64 }),
        }
      );
    } catch (err) {}
  };
  reader.readAsDataURL(file);
};

  const handleRemovePic = () => {
    setProfilePic(null);
    localStorage.removeItem("employee_profile_pic");
  };

  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (pwErrors[name]) setPwErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validatePassword = () => {
    const errs = {};
    if (!passwordForm.currentPassword)
      errs.currentPassword = "Current password is required";
    if (!passwordForm.newPassword)
      errs.newPassword = "New password is required";
    else if (passwordForm.newPassword.length < 6)
      errs.newPassword = "Minimum 6 characters";
    if (passwordForm.newPassword !== passwordForm.confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setPwLoading(true);
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword: passwordForm.currentPassword,
          password: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Password changed successfully!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        alert("❌ " + (data.message || "Failed to change password"));
      }
    } catch (error) {
      alert("❌ Failed to change password");
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="employee-container">
        <EmployeeNavbar />
        <div className="employee-content">
          <div style={S.loadingBox}>
            <div style={S.spinner}></div>
            <p style={{ color: "#6b7280", marginTop: 12 }}>
              Loading profile...
            </p>
          </div>
          <style>{spinnerCSS}</style>
        </div>
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="employee-container">
        <EmployeeNavbar />
        <div className="employee-content">
          <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
            Profile not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-container">
      <EmployeeNavbar />
      <div className="employee-content" style={S.content}>
        <div style={S.pageHeader}>
          <div>
            <h1 style={S.pageTitle}>👤 My Profile</h1>
            <p style={S.pageSubtitle}>
              Your personal and employment information
            </p>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.profileTop}>
            <div style={{ position: "relative", display: "inline-block" }}>
              {profilePic ? (
                <img
                  src={profilePic}
                  alt="Profile"
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid #667eea",
                    cursor: "pointer",
                  }}
                  onClick={() => fileInputRef.current.click()}
                />
              ) : (
                <div
                  style={{ ...S.avatarXl, cursor: "pointer" }}
                  onClick={() => fileInputRef.current.click()}
                >
                  {(employeeData.name || "E").charAt(0).toUpperCase()}
                </div>
              )}
              <div
                onClick={() => fileInputRef.current.click()}
                style={{
                  position: "absolute",
                  bottom: 4,
                  right: 4,
                  background: "#667eea",
                  borderRadius: "50%",
                  width: 26,
                  height: 26,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 13,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                }}
              >
                📷
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePicChange}
              />
            </div>
            <div>
              <h2 style={S.empName}>{employeeData.name}</h2>
              <p style={S.empPosition}>{employeeData.position}</p>
              <span style={S.activeBadge}>✅ {employeeData.status}</span>
              {profilePic && (
                <button
                  onClick={handleRemovePic}
                  style={{
                    marginTop: 6,
                    display: "block",
                    background: "none",
                    border: "1px solid #ef4444",
                    color: "#ef4444",
                    borderRadius: 6,
                    padding: "3px 10px",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  🗑️ Remove Photo
                </button>
              )}
            </div>
          </div>

          <div style={S.divider}></div>

          <div style={S.section}>
            <h3 style={S.sectionTitle}>🏢 Employment Details</h3>
            <div style={S.infoGrid}>
              <div style={S.infoItem}>
                <div style={S.infoLabel}>Department</div>
                <div style={S.infoValue}>{employeeData.department}</div>
              </div>
              <div style={S.infoItem}>
                <div style={S.infoLabel}>Position</div>
                <div style={S.infoValue}>{employeeData.position}</div>
              </div>
              <div style={S.infoItem}>
                <div style={S.infoLabel}>Manager</div>
                <div style={S.infoValue}>{employeeData.manager}</div>
              </div>
              <div style={S.infoItem}>
                <div style={S.infoLabel}>Joining Date</div>
                {/* ✅ FIXED: formatDate use karo — timezone safe */}
                <div style={S.infoValue}>
                  {formatDate(employeeData.joiningDate) || "—"}
                </div>
              </div>
              <div style={S.infoItem}>
                <div style={S.infoLabel}>Base Salary</div>
                <div
                  style={{ ...S.infoValue, color: "#10b981", fontWeight: 700 }}
                >
                  {employeeData.baseSalary > 0
                    ? `PKR ${employeeData.baseSalary.toLocaleString()}`
                    : "—"}
                </div>
              </div>
              <div style={S.infoItem}>
                <div style={S.infoLabel}>Status</div>
                <div style={S.infoValue}>
                  <span style={S.activeBadge}>✅ {employeeData.status}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={S.divider}></div>

          <div style={S.section}>
            <h3 style={S.sectionTitle}>🔒 Change Password</h3>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 20 }}>
              Keep your account secure. Use a strong combination of letters,
              numbers, and symbols.
            </p>
            <form onSubmit={handlePasswordSubmit}>
              <div style={S.pwGrid}>
                {[
                  {
                    key: "current",
                    name: "currentPassword",
                    label: "Current Password *",
                    placeholder: "Enter current password",
                  },
                  {
                    key: "new",
                    name: "newPassword",
                    label: "New Password *",
                    placeholder: "Min 6 characters",
                  },
                  {
                    key: "confirm",
                    name: "confirmPassword",
                    label: "Confirm New Password *",
                    placeholder: "Confirm new password",
                  },
                ].map(({ key, name, label, placeholder }) => (
                  <div key={key} style={S.formGroup}>
                    <label style={S.label}>{label}</label>
                    <div style={S.inputWrap}>
                      <input
                        type={showPasswords[key] ? "text" : "password"}
                        name={name}
                        value={passwordForm[name]}
                        onChange={handlePwChange}
                        placeholder={placeholder}
                        style={{
                          ...S.input,
                          borderColor: pwErrors[name] ? "#ef4444" : "#e5e7eb",
                        }}
                      />
                      <button
                        type="button"
                        style={S.eyeBtn}
                        onClick={() =>
                          setShowPasswords((p) => ({ ...p, [key]: !p[key] }))
                        }
                      >
                        {showPasswords[key] ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {pwErrors[name] && (
                      <span style={S.errorText}>{pwErrors[name]}</span>
                    )}
                  </div>
                ))}
              </div>

              <div style={S.pwRequirements}>
                <div style={S.reqTitle}>Password Requirements:</div>
                <div style={S.reqList}>
                  {[
                    {
                      check: passwordForm.newPassword.length >= 6,
                      label: "At least 6 characters",
                    },
                    {
                      check: /[A-Z]/.test(passwordForm.newPassword),
                      label: "Uppercase letter",
                    },
                    {
                      check: /[0-9]/.test(passwordForm.newPassword),
                      label: "Number",
                    },
                  ].map(({ check, label }) => (
                    <span
                      key={label}
                      style={{ color: check ? "#10b981" : "#9ca3af" }}
                    >
                      {check ? "✅" : "○"} {label}
                    </span>
                  ))}
                </div>
              </div>

              <div style={S.pwActions}>
                <button
                  type="button"
                  style={S.btnSecondary}
                  disabled={pwLoading}
                  onClick={() => {
                    setPasswordForm({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setPwErrors({});
                  }}
                >
                  Reset
                </button>
                <button type="submit" style={S.btnPrimary} disabled={pwLoading}>
                  {pwLoading ? "⏳ Changing..." : "🔒 Change Password"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div style={S.actionRow}>
          <button
            style={S.btnPrimary}
            onClick={() => navigate("/employee/my-attendance")}
          >
            📝 View My Attendance
          </button>
          <button
            style={S.btnSecondary}
            onClick={() => navigate("/employee/attendance-history")}
          >
            📅 Attendance History
          </button>
        </div>
      </div>
      <style>{spinnerCSS}</style>
    </div>
  );
};

const spinnerCSS = `@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`;

const S = {
  content: {
    padding: 24,
    background: "#f9fafb",
    minHeight: "calc(100vh - 80px)",
  },
  loadingBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 400,
  },
  spinner: {
    width: 48,
    height: 48,
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 700,
    background: "linear-gradient(135deg,#667eea,#764ba2)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    margin: "0 0 4px 0",
  },
  pageSubtitle: { fontSize: 14, color: "#6b7280", margin: 0 },
  card: {
    background: "white",
    borderRadius: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    overflow: "hidden",
    marginBottom: 20,
  },
  profileTop: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    padding: "32px 32px 24px",
  },
  avatarXl: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#667eea,#764ba2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: 32,
    fontWeight: 700,
    flexShrink: 0,
  },
  empName: {
    fontSize: 24,
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 4px 0",
  },
  empPosition: { fontSize: 15, color: "#6b7280", margin: "0 0 10px 0" },
  activeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 12px",
    background: "rgba(16,185,129,0.1)",
    color: "#059669",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    border: "1px solid rgba(16,185,129,0.2)",
    textTransform: "capitalize",
  },
  divider: { height: 1, background: "#f3f4f6", margin: "0 24px" },
  section: { padding: "24px 32px" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 20px 0",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 20,
  },
  infoItem: { display: "flex", flexDirection: "column", gap: 6 },
  infoLabel: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  infoValue: { fontSize: 15, fontWeight: 600, color: "#111827" },
  idBadge: {
    display: "inline-block",
    padding: "3px 10px",
    background: "#ede9fe",
    color: "#7c3aed",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 700,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 16,
  },
  statCard: {
    background: "#f9fafb",
    borderRadius: 12,
    padding: "16px 20px",
    textAlign: "center",
    borderTop: "4px solid",
    border: "1px solid #e5e7eb",
  },
  statLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    marginBottom: 8,
  },
  statValue: { fontSize: 32, fontWeight: 800 },
  pwGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 20,
    marginBottom: 20,
  },
  formGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  input: {
    width: "100%",
    padding: "11px 44px 11px 14px",
    border: "2px solid",
    borderRadius: 10,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  eyeBtn: {
    position: "absolute",
    right: 10,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 16,
    padding: 4,
  },
  errorText: { fontSize: 12, color: "#ef4444", marginTop: 2 },
  pwRequirements: {
    background: "#f9fafb",
    borderRadius: 10,
    padding: "14px 18px",
    marginBottom: 20,
    border: "1px solid #e5e7eb",
  },
  reqTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 8,
  },
  reqList: { display: "flex", gap: 20, flexWrap: "wrap" },
  pwActions: { display: "flex", gap: 12, justifyContent: "flex-end" },
  btnPrimary: {
    padding: "11px 24px",
    background: "linear-gradient(135deg,#667eea,#764ba2)",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnSecondary: {
    padding: "11px 24px",
    background: "white",
    color: "#667eea",
    border: "2px solid #667eea",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  actionRow: { display: "flex", gap: 12, flexWrap: "wrap" },
};

export default MyProfile;
