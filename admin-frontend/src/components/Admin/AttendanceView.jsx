/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars, import/no-anonymous-default-export, jsx-a11y/anchor-is-valid */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import adminService from "../../services/adminService";
import adminAttendanceService from "../../services/adminAttendanceService";
import MarkAttendanceModal from "./MarkAttendanceModal";
import AdminCorrectAttendanceModal from "./AdminCorrectAttendanceModal";
import "../../styles/Admin.css";

const AttendanceView = () => {
  const navigate = useNavigate();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [showMarkAttendanceModal, setShowMarkAttendanceModal] = useState(false);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [weekendDays, setWeekendDays] = useState(["Saturday", "Sunday"]);
  const [dayOffMessage, setDayOffMessage] = useState("");
  const [isHolidayDate, setIsHolidayDate] = useState(false);

  const [showCorrectModal, setShowCorrectModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  useEffect(() => {
    filterRecords();
  }, [searchTerm, filterStatus, filterDepartment, attendanceRecords]);

  const fetchData = async () => {
    setLoading(true);
    let currentWeekendDays = ["Saturday", "Sunday"];
    try {
      const configRes = await adminService.getSystemConfig();
      if (configRes?.data?.config?.weekendDays) {
        currentWeekendDays = configRes.data.config.weekendDays;
        setWeekendDays(configRes.data.config.weekendDays);
      }
    } catch (e) {}

    try {
      const holidayRes = await adminService.getAllHolidays();
      const holidays = holidayRes?.data?.holidays || [];
      const isHoliday = holidays.some((h) => {
        const hDate = new Date(h.date).toISOString().split("T")[0];
        return hDate === selectedDate;
      });
      setIsHolidayDate(isHoliday);
      if (isHoliday) {
        const holidayName =
          holidays.find(
            (h) =>
              new Date(h.date).toISOString().split("T")[0] === selectedDate
          )?.name || "Public Holiday";
        setDayOffMessage(
          `🎉 ${holidayName} — This is a public holiday. Office is closed.`
        );
        setAttendanceRecords([]);
        setTotalEmployees(0);
        setLoading(false);
        return;
      }
      setDayOffMessage("");
    } catch (e) {}

    try {
      const attendanceResponse = await adminService.getAllAttendance({
        date: selectedDate,
      });
      const employeesResponse = await adminAttendanceService.getAllEmployees();

      if (attendanceResponse.success && employeesResponse.success) {
        const allEmployees = employeesResponse.data.employees || [];

        const formatted = attendanceResponse.data.attendance.map((record) => ({
          id: record._id,
          employeeId: record.employeeId?.employeeCode || "N/A",
          employeeName: `${record.employeeId?.firstName || ""} ${record.employeeId?.lastName || ""}`,
          department: record.employeeId?.department || "N/A",
          status: record.status,
          clockIn: record.clockIn
            ? new Date(record.clockIn).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
            : null,
          clockOut: record.clockOut
            ? new Date(record.clockOut).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
            : null,
          hoursWorked: record.workHours || 0,
          notes: record.remarks || "",
          hasRecord: true,
          date: selectedDate,
        }));

        const presentIds = attendanceResponse.data.attendance
          .map((r) => r.employeeId?._id?.toString())
          .filter(Boolean);

        const dayNames = [
          "Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday",
        ];
        const selectedDayName = dayNames[new Date(selectedDate).getDay()];
        const isWeekend = currentWeekendDays.includes(selectedDayName);

        if (isWeekend) {
          setDayOffMessage(
            `🏖️ ${selectedDayName} — Weekend. Office is closed.`
          );
          setAttendanceRecords([]);
          setTotalEmployees(0);
          setLoading(false);
          return;
        }
        setDayOffMessage("");

        const absentRows =
          isWeekend || isHolidayDate
            ? []
            : allEmployees
                .filter(
                  (emp) =>
                    emp.firstName &&
                    emp.lastName &&
                    emp.employeeCode &&
                    !emp.employeeCode.includes("TEST") &&
                    !presentIds.includes(emp._id?.toString())
                )
                .map((emp) => ({
                  id: emp._id,
                  employeeId: emp.employeeCode || "N/A",
                  employeeName: `${emp.firstName || ""} ${emp.lastName || ""}`,
                  department: emp.department || "N/A",
                  status: "absent",
                  clockIn: null,
                  clockOut: null,
                  hoursWorked: 0,
                  notes: "",
                  hasRecord: false,
                  date: selectedDate,
                }));

        setAttendanceRecords([...formatted, ...absentRows]);
      } else {
        setAttendanceRecords([]);
      }

      if (employeesResponse.success && employeesResponse.data.employees) {
        const realEmployees = employeesResponse.data.employees.filter(
          (emp) =>
            emp.firstName &&
            emp.lastName &&
            emp.employeeCode &&
            !emp.employeeCode.includes("TEST")
        );
        setTotalEmployees(realEmployees.length);
      } else {
        setTotalEmployees(0);
      }
    } catch (error) {
      console.error(error);
      setAttendanceRecords([]);
      setTotalEmployees(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    await fetchData();
  };

  const filterRecords = () => {
    let filtered = [...attendanceRecords];
    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.employeeId.includes(searchTerm)
      );
    }
    if (filterStatus) {
      if (filterStatus === "leave" || filterStatus === "on-leave") {
        filtered = filtered.filter(
          (record) =>
            record.status === "leave" || record.status === "on-leave"
        );
      } else {
        filtered = filtered.filter((record) => record.status === filterStatus);
      }
    }
    if (filterDepartment) {
      filtered = filtered.filter(
        (record) => record.department === filterDepartment
      );
    }
    setFilteredRecords(filtered);
  };

  const handleViewDetails = (record) => {
    if (record.hasRecord) {
      navigate(`/admin/attendance-details/${record.id}`);
    } else {
      navigate(`/admin/employee-attendance/${record.id}`);
    }
  };

  const handleAttendanceMarked = () => {
    fetchAttendance();
  };

  const handleCorrectClick = (record) => {
    setSelectedRecord(record);
    setShowCorrectModal(true);
  };

  const handleCorrected = () => {
    setShowCorrectModal(false);
    setSelectedRecord(null);
    fetchAttendance();
  };

  if (loading) {
    return (
      <div className="admin-container">
        <AdminNavbar />
        <div className="admin-layout">
          <AdminSidebar />
          <div className="admin-content loading-screen">
            <h3>Loading Attendance...</h3>
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

        <div
          className="admin-content responsive-content"
          style={{
            margin: window.innerWidth <= 768 ? "10px" : "20px",
          }}
        >
          {/* ✅ Single Header Bar — Title + Date + Search + Filter + Buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "20px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              padding: "14px 20px",
              borderRadius: "14px",
              boxShadow: "0 4px 15px rgba(102,126,234,0.3)",
            }}
          >
            {/* Title */}
            <h1
              style={{
                color: "white",
                fontSize: "17px",
                fontWeight: "700",
                margin: 0,
                whiteSpace: "nowrap",
              }}
            >
  📋
</h1>

            <div
              style={{
                width: "1px",
                height: "30px",
                background: "rgba(255,255,255,0.3)",
              }}
            />

            {/* Date Picker */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <label
                style={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: "12px",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                }}
              >
                📅 Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                onClick={(e) => e.target.showPicker?.()}
                style={{
                  padding: "6px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.4)",
                  fontSize: "13px",
                  fontWeight: "600",
                  background: "rgba(255,255,255,0.15)",
                  color: "white",
                  cursor: "pointer",
                  outline: "none",
                  colorScheme: "dark",
                }}
              />
            </div>

            <div
              style={{
                width: "1px",
                height: "30px",
                background: "rgba(255,255,255,0.3)",
              }}
            />

            {/* Search */}
            <input
              type="text"
              placeholder="🔍 Search name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.4)",
                fontSize: "13px",
                background: "rgba(255,255,255,0.15)",
                color: "white",
                outline: "none",
                minWidth: "160px",
                flex: "1",
              }}
            />

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.4)",
                fontSize: "13px",
                fontWeight: "600",
                background: "rgba(255,255,255,0.15)",
                color: "white",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="" style={{ color: "#333", background: "white" }}>All Status</option>
              <option value="present" style={{ color: "#333", background: "white" }}>Present</option>
              <option value="absent" style={{ color: "#333", background: "white" }}>Absent</option>
              <option value="leave" style={{ color: "#333", background: "white" }}>Leave</option>
              <option value="holiday" style={{ color: "#333", background: "white" }}>Holiday</option>
            </select>

            {/* Clear Button */}
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterDepartment("");
                setFilterStatus("");
              }}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.5)",
                background: "transparent",
                color: "white",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              ✕ Clear
            </button>

            {/* Mark Attendance Button */}
            <button
              onClick={() => setShowMarkAttendanceModal(true)}
              style={{
                padding: "7px 16px",
                borderRadius: "8px",
                border: "none",
                background: "white",
                color: "#667eea",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              ✓ Mark Attendance
            </button>
          </div>

          {/* Table */}
          <div className="table-container-modern">
            <table className="data-table-modern">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Hours</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length ? (
                  filteredRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{record.employeeId}</td>
                      <td>{record.employeeName}</td>
                      <td>{record.department}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            record.status === "leave" ||
                            record.status === "on-leave"
                              ? "leave"
                              : record.status
                          }`}
                        >
                          {record.status === "leave" ||
                          record.status === "on-leave"
                            ? "Leave"
                            : record.status}
                        </span>
                      </td>
                      <td>{record.clockIn || "-"}</td>
                      <td>{record.clockOut || "-"}</td>
                      <td>{record.hoursWorked} hrs</td>
                      <td>{record.notes || "-"}</td>
                      <td>
                        <button
                          className="btn-icon view"
                          onClick={() => handleViewDetails(record)}
                          title="View Details"
                        >
                          👁
                        </button>

                        {record.status === "absent" && record.hasRecord && (
                          <button
                            onClick={() => handleCorrectClick(record)}
                            title="Correct Attendance"
                            style={{
                              marginLeft: "6px",
                              background:
                                "linear-gradient(135deg, #f97316, #ef4444)",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              padding: "5px 10px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "600",
                              boxShadow: "0 2px 6px rgba(249,115,22,0.3)",
                            }}
                          >
                            ✏️ Correct
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="no-data">
                      {dayOffMessage ||
                        `No attendance found for ${new Date(
                          selectedDate
                        ).toLocaleDateString()}`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer-modern">
            Showing {filteredRecords.length} records out of {totalEmployees} total employees
          </div>
        </div>
      </div>

      {/* Mark Attendance Modal */}
      {showMarkAttendanceModal && (
        <MarkAttendanceModal
          selectedDate={selectedDate}
          onClose={() => setShowMarkAttendanceModal(false)}
          onAttendanceMarked={handleAttendanceMarked}
        />
      )}

      {/* Correct Attendance Modal */}
      {showCorrectModal && selectedRecord && (
        <AdminCorrectAttendanceModal
          record={selectedRecord}
          onClose={() => {
            setShowCorrectModal(false);
            setSelectedRecord(null);
          }}
          onCorrected={handleCorrected}
        />
      )}
    </div>
  );
};

export default AttendanceView;