import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import adminService from "../../services/adminService";
import adminAttendanceService from "../../services/adminAttendanceService";
import MarkAttendanceModal from "./MarkAttendanceModal";
import AdminCorrectAttendanceModal from "./AdminCorrectAttendanceModal"; // ✅ NEW
import "../../styles/Admin.css";

const AttendanceView = () => {
  const navigate = useNavigate();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [showMarkAttendanceModal, setShowMarkAttendanceModal] = useState(false);
  const [totalEmployees, setTotalEmployees] = useState(0);

  // ✅ NEW — Correct modal state
  const [showCorrectModal, setShowCorrectModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [selectedDate]);

  useEffect(() => {
    filterRecords();
    // eslint-disable-next-line
  }, [searchTerm, filterStatus, filterDepartment, attendanceRecords]);

  const fetchData = async () => {
    setLoading(true);
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
            ? new Date(record.clockIn).toLocaleTimeString()
            : null,
          clockOut: record.clockOut
            ? new Date(record.clockOut).toLocaleTimeString()
            : null,
          hoursWorked: record.workHours || 0,
          notes: record.remarks || "",
          hasRecord: true,
          date: selectedDate, // ✅ date pass karo modal ke liye
        }));

        const presentIds = attendanceResponse.data.attendance
          .map((r) => r.employeeId?._id?.toString())
          .filter(Boolean);

        const absentRows = allEmployees
          .filter(
            (emp) =>
              emp.firstName &&
              emp.lastName &&
              emp.employeeCode &&
              !emp.employeeCode.includes("TEST") &&
              !presentIds.includes(emp._id?.toString()),
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
            !emp.employeeCode.includes("TEST"),
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
          record.employeeName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          record.employeeId.includes(searchTerm),
      );
    }
    if (filterStatus) {
      if (filterStatus === "leave" || filterStatus === "on-leave") {
        filtered = filtered.filter(
          (record) => record.status === "leave" || record.status === "on-leave",
        );
      } else {
        filtered = filtered.filter((record) => record.status === filterStatus);
      }
    }
    if (filterDepartment) {
      filtered = filtered.filter(
        (record) => record.department === filterDepartment,
      );
    }
    setFilteredRecords(filtered);
  };

  const presentCount = filteredRecords.filter(
    (r) => r.status === "present",
  ).length;
  const leaveCount = filteredRecords.filter(
    (r) => r.status === "leave" || r.status === "on-leave",
  ).length;
  const holidayCount = filteredRecords.filter(
    (r) => r.status === "holiday",
  ).length;
  const absentCount = Math.max(
    0,
    totalEmployees - presentCount - leaveCount - holidayCount,
  );

  const stats = {
    total: totalEmployees,
    present: presentCount,
    absent: absentCount,
    leave: leaveCount,
    holiday: holidayCount,
  };

  const handleViewDetails = (id) => {
    navigate(`/admin/attendance-details/${id}`);
  };

  const handleAttendanceMarked = () => {
    setShowMarkAttendanceModal(false);
    fetchAttendance();
  };

  // ✅ NEW — Correct button click handler
  const handleCorrectClick = (record) => {
    setSelectedRecord(record);
    setShowCorrectModal(true);
  };

  // ✅ NEW — After correction done
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

        <div className="admin-content">
          {/* Header */}
          <div className="page-header-modern">
            <h1>Attendance View</h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div className="date-selector-modern">
                <label>Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  onClick={(e) => e.target.showPicker?.()}
                />
              </div>
              <button
                onClick={() => setShowMarkAttendanceModal(true)}
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  padding: "12px 24px",
                  borderRadius: "10px",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                  transition: "all 0.3s",
                }}
              >
                <span style={{ fontSize: "18px" }}>✓</span>
                Mark Attendance
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-grid-modern">
            <div className="stat-card-modern stat-1">
              <div className="stat-label-modern">Total</div>
              <div className="stat-value-modern">{stats.total}</div>
            </div>
            <div className="stat-card-modern stat-2">
              <div className="stat-label-modern">Present</div>
              <div className="stat-value-modern">{stats.present}</div>
            </div>
            <div className="stat-card-modern stat-3">
              <div className="stat-label-modern">Absent</div>
              <div className="stat-value-modern">{stats.absent}</div>
            </div>
            <div className="stat-card-modern stat-4">
              <div className="stat-label-modern">Leave</div>
              <div className="stat-value-modern">{stats.leave}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-modern">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="leave">Leave</option>
              <option value="holiday">Holiday</option>
            </select>
            <button
              className="btn-secondary"
              onClick={() => {
                setSearchTerm("");
                setFilterDepartment("");
                setFilterStatus("");
              }}
            >
              Clear Filters
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
                          className={`status-badge ${record.status === "leave" || record.status === "on-leave" ? "leave" : record.status}`}
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
                        {/* ✅ View button */}
                        <button
                          className="btn-icon view"
                          onClick={() => handleViewDetails(record.id)}
                          title="View Details"
                        >
                          👁
                        </button>

                        {/* ✅ NEW — Correct button (sirf absent records pe) */}
                        {record.status === "absent" && record.hasRecord && (
                          <button
                            onClick={() => handleCorrectClick(record)}
                            title="Correct Attendance"
                            style={{
                              marginLeft: "6px",
                              background: "linear-gradient(135deg, #f97316, #ef4444)",
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
                      No attendance found for{" "}
                      {new Date(selectedDate).toLocaleDateString()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer-modern">
            Showing {filteredRecords.length} records out of {stats.total} total
            employees
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

      {/* ✅ NEW — Correct Attendance Modal */}
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