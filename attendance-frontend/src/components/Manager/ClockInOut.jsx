import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ManagerNavbar from "./ManagerNavbar";
import ManagerSidebar from "./ManagerSidebar";
import managerService from "../../services/managerService";
import attendanceService from "../../services/attendanceService";
import "../../styles/Manager.css";

const ClockInOut = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClockingIn] = useState(false);
  const [systemConfig, setSystemConfig] = useState(null); // ✅ Real policy
  const intervalRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchTodayAttendance();
    fetchSystemConfig(); // ✅ Fetch real office policy

    intervalRef.current = setInterval(() => {
      fetchTodayAttendance(true);
    }, 5000);

    return () => {
      clearInterval(timer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ✅ Fetch real SystemConfig from backend
  const fetchSystemConfig = async () => {
    try {
      const response = await managerService.getSystemConfig();
      console.log("🔧 SystemConfig raw response:", JSON.stringify(response));

      if (response.success) {
        // Handle all possible response structures:
        // { success, data: { config: {...} } }
        // { success, data: { systemConfig: {...} } }
        // { success, data: {...fields directly} }
        const raw = response.data;
        const config = raw?.config || raw?.systemConfig || raw;
        console.log("🔧 Parsed config:", config);
        setSystemConfig(config);
      }
    } catch (error) {
      console.error("❌ Error fetching system config:", error);
    }
  };

  const fetchTodayAttendance = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const employeesResponse = await managerService.getMyEmployees();
      if (!employeesResponse.success || !employeesResponse.data.employees) {
        setTodayAttendance([]);
        return;
      }

      const employees = employeesResponse.data.employees;
      const today = new Date().toISOString().split("T")[0];
      const attendanceResponse = await attendanceService.getAllAttendance({
        date: today,
      });

      // ✅ Weekend check using SystemConfig working days
      const configWorkingDays = systemConfig?.workingDays || [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
      ];
      const todayName = new Date().toLocaleDateString("en-US", {
        weekday: "long",
      });
      const isWeekend = !configWorkingDays.includes(todayName);

      const attendanceMap = {};
      if (attendanceResponse.success && attendanceResponse.data?.attendance) {
        attendanceResponse.data.attendance.forEach((record) => {
          const empId = record.employeeId?._id || record.employeeId;
          if (empId) attendanceMap[empId] = record;
        });
      }

      const combinedData = employees.map((emp) => {
        const attendance = attendanceMap[emp._id];
        return {
          id: emp._id,
          employeeId: emp.employeeCode || "N/A",
          employeeName: `${emp.firstName || ""} ${emp.lastName || ""}`.trim(),
          clockIn: attendance?.clockIn
            ? new Date(attendance.clockIn).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
            : null,
          clockOut: attendance?.clockOut
            ? new Date(attendance.clockOut).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
            : null,
          status: isWeekend
            ? "weekend"
            : attendance?.clockOut
              ? "clocked-out"
              : attendance?.clockIn
                ? "clocked-in"
                : "not-clocked-in",
          attendanceId: attendance?._id,
          isWeekend,
        };
      });

      setTodayAttendance(combinedData);
    } catch (error) {
      console.error("❌ Error fetching attendance:", error);
      setTodayAttendance([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

  const formatDate = (date) => {
    const formatted = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const configWorkingDays = systemConfig?.workingDays || [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ];
    const todayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const isOff = !configWorkingDays.includes(todayName);
    return `${formatted}${isOff ? " (Off Day)" : ""}`;
  };

  // ✅ Parse shift time - backend stores in workingHours.startTime/endTime
  const getShiftHours = () => {
    const startStr =
      systemConfig?.workingHours?.startTime ||
      systemConfig?.shiftStartTime ||
      "09:00";
    const endStr =
      systemConfig?.workingHours?.endTime ||
      systemConfig?.shiftEndTime ||
      "17:00";
    const [startH] = startStr.split(":").map(Number);
    const [endH] = endStr.split(":").map(Number);
    return { startH, endH };
  };

  // ✅ Format shift time - handles "09:00", "17:00", "09:00 AM" all formats
  const formatShiftTime = (timeStr) => {
    if (!timeStr) return "—";
    if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    const h = parseInt(parts[0]);
    const m = parseInt(parts[1]);
    if (isNaN(h) || isNaN(m)) return timeStr;
    const period = h >= 12 ? "PM" : "AM";
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayH}:${m.toString().padStart(2, "0")} ${period}`;
  };

  // ✅ Working days display - shows all days properly
  const formatWorkingDays = () => {
    const days = systemConfig?.workingDays;
    if (!days || days.length === 0) return "Monday to Friday";
    if (days.length === 1) return days[0];
    // If consecutive Mon-Fri type range, show "Monday to Friday"
    const allDaysOrder = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const sorted = [...days].sort(
      (a, b) => allDaysOrder.indexOf(a) - allDaysOrder.indexOf(b),
    );
    // Check if consecutive
    let isConsecutive = true;
    for (let i = 1; i < sorted.length; i++) {
      if (
        allDaysOrder.indexOf(sorted[i]) -
          allDaysOrder.indexOf(sorted[i - 1]) !==
        1
      ) {
        isConsecutive = false;
        break;
      }
    }
    if (isConsecutive) return `${sorted[0]} to ${sorted[sorted.length - 1]}`;
    return sorted.join(", ");
  };

  // ✅ Off days = days NOT in working days
  const formatOffDays = () => {
    const allDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const workDays = systemConfig?.workingDays || [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ];
    const offDays = allDays.filter((d) => !workDays.includes(d));
    if (offDays.length === 0) return "None";
    return offDays.join(" & ") + " (Automatic Off)";
  };

  const handleClockIn = async (empId, employeeName) => {
    const configWorkingDays = systemConfig?.workingDays || [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ];
    const todayName = new Date().toLocaleDateString("en-US", {
      weekday: "long",
    });
    const isOff = !configWorkingDays.includes(todayName);

    if (isOff) {
      alert(`🏖️ Today is ${todayName}. Office is closed!`);
      return;
    }

    const now = new Date();
    const { startH, endH } = getShiftHours();

    if (now.getHours() < startH) {
      alert(
        `⏰ Office opens at ${formatShiftTime(systemConfig?.workingHours?.startTime || "09:00")}. Please clock in after that.`,
      );
      return;
    }
    if (now.getHours() >= endH) {
      alert(
        `⏰ Office hours ended at ${formatShiftTime(systemConfig?.workingHours?.endTime || "17:00")}. Cannot clock in now.`,
      );
      return;
    }

    if (window.confirm(`Clock in for ${employeeName}?`)) {
      setClockingIn(true);
      try {
        const today = new Date().toISOString().split("T")[0];
        const clockInTime = `${today}T${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:00`;
        const response = await attendanceService.createAttendance({
          employeeId: empId,
          date: today,
          clockIn: clockInTime,
          status: "present",
        });
        if (response.success) {
          alert(`✅ ${employeeName} clocked in at ${formatTime(now)}!`);
          await fetchTodayAttendance();
        }
      } catch (error) {
        alert(error.response?.data?.message || "Failed to clock in");
      } finally {
        setClockingIn(false);
      }
    }
  };

  const handleClockOut = async (attendanceId, employeeName) => {
    const now = new Date();
    if (window.confirm(`Clock out for ${employeeName}?`)) {
      setClockingIn(true);
      try {
        const today = new Date().toISOString().split("T")[0];
        const clockOutTime = `${today}T${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:00`;
        const response = await attendanceService.updateAttendance(
          attendanceId,
          { clockOut: clockOutTime },
        );
        if (response.success) {
          alert(`✅ ${employeeName} clocked out at ${formatTime(now)}!`);
          await fetchTodayAttendance();
        }
      } catch (error) {
        alert(error.response?.data?.message || "Failed to clock out");
      } finally {
        setClockingIn(false);
      }
    }
  };

  const calculateWorkingHours = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return "-";
    try {
      const inTime = new Date(`2000-01-01 ${clockIn}`);
      const outTime = new Date(`2000-01-01 ${clockOut}`);
      const diff = (outTime - inTime) / (1000 * 60 * 60);
      return `${diff.toFixed(2)} hrs`;
    } catch {
      return "-";
    }
  };

  const stats = {
    total: todayAttendance.length,
    clockedIn: todayAttendance.filter((a) => a.status === "clocked-in").length,
    clockedOut: todayAttendance.filter((a) => a.status === "clocked-out")
      .length,
    notYetIn: todayAttendance.filter((a) => a.status === "not-clocked-in")
      .length,
  };

  const configWorkingDays = systemConfig?.workingDays || [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ];
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const isWeekend = !configWorkingDays.includes(todayName);

  if (loading) {
    return (
      <div className="manager-container">
        <ManagerNavbar />
        <div className="manager-layout">
          <ManagerSidebar />
          <div className="manager-content">
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "400px",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    border: "4px solid #f3f3f3",
                    borderTop: "4px solid #667eea",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 20px",
                  }}
                />
                <p style={{ color: "#666" }}>Loading attendance...</p>
                <style>{`@keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="manager-container">
      <ManagerNavbar />
      <div className="manager-layout">
        <ManagerSidebar />
        <div className="manager-content">
          <div className="page-header">
  <h1 style={{ color: '#111827' }}>⏰ Clock In/Out</h1>
  <small style={{ color: '#6b7280', fontSize: '12px' }}>🔄 Auto-refreshing every 5 seconds</small>
</div>

          {/* ✅ Off Day Banner - uses real config */}
          {isWeekend && (
            <div
              style={{
                background: "#fff3cd",
                border: "1px solid #ffc107",
                borderRadius: "8px",
                padding: "15px",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              <strong>🏖️ {todayName} - Office Closed</strong>
              <p style={{ margin: "5px 0 0", fontSize: "14px" }}>
                {formatOffDays()}
              </p>
            </div>
          )}

          <div className="clock-display">
            <div className="digital-clock">
              <div
                className="clock-time"
                style={{
                  color: "#ffffff",
                  textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}
              >
                {formatTime(currentTime)}
              </div>
              <div
                className="clock-date"
                style={{ color: "#e2e8f0", fontSize: "16px", marginTop: "6px" }}
              >
                {formatDate(currentTime)}
              </div>
            </div>
          </div>

          <div className="stats-grid-small">
            <div className="stat-card-small blue">
              <span className="stat-label">Total Employees</span>
              <span className="stat-value">{stats.total}</span>
            </div>
            <div className="stat-card-small green">
              <span className="stat-label">Clocked In</span>
              <span className="stat-value">{stats.clockedIn}</span>
            </div>
            <div className="stat-card-small purple">
              <span className="stat-label">Clocked Out</span>
              <span className="stat-value">{stats.clockedOut}</span>
            </div>
            <div className="stat-card-small orange">
              <span className="stat-label">Not Yet In</span>
              <span className="stat-value">{stats.notYetIn}</span>
            </div>
          </div>

          <div className="table-container">
            <h2>Today's Clock Records</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Employee Name</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {todayAttendance.length > 0 ? (
                  todayAttendance.map((record) => (
                    <tr key={record.id}>
                      <td>{record.employeeId}</td>
                      <td>
                        <strong>{record.employeeName}</strong>
                      </td>
                      <td
                        className={record.clockIn ? "text-green" : "text-muted"}
                      >
                        {record.isWeekend
                          ? "Off Day"
                          : record.clockIn || "Not clocked in"}
                      </td>
                      <td
                        className={record.clockOut ? "text-blue" : "text-muted"}
                      >
                        {record.isWeekend
                          ? "—"
                          : record.clockOut || "Not clocked out"}
                      </td>
                      <td>
                        {record.isWeekend
                          ? "—"
                          : calculateWorkingHours(
                              record.clockIn,
                              record.clockOut,
                            )}
                      </td>
                      <td>
                        <span className={`status-badge ${record.status}`}>
                          {record.status === "weekend" && "🏖️ Off Day"}
                          {record.status === "clocked-in" && "🟢 Working"}
                          {record.status === "clocked-out" && "🔴 Finished"}
                          {record.status === "not-clocked-in" &&
                            "⚪ Not Started"}
                        </span>
                      </td>
                      <td>
                        {record.isWeekend ? (
                          <span className="text-muted">Off Day</span>
                        ) : record.status === "clocked-in" ? (
                          <button
                            className="btn-small danger"
                            onClick={() =>
                              handleClockOut(
                                record.attendanceId,
                                record.employeeName,
                              )
                            }
                            disabled={clockingIn}
                          >
                            Clock Out
                          </button>
                        ) : record.status === "not-clocked-in" ? (
                          <button
                            className="btn-small success"
                            onClick={() =>
                              handleClockIn(record.id, record.employeeName)
                            }
                            disabled={clockingIn}
                          >
                            Clock In
                          </button>
                        ) : (
                          <span className="text-muted">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-data">
                      No employees found under your supervision
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ✅ Info box - REAL data from SystemConfig */}
          <div className="info-box">
            <h3>ℹ️ Clock In/Out Information</h3>
            <ul>
              <li>
                🕙 <strong>Office Hours:</strong>{" "}
                {systemConfig
                  ? `${formatShiftTime(systemConfig.workingHours?.startTime || systemConfig.shiftStartTime)} - ${formatShiftTime(systemConfig.workingHours?.endTime || systemConfig.shiftEndTime)}`
                  : "Loading..."}
              </li>
              <li>
                ⏱️ <strong>Late Entry After:</strong>{" "}
                {systemConfig
                  ? formatShiftTime(
                      systemConfig.workingHours?.lateEntryTime ||
                        systemConfig.lateEntryTime,
                    )
                  : "Loading..."}
              </li>
              <li>
                📅 <strong>Working Days:</strong>{" "}
                {systemConfig ? formatWorkingDays() : "Loading..."}
              </li>
              <li>
                🏖️ <strong>Off Days:</strong>{" "}
                {systemConfig ? formatOffDays() : "Loading..."}
              </li>
              <li>⏰ Clock in time is recorded when employee arrives</li>
              <li>🚪 Clock out time is recorded when employee leaves</li>
              <li>📊 Working hours are automatically calculated</li>
              <li>🔄 Page refreshes every 5 seconds for real-time updates</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClockInOut;
