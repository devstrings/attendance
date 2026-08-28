/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars, import/no-anonymous-default-export, jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ManagerNavbar from "./ManagerNavbar";
import ManagerSidebar from "./ManagerSidebar";
import managerService from "../../services/managerService";
import "../../styles/Manager.css";

/**
 * ManagerDashboard Component
 * Admin Dashboard jaisa style - same layout, same cards
 * Manager-specific data aur actions ke saath
 */
const ManagerDashboard = () => {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalEmployees: 0,
      presentToday: 0,
      absentToday: 0,
      leaveToday: 0, // ✅ ADD
    },
    companyName: null,   // ✅ NEW
  });

  const [recentAttendance, setRecentAttendance] = useState([]);
  const [systemConfig, setSystemConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();
    fetchSystemConfig();

    // Auto-refresh every 5 seconds
    intervalRef.current = setInterval(() => {
      fetchDashboardData(true);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await managerService.getDashboardStats();
      if (response.success) {
        const s = response.data.stats;
        setDashboardData({
          stats: {
            totalEmployees: s.totalEmployees || 0,
            presentToday: s.todayAttendance || 0,
            absentToday: s.absentToday || 0,
            leaveToday: s.leaveToday || 0, // ✅ ADD
          },
          companyName: response.data.companyName || null,   // ✅ NEW
        });
        const allAttendance = response.data.recentAttendance || [];
        const today = new Date().toDateString();
        const todayAttendance = allAttendance.filter(
          (r) => new Date(r.date).toDateString() === today,
        );

        // Absent employees add karo
        const allEmployees = response.data.employees || [];
        const presentIds = todayAttendance.map(
          (r) => r.employeeId?._id?.toString() || r.employeeId?.toString(),
        );
        const absentEmployees = allEmployees
          .filter((emp) => !presentIds.includes(emp._id?.toString()))
          .map((emp) => ({
            _id: emp._id,
            employeeId: { firstName: emp.firstName, lastName: emp.lastName },
            status: "absent",
            date: new Date(),
            clockIn: null,
          }));

        setRecentAttendance([...todayAttendance, ...absentEmployees]);
      }
    } catch (error) {
      console.error("❌ Dashboard error:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchSystemConfig = async () => {
    try {
      const response = await managerService.getSystemConfig();
      if (response.success) {
        setSystemConfig(response.data.config);
      }
    } catch (error) {
      console.error("❌ System config error:", error);
    }
  };

  const formatTime = (time) => {
    if (!time) return "N/A";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getAttendancePercentage = () => {
    if (dashboardData.stats.totalEmployees === 0) return 0;
    return Math.round(
      (dashboardData.stats.presentToday / dashboardData.stats.totalEmployees) *
        100,
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "present":
        return "✅";
      case "absent":
        return "❌";
      case "leave":
        return "🏖️";
      default:
        return "❓";
    }
  };

  // ─── Loading Screen ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="admin-container">
        <ManagerNavbar />
        <div className="admin-layout">
          <ManagerSidebar />
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

  // ─── Main Dashboard ───────────────────────────────────────────
  return (
    <div className="admin-container">
      <ManagerNavbar />
      <div className="admin-layout">
        <ManagerSidebar />
        <div className="admin-content" style={styles.content}>
          {/* ── Header Section (Admin jaisa) ── */}
          <div style={styles.header}>
            <div style={styles.welcomeSection}>
              <h1 style={styles.title}>
                <span style={styles.emoji}>👔</span>
                Manager Dashboard {dashboardData.companyName ? `— ${dashboardData.companyName}` : ''}
              </h1>
              <p style={styles.subtitle}>
                Manage your team's attendance and performance
              </p>
              <small
                style={{
                  color: "#9ca3af",
                  fontSize: "12px",
                  marginTop: "4px",
                  display: "block",
                }}
              >
                🔄 Auto-refreshing every 5 seconds
              </small>
            </div>
            <div style={styles.headerActions}>
              <button
                style={styles.primaryButton}
                onClick={() => navigate("/manager/mark-attendance")}
              >
                <span>📝</span> Mark Attendance
              </button>
              <button
                style={styles.secondaryButton}
                onClick={() => navigate("/manager/my-employees")}
              >
                <span>👥</span> My Employees
              </button>
            </div>
          </div>

          {/* ── Stats Cards (Admin jaisi 4 cards) ── */}
          <div style={styles.statsGrid}>
            {/* My Employees */}
            <div style={{ ...styles.statCard, borderLeftColor: "#3b82f6" }}>
              <div style={styles.statHeader}>
                <div style={{ ...styles.statIcon, background: "#3b82f615" }}>
                  👥
                </div>
                <div style={styles.statInfo}>
                  <div style={styles.statLabel}>MY EMPLOYEES</div>
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
                    navigate("/manager/my-employees");
                  }}
                >
                  View All →
                </a>
              </div>
            </div>

            {/* Present Today */}
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
                    navigate("/manager/attendance-history");
                  }}
                >
                  View Details →
                </a>
              </div>
            </div>

            {/* Absent Today */}
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
                    navigate("/manager/attendance-history");
                  }}
                >
                  View Details →
                </a>
              </div>
            </div>

            {/* Pending Leaves */}
            <div style={{ ...styles.statCard, borderLeftColor: "#f59e0b" }}>
              <div style={styles.statHeader}>
                <div style={{ ...styles.statIcon, background: "#f59e0b15" }}>
                  🏖️
                </div>
                <div style={styles.statInfo}>
                  <div style={styles.statLabel}>ON LEAVE TODAY</div>
                  <div style={styles.statValue}>
                    {dashboardData.stats.leaveToday || 0}
                  </div>
                </div>
              </div>
              <div style={styles.statFooter}>
                <a
                  href="#"
                  style={styles.statLink}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/manager/attendance-history");
                  }}
                >
                  View Details →
                </a>
              </div>
            </div>
          </div>

          {/* ── Widgets Grid (Admin jaisa 2-column) ── */}
          <div style={styles.widgetsGrid}>
            {/* Today's Attendance Rate Widget */}
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
                      On Leave: {dashboardData.stats.leaveToday || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Widget */}
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
                    onClick={() => navigate("/manager/mark-attendance")}
                  >
                    <div
                      style={{
                        ...styles.actionIcon,
                        background: "#10b98115",
                        color: "#10b981",
                      }}
                    >
                      📝
                    </div>
                    <div style={styles.actionInfo}>
                      <div style={styles.actionTitle}>Mark Attendance</div>
                      <div style={styles.actionDesc}>
                        Record today's attendance
                      </div>
                    </div>
                    <div style={styles.actionArrow}>→</div>
                  </div>

                  <div
                    style={styles.quickActionItem}
                    onClick={() => navigate("/manager/clock-in-out")}
                  >
                    <div
                      style={{
                        ...styles.actionIcon,
                        background: "#3b82f615",
                        color: "#3b82f6",
                      }}
                    >
                      ⏰
                    </div>
                    <div style={styles.actionInfo}>
                      <div style={styles.actionTitle}>Clock In/Out</div>
                      <div style={styles.actionDesc}>Manage clock records</div>
                    </div>
                    <div style={styles.actionArrow}>→</div>
                  </div>

                  {/* <div
                    style={styles.quickActionItem}
                    onClick={() => navigate("/manager/attendance-history")}
                  >
                    <div
                      style={{
                        ...styles.actionIcon,
                        background: "#f59e0b15",
                        color: "#f59e0b",
                      }}
                    >
                      📅
                    </div>
                    <div style={styles.actionInfo}>
                      <div style={styles.actionTitle}>Attendance History</div>
                      <div style={styles.actionDesc}>View past records</div>
                    </div>
                    <div style={styles.actionArrow}>→</div>
                  </div> */}
                </div>
              </div>
            </div>
          </div>

          {/* ── Recent Attendance Table ── */}
          <div style={{ ...styles.widget, marginTop: "24px" }}>
            <div style={styles.widgetHeader}>
              <h3 style={styles.widgetTitle}>
                <span style={styles.widgetIcon}>📋</span>
                Recent Attendance
              </h3>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeadRow}>
                    <th style={styles.th}>Employee</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Clock In</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttendance.length > 0 ? (
                    recentAttendance.map((record) => (
                      <tr key={record._id} style={styles.tableRow}>
                        <td style={styles.td}>
                          <strong>
                            {record.employeeId?.firstName}{" "}
                            {record.employeeId?.lastName}
                          </strong>
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              ...(record.status === "present"
                                ? styles.badgePresent
                                : record.status === "absent"
                                  ? styles.badgeAbsent
                                  : styles.badgeLeave),
                            }}
                          >
                            {getStatusIcon(record.status)} {record.status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td style={styles.td}>
                          {record.clockIn
                            ? new Date(record.clockIn).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={styles.noData}>
                        No recent attendance records
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Office Hours & Policy ── */}
          <div style={{ ...styles.widget, marginTop: "24px" }}>
            <div style={styles.widgetHeader}>
              <h3 style={styles.widgetTitle}>
                <span style={styles.widgetIcon}>📋</span>
                Office Hours & Policy
              </h3>
            </div>
            <div style={styles.widgetContent}>
              {systemConfig ? (
                <div style={styles.policyGrid}>
                  <div style={styles.policyItem}>
                    <span style={styles.policyIcon}>🕙</span>
                    <div>
                      <div style={styles.policyLabel}>Office Hours</div>
                      <div style={styles.policyValue}>
                        {formatTime(systemConfig.workingHours?.startTime)} -{" "}
                        {formatTime(systemConfig.workingHours?.endTime)}
                      </div>
                    </div>
                  </div>
                  <div style={styles.policyItem}>
                    <span style={styles.policyIcon}>⏰</span>
                    <div>
                      <div style={styles.policyLabel}>Late Entry After</div>
                      <div style={styles.policyValue}>
                        {formatTime(systemConfig.workingHours?.lateEntryTime)}
                      </div>
                    </div>
                  </div>
                  <div style={styles.policyItem}>
                    <span style={styles.policyIcon}>📅</span>
                    <div>
                      <div style={styles.policyLabel}>Working Days</div>
                      <div style={styles.policyValue}>
                        {systemConfig.workingDays?.join(", ") ||
                          "Monday to Friday"}
                      </div>
                    </div>
                  </div>
                  <div style={styles.policyItem}>
                    <span style={styles.policyIcon}>🏖️</span>
                    <div>
                      <div style={styles.policyLabel}>Weekends</div>
                      <div style={styles.policyValue}>
                        {systemConfig.weekendDays?.join(", ") ||
                          "Saturday & Sunday"}
                      </div>
                    </div>
                  </div>
                  <div style={styles.policyItem}>
                    <span style={styles.policyIcon}>☕</span>
                    <div>
                      <div style={styles.policyLabel}>Break Time</div>
                      <div style={styles.policyValue}>
                        {systemConfig.breakTime || 60} minutes
                      </div>
                    </div>
                  </div>
                  <div style={styles.policyItem}>
                    <span style={styles.policyIcon}>📝</span>
                    <div>
                      <div style={styles.policyLabel}>Monthly Leaves</div>
                      <div style={styles.policyValue}>
                        {systemConfig.leavePolicy?.allowedLeaves || 2} days
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p
                  style={{
                    textAlign: "center",
                    color: "#9ca3af",
                    padding: "20px",
                  }}
                >
                  Loading system settings...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Styles (Admin Dashboard se exactly copy) ─────────────────────────────────

const styles = {
  content: {
    padding: "24px",
    background: "#f9fafb",
    minHeight: "100vh",
  },

  // Header
  header: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
  },
  welcomeSection: { flex: 1, minWidth: "300px" },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 8px 0",
    display: "flex",
    alignItems: "center",
    gap: "12px",
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

  // Stats Grid
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
    marginBottom: "24px",
  },
  statCard: {
    background: "white",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    borderLeft: "4px solid",
    transition: "all 0.3s",
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
  statValue: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#111827",
  },
  statFooter: {
    borderTop: "1px solid #e5e7eb",
    paddingTop: "12px",
  },
  statLink: {
    color: "#667eea",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "600",
  },

  // Widgets
  widgetsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "24px",
  },
  widget: {
    background: "white",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    overflow: "hidden",
  },
  widgetHeader: {
    padding: "20px 24px",
    borderBottom: "1px solid #e5e7eb",
  },
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

  // Attendance Circle
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
  attendanceDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  detailItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
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

  // Quick Actions
  quickActionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
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

  // Table
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  tableHeadRow: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  th: {
    padding: "14px 16px",
    textAlign: "left",
    color: "white",
    fontWeight: "700",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  tableRow: {
    borderBottom: "1px solid #f3f4f6",
    transition: "background 0.2s",
  },
  td: {
    padding: "14px 16px",
    color: "#374151",
  },
  noData: {
    textAlign: "center",
    padding: "40px",
    color: "#9ca3af",
    fontSize: "14px",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  badgePresent: {
    background: "rgba(16, 185, 129, 0.1)",
    color: "#059669",
    border: "1px solid rgba(16,185,129,0.3)",
  },
  badgeAbsent: {
    background: "rgba(239, 68, 68, 0.1)",
    color: "#dc2626",
    border: "1px solid rgba(239,68,68,0.3)",
  },
  badgeLeave: {
    background: "rgba(245, 158, 11, 0.1)",
    color: "#d97706",
    border: "1px solid rgba(245,158,11,0.3)",
  },

  // Policy Grid
  policyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  policyItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "14px",
    background: "#f9fafb",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
  },
  policyIcon: { fontSize: "22px", marginTop: "2px" },
  policyLabel: {
    fontSize: "11px",
    color: "#6b7280",
    fontWeight: "600",
    letterSpacing: "0.3px",
    marginBottom: "4px",
  },
  policyValue: { fontSize: "14px", color: "#111827", fontWeight: "600" },

  // Loading
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

const spinnerAnimation = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default ManagerDashboard;

