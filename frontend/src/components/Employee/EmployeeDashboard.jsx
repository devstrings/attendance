import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeNavbar from "./EmployeeNavbar";
import "../../styles/Employee.css";
import employeeService from "../../services/employeeService";

// ─── Circular Progress Ring ───────────────────────────────────────────────────
const CircleRing = ({ percentage, color, size = 110, stroke = 10 }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#f0f0f5"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [systemConfig, setSystemConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchSystemConfig();
    const interval = setInterval(() => fetchDashboardData(true), 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await employeeService.getDashboardStats();
      if (response.success) setDashboardData(response.data);
    } catch (e) {
      console.error("Dashboard error:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchSystemConfig = async () => {
    try {
      const response = await employeeService.getSystemConfig();
      if (response.success) setSystemConfig(response.data.config);
    } catch (e) {}
  };

  const formatTime = (time) => {
    if (!time) return "N/A";
    const [h, m] = time.split(":");
    const hr = parseInt(h);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
  };

  if (loading) {
    return (
      <div className="employee-container">
        <EmployeeNavbar />
        <div
          className="employee-content"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "80vh",
          }}
        >
          <div style={s.spinner} />
        </div>
        <style>{spinnerCSS}</style>
      </div>
    );
  }

  const employee = dashboardData?.employee || {};
  const monthlyStats = dashboardData?.monthlyStats || {};
  const recentAttendance = dashboardData?.recentAttendance || [];

  // ── Today's status — directly from backend ────────────────────────────────
  // todayStatus: 'present' | 'absent' | 'leave' | 'not_marked'
  // isLateToday: true/false (separately flagged)
  const todayStatus = dashboardData?.todayStatus || "not_marked";
  const isLateToday = dashboardData?.isLateToday || false;
  const todayRecord = dashboardData?.todayAttendance || null;

  // ── Total working days — from backend (join date → today, minus weekends/holidays) ──
  const joinDate = employee.joiningDate ? new Date(employee.joiningDate) : null;
  const totalWorkingDays = monthlyStats.workingDays ?? 0;

  // ── Attendance rate — totalWorkingDays se divide (MyAttendance ki tarah) ────
  const rateBase = totalWorkingDays > 0 ? totalWorkingDays : 1;
  const realAbsent = Math.max(
    0,
    totalWorkingDays -
      (monthlyStats.present || 0) -
      (monthlyStats.onLeave || 0),
  );
  const presentPct = Math.round(((monthlyStats.present || 0) / rateBase) * 100);
  const absentPct = Math.round((realAbsent / rateBase) * 100);
  const leavePct = Math.round(((monthlyStats.onLeave || 0) / rateBase) * 100);
  const latePct = Math.round(((monthlyStats.late || 0) / rateBase) * 100);

  // ── Today status cards ─────────────────────────────────────────────────────
  const todayCards = [
    {
      key: "present",
      label: "Today Present",
      icon: "✅",
      color: "#10b981",
      bg: "#ecfdf5",
      border: "#10b981",
      active: todayStatus === "present",
      activeLabel: "Present ✓",
      inactiveLabel: "Not Present",
    },
    {
      key: "absent",
      label: "Today Absent",
      icon: "❌",
      color: "#ef4444",
      bg: "#fef2f2",
      border: "#ef4444",
      active: todayStatus === "absent",
      activeLabel: "Absent Today",
      inactiveLabel: "Not Absent",
    },
    {
      key: "leave",
      label: "Today Leave",
      icon: "🏖️",
      color: "#f59e0b",
      bg: "#fffbeb",
      border: "#f59e0b",
      active: todayStatus === "leave",
      activeLabel: "On Leave ✓",
      inactiveLabel: "Not on Leave",
    },
    {
      key: "late",
      label: "Today Late",
      icon: "⏰",
      color: "#8b5cf6",
      bg: "#f5f3ff",
      border: "#8b5cf6",
      active: isLateToday,
      activeLabel: `Late${dashboardData?.todayLateMinutes ? ` (${dashboardData.todayLateMinutes} min)` : ""}`,
      inactiveLabel: todayStatus === "not_marked" ? "Not Marked" : "On Time",
    },
  ];

  return (
    <div className="employee-container">
      <EmployeeNavbar />
      <div className="employee-content" style={s.content}>
        {/* ── Welcome Header ── */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>
              Welcome back, {employee.firstName} {employee.lastName}! 👋
            </h1>
            <p style={s.subtitle}>
              {dashboardData?.companyName || 'Your'} — Here's your attendance overview
            </p>
            <span style={s.refreshBadge}>
              🔄 Auto-refreshing every 10 seconds
            </span>
          </div>
          <div style={s.headerRight}>
            <div style={s.workingDaysBig}>
              <span style={s.wdNumber}>{totalWorkingDays}</span>
              <span style={s.wdLabel}>Total Working Days</span>
              {joinDate && (
                <span style={s.wdSince}>
                  since{" "}
                  {joinDate.toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── TODAY STATUS CARDS ── */}
        <div style={s.sectionLabel}>📅 Today's Status</div>
        <div style={s.todayGrid}>
          {todayCards.map((card) => (
            <div
              key={card.key}
              style={{
                ...s.todayCard,
                borderColor: card.active ? card.border : "#e5e7eb",
                background: card.active ? card.bg : "#fafafa",
                boxShadow: card.active
                  ? `0 4px 20px ${card.color}25`
                  : "0 1px 3px rgba(0,0,0,0.05)",
                opacity:
                  !card.active && todayStatus !== "not_marked" ? 0.55 : 1,
              }}
            >
              <div
                style={{
                  fontSize: card.active ? "34px" : "26px",
                  transition: "font-size 0.3s",
                  filter: card.active ? "none" : "grayscale(0.5)",
                }}
              >
                {card.icon}
              </div>
              <div style={s.todayInfo}>
                <div
                  style={{
                    ...s.todayCardLabel,
                    color: "#9ca3af",
                    fontSize: "11px",
                  }}
                >
                  {card.label}
                </div>
                <div
                  style={{
                    ...s.todayStatus,
                    color: card.active ? card.color : "#c4c9d4",
                    fontSize: card.active ? "15px" : "13px",
                    fontWeight: card.active ? "700" : "500",
                  }}
                >
                  {card.active ? card.activeLabel : card.inactiveLabel}
                </div>
              </div>
              {card.active && (
                <div style={{ ...s.activeDot, background: card.color }} />
              )}
            </div>
          ))}
        </div>

        {/* ── ATTENDANCE RATE + QUICK ACTIONS ── */}
        <div style={s.middleGrid}>
          {/* Circular Chart */}
          <div style={s.chartCard}>
            <div style={s.chartTitle}>📊 Attendance Rate</div>
            <div style={s.chartBody}>
              {/* Stacked rings */}
              <div style={s.ringsWrap}>
                {/* Outer: Present */}
                <div style={{ position: "absolute", top: 0, left: 0 }}>
                  <CircleRing
                    percentage={presentPct}
                    color="#10b981"
                    size={160}
                    stroke={14}
                  />
                </div>
                {/* Middle: Absent */}
                <div style={{ position: "absolute", top: 16, left: 16 }}>
                  <CircleRing
                    percentage={absentPct}
                    color="#ef4444"
                    size={128}
                    stroke={12}
                  />
                </div>
                {/* Inner: Leave */}
                <div style={{ position: "absolute", top: 30, left: 30 }}>
                  <CircleRing
                    percentage={leavePct}
                    color="#f59e0b"
                    size={100}
                    stroke={10}
                  />
                </div>
                {/* Center text */}
                <div style={s.ringCenter}>
                  <span style={s.ringPct}>{presentPct}%</span>
                  <span style={s.ringLbl}>Present</span>
                </div>
              </div>

              {/* Legend */}
              <div style={s.legend}>
                {[
                  {
                    label: "Present",
                    value: monthlyStats.present || 0,
                    pct: presentPct,
                    color: "#10b981",
                  },
                  {
                    label: "Absent",
                    value: realAbsent,
                    pct: absentPct,
                    color: "#ef4444",
                  },
                  {
                    label: "Leave",
                    value: monthlyStats.onLeave || 0,
                    pct: leavePct,
                    color: "#f59e0b",
                  },
                  {
                    label: "Late",
                    value: monthlyStats.late || 0,
                    pct: latePct,
                    color: "#8b5cf6",
                  },
                ].map((item) => (
                  <div key={item.label} style={s.legendRow}>
                    <span style={{ ...s.legendDot, background: item.color }} />
                    <span style={s.legendLabel}>{item.label}</span>
                    <span style={s.legendVal}>{item.value} days</span>
                    <span style={{ ...s.legendPct, color: item.color }}>
                      {item.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={s.actionsCard}>
            <div style={s.chartTitle}>⚡ Quick Actions</div>
            <div style={s.actionsList}>
              {[
                {
                  icon: "📝",
                  label: "View My Attendance",
                  desc: "Check this month",
                  color: "#10b981",
                  path: "/employee/my-attendance",
                },
                {
                  icon: "📅",
                  label: "Attendance History",
                  desc: "Past records",
                  color: "#3b82f6",
                  path: "/employee/attendance-history",
                },
                {
                  icon: "🏖️",
                  label: "Request Leave",
                  desc: "Apply for time off",
                  color: "#f59e0b",
                  path: "/employee/request-leave",
                },
                
                {
                  icon: "👤",
                  label: "My Profile",
                  desc: "View & edit info",
                  color: "#8b5cf6",
                  path: "/employee/profile",
                },
                {
                  icon: "⏰",
                  label: "Overtime Request",
                  desc: "Extra time ki request",
                  color: "#f59e0b",
                  path: "/employee/overtime-requests",
                },
              ].map((a) => (
                <div
                  key={a.label}
                  style={s.actionRow}
                  onClick={() => navigate(a.path)}
                >
                  <div
                    style={{
                      ...s.actionIconBox,
                      background: `${a.color}15`,
                      color: a.color,
                    }}
                  >
                    {a.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={s.actionLabel}>{a.label}</div>
                    <div style={s.actionDesc}>{a.desc}</div>
                  </div>
                  <span style={s.arrow}>→</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent Attendance Table ── */}
        <div style={s.tableCard}>
          <div style={s.chartTitle}>📋 Recent Attendance</div>
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {[
                    "Date",
                    "Status",
                    "Clock In",
                    "Clock Out",
                    "Hours",
                    "Overtime",
                  ].map((h) => (
                    <th key={h} style={s.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
  {/* Today's row at top if exists */}
  {todayRecord && (
    <tr
      style={{
        ...s.tr,
        background: "#f0f9ff",
        borderLeft: "3px solid #3b82f6",
      }}
    >
      <td style={s.td}>
        <span style={{ fontWeight: "700", color: "#2563eb" }}>
          Today
        </span>
        <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: "6px" }}>
          {new Date(todayRecord.date).toLocaleDateString()}
        </span>
      </td>
      <td style={s.td}>
        <span style={{ ...s.badge, ...badgeStyle(todayRecord.status) }}>
          {statusIcon(todayRecord.status)} {todayRecord.status}
          {isLateToday && (
            <span style={{ marginLeft: "4px", fontSize: "10px" }}>⏰</span>
          )}
        </span>
      </td>
      <td style={s.td}>
        {todayRecord.clockIn ? (
          <span style={{ color: "#059669", fontWeight: "600" }}>
            {new Date(todayRecord.clockIn).toLocaleTimeString([], {
              hour: "2-digit", minute: "2-digit",
            })}
          </span>
        ) : (
          <span style={{ color: "#9ca3af" }}>Not yet</span>
        )}
      </td>
      <td style={s.td}>
        {todayRecord.clockOut
          ? new Date(todayRecord.clockOut).toLocaleTimeString([], {
              hour: "2-digit", minute: "2-digit",
            })
          : <span style={{ color: "#9ca3af" }}>—</span>}
      </td>
      <td style={s.td}>{todayRecord.workHours || 0} hrs</td>
      <td style={s.td}>
        {todayRecord.overtimeMinutes > 0 ? (
          <span style={{
            color: todayRecord.overtimeStatus === "approved" ? "#d97706" : "#9ca3af",
            fontWeight: 600,
          }}>
            {todayRecord.overtimeStatus === "approved"
              ? `+${Math.floor(todayRecord.overtimeMinutes / 60)}h ${todayRecord.overtimeMinutes % 60}m`
              : "⏳ Pending"}
          </span>
        ) : "—"}
      </td>
    </tr>
  )}

  {/* ── Previous 7 days — consecutive, no gaps ── */}
  {(() => {
    const rows = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toDateString();

      // Backend record se match karo
      const record = recentAttendance.find(
        (r) => new Date(r.date).toDateString() === dateStr
      );

      // Day name check (weekend detection)
      const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
      const isWeekend =
        systemConfig?.weekendDays?.includes(dayName) ||
        ["Saturday", "Sunday"].includes(dayName);

      // Display date
      const displayDate = d.toLocaleDateString("en-GB", {
        day: "2-digit", month: "2-digit", year: "numeric",
      });

      if (record) {
        // Record maujood hai — normal row
        rows.push(
          <tr key={record._id} style={s.tr}>
            <td style={s.td}>{displayDate}</td>
            <td style={s.td}>
              <span style={{ ...s.badge, ...badgeStyle(record.status) }}>
                {statusIcon(record.status)} {record.status}
              </span>
            </td>
            <td style={s.td}>
              {record.clockIn
                ? new Date(record.clockIn).toLocaleTimeString([], {
                    hour: "2-digit", minute: "2-digit",
                  })
                : "—"}
            </td>
            <td style={s.td}>
              {record.clockOut
                ? new Date(record.clockOut).toLocaleTimeString([], {
                    hour: "2-digit", minute: "2-digit",
                  })
                : "—"}
            </td>
            <td style={s.td}>{record.workHours || 0} hrs</td>
            <td style={s.td}>
              {record.overtimeMinutes > 0 ? (
                <span style={{
                  color: record.overtimeStatus === "approved" ? "#d97706" : "#9ca3af",
                  fontWeight: 600,
                }}>
                  {record.overtimeStatus === "approved"
                    ? `+${Math.floor(record.overtimeMinutes / 60)}h ${record.overtimeMinutes % 60}m`
                    : "⏳ Pending"}
                </span>
              ) : "—"}
            </td>
          </tr>
        );
      } else if (isWeekend) {
        // Weekend — record nahi hai
        rows.push(
          <tr key={dateStr} style={{ ...s.tr, background: "#f9fafb" }}>
            <td style={s.td}>{displayDate}</td>
            <td style={s.td}>
              <span style={{
                ...s.badge,
                background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb",
              }}>
                🏠 Weekend
              </span>
            </td>
            <td style={{ ...s.td, color: "#d1d5db" }}>—</td>
            <td style={{ ...s.td, color: "#d1d5db" }}>—</td>
            <td style={{ ...s.td, color: "#d1d5db" }}>—</td>
            <td style={{ ...s.td, color: "#d1d5db" }}>—</td>
          </tr>
        );
      } else {
        // Working day — record nahi = Absent
        rows.push(
          <tr key={dateStr} style={{ ...s.tr, background: "#fff5f5" }}>
            <td style={s.td}>{displayDate}</td>
            <td style={s.td}>
              <span style={{
                ...s.badge,
                background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca",
              }}>
                ❌ Absent
              </span>
            </td>
            <td style={{ ...s.td, color: "#d1d5db" }}>—</td>
            <td style={{ ...s.td, color: "#d1d5db" }}>—</td>
            <td style={{ ...s.td, color: "#d1d5db" }}>—</td>
            <td style={{ ...s.td, color: "#d1d5db" }}>—</td>
          </tr>
        );
      }
    }
    return rows;
  })()}
  
</tbody>
</table>
          </div>
        </div>

        {/* ── Office Policy ── */}
        {systemConfig && (
          <div style={{ ...s.tableCard, marginTop: "20px" }}>
            <div style={s.chartTitle}>🏢 Office Hours & Policy</div>
            <div style={s.policyGrid}>
              {[
                {
                  icon: "🕙",
                  label: "Office Hours",
                  val: `${formatTime(systemConfig.workingHours?.startTime)} – ${formatTime(systemConfig.workingHours?.endTime)}`,
                },
                {
                  icon: "⏰",
                  label: "Late After",
                  val: formatTime(systemConfig.workingHours?.lateEntryTime),
                },
                {
                  icon: "📅",
                  label: "Working Days",
                  val: systemConfig.workingDays?.join(", ") || "Mon–Fri",
                },
                {
                  icon: "🏖️",
                  label: "Weekends",
                  val: systemConfig.weekendDays?.join(", ") || "Sat & Sun",
                },
                {
                  icon: "☕",
                  label: "Break Time",
                  val: `${systemConfig.breakTime || 60} min`,
                },
                {
                  icon: "📝",
                  label: "Leaves/Month",
                  val: `${systemConfig.leavePolicy?.allowedLeaves || 2} days`,
                },
              ].map((p) => (
                <div key={p.label} style={s.policyItem}>
                  <span style={{ fontSize: "22px" }}>{p.icon}</span>
                  <div>
                    <div style={s.policyLabel}>{p.label}</div>
                    <div style={s.policyVal}>{p.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{spinnerCSS}</style>
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusIcon = (s) =>
  ({ present: "✅", absent: "❌", late: "⏰", leave: "🏖️" })[s] || "";
const badgeStyle = (status) =>
  ({
    present: {
      background: "#ecfdf5",
      color: "#059669",
      border: "1px solid #a7f3d0",
    },
    absent: {
      background: "#fef2f2",
      color: "#dc2626",
      border: "1px solid #fecaca",
    },
    late: {
      background: "#f5f3ff",
      color: "#7c3aed",
      border: "1px solid #ddd6fe",
    },
    leave: {
      background: "#fffbeb",
      color: "#d97706",
      border: "1px solid #fde68a",
    },
  })[status] || {};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  content: { padding: "24px", background: "#f8f9fc", minHeight: "100vh" },

  // Header
  header: {
    background:
      "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
    borderRadius: "16px",
    padding: "28px 32px",
    marginBottom: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
    boxShadow: "0 8px 32px rgba(67,56,202,0.3)",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 6px 0",
  },
  subtitle: { fontSize: "14px", color: "#a5b4fc", margin: "0 0 8px 0" },
  refreshBadge: {
    fontSize: "11px",
    color: "#c7d2fe",
    background: "rgba(255,255,255,0.1)",
    padding: "4px 10px",
    borderRadius: "20px",
  },
  headerRight: { textAlign: "right" },
  workingDaysBig: {
    background: "rgba(255,255,255,0.12)",
    borderRadius: "14px",
    padding: "16px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.2)",
  },
  wdNumber: {
    fontSize: "40px",
    fontWeight: "800",
    color: "#fff",
    lineHeight: 1,
  },
  wdLabel: {
    fontSize: "12px",
    color: "#c7d2fe",
    fontWeight: "600",
    marginTop: "4px",
  },
  wdSince: { fontSize: "11px", color: "#a5b4fc", marginTop: "2px" },

  // Section label
  sectionLabel: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: "12px",
  },

  // Today cards
  todayGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "14px",
    marginBottom: "24px",
  },
  todayCard: {
    background: "#fff",
    borderRadius: "14px",
    border: "2px solid #e5e7eb",
    padding: "18px 20px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    position: "relative",
    transition: "all 0.3s ease",
    cursor: "default",
  },
  todayIcon: { transition: "font-size 0.3s" },
  todayInfo: { flex: 1 },
  todayStatus: { fontSize: "15px", fontWeight: "700", marginBottom: "2px" },
  todayCardLabel: { fontSize: "11px", color: "#9ca3af", fontWeight: "500" },
  activeDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    position: "absolute",
    top: "12px",
    right: "12px",
    animation: "pulse 1.5s infinite",
  },

  // Middle grid
  middleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
    marginBottom: "24px",
  },

  // Chart card
  chartCard: {
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  chartTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#111827",
    padding: "18px 24px",
    borderBottom: "1px solid #f3f4f6",
  },
  chartBody: {
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "28px",
    flexWrap: "wrap",
  },
  ringsWrap: {
    position: "relative",
    width: "160px",
    height: "160px",
    flexShrink: 0,
  },
  ringCenter: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
  },
  ringPct: {
    display: "block",
    fontSize: "26px",
    fontWeight: "800",
    color: "#111827",
  },
  ringLbl: {
    display: "block",
    fontSize: "11px",
    color: "#6b7280",
    fontWeight: "600",
  },

  // Legend
  legend: {
    flex: 1,
    minWidth: "160px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  legendRow: { display: "flex", alignItems: "center", gap: "8px" },
  legendDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  legendLabel: {
    flex: 1,
    fontSize: "13px",
    color: "#374151",
    fontWeight: "500",
  },
  legendVal: { fontSize: "13px", color: "#111827", fontWeight: "600" },
  legendPct: {
    fontSize: "12px",
    fontWeight: "700",
    minWidth: "34px",
    textAlign: "right",
  },

  // Actions card
  actionsCard: {
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  actionsList: {
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  actionRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "11px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  actionIconBox: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },
  actionLabel: { fontSize: "13px", fontWeight: "600", color: "#111827" },
  actionDesc: { fontSize: "11px", color: "#9ca3af" },
  arrow: { fontSize: "16px", color: "#d1d5db" },

  // Table
  tableCard: {
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
    overflow: "hidden",
    marginBottom: "20px",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  th: {
    padding: "13px 16px",
    textAlign: "left",
    background: "linear-gradient(135deg, #4338ca, #6366f1)",
    color: "#fff",
    fontWeight: "700",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "13px 16px", color: "#374151" },
  noData: { textAlign: "center", padding: "40px", color: "#9ca3af" },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "capitalize",
  },

  // Policy
  policyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
    padding: "20px 24px",
  },
  policyItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "12px",
    background: "#f9fafb",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
  },
  policyLabel: {
    fontSize: "11px",
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: "3px",
  },
  policyVal: { fontSize: "13px", color: "#111827", fontWeight: "700" },

  // Spinner
  spinner: {
    width: "44px",
    height: "44px",
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #4338ca",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};

const spinnerCSS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50%       { transform: scale(1.4); opacity: 0.6; }
  }
`;

export default EmployeeDashboard;
