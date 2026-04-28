/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars, import/no-anonymous-default-export, jsx-a11y/anchor-is-valid */
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import api from "../../services/api";
import "../../styles/Admin.css";

const AttendanceDetails = () => {
  const navigate = useNavigate();
  const { attendanceId, employeeId } = useParams();
  const [record, setRecord] = useState(null);
  const [employeeHistory, setEmployeeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState("weekly");
  const [weekendDays, setWeekendDays] = useState(["Saturday", "Sunday"]);
  const [holidays, setHolidays] = useState([]);
  const [customDates, setCustomDates] = useState({
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (attendanceId) fetchRecordDetails();
    else if (employeeId) fetchEmployeeLatestRecord();
  }, [attendanceId, employeeId]);

  useEffect(() => {
    if (record) fetchEmployeeHistory();
  }, [reportType, customDates, record]);
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get("/admin/system-config");
        if (res.data?.data?.config?.weekendDays) setWeekendDays(res.data.data.config.weekendDays);

      } catch (e) {}
      try {
        const res = await api.get("/admin/holidays");
        setHolidays(res.data?.data?.holidays || []);
      } catch (e) {}
    };
    fetchConfig();
  }, []);

  // ── Specific attendance record ──────────────────────────────────────────────
  const fetchRecordDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/attendance/${attendanceId}`);
      if (response.data.success && response.data.data.attendance) {
        const att = response.data.data.attendance;
        setRecord({
          id: att._id,
          employeeId: att.employeeId?._id,
          employeeCode: att.employeeId?.employeeCode || "N/A",
          employeeName:
            `${att.employeeId?.firstName || ""} ${att.employeeId?.lastName || ""}`.trim() ||
            "N/A",
          email: att.employeeId?.userId?.email || "N/A",
          phone: att.employeeId?.phoneNumber || "N/A",
          department: att.employeeId?.department || "N/A",
          position: att.employeeId?.designation || "N/A",
          date: att.date,
          status: att.status,
          clockIn: att.clockIn
            ? new Date(att.clockIn).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : null,
          clockOut: att.clockOut
            ? new Date(att.clockOut).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : null,
          hoursWorked: att.workHours || 0,
          notes: att.remarks || "",
          managedBy: att.managerId
            ? `${att.managerId.firstName || ""} ${att.managerId.lastName || ""}`.trim()
            : "N/A",
        });
      } else {
        setError("Attendance record not found");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load attendance details",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Employee latest record (from Reports page click) ────────────────────────
  const fetchEmployeeLatestRecord = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ Correct route — user detail from admin
      let employee = null;

      // Try employee route first
      try {
        const empRes = await api.get(`/admin/user/${employeeId}/employee`);
        if (empRes.data.success) {
          employee = empRes.data.data.profile;
          // Merge userId email
          if (empRes.data.data.user) {
            employee.email = empRes.data.data.user.email;
          }
        }
      } catch (e) {
        // Fallback — try getAllEmployees and find by ID
        const listRes = await api.get(`/admin/employees?limit=1000`);
        if (listRes.data.success) {
          employee = listRes.data.data.employees.find(
            (emp) =>
              emp._id === employeeId || emp._id?.toString() === employeeId,
          );
        }
      }

      if (!employee) {
        setError("Employee not found");
        setLoading(false);
        return;
      }

      // Today's attendance
      const today = new Date().toISOString().split("T")[0];
      let todayRecord = null;
      try {
        const attRes = await api.get("/attendance", {
          params: { employeeId, startDate: today, endDate: today, limit: 1 },
        });
        if (attRes.data.success && attRes.data.data.attendance.length > 0) {
          todayRecord = attRes.data.data.attendance[0];
        }
      } catch (e) {}

      setRecord({
        id: todayRecord?._id || null,
        employeeId: employee._id,
        employeeCode: employee.employeeCode || "N/A",
        employeeName:
          `${employee.firstName || ""} ${employee.lastName || ""}`.trim() ||
          "N/A",
        email: employee.email || employee.userId?.email || "N/A",
        phone: employee.phoneNumber || "N/A",
        department: employee.department || "N/A",
        position: employee.designation || "N/A",
        joiningDate: employee.joiningDate,
        date: todayRecord?.date || today,
        status: todayRecord?.status || "not_marked",
        clockIn: todayRecord?.clockIn
          ? new Date(todayRecord.clockIn).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : null,
        clockOut: todayRecord?.clockOut
          ? new Date(todayRecord.clockOut).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : null,
        hoursWorked: todayRecord?.workHours || 0,
        notes: todayRecord?.remarks || "",
        managedBy: todayRecord?.managerId
          ? `${todayRecord.managerId.firstName || ""} ${todayRecord.managerId.lastName || ""}`.trim()
          : employee.managerId
            ? "Assigned"
            : "N/A",
      });
    } catch (err) {
      console.error("❌ Error fetching employee record:", err);
      setError(
        err.response?.data?.message || "Failed to load employee details",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Attendance history ──────────────────────────────────────────────────────
  const fetchEmployeeHistory = async () => {
    if (!record?.employeeId) return;
    try {
      setHistoryLoading(true);
      const today = new Date();
      let startDate, endDate;

      if (reportType === "weekly") {
        endDate = new Date(today);
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
      } else if (reportType === "monthly") {
        endDate = new Date(today);
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30);
      } else if (
        reportType === "custom" &&
        customDates.startDate &&
        customDates.endDate
      ) {
        startDate = new Date(customDates.startDate);
        endDate = new Date(customDates.endDate);
      } else {
        endDate = new Date(today);
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
      }

      const response = await api.get("/attendance", {
        params: {
          employeeId: record.employeeId,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          limit: 100,
        },
      });

      if (response.data.success) {
        const history = response.data.data.attendance.map((att) => ({
          date: att.date,
          status: att.status,
          clockIn: att.clockIn
            ? new Date(att.clockIn).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-",
          clockOut: att.clockOut
            ? new Date(att.clockOut).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-",
          hoursWorked: att.workHours || 0,
          isLate: att.isLate || false,
          lateMinutes: att.lateMinutes || 0,
          remarks: att.remarks || "-",
        }));
        setEmployeeHistory(history);
      }
    } catch (err) {
      console.error("❌ Error fetching history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const getStatusIcon = (status) =>
    ({
      present: "✅",
      absent: "❌",
      "on-leave": "🏖️",
      leave: "🏖️",
      holiday: "🎉",
      late: "⏰",
      "half-day": "🕐",
      not_marked: "—",
    })[status] || "❓";

  const getStatusBadgeStyle = (status) => {
    const map = {
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
      "on-leave": {
        background: "#fffbeb",
        color: "#d97706",
        border: "1px solid #fde68a",
      },
      leave: {
        background: "#fffbeb",
        color: "#d97706",
        border: "1px solid #fde68a",
      },
      holiday: {
        background: "#fdf4ff",
        color: "#9333ea",
        border: "1px solid #e9d5ff",
      },
      "half-day": {
        background: "#eff6ff",
        color: "#2563eb",
        border: "1px solid #bfdbfe",
      },
      not_marked: {
        background: "#f9fafb",
        color: "#6b7280",
        border: "1px solid #e5e7eb",
      },
    };
    return {
      ...badgeBase,
      ...(map[status] || { background: "#f3f4f6", color: "#6b7280" }),
    };
  };

  // Stats — without total hours & avg hours
  const calculateStats = () => {
    // ✅ Working days count karo (Mon-Fri, last 7/30 days)
    const today = new Date();
    let startDate = new Date(today);

    if (reportType === "weekly") startDate.setDate(today.getDate() - 7);
    else if (reportType === "monthly") startDate.setDate(today.getDate() - 30);
    else if (customDates.startDate) startDate = new Date(customDates.startDate);

    // Working days count (weekdays only)
    let workingDaysCount = 0;
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const holidaySet = new Set(
      holidays.map((h) => new Date(h.date).toDateString()),
    );
    while (cursor <= end) {
      const dayName = dayNames[cursor.getDay()];
      const isWeekend = weekendDays.includes(dayName);

      const isHoliday = holidaySet.has(cursor.toDateString());
      if (!isWeekend && !isHoliday) workingDaysCount++;
      cursor.setDate(cursor.getDate() + 1);
    }

    const presentDays = employeeHistory.filter((h) =>
      ["present", "late", "half-day"].includes(h.status),
    ).length;
    const leaveDays = employeeHistory.filter((h) =>
      ["on-leave", "leave"].includes(h.status),
    ).length;
    const lateDays = employeeHistory.filter((h) => h.isLate).length;

    // ✅ Absent = working days - present - leave (jo records nahi hain woh bhi absent)
    const absentDays = Math.max(0, workingDaysCount - presentDays - leaveDays);

    return {
      totalDays: workingDaysCount,
      presentDays,
      absentDays,
      leaveDays,
      lateDays,
    };
  };

  if (loading) {
    return (
      <div className="admin-container">
        <AdminNavbar />
        <div className="admin-layout">
          <AdminSidebar />
          <div className="admin-content" style={S.center}>
            <div style={S.spinner} />
            <style>{spinCSS}</style>
            <p style={{ color: "#6b7280", marginTop: 12 }}>
              Loading attendance details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="admin-container">
        <AdminNavbar />
        <div className="admin-layout">
          <AdminSidebar />
          <div className="admin-content" style={S.center}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
              <h2 style={{ color: "#111827", marginBottom: 8 }}>
                {error || "Record Not Found"}
              </h2>
              <p style={{ color: "#6b7280", marginBottom: 24 }}>
                The attendance record could not be found.
              </p>
              <button style={S.backBtn} onClick={() => navigate(-1)}>
                ← Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="admin-container">
      <AdminNavbar />
      <div className="admin-layout">
        <AdminSidebar />
        <div
          className="admin-content"
          style={{ padding: 24, background: "#f9fafb", minHeight: "100vh" }}
        >
          {/* ── Header ── */}
          <div style={S.pageHeader}>
            <div>
              <h1 style={S.pageTitle}>📊 Attendance Details</h1>
              <p style={S.pageSub}>
                {record.employeeName} · {record.employeeCode}
              </p>
            </div>
            <button style={S.backBtn} onClick={() => navigate(-1)}>
              ← Back
            </button>
          </div>

          {/* ── Employee Info Card ── */}
          <div style={S.card}>
            <div style={S.cardTitle}>👤 Employee Information</div>
            <div style={S.infoGrid}>
              {[
                { label: "Employee ID", value: record.employeeCode },
                { label: "Full Name", value: record.employeeName },
                { label: "Email", value: record.email },
                { label: "Phone", value: record.phone },
                { label: "Department", value: record.department },
                { label: "Position", value: record.position },
                { label: "Manager", value: record.managedBy },
                {
                  label: "Joining Date",
                  value: record.joiningDate
                    ? new Date(record.joiningDate).toLocaleDateString("en-GB")
                    : "N/A",
                },
              ].map((item) => (
                <div key={item.label} style={S.infoItem}>
                  <div style={S.infoLabel}>{item.label}</div>
                  <div style={S.infoValue}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Today's Attendance Card ── */}
          <div style={S.card}>
            <div style={S.cardTitle}>📋 Today's Attendance</div>
            <div style={S.todayGrid}>
              <div style={S.todayItem}>
                <div style={S.infoLabel}>Date</div>
                <div style={S.infoValue}>
                  {new Date(record.date).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
              <div style={S.todayItem}>
                <div style={S.infoLabel}>Status</div>
                <span style={getStatusBadgeStyle(record.status)}>
                  {getStatusIcon(record.status)}{" "}
                  {record.status === "not_marked"
                    ? "Not Marked"
                    : record.status}
                </span>
              </div>
              <div style={S.todayItem}>
                <div style={S.infoLabel}>Clock In</div>
                <div
                  style={{
                    ...S.infoValue,
                    color: record.clockIn ? "#059669" : "#9ca3af",
                  }}
                >
                  {record.clockIn || "—"}
                </div>
              </div>
              <div style={S.todayItem}>
                <div style={S.infoLabel}>Clock Out</div>
                <div
                  style={{
                    ...S.infoValue,
                    color: record.clockOut ? "#3b82f6" : "#9ca3af",
                  }}
                >
                  {record.clockOut || "—"}
                </div>
              </div>
              <div style={S.todayItem}>
                <div style={S.infoLabel}>Hours Worked</div>
                <div style={S.infoValue}>{record.hoursWorked} hrs</div>
              </div>
              <div style={S.todayItem}>
                <div style={S.infoLabel}>Notes</div>
                <div
                  style={{
                    ...S.infoValue,
                    color: record.notes ? "#374151" : "#9ca3af",
                    fontSize: 13,
                  }}
                >
                  {record.notes || "No notes"}
                </div>
              </div>
            </div>
          </div>

          {/* ── Report Type Selector ── */}
          <div style={S.card}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
                Report Period:
              </span>
              {[
                { key: "weekly", label: "📅 Last 7 Days" },
                { key: "monthly", label: "📆 Last 30 Days" },
                { key: "custom", label: "🗓️ Custom Range" },
              ].map((t) => (
                <button
                  key={t.key}
                  style={{
                    ...S.typeBtn,
                    ...(reportType === t.key ? S.typeBtnActive : {}),
                  }}
                  onClick={() => {
                    setReportType(t.key);
                    if (t.key !== "custom")
                      setCustomDates({ startDate: "", endDate: "" });
                  }}
                >
                  {t.label}
                </button>
              ))}
              {reportType === "custom" && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    type="date"
                    value={customDates.startDate}
                    onChange={(e) =>
                      setCustomDates((p) => ({
                        ...p,
                        startDate: e.target.value,
                      }))
                    }
                    style={S.dateInput}
                  />
                  <span style={{ color: "#6b7280" }}>to</span>
                  <input
                    type="date"
                    value={customDates.endDate}
                    onChange={(e) =>
                      setCustomDates((p) => ({ ...p, endDate: e.target.value }))
                    }
                    style={S.dateInput}
                  />
                  <button
                    style={S.typeBtnActive}
                    onClick={fetchEmployeeHistory}
                    disabled={!customDates.startDate || !customDates.endDate}
                  >
                    Generate
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Stats Cards — WITHOUT Total Hours & Avg Hours ── */}
          <div style={S.statsGrid}>
            {[
              { label: "Total Days", value: stats.totalDays, color: "#3b82f6" },
              { label: "Present", value: stats.presentDays, color: "#10b981" },
              { label: "Absent", value: stats.absentDays, color: "#ef4444" },
              { label: "Leave", value: stats.leaveDays, color: "#f59e0b" },
              { label: "Late Days", value: stats.lateDays, color: "#8b5cf6" },
            ].map((s) => (
              <div
                key={s.label}
                style={{ ...S.statCard, borderTopColor: s.color }}
              >
                <div style={{ ...S.statValue, color: s.color }}>{s.value}</div>
                <div style={S.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Attendance History Table ── */}
          <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <div style={S.cardTitle}>
                📅 Attendance History (
                {reportType === "weekly"
                  ? "Last 7 Days"
                  : reportType === "monthly"
                    ? "Last 30 Days"
                    : "Custom Range"}
                )
              </div>
            </div>

            {historyLoading ? (
              <div style={{ ...S.center, padding: 40 }}>
                <div style={S.spinner} />
                <style>{spinCSS}</style>
              </div>
            ) : employeeHistory.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={S.table}>
                  <thead>
                    <tr style={S.theadRow}>
                      {[
                        "Date",
                        "Status",
                        "Clock In",
                        "Clock Out",
                        "Hours",
                        "Late",
                        "Remarks",
                      ].map((h) => (
                        <th key={h} style={S.th}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {employeeHistory.map((h, i) => (
                      <tr
                        key={i}
                        style={{ borderBottom: "1px solid #f3f4f6" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#f9fafb")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "white")
                        }
                      >
                        <td style={S.td}>
                          {new Date(h.date).toLocaleDateString("en-GB")}
                        </td>
                        <td style={S.td}>
                          <span style={getStatusBadgeStyle(h.status)}>
                            {getStatusIcon(h.status)} {h.status}
                          </span>
                        </td>
                        <td
                          style={{
                            ...S.td,
                            color: h.clockIn !== "-" ? "#059669" : "#9ca3af",
                          }}
                        >
                          {h.clockIn}
                        </td>
                        <td
                          style={{
                            ...S.td,
                            color: h.clockOut !== "-" ? "#3b82f6" : "#9ca3af",
                          }}
                        >
                          {h.clockOut}
                        </td>
                        <td style={S.td}>
                          <strong>{h.hoursWorked} hrs</strong>
                        </td>
                        <td style={S.td}>
                          {h.isLate ? (
                            <span
                              style={{
                                background: "#fef3c7",
                                color: "#92400e",
                                padding: "2px 8px",
                                borderRadius: 12,
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              ⏰ {h.lateMinutes} min
                            </span>
                          ) : (
                            <span
                              style={{
                                color: "#10b981",
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              ✅ On Time
                            </span>
                          )}
                        </td>
                        <td
                          style={{
                            ...S.td,
                            color: "#6b7280",
                            fontSize: 12,
                            maxWidth: 200,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {h.remarks}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px",
                  color: "#9ca3af",
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>
                  📭
                </div>
                <div style={{ fontWeight: 600, color: "#374151" }}>
                  No Records Found
                </div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  No attendance records for the selected period.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const badgeBase = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 10px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
  textTransform: "capitalize",
};

const S = {
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 12,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 4px",
  },
  pageSub: { fontSize: 14, color: "#6b7280", margin: 0 },
  backBtn: {
    padding: "10px 20px",
    background: "white",
    border: "2px solid #e5e7eb",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    color: "#374151",
  },

  card: {
    background: "white",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 16,
  },

  // Employee Info Grid
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },
  infoItem: {
    padding: "12px 16px",
    background: "#f9fafb",
    borderRadius: 10,
    border: "1px solid #f3f4f6",
  },
  infoLabel: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 4,
  },
  infoValue: { fontSize: 14, fontWeight: 600, color: "#111827" },

  // Today Grid
  todayGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
  },
  todayItem: {
    padding: "12px 16px",
    background: "#f9fafb",
    borderRadius: 10,
    border: "1px solid #f3f4f6",
  },

  // Report type buttons
  typeBtn: {
    padding: "8px 16px",
    border: "2px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    background: "white",
    color: "#6b7280",
  },
  typeBtnActive: {
    padding: "8px 16px",
    border: "2px solid #667eea",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    background: "#667eea",
    color: "white",
  },
  dateInput: {
    padding: "8px 12px",
    border: "2px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
  },

  // Stats — 5 cards, no total/avg hours
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    background: "white",
    borderRadius: 12,
    padding: "16px 20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
    borderTop: "3px solid",
    textAlign: "center",
  },
  statValue: { fontSize: 32, fontWeight: 800, lineHeight: 1, marginBottom: 6 },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },

  // Table
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  theadRow: { background: "linear-gradient(135deg, #667eea, #764ba2)" },
  th: {
    padding: "12px 16px",
    textAlign: "left",
    color: "white",
    fontWeight: 700,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
  },
  td: { padding: "12px 16px", color: "#374151", verticalAlign: "middle" },

  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #667eea",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};

const spinCSS = `@keyframes spin { to { transform: rotate(360deg); } }`;

export default AttendanceDetails;

