import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import adminService from "../../services/adminService";
import api from "../../services/api";
import "../../styles/Admin.css";

const Report = () => {
  const navigate = useNavigate();

  const [reportType, setReportType] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState([]);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i,
  );

  // ✅ Holidays ek baar fetch karo
  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      const res = await adminService.getAllHolidays({ year: selectedYear });
      if (res.success) setHolidays(res.data.holidays || []);
    } catch (e) {
      console.error("Holidays fetch error:", e);
    }
  };

  // ✅ Working days calculate: start se end tak, weekends + holidays minus
  const calculateWorkingDays = (
    startDate,
    endDate,
    holidayDates,
    workingDayNames,
  ) => {
    const defaultWorkingDays = workingDayNames || [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ];
    const holidaySet = new Set(
      holidayDates.map((h) => new Date(h).toDateString()),
    );

    let count = 0;
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    // ✅ End = endDate ki midnight tak (us din include, agle din nahi)
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0); // date of end, not beyond

    while (current <= end) {
      const dayName = current.toLocaleDateString("en-US", { weekday: "long" });
      const isWorkingDay = defaultWorkingDays.includes(dayName);
      const isHoliday = holidaySet.has(current.toDateString());
      if (isWorkingDay && !isHoliday) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  // =====================================================
  // DATE RANGE
  // =====================================================
  const getDateRange = useCallback(() => {
    if (reportType === "monthly") {
      const start = new Date(selectedYear, selectedMonth - 1, 1);
      const end = new Date(selectedYear, selectedMonth, 0);
      return {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      };
    }
    if (reportType === "weekly") {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(today);
      monday.setDate(today.getDate() + mondayOffset);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        startDate: monday.toISOString().split("T")[0],
        endDate: sunday.toISOString().split("T")[0],
      };
    }
    return { startDate: customStartDate, endDate: customEndDate };
  }, [reportType, selectedMonth, selectedYear, customStartDate, customEndDate]);

  // =====================================================
  // FETCH
  // =====================================================
  useEffect(() => {
    if (reportType === "custom" && (!customStartDate || !customEndDate)) return;
    fetchReport();
  }, [
    reportType,
    selectedMonth,
    selectedYear,
    customStartDate,
    customEndDate,
    holidays,
  ]);

  useEffect(() => {
    applySearch();
  }, [searchTerm, employees]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      // System config fetch karo (working days ke liye)
      let configWorkingDays = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
      ];
      try {
        const configRes = await adminService.getSystemConfig();
        if (configRes.success && configRes.data.config?.workingDays) {
          configWorkingDays = configRes.data.config.workingDays;
        }
      } catch (e) {}

      const empRes = await adminService.getAllEmployees({ limit: 1000 });
      if (!empRes.success || !empRes.data.employees) {
        setEmployees([]);
        setLoading(false);
        return;
      }
      const allEmployees = empRes.data.employees;

      const attRes = await api.get("/admin/attendance", {
        params: { startDate, endDate },
      });
      const attendanceData = attRes.data.success
        ? attRes.data.data.attendance
        : [];

      // Holiday dates for this range
      const rangeHolidayDates = holidays
        .filter((h) => {
          const hDate = new Date(h.date);
          return hDate >= new Date(startDate) && hDate <= new Date(endDate);
        })
        .map((h) => h.date);

      const reportStart = new Date(startDate);
      reportStart.setHours(0, 0, 0, 0);
      const reportEnd = new Date(endDate);
      reportEnd.setHours(23, 59, 59, 999);
      // ✅ Future days nahi, lekin aaj ka poora din include
      // ✅ Sirf abhi tak ke complete hours — aaj ki current time tak
      const now = new Date();
      // ✅ Aaj ki date tak — time nahi, date
      // ✅ Today = aaj ki date, end of day
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      // ✅ Future month = 0 days (abhi koi working day nahi)
      const reportStartDate = new Date(startDate);
      reportStartDate.setHours(0, 0, 0, 0);

      if (reportStartDate > today) {
        // Pure future month — koi data nahi
        setEmployees(
          allEmployees.map((emp) => ({
            id: emp._id,
            name: `${emp.firstName} ${emp.lastName}`,
            department: emp.department || "General",
            joiningDate: emp.joiningDate,
            workingDays: 0,
            present: 0,
            absent: 0,
            leave: 0,
            late: 0,
            attendanceRate: 0,
            overtimeHours: 0,
          })),
        );
        setLoading(false);
        return;
      }

      const effectiveEnd = reportEnd > today ? today : reportEnd;

      const stats = allEmployees.map((emp) => {
        // ✅ Joining date ke hisaab se effective start date
        const joiningDate = emp.joiningDate
          ? new Date(emp.joiningDate)
          : reportStart;
        joiningDate.setHours(0, 0, 0, 0);

        // Is employee ke liye actual start = max(reportStart, joiningDate)
        const empEffectiveStart =
          joiningDate > reportStart ? joiningDate : reportStart;

        // Working days = empEffectiveStart se effectiveEnd tak
        const workingDays = calculateWorkingDays(
          empEffectiveStart,
          effectiveEnd,
          rangeHolidayDates,
          configWorkingDays,
        );

        const empAtt = attendanceData.filter((a) => {
          const empId = a.employeeId?._id || a.employeeId;
          return empId?.toString() === emp._id?.toString();
        });

        const present = empAtt.filter((a) =>
          ["present", "half-day", "late"].includes(a.status),
        ).length;

        const leave = empAtt.filter((a) =>
          ["leave", "on-leave"].includes(a.status),
        ).length;

        const late = empAtt.filter((a) => a.isLate === true).length;

        // ✅ Absent = working days - present - leave
        // Lekin sirf past days count karo (aaj bhi agar attendance nahi to absent)
        const absent = Math.max(0, workingDays - present - leave);

        const rate =
          workingDays > 0 ? ((present / workingDays) * 100).toFixed(1) : 0;

        const overtimeHours = empAtt.reduce((sum, a) => {
          return a.overtimeStatus === "approved"
            ? sum + (a.overtimeHours || 0)
            : sum;
        }, 0);

        return {
          id: emp._id,
          name: `${emp.firstName} ${emp.lastName}`,
          department: emp.department || "General",
          joiningDate: emp.joiningDate,
          workingDays,
          present,
          absent,
          leave,
          late,
          attendanceRate: parseFloat(rate),
          overtimeHours: parseFloat(overtimeHours.toFixed(1)),
        };
      });

      setEmployees(stats);
    } catch (error) {
      console.error("Report fetch error:", error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const applySearch = () => {
    if (!searchTerm) {
      setFilteredEmployees(employees);
      return;
    }
    const term = searchTerm.toLowerCase();
    setFilteredEmployees(
      employees.filter((emp) => emp.name.toLowerCase().includes(term)),
    );
  };

  // =====================================================
  // TOTALS
  // =====================================================
  const totals = {
    employees: filteredEmployees.length,
    present: filteredEmployees.reduce((s, e) => s + e.present, 0),
    absent: filteredEmployees.reduce((s, e) => s + e.absent, 0),
    leave: filteredEmployees.reduce((s, e) => s + e.leave, 0),
    avgAttendance:
      filteredEmployees.length > 0
        ? (
            filteredEmployees.reduce((s, e) => s + e.attendanceRate, 0) /
            filteredEmployees.length
          ).toFixed(1)
        : 0,
  };

  // =====================================================
  // EXPORT CSV
  // =====================================================
  const handleExportCSV = () => {
    const { startDate, endDate } = getDateRange();
    const header = [
      "Employee",
      "Department",
      "Joining Date",
      "Working Days",
      "Present",
      "Absent",
      "Leave",
      "Late",
      "Attendance %",
    ];
    const rows = filteredEmployees.map((e) => [
      e.name,
      e.department,
      e.joiningDate ? new Date(e.joiningDate).toLocaleDateString() : "N/A",
      e.workingDays,
      e.present,
      e.absent,
      e.leave,
      e.late,
      e.attendanceRate,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEmployeeClick = (employeeId) => {
    navigate(`/admin/employee-attendance/${employeeId}`);
  };

  // =====================================================
  // HELPERS
  // =====================================================
  const getPerformanceColor = (rate) => {
    if (rate >= 90)
      return { bg: "#ecfdf5", color: "#059669", label: "Excellent" };
    if (rate >= 75) return { bg: "#fffbeb", color: "#d97706", label: "Good" };
    if (rate >= 60)
      return { bg: "#fff7ed", color: "#ea580c", label: "Average" };
    return { bg: "#fef2f2", color: "#dc2626", label: "Poor" };
  };

  const getReportLabel = () => {
    if (reportType === "monthly")
      return `${months[selectedMonth - 1]} ${selectedYear}`;
    if (reportType === "weekly") {
      const { startDate, endDate } = getDateRange();
      return `${startDate} to ${endDate}`;
    }
    if (customStartDate && customEndDate)
      return `${customStartDate} to ${customEndDate}`;
    return "Select date range";
  };

  // =====================================================
  // LOADING
  // =====================================================
  if (loading) {
    return (
      <div className="admin-container">
        <AdminNavbar />
        <div className="admin-layout">
          <AdminSidebar />
          <div className="admin-content">
            <div style={styles.loadingBox}>
              <div style={styles.spinner}></div>
              <p style={{ color: "#6b7280", marginTop: 12 }}>
                Loading report...
              </p>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="admin-container">
      <AdminNavbar />
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content" style={styles.content}>
          <div style={styles.pageHeader}>
            <div>
              <h1 style={styles.pageTitle}>📈 Report</h1>
              <p style={styles.pageSubtitle}>
                Web Development · {getReportLabel()}
              </p>
            </div>
            <button style={styles.exportBtn} onClick={handleExportCSV}>
              📊 Export CSV
            </button>
          </div>

          <div style={styles.tabsContainer}>
            {["monthly", "weekly", "custom"].map((type) => (
              <button
                key={type}
                style={{
                  ...styles.tab,
                  ...(reportType === type ? styles.tabActive : {}),
                }}
                onClick={() => setReportType(type)}
              >
                {type === "monthly" && "📅 Monthly"}
                {type === "weekly" && "📆 Weekly"}
                {type === "custom" && "🗓️ Custom"}
              </button>
            ))}
          </div>

          <div style={styles.controlsRow}>
            <div style={styles.controlsLeft}>
              {reportType === "monthly" && (
                <>
                  <select
                    style={styles.select}
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(+e.target.value)}
                  >
                    {months.map((m, i) => (
                      <option key={i} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    style={styles.select}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(+e.target.value)}
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </>
              )}
              {reportType === "weekly" && (
                <span style={styles.weekLabel}>📍 Current Week</span>
              )}
              {reportType === "custom" && (
                <div style={styles.customDateRow}>
                  <div style={styles.dateInputWrapper}>
                    <label style={styles.dateLabel}>From</label>
                    <input
                      type="date"
                      style={styles.dateInput}
                      value={customEndDate}
                      min={customStartDate}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      onClick={(e) => e.target.showPicker?.()}
                    />
                  </div>
                  <span style={styles.dateSeparator}>→</span>
                  <div style={styles.dateInputWrapper}>
                    <label style={styles.dateLabel}>To</label>
                    <input
                      type="date"
                      style={styles.dateInput}
                      value={customEndDate}
                      min={customStartDate}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            <div style={styles.searchWrapper}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search employee..."
                style={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            {[
              {
                label: "Employees",
                value: totals.employees,
                color: "#3b82f6",
                icon: "👥",
              },
              {
                label: "Total Present",
                value: totals.present,
                color: "#10b981",
                icon: "✅",
              },
              {
                label: "Total Absent",
                value: totals.absent,
                color: "#ef4444",
                icon: "❌",
              },
              {
                label: "Total Leave",
                value: totals.leave,
                color: "#f59e0b",
                icon: "🏖️",
              },
              {
                label: "Avg Attendance",
                value: `${totals.avgAttendance}%`,
                color: "#06b6d4",
                icon: "📊",
              },
            ].map((card, i) => (
              <div
                key={i}
                style={{ ...styles.statCard, borderTopColor: card.color }}
              >
                <div style={styles.statRow}>
                  <span style={styles.statIcon}>{card.icon}</span>
                  <div>
                    <div style={styles.statLabel}>{card.label}</div>
                    <div style={{ ...styles.statValue, color: card.color }}>
                      {card.value}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={styles.tableContainer}>
            <div style={styles.tableHeader}>
              <h3 style={styles.tableTitle}>Employee Report</h3>
              <span style={styles.tableCount}>
                {filteredEmployees.length} employees
              </span>
            </div>

            {filteredEmployees.length > 0 ? (
              <div style={styles.tableScroll}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.theadRow}>
                      <th style={styles.th}>Employee</th>
                      <th style={styles.th}>Department</th>
                      <th style={styles.th}>Days</th>
                      <th style={styles.th}>Present</th>
                      <th style={styles.th}>Absent</th>
                      <th style={styles.th}>Leave</th>
                      <th style={styles.th}>Late</th>
                      <th style={styles.th}>Overtime</th>
                      <th style={styles.th}>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp, i) => {
                      const perf = getPerformanceColor(emp.attendanceRate);
                      return (
                        <tr
                          key={emp.id}
                          style={{
                            ...styles.tbody_tr,
                            background: i % 2 === 0 ? "#fff" : "#f9fafb",
                            cursor: "pointer",
                          }}
                          onClick={() => handleEmployeeClick(emp.id)}
                        >
                          <td style={styles.td}>
                            <div style={styles.empCell}>
                              <div style={styles.avatar}>
                                {emp.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)}
                              </div>
                              <div>
                                <div style={styles.empName}>{emp.name}</div>
                                {emp.joiningDate && (
                                  <div
                                    style={{ fontSize: 11, color: "#9ca3af" }}
                                  >
                                    Joined:{" "}
                                    {new Date(
                                      emp.joiningDate,
                                    ).toLocaleDateString("en-GB")}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.deptBadge}>
                              {emp.department}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <strong>{emp.workingDays}</strong>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.presentBadge}>
                              {emp.present}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.absentBadge}>{emp.absent}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.leaveBadge}>{emp.leave}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.lateBadge}>{emp.late}</span>
                          </td>
                          <td style={styles.td}>
                            {emp.overtimeHours > 0 ? (
                              <span
                                style={{ color: "#667eea", fontWeight: 700 }}
                              >
                                {emp.overtimeHours} hr
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.rateBadge,
                                background: perf.bg,
                                color: perf.color,
                              }}
                            >
                              {emp.attendanceRate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={styles.emptyState}>
                <div style={{ fontSize: 56, opacity: 0.4 }}>📭</div>
                <h3 style={{ color: "#374151", margin: "12px 0 4px" }}>
                  No Data Found
                </h3>
                <p style={{ color: "#6b7280", fontSize: 14 }}>
                  {reportType === "custom" && !customStartDate
                    ? "Please select a date range above"
                    : `No attendance data for ${getReportLabel()}`}
                </p>
              </div>
            )}
          </div>

          <div style={styles.legend}>
            {[
              { label: "Excellent", color: "#059669", range: "≥ 90%" },
              { label: "Good", color: "#d97706", range: "75–89%" },
              { label: "Average", color: "#ea580c", range: "60–74%" },
              { label: "Poor", color: "#dc2626", range: "< 60%" },
            ].map((item, i) => (
              <div key={i} style={styles.legendItem}>
                <span
                  style={{ ...styles.legendDot, background: item.color }}
                ></span>
                <span style={styles.legendText}>
                  <strong>{item.label}</strong> ({item.range})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// STYLES
// =====================================================
const styles = {
  content: { padding: 24, background: "#f9fafb", minHeight: "100vh" },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },
  pageTitle: { fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 },
  pageSubtitle: { fontSize: 13, color: "#6b7280", margin: "4px 0 0" },
  exportBtn: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  tabsContainer: { display: "flex", gap: 8, marginBottom: 16 },
  tab: {
    padding: "8px 18px",
    background: "#fff",
    border: "2px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    color: "#6b7280",
    cursor: "pointer",
  },
  tabActive: {
    background: "#667eea",
    border: "2px solid #667eea",
    color: "#fff",
    boxShadow: "0 2px 8px rgba(102,126,234,0.3)",
  },
  controlsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
    marginBottom: 20,
    flexWrap: "wrap",
    background: "#fff",
    padding: "16px 20px",
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  controlsLeft: {
    display: "flex",
    gap: 10,
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  select: {
    padding: "8px 12px",
    border: "2px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 13,
    color: "#374151",
    background: "#fff",
    cursor: "pointer",
    outline: "none",
    minWidth: 120,
  },
  weekLabel: {
    padding: "8px 14px",
    background: "#eef2ff",
    color: "#4f46e5",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
  },
  customDateRow: { display: "flex", alignItems: "flex-end", gap: 8 },
  dateInputWrapper: { display: "flex", flexDirection: "column", gap: 4 },
  dateLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  dateInput: {
    padding: "8px 10px",
    border: "2px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 13,
    color: "#374151",
    outline: "none",
  },
  dateSeparator: {
    fontSize: 18,
    color: "#9ca3af",
    marginBottom: 4,
    fontWeight: 700,
  },
  searchWrapper: { position: "relative", minWidth: 220 },
  searchIcon: {
    position: "absolute",
    left: 10,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 14,
  },
  searchInput: {
    width: "100%",
    padding: "8px 12px 8px 32px",
    border: "2px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    background: "#fff",
    borderRadius: 10,
    padding: "14px 16px",
    borderTop: "3px solid",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  statRow: { display: "flex", alignItems: "center", gap: 10 },
  statIcon: { fontSize: 20 },
  statLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statValue: { fontSize: 22, fontWeight: 700, marginTop: 2 },
  tableContainer: {
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    overflow: "hidden",
    marginBottom: 16,
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #e5e7eb",
  },
  tableTitle: { fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 },
  tableCount: {
    fontSize: 12,
    color: "#6b7280",
    background: "#f3f4f6",
    padding: "4px 10px",
    borderRadius: 12,
  },
  tableScroll: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 800 },
  theadRow: { background: "#f9fafb" },
  th: {
    padding: "10px 14px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "2px solid #e5e7eb",
    whiteSpace: "nowrap",
  },
  tbody_tr: {
    borderBottom: "1px solid #f3f4f6",
    transition: "background 0.15s",
  },
  td: {
    padding: "12px 14px",
    fontSize: 13,
    color: "#374151",
    whiteSpace: "nowrap",
  },
  empCell: { display: "flex", alignItems: "center", gap: 10 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  empName: { fontWeight: 600, color: "#111827" },
  deptBadge: {
    background: "#eef2ff",
    color: "#4f46e5",
    padding: "3px 8px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
  },
  presentBadge: { color: "#059669", fontWeight: 700 },
  absentBadge: { color: "#dc2626", fontWeight: 700 },
  leaveBadge: { color: "#d97706", fontWeight: 700 },
  lateBadge: { color: "#ea580c", fontWeight: 600 },
  rateBadge: {
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
  },
  emptyState: { textAlign: "center", padding: "60px 20px" },
  legend: {
    display: "flex",
    gap: 20,
    flexWrap: "wrap",
    padding: "14px 20px",
    background: "#fff",
    borderRadius: 10,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  legendItem: { display: "flex", alignItems: "center", gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: "50%" },
  legendText: { fontSize: 12, color: "#374151" },
  loadingBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 350,
  },
  spinner: {
    width: 44,
    height: 44,
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #667eea",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};

export default Report;
