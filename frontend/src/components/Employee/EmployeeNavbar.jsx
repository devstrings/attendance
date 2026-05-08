import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Employee.css";
import NotificationCenter from "../Common/NotificationCenter";
import TokenExpiryWatcher from "../Common/TokenExpiryWatcher";

const EmployeeNavbar = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(false);
  const [employeeName, setEmployeeName] = useState("Employee User");
  const [profilePic, setProfilePic] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    const storedUser =
      localStorage.getItem("employee_user") || localStorage.getItem("user");

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);

        // Name logic
        const name =
          user.name ||
          (user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : null) ||
          user.firstName ||
          user.profile?.firstName
            ? `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim()
            : null;

        if (name && name.trim()) {
          setEmployeeName(name.trim());
        } else {
          const token =
            localStorage.getItem("employee_token") ||
            localStorage.getItem("token");
          if (token) {
            fetch("http://localhost:5000/api/v1/employee/profile", {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then((r) => r.json())
              .then((data) => {
                const emp = data.data?.employee || data.data || {};
                const realName =
                  `${emp.firstName || ""} ${emp.lastName || ""}`.trim();
                if (realName) setEmployeeName(realName);
              })
              .catch(() => {});
          }
        }

        // ✅ User-specific pic load karo
        const email = user.email || "employee";
        const pic =
          localStorage.getItem(`employee_profile_pic_${email}`) ||
          localStorage.getItem("employee_profile_pic");
        if (pic) setProfilePic(pic);

      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

  const formatDate = (date) =>
    date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const handleLogout = () => {
    localStorage.removeItem("employee_token");
    localStorage.removeItem("employee_user");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.clear();
    navigate("/");
  };

  const handleCorrectionRequest = () => {
    navigate("/employee/my-requests", {
      state: { activeTab: "correction", openModal: true },
    });
  };

  return (
    <>
      <TokenExpiryWatcher role="employee" />
      <nav className="employee-navbar">
        <div className="navbar-left">
          <div
            className="navbar-logo"
            onClick={() => navigate("/employee/dashboard")}
          >
            <span className="logo-icon">📊</span>
            <span className="logo-text">Attendance System</span>
          </div>
        </div>

        <div className="navbar-center">
          <div className="datetime-display">
            <div className="current-time">{formatTime(currentTime)}</div>
            <div className="current-date">{formatDate(currentTime)}</div>
          </div>
        </div>

        <div className="navbar-right">
          <div className="employee-badge">
            <span className="badge-icon">👤</span>
            <span className="badge-text">EMPLOYEE</span>
          </div>

          <div style={{ marginRight: "8px" }}>
            <NotificationCenter userType="employee" />
          </div>

          <div
            className="user-profile"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div
              className="profile-avatar"
              style={{ overflow: "hidden", padding: 0 }}
            >
              {profilePic ? (
                <img
                  src={profilePic}
                  alt="pic"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              ) : (
                employeeName.charAt(0).toUpperCase()
              )}
            </div>
            <span className="profile-name">{employeeName}</span>
            <span className="dropdown-arrow">▼</span>

            {showDropdown && (
              <div className="profile-dropdown">
                <div
                  className="dropdown-item"
                  onClick={() => navigate("/employee/dashboard")}
                >
                  <span>🏠</span> Dashboard
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => navigate("/employee/profile")}
                >
                  <span>👤</span> My Profile
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => navigate("/employee/my-attendance")}
                >
                  <span>📝</span> My Attendance
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-section-title">
                  <span>📋 Requests & Leave</span>
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => navigate("/employee/request-leave")}
                >
                  <span>🏖️</span> Request Leave
                </div>
                <div
                  className="dropdown-item"
                  onClick={handleCorrectionRequest}
                >
                  <span>✏️</span> Correction Request
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => navigate("/employee/my-requests")}
                >
                  <span>📋</span> My Requests
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => navigate("/employee/overtime-requests")}
                >
                  <span>⏰</span> Overtime Request
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item logout" onClick={handleLogout}>
                  <span>🚪</span> Logout
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default EmployeeNavbar;