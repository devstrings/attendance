import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import adminService from "../../services/adminService";
import api from "../../services/api";
import "../../styles/Admin.css";
import MarkAttendanceModal from "./MarkAttendanceModal";
import { sendBroadcast } from "../../services/notificationService";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalEmployees: 0,
      presentToday: 0,
      absentToday: 0,
      leaveToday: 0,
    },
  });
  const [pendingOvertimeCount, setPendingOvertimeCount] = useState(0);
  const [pendingCorrectionCount, setPendingCorrectionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMarkAttendanceModal, setShowMarkAttendanceModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  
  const [broadcastData, setBroadcastData] = useState({
    updateType: "",
    updateDetails: "",
    affectedUsers: "all",
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchPendingOvertimeCount();
  }, []);

  const fetchPendingCorrectionCount = async () => {
    try {
      const res = await api.get("/correction-requests?status=pending&limit=1");
      if (res.data.success) {
        setPendingCorrectionCount(res.data.data?.pendingCount || 0);
      }
    } catch (e) {
      console.warn("Correction count fetch failed:", e);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastData.updateType || !broadcastData.updateDetails) {
      alert("Please fill in all fields");
      return;
    }
    setSending(true);
    try {
      const response = await sendBroadcast(
        broadcastData.updateType,
        broadcastData.updateDetails,
        broadcastData.affectedUsers,
      );
      if (response.success) {
        alert(`✅ Broadcast sent to ${response.data?.count ?? 0} users`);
        setBroadcastData({
          updateType: "",
          updateDetails: "",
          affectedUsers: "all",
        });
        setShowBroadcastModal(false);
      }
    } catch (error) {
      alert(error.message || "Failed to send broadcast");
    } finally {
      setSending(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboard();
      if (response.success) {
        setDashboardData({
          stats: {
            totalEmployees: response.data.stats?.totalEmployees || 0,
            presentToday: response.data.stats?.todayAttendance || 0,
            absentToday: response.data.stats?.absentToday || 0,
            leaveToday: response.data.stats?.leaveToday || 0,
          },
        });
      }
    } catch (error) {
      console.error("❌ Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Pending overtime requests count fetch
  const fetchPendingOvertimeCount = async () => {
    try {
      const res = await api.get("/attendance/overtime/pending");
      if (res.data.success) {
        setPendingOvertimeCount(
          res.data.data?.count || res.data.data?.requests?.length || 0,
        );
      }
    } catch (e) {
      console.warn("Overtime count fetch failed:", e);
    }
  };

  const getAttendancePercentage = () => {
    if (dashboardData.stats.totalEmployees === 0) return 0;
    return Math.round(
      (dashboardData.stats.presentToday / dashboardData.stats.totalEmployees) *
        100,
    );
  };

  if (loading) {
    return (
      <div className="admin-container">
        <AdminNavbar />
        <div className="admin-layout">
          <AdminSidebar />
          <div className="admin-content">
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
              <p style={styles.loadingText}>Loading dashboard...</p>
            </div>
            <style>{spinnerAnimation}</style>
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
        <div className="admin-content" style={styles.content}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.welcomeSection}>
              <h1 style={styles.title}>
                <span style={styles.emoji}>👋</span>
                Welcome to Devstrings Attendance System
              </h1>
              <p style={styles.subtitle}>
                Overview of your organization's attendance data and quick
                actions
              </p>
            </div>
            <div style={styles.headerActions}>
              <button
                style={styles.primaryButton}
                onClick={() => navigate("/admin/create-employee")}
              >
                <span>➕</span> Add Employee
              </button>
              <button
                style={styles.secondaryButton}
                onClick={() => navigate("/admin/create-manager")}
              >
                <span>👥</span> Add Manager
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            <div style={{ ...styles.statCard, borderLeftColor: "#3b82f6" }}>
              <div style={styles.statHeader}>
                <div style={{ ...styles.statIcon, background: "#3b82f615" }}>
                  👥
                </div>
                <div style={styles.statInfo}>
                  <div style={styles.statLabel}>TOTAL EMPLOYEES</div>
                  <div style={styles.statValue}>
                    {dashboardData.stats.totalEmployees}
                  </div>
                </div>
              </div>
              <div style={styles.statFooter}>
                <a
                  href="#"
                  style={styles.statLink}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/admin/employees");
                  }}
                >
                  View All →
                </a>
              </div>
            </div>

            <div style={{ ...styles.statCard, borderLeftColor: "#10b981" }}>
              <div style={styles.statHeader}>
                <div style={{ ...styles.statIcon, background: "#10b98115" }}>
                  ✅
                </div>
                <div style={styles.statInfo}>
                  <div style={styles.statLabel}>PRESENT TODAY</div>
                  <div style={styles.statValue}>
                    {dashboardData.stats.presentToday}
                  </div>
                </div>
              </div>
              <div style={styles.statFooter}>
                <a
                  href="#"
                  style={styles.statLink}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/admin/attendance-view");
                  }}
                >
                  View Details →
                </a>
              </div>
            </div>

            <div style={{ ...styles.statCard, borderLeftColor: "#ef4444" }}>
              <div style={styles.statHeader}>
                <div style={{ ...styles.statIcon, background: "#ef444415" }}>
                  ❌
                </div>
                <div style={styles.statInfo}>
                  <div style={styles.statLabel}>ABSENT TODAY</div>
                  <div style={styles.statValue}>
                    {dashboardData.stats.absentToday}
                  </div>
                </div>
              </div>
              <div style={styles.statFooter}>
                <a
                  href="#"
                  style={styles.statLink}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/admin/attendance-view");
                  }}
                >
                  View Details →
                </a>
              </div>
            </div>

            <div style={{ ...styles.statCard, borderLeftColor: "#f59e0b" }}>
              <div style={styles.statHeader}>
                <div style={{ ...styles.statIcon, background: "#f59e0b15" }}>
                  🏖️
                </div>
                <div style={styles.statInfo}>
                  <div style={styles.statLabel}>LEAVE TODAY</div>
                  <div style={styles.statValue}>
                    {dashboardData.stats.leaveToday}
                  </div>
                </div>
              </div>
              <div style={styles.statFooter}>
                <a
                  href="#"
                  style={styles.statLink}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/admin/attendance-view");
                  }}
                >
                  Review →
                </a>
              </div>
            </div>
          </div>

          {/* Widgets Grid */}
          <div style={styles.widgetsGrid}>
            {/* Attendance Rate */}
            <div style={styles.widget}>
              <div style={styles.widgetHeader}>
                <h3 style={styles.widgetTitle}>
                  <span style={styles.widgetIcon}>📊</span>
                  Today's Attendance Rate
                </h3>
              </div>
              <div style={styles.widgetContent}>
                <div style={styles.attendanceCircle}>
                  <div style={styles.circleProgress}>
                    <svg width="150" height="150">
                      <circle
                        cx="75"
                        cy="75"
                        r="60"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                      />
                      <circle
                        cx="75"
                        cy="75"
                        r="60"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="12"
                        strokeDasharray={`${(getAttendancePercentage() / 100) * 377} 377`}
                        strokeLinecap="round"
                        transform="rotate(-90 75 75)"
                      />
                    </svg>
                    <div style={styles.circleText}>
                      <div style={styles.percentageText}>
                        {getAttendancePercentage()}%
                      </div>
                      <div style={styles.percentageLabel}>Present</div>
                    </div>
                  </div>
                </div>
                <div style={styles.attendanceDetails}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailDot("green")}>●</span>
                    <span style={styles.detailText}>
                      Present: {dashboardData.stats.presentToday}
                    </span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailDot("red")}>●</span>
                    <span style={styles.detailText}>
                      Absent: {dashboardData.stats.absentToday}
                    </span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailDot("orange")}>●</span>
                    <span style={styles.detailText}>
                      On Leave: {dashboardData.stats.leaveToday}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={styles.widget}>
              <div style={styles.widgetHeader}>
                <h3 style={styles.widgetTitle}>
                  <span style={styles.widgetIcon}>⚡</span>
                  Quick Actions
                </h3>
              </div>
              <div style={styles.widgetContent}>
                <div style={styles.quickActionsList}>
                  <div
                    style={styles.quickActionItem}
                    onClick={() => setShowMarkAttendanceModal(true)}
                  >
                    <div
                      style={{
                        ...styles.actionIcon,
                        background: "#8b5cf615",
                        color: "#8b5cf6",
                      }}
                    >
                      ✓
                    </div>
                    <div style={styles.actionInfo}>
                      <div style={styles.actionTitle}>Mark Attendance</div>
                      <div style={styles.actionDesc}>
                        Mark today's attendance
                      </div>
                    </div>
                    <div style={styles.actionArrow}>→</div>
                  </div>

                  <div
                    style={styles.quickActionItem}
                    onClick={() => setShowBroadcastModal(true)}
                  >
                    <div
                      style={{
                        ...styles.actionIcon,
                        background: "#3b82f615",
                        color: "#3b82f6",
                      }}
                    >
                      📢
                    </div>
                    <div style={styles.actionInfo}>
                      <div style={styles.actionTitle}>Send Broadcast</div>
                      <div style={styles.actionDesc}>
                        Send announcement to all
                      </div>
                    </div>
                    <div style={styles.actionArrow}>→</div>
                  </div>

                  {/* ✅ NEW — Overtime Quick Action with pending badge */}
                  <div
                    style={styles.quickActionItem}
                    onClick={() => navigate("/admin/overtime")}
                  >
                    <div
                      style={{
                        ...styles.actionIcon,
                        background: "#f59e0b15",
                        color: "#f59e0b",
                      }}
                    >
                      ⏱️
                    </div>
                    <div style={styles.actionInfo}>
                      <div
                        style={{
                          ...styles.actionTitle,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        Overtime Management
                        {pendingOvertimeCount > 0 && (
                          <span style={styles.overtimeBadge}>
                            {pendingOvertimeCount} pending
                          </span>
                        )}
                      </div>
                      <div style={styles.actionDesc}>
                        Review & set employee overtime
                      </div>
                    </div>
                    <div style={styles.actionArrow}>→</div>
                  </div>

                  <div
                    style={styles.quickActionItem}
                    onClick={() => navigate("/admin/monthly-summary")}
                  >
                    <div
                      style={{
                        ...styles.actionIcon,
                        background: "#10b98115",
                        color: "#10b981",
                      }}
                    >
                      📊
                    </div>
                    <div style={styles.actionInfo}>
                      <div style={styles.actionTitle}>Monthly Summary</div>
                      <div style={styles.actionDesc}>
                        View attendance & salary reports
                      </div>
                    </div>
                    <div style={styles.actionArrow}>→</div>
                  </div>

                  <div
                    style={styles.quickActionItem}
                    onClick={() => navigate("/admin/overtime")}
                  >
                    <div
                      style={{
                        ...styles.actionIcon,
                        background: "#ef444415",
                        color: "#ef4444",
                      }}
                    >
                      ✏️
                    </div>
                    <div style={styles.actionInfo}>
                      <div
                        style={{
                          ...styles.actionTitle,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        Attendance Corrections
                        {pendingCorrectionCount > 0 && (
                          <span
                            style={{
                              ...styles.overtimeBadge,
                              background: "#fef2f2",
                              color: "#dc2626",
                              border: "1px solid #fecaca",
                            }}
                          >
                            {pendingCorrectionCount} pending
                          </span>
                        )}
                      </div>
                      <div style={styles.actionDesc}>
                        Review & fix attendance records
                      </div>
                    </div>
                    <div style={styles.actionArrow}>→</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showMarkAttendanceModal && (
        <MarkAttendanceModal
          selectedDate={new Date().toISOString().split("T")[0]}
          onClose={() => setShowMarkAttendanceModal(false)}
          onAttendanceMarked={() => {
            
            fetchDashboardData();
          }}
        />
      )}

      {showBroadcastModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setShowBroadcastModal(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: 16,
              width: "100%",
              maxWidth: 520,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                padding: "20px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: "white" }}>
                📢 Send Broadcast Notification
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "white",
                  fontSize: 20,
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  Update Type *
                </label>
                <input
                  type="text"
                  value={broadcastData.updateType}
                  onChange={(e) =>
                    setBroadcastData({
                      ...broadcastData,
                      updateType: e.target.value,
                    })
                  }
                  placeholder="e.g., Holiday Announcement, Policy Change"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "2px solid #e5e7eb",
                    borderRadius: 10,
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  Update Details *
                </label>
                <textarea
                  value={broadcastData.updateDetails}
                  onChange={(e) =>
                    setBroadcastData({
                      ...broadcastData,
                      updateDetails: e.target.value,
                    })
                  }
                  placeholder="Enter detailed message..."
                  rows="4"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "2px solid #e5e7eb",
                    borderRadius: 10,
                    fontSize: 14,
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  Send To
                </label>
                <select
                  value={broadcastData.affectedUsers}
                  onChange={(e) =>
                    setBroadcastData({
                      ...broadcastData,
                      affectedUsers: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "2px solid #e5e7eb",
                    borderRadius: 10,
                    fontSize: 14,
                    outline: "none",
                    background: "white",
                  }}
                >
                  <option value="all">All Users</option>
                  <option value="employee">Employees Only</option>
                  <option value="manager">Managers Only</option>
                </select>
              </div>
              <div
                style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
              >
                <button
                  onClick={() => setShowBroadcastModal(false)}
                  style={{
                    padding: "10px 20px",
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendBroadcast}
                  disabled={
                    sending ||
                    !broadcastData.updateType ||
                    !broadcastData.updateDetails
                  }
                  style={{
                    padding: "10px 24px",
                    background: sending
                      ? "#9ca3af"
                      : "linear-gradient(135deg, #667eea, #764ba2)",
                    color: "white",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: sending ? "not-allowed" : "pointer",
                  }}
                >
                  {sending ? "⏳ Sending..." : "📢 Send Broadcast"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  // ✅ NAYA
content: { padding: "16px", background: "#f9fafb", minHeight: "100vh", boxSizing: "border-box", overflowX: "hidden" },
  // ✅ NAYA
header: {
  background: "white",
  borderRadius: "16px",
  padding: "16px",
  marginBottom: "20px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "12px",
  boxSizing: "border-box",
},
  welcomeSection: { flex: 1, minWidth: "0", maxWidth: "100%" },

 // ✅ NAYA
title: {
  fontSize: "clamp(18px, 4vw, 28px)",
  fontWeight: "700",
  color: "#111827",
  margin: "0 0 8px 0",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  wordBreak: "break-word",
  overflowWrap: "break-word",
},
  emoji: { fontSize: "32px" },
  subtitle: { fontSize: "14px", color: "#6b7280", margin: 0 },
  headerActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  primaryButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
  },
  secondaryButton: {
    padding: "12px 24px",
    background: "white",
    color: "#667eea",
    border: "2px solid #667eea",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  // ✅ NAYA
statsGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "16px",
  marginBottom: "24px",
},
  statCard: {
    background: "white",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    borderLeft: "4px solid",
    cursor: "pointer",
  },
  statHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "16px",
  },
  statIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
  },
  statInfo: { flex: 1 },
  statLabel: {
    fontSize: "11px",
    color: "#6b7280",
    marginBottom: "4px",
    fontWeight: "600",
    letterSpacing: "0.5px",
  },
  statValue: { fontSize: "32px", fontWeight: "700", color: "#111827" },
  statFooter: { borderTop: "1px solid #e5e7eb", paddingTop: "12px" },
  statLink: {
    color: "#667eea",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "600",
  },
  widgetsGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "16px",
},
  widget: {
    background: "white",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    overflow: "hidden",
  },
  widgetHeader: { padding: "20px 24px", borderBottom: "1px solid #e5e7eb" },
  widgetTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  widgetIcon: { fontSize: "20px" },
  widgetContent: { padding: "24px" },
  attendanceCircle: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  },
  circleProgress: { position: "relative" },
  circleText: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
  },
  percentageText: { fontSize: "32px", fontWeight: "700", color: "#111827" },
  percentageLabel: { fontSize: "12px", color: "#6b7280", marginTop: "4px" },
  attendanceDetails: { display: "flex", flexDirection: "column", gap: "8px" },
  detailItem: { display: "flex", alignItems: "center", gap: "8px" },
  detailDot: (color) => ({
    fontSize: "16px",
    color:
      color === "green"
        ? "#10b981"
        : color === "orange"
          ? "#f59e0b"
          : "#ef4444",
  }),
  detailText: { fontSize: "14px", color: "#374151" },
  quickActionsList: { display: "flex", flexDirection: "column", gap: "12px" },
  quickActionItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    background: "#f9fafb",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.3s",
    border: "2px solid transparent",
  },
  actionIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  },
  actionInfo: { flex: 1 },
  actionTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#111827",
    marginBottom: "2px",
  },
  actionDesc: { fontSize: "12px", color: "#6b7280" },
  actionArrow: { fontSize: "18px", color: "#9ca3af" },
  // ✅ Pending overtime badge
  overtimeBadge: {
    background: "#fef3c7",
    color: "#d97706",
    fontSize: "11px",
    fontWeight: "700",
    padding: "2px 8px",
    borderRadius: "10px",
    border: "1px solid #fde68a",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "400px",
    flexDirection: "column",
    gap: "20px",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: { color: "#666", fontSize: "14px" },
};

const spinnerAnimation = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;

export default AdminDashboard;
