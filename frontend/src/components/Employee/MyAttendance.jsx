import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeNavbar from "./EmployeeNavbar";
import employeeService from "../../services/employeeService";
import { createCorrectionRequest } from "../../services/correctionRequestService";
import "../../styles/Employee.css";

// ─── Correction Request Modal ─────────────────────────────────────────────────
const CorrectionModal = ({ record, onClose, onSubmitted }) => {
  const [issueType, setIssueType] = useState("wrong_status");
  const [requestedStatus, setRequestedStatus] = useState("present");
  const [requestedClockIn, setRequestedClockIn] = useState("10:00");
  const [requestedClockOut, setRequestedClockOut] = useState("19:00");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const dateStr = new Date(record.date).toISOString().split("T")[0];
      const payload = {
        attendanceId: record._id || null,
        attendanceDate: dateStr,
        currentStatus: record.status,
        requestedStatus,
        currentClockIn: record.clockIn
          ? new Date(record.clockIn).toTimeString().slice(0, 5)
          : "",
        currentClockOut: record.clockOut
          ? new Date(record.clockOut).toTimeString().slice(0, 5)
          : "",
        requestedClockIn,
        requestedClockOut,
        reason,
        issueType,
        priority: "medium",
      };
      const response = await createCorrectionRequest(payload);
      if (response.success) {
        onSubmitted();
      } else {
        setError(response.message || "Submission failed.");
      }
    } catch (err) {
      setError(err.message || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const dateLabel = new Date(record.date).toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div style={ms.overlay}>
      <div style={ms.modal}>
        {/* Header */}
        <div style={ms.header}>
          <div>
            <h2 style={ms.title}>📝 Request Attendance Correction</h2>
            <p style={ms.subtitle}>{dateLabel}</p>
          </div>
          <button style={ms.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Current status */}
        <div style={ms.currentBox}>
          <span style={ms.currentLabel}>Current Status:</span>
          <span style={{
            ...ms.badge,
            background: record.status === "absent" ? "#fef2f2" : "#e0e7ff",
            color: record.status === "absent" ? "#dc2626" : "#4338ca",
          }}>
            {record.status?.toUpperCase()}
          </span>
        </div>

        {/* Issue Type */}
        <div style={ms.field}>
          <label style={ms.label}>Issue Type *</label>
          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            style={ms.select}
          >
            <option value="wrong_status">Wrong Status Marked</option>
            <option value="missed_clock_in">Missed Clock In</option>
            <option value="missed_clock_out">Missed Clock Out</option>
            <option value="wrong_time">Wrong Time Recorded</option>
            <option value="technical_issue">Technical Issue</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Requested Status */}
        <div style={ms.field}>
          <label style={ms.label}>Requested Status *</label>
          <div style={ms.statusGrid}>
            {["present", "half-day", "on-leave", "late"].map((s) => (
              <button
                key={s}
                onClick={() => setRequestedStatus(s)}
                style={{
                  ...ms.statusBtn,
                  ...(requestedStatus === s ? ms.statusBtnActive : {}),
                }}
              >
                {s === "present" && "✅ Present"}
                {s === "half-day" && "🕐 Half Day"}
                {s === "on-leave" && "🏖️ On Leave"}
                {s === "late" && "⏰ Late"}
              </button>
            ))}
          </div>
        </div>

        {/* Clock times */}
        {(requestedStatus === "present" || requestedStatus === "half-day" || requestedStatus === "late") && (
          <div style={ms.timeRow}>
            <div style={ms.field}>
              <label style={ms.label}>Requested Clock In</label>
              <input
                type="time"
                value={requestedClockIn}
                onChange={(e) => setRequestedClockIn(e.target.value)}
                style={ms.input}
              />
            </div>
            <div style={ms.field}>
              <label style={ms.label}>Requested Clock Out</label>
              <input
                type="time"
                value={requestedClockOut}
                onChange={(e) => setRequestedClockOut(e.target.value)}
                style={ms.input}
              />
            </div>
          </div>
        )}

        {/* Reason */}
        <div style={ms.field}>
          <label style={ms.label}>Reason * <span style={ms.hint}>(explain what happened)</span></label>
          <textarea
            rows={3}
            placeholder="e.g. I was present but system marked me absent due to a technical issue..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={ms.textarea}
          />
        </div>

        {error && <div style={ms.error}>⚠️ {error}</div>}

        <div style={ms.actions}>
          <button style={ms.cancelBtn} onClick={onClose} disabled={loading}>Cancel</button>
          <button
            style={{ ...ms.submitBtn, opacity: loading ? 0.7 : 1 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "📤 Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MyAttendance = () => {
  const navigate = useNavigate();
  const [attendanceData, setAttendanceData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // ✅ Correction modal state
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => { fetchAttendanceData(); }, [selectedMonth, selectedYear]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const response = await employeeService.getAttendanceHistory(selectedMonth, selectedYear);
      if (response.success) {
        setAttendanceData(response.data.attendance || []);
        setStatistics(response.data.statistics || {});
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = (() => {
    const totalDays = statistics?.totalDays || 0;
    const presentDays = statistics?.present || 0;
    const leaveDays = statistics?.onLeave || 0;
    const lateDays = statistics?.late || 0;
    const absentDays = Math.max(0, totalDays - presentDays - leaveDays);
    const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;
    return { totalDays, presentDays, absentDays, leaveDays, lateDays, attendanceRate };
  })();

  const getStatusIcon = (status) =>
    ({ present: "✅", absent: "❌", "on-leave": "🏖️", leave: "🏖️", holiday: "🎉", "half-day": "🕐", late: "⏰" })[status] || "❓";

  const formatTime = (dt) =>
    dt ? new Date(dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

  // Records that can request correction — past records only (not today's holiday/leave)
  const canRequestCorrection = (record) => {
    const today = new Date().toISOString().split("T")[0];
    const recordDate = new Date(record.date).toISOString().split("T")[0];
    return recordDate < today && record.status !== "holiday";
  };

  const handleCorrectionSubmitted = () => {
    setShowCorrectionModal(false);
    setSelectedRecord(null);
    setSuccessMsg("✅ Correction request submitted! Admin will review it.");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  if (loading) {
    return (
      <div className="employee-container">
        <EmployeeNavbar />
        <div className="employee-content" style={s.center}>
          <div style={s.spinner} />
          <p style={{ color: "#6b7280", marginTop: 12 }}>Loading attendance...</p>
          <style>{spinCSS}</style>
        </div>
      </div>
    );
  }

  const perfClass =
    stats.attendanceRate >= 90 ? "excellent"
    : stats.attendanceRate >= 80 ? "good"
    : stats.attendanceRate >= 70 ? "average" : "poor";

  return (
    <div className="employee-container">
      <EmployeeNavbar />
      <div className="employee-content" style={s.content}>

        {/* Success message */}
        {successMsg && (
          <div style={s.successBanner}>{successMsg}</div>
        )}

        {/* Header */}
        <div style={s.header}>
          <h1 style={s.title}>📋 My Attendance</h1>
          <div style={s.monthSelector}>
            <select style={s.select} value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select style={s.select} value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={s.statsGrid}>
          {[
            { icon: "📅", label: "Working Days", value: stats.totalDays, color: "#3b82f6", hint: "Join date se aaj tak" },
            { icon: "✅", label: "Present Days", value: stats.presentDays, color: "#10b981" },
            { icon: "❌", label: "Absent Days", value: stats.absentDays, color: "#ef4444", hint: "Unmarked days included" },
            { icon: "🏖️", label: "Leave Days", value: stats.leaveDays, color: "#f59e0b" },
            { icon: "📊", label: "Attendance Rate", value: `${stats.attendanceRate}%`, color: "#06b6d4" },
          ].map((c, i) => (
            <div key={i} style={{ ...s.statCard, borderTopColor: c.color }}>
              <div style={s.statIcon}>{c.icon}</div>
              <div>
                <div style={{ ...s.statVal, color: c.color }}>{c.value}</div>
                <div style={s.statLabel}>{c.label}</div>
                {c.hint && <div style={s.statHint}>{c.hint}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={s.tableCard}>
          <h2 style={s.tableTitle}>
            Attendance Records — {months[selectedMonth - 1]} {selectedYear}
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Date", "Day", "Status", "Clock In", "Clock Out", "Hours", "Late", "Action"].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attendanceData.length > 0 ? (
                  attendanceData.map((record) => {
                    const d = new Date(record.date);
                    return (
                      <tr key={record._id} style={s.tr}>
                        <td style={s.td}>{d.toLocaleDateString()}</td>
                        <td style={s.td}>{d.toLocaleDateString("en-US", { weekday: "short" })}</td>
                        <td style={s.td}>
                          <span style={{ ...s.badge, ...badgeStyle(record.status) }}>
                            {getStatusIcon(record.status)} {record.status}
                          </span>
                        </td>
                        <td style={s.td}>{formatTime(record.clockIn)}</td>
                        <td style={s.td}>{formatTime(record.clockOut)}</td>
                        <td style={s.td}>{record.workHours ? `${record.workHours.toFixed(1)} hrs` : "0 hrs"}</td>
                        <td style={s.td}>
                          {record.isLate ? (
                            <span style={s.lateBadge}>⏰ {record.lateMinutes || 0} min</span>
                          ) : (
                            <span style={{ color: "#9ca3af" }}>—</span>
                          )}
                        </td>
                        {/* ✅ Action column */}
                        <td style={s.td}>
                          {canRequestCorrection(record) ? (
                            <button
                              onClick={() => {
                                setSelectedRecord(record);
                                setShowCorrectionModal(true);
                              }}
                              style={s.correctBtn}
                              title="Request Correction"
                            >
                              ✏️ Correct
                            </button>
                          ) : (
                            <span style={{ color: "#d1d5db", fontSize: 12 }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" style={s.noData}>
                      No attendance records for {months[selectedMonth - 1]} {selectedYear}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Bar */}
        <div style={s.perfCard}>
          <h3 style={s.perfTitle}>📈 Performance Indicator</h3>
          <div style={s.perfTrack}>
            <div style={{
              ...s.perfFill,
              width: `${stats.attendanceRate}%`,
              background:
                perfClass === "excellent" ? "linear-gradient(90deg,#10b981,#059669)"
                : perfClass === "good" ? "linear-gradient(90deg,#3b82f6,#2563eb)"
                : perfClass === "average" ? "linear-gradient(90deg,#f59e0b,#d97706)"
                : "linear-gradient(90deg,#ef4444,#dc2626)",
            }}>
              {stats.attendanceRate}%
            </div>
          </div>
          <div style={s.perfLegend}>
            {[
              { label: "Excellent (90%+)", color: "#10b981" },
              { label: "Good (80–89%)", color: "#3b82f6" },
              { label: "Average (70–79%)", color: "#f59e0b" },
              { label: "Poor (<70%)", color: "#ef4444" },
            ].map((p) => (
              <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, display: "inline-block" }} />
                <span style={{ fontSize: 12, color: "#6b7280" }}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ✅ Correction Modal */}
      {showCorrectionModal && selectedRecord && (
        <CorrectionModal
          record={selectedRecord}
          onClose={() => { setShowCorrectionModal(false); setSelectedRecord(null); }}
          onSubmitted={handleCorrectionSubmitted}
        />
      )}

      <style>{spinCSS}</style>
    </div>
  );
};

// ── Badge styles ──────────────────────────────────────────────────────────────
const badgeStyle = (status) =>
  ({
    present: { background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" },
    late: { background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe" },
    "half-day": { background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" },
    absent: { background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" },
    leave: { background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" },
    "on-leave": { background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" },
    holiday: { background: "#fdf4ff", color: "#9333ea", border: "1px solid #e9d5ff" },
  })[status] || { background: "#f3f4f6", color: "#6b7280" };

// ── Main styles ───────────────────────────────────────────────────────────────
const s = {
  content: { padding: "24px", background: "#f8f9fc", minHeight: "100vh" },
  center: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px" },
  successBanner: {
    background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46",
    padding: "12px 20px", borderRadius: 10, marginBottom: 16,
    fontWeight: 600, fontSize: 14,
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    flexWrap: "wrap", gap: 12, marginBottom: 24,
    background: "#fff", padding: "18px 24px", borderRadius: 14,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  title: { fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 },
  monthSelector: { display: "flex", gap: 10 },
  select: { padding: "8px 14px", border: "2px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: "#374151", outline: "none", cursor: "pointer" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 },
  statCard: { background: "#fff", borderRadius: 12, padding: "16px", borderTop: "3px solid", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 12 },
  statIcon: { fontSize: 26 },
  statVal: { fontSize: 24, fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: 12, color: "#6b7280", fontWeight: 600, marginTop: 3 },
  statHint: { fontSize: 10, color: "#9ca3af", marginTop: 2 },
  tableCard: { background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden", marginBottom: 20 },
  tableTitle: { fontSize: 16, fontWeight: 700, color: "#111827", margin: 0, padding: "18px 24px", borderBottom: "1px solid #f3f4f6" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { padding: "12px 14px", textAlign: "left", background: "linear-gradient(135deg,#4338ca,#6366f1)", color: "#fff", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "12px 14px", color: "#374151" },
  noData: { textAlign: "center", padding: "40px", color: "#9ca3af" },
  badge: { display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: "capitalize" },
  lateBadge: { background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600 },
  correctBtn: {
    background: "linear-gradient(135deg, #f97316, #ef4444)",
    color: "white", border: "none", borderRadius: 6,
    padding: "4px 10px", cursor: "pointer", fontSize: 12,
    fontWeight: 600, boxShadow: "0 2px 6px rgba(249,115,22,0.3)",
  },
  perfCard: { background: "#fff", borderRadius: 14, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  perfTitle: { fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 14px 0" },
  perfTrack: { background: "#f3f4f6", borderRadius: 50, height: 32, overflow: "hidden", marginBottom: 14 },
  perfFill: { height: "100%", borderRadius: 50, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, minWidth: 48, transition: "width 1s ease" },
  perfLegend: { display: "flex", gap: 20, flexWrap: "wrap" },
  spinner: { width: 44, height: 44, border: "4px solid #e5e7eb", borderTop: "4px solid #4338ca", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
};

// ── Modal styles ──────────────────────────────────────────────────────────────
const ms = {
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  modal: { background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  title: { margin: 0, fontSize: 18, fontWeight: 700, color: "#1e293b" },
  subtitle: { margin: "4px 0 0", fontSize: 13, color: "#64748b" },
  closeBtn: { background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14, color: "#64748b", fontWeight: 600 },
  currentBox: { display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", borderRadius: 10, padding: "10px 14px", marginBottom: 18 },
  currentLabel: { fontSize: 13, color: "#64748b", fontWeight: 600 },
  badge: { padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 },
  field: { marginBottom: 14 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 },
  hint: { fontWeight: 400, color: "#94a3b8", fontSize: 12 },
  select: { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, color: "#1e293b", outline: "none", boxSizing: "border-box" },
  statusGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  statusBtn: { padding: 10, borderRadius: 8, border: "2px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#475569" },
  statusBtnActive: { border: "2px solid #667eea", background: "#ede9fe", color: "#4338ca", fontWeight: 700 },
  timeRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  input: { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, color: "#1e293b", outline: "none", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, color: "#1e293b", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" },
  error: { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "9px 14px", color: "#dc2626", fontSize: 13, marginBottom: 14 },
  actions: { display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 },
  cancelBtn: { padding: "9px 20px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", cursor: "pointer", fontSize: 14, fontWeight: 600 },
  submitBtn: { padding: "9px 22px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", cursor: "pointer", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 12px rgba(102,126,234,0.35)" },
};

const spinCSS = `@keyframes spin { to { transform: rotate(360deg); } }`;

export default MyAttendance;