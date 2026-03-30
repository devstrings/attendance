import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeNavbar from "./EmployeeNavbar";
import "../../styles/Employee.css";

// ============================================================
// ⏰ OvertimeRequest.jsx — Employee Frontend (port 3000)
// Route: /employee/overtime-requests
// Employee apni overtime requests dekh aur submit kar sakta hai
// ============================================================

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";

const OvertimeRequest = () => {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [overtimeRequests, setOvertimeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null); // attendanceId

  // Form state
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [overtimeMinutes, setOvertimeMinutes] = useState(0);
  const [overtimeNote, setOvertimeNote] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const getToken = () =>
    localStorage.getItem("employee_token") || localStorage.getItem("token");

  // Aakhri 30 din ki attendance fetch karo
  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);

      const token = getToken();

      const res = await fetch(
        `${API}/employee/attendance-history?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();
      const mine = data.data?.attendance || [];

      setAttendance(mine);

      const withOvertime = mine.filter(
        (a) => a.overtimeRequest?.requested === true,
      );
      setOvertimeRequests(withOvertime);
    } catch (err) {
      console.error("Attendance fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // ✅ Jab attendance load ho, aaj ki date auto-select karo
  useEffect(() => {
    if (eligibleForRequest.length > 0 && !selectedAttendance) {
      setSelectedAttendance(eligibleForRequest[0]);
    }
  }, [attendance]);

  const getUserId = () => {
    try {
      const token = getToken();
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.employeeId || payload.userId || null;
    } catch {
      return null;
    }
  };

  // Overtime request submit karo
  const handleSubmitRequest = async () => {
  if (!selectedAttendance) return;

  const minutes = Number(overtimeMinutes);

  if (!minutes || isNaN(minutes) || minutes <= 0) {
    setSubmitError("Overtime minutes must be greater than 0.");
    return;
  }

  setSubmitError('');
setSubmitSuccess('');

    const hrs = +(minutes / 60).toFixed(2);

    setSubmitting(selectedAttendance._id);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const res = await fetch(
        `${API}/attendance/${selectedAttendance._id}/overtime-request`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
  overtimeMinutes: minutes,
  overtimeNote: overtimeNote.trim() || `Worked ${minutes} extra minutes`,
}),
        },
      );

      const data = await res.json();

      if (data.success) {
        setSubmitSuccess(data.message);
        setShowForm(false);
        setOvertimeMinutes("");
        setOvertimeNote("");
        setSelectedAttendance(null);
        fetchAttendance();
      } else {
        setSubmitError(data.message || "Failed to submit overtime request.");
      }
    } catch (err) {
      setSubmitError("Server error. Please try again.");
    } finally {
      setSubmitting(null);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatTime = (t) =>
    t
      ? new Date(t).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const minsToHrs = (m) => {
    if (!m) return "0 min";
    const h = Math.floor(m / 60);
    const rem = m % 60;
    if (h === 0) return `${rem} min`;
    return rem === 0 ? `${h} hr` : `${h} hr ${rem} min`;
  };

  const statusStyle = (status) => {
    switch (status) {
      case "pending":
        return {
          bg: "rgba(245,158,11,0.1)",
          color: "#d97706",
          border: "rgba(245,158,11,0.3)",
          label: "⏳ Pending",
        };
      case "approved":
        return {
          bg: "rgba(16,185,129,0.1)",
          color: "#059669",
          border: "rgba(16,185,129,0.3)",
          label: "✅ Approved",
        };
      case "rejected":
        return {
          bg: "rgba(239,68,68,0.1)",
          color: "#dc2626",
          border: "rgba(239,68,68,0.3)",
          label: "❌ Rejected",
        };
      default:
        return {
          bg: "#f3f4f6",
          color: "#6b7280",
          border: "#e5e7eb",
          label: status,
        };
    }
  };

  const eligibleForRequest = attendance.filter(
  (a) =>
    (a.status === "present" ||
      a.status === "late" ||
      a.status === "half-day") &&
    a.clockIn &&
    (!a.overtimeRequest?.requested ||
      a.overtimeRequest?.status === "rejected"),
);

  return (
    <div className="employee-container">
      <EmployeeNavbar />
      <div style={S.content}>
        {/* Header */}
        <div style={S.pageHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>⏰</span>
            <div>
              <h1 style={S.pageTitle}>Overtime Requests</h1>
              <p style={S.pageSub}>
                No eligible attendance records found for overtime request.
              </p>
            </div>
          </div>
          <button
            style={S.newBtn}
            onClick={() => {
              setShowForm(true);
              setSubmitError("");
              setSubmitSuccess("");
            }}
          >
            + New Overtime Request
          </button>
        </div>

        {/* Success/Error */}
        {submitSuccess && (
          <div
            style={{
              ...S.alertBox,
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#065f46",
            }}
          >
            ✅ {submitSuccess}
          </div>
        )}

        {/* ── NEW REQUEST FORM ── */}
        {showForm && (
          <div style={S.formCard}>
            <div style={S.formTitle}>⏰ New Overtime Request</div>

            {/* Attendance select */}
            <div style={S.formGroup}>
              <label style={S.label}>📅 Attendance Date Select Karo</label>
              {eligibleForRequest.length === 0 ? (
                <div
                  style={{ color: "#9ca3af", fontSize: 13, padding: "10px 0" }}
                >
                  Koi eligible attendance nahi mili. (Aaj ka ya recent present
                  days dekhein)
                </div>
              ) : (
                <div style={S.dateList}>
                  {eligibleForRequest.slice(0, 14).map((a) => (
                    <button
                      key={a._id}
                      onClick={() => setSelectedAttendance(a)}
                      style={{
                        ...S.dateChip,
                        background:
                          selectedAttendance?._id === a._id
                            ? "#667eea"
                            : "white",
                        color:
                          selectedAttendance?._id === a._id
                            ? "white"
                            : "#374151",
                        border:
                          selectedAttendance?._id === a._id
                            ? "2px solid #667eea"
                            : "2px solid #e5e7eb",
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13 }}>
                        {formatDate(a.date)}
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.8 }}>
                        {formatTime(a.clockIn)} – {formatTime(a.clockOut)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected attendance ka detail */}
            {selectedAttendance && (
              <div style={S.selectedDetail}>
                <div
                  style={{ fontWeight: 600, color: "#374151", marginBottom: 6 }}
                >
                  ✅ Selected: {formatDate(selectedAttendance.date)}
                </div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  Clock In: {formatTime(selectedAttendance.clockIn)}{" "}
                  &nbsp;|&nbsp; Clock Out:{" "}
                  {formatTime(selectedAttendance.clockOut)} &nbsp;|&nbsp; Work
                  Hours: {selectedAttendance.workHours || 0} hrs
                </div>
              </div>
            )}

            {/* Overtime minutes input */}
            <div style={S.formGroup}>
              <label style={S.label}>
                📝 Note (optional) — kya kaam kiya extra time mein?
              </label>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 10,
                }}
              >
                {[30, 60, 90, 120].map((m) => (
                  <button
                    key={m}
                    onClick={() => setOvertimeMinutes(m)}
                    style={{
                      ...S.quickBtn,
                      background: overtimeMinutes === m ? "#667eea" : "#f3f4f6",
                      color: overtimeMinutes === m ? "white" : "#374151",
                    }}
                  >
                    {minsToHrs(m)}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={overtimeMinutes || ""}
                onChange={(e) => setOvertimeMinutes(Number(e.target.value))}
                style={S.input}
                min="1"
                max="480"
              />
              {overtimeMinutes > 0 && (
                <div style={{ fontSize: 12, color: "#667eea", marginTop: 6 }}>
                  = {minsToHrs(parseInt(overtimeMinutes))} overtime
                </div>
              )}
            </div>

            {/* Note */}
            <div style={S.formGroup}>
              <label style={S.label}>
                📝 Note (optional) — kya kaam kiya extra time mein?
              </label>
              <textarea
                placeholder="e.g. Project deadline ki wajah se extra time laga..."
                value={overtimeNote}
                onChange={(e) => setOvertimeNote(e.target.value)}
                style={{ ...S.input, height: 80, resize: "vertical" }}
              />
            </div>

            {submitError && (
              <div
                style={{
                  ...S.alertBox,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                }}
              >
                ⚠️ {submitError}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
                marginTop: 4,
              }}
            >
              <button
                style={{ ...S.newBtn, background: "#f3f4f6", color: "#374151" }}
                onClick={() => {
                  setShowForm(false);
                  setSubmitError("");
                }}
              >
                Cancel
              </button>
              <button
                style={{
                  ...S.newBtn,
                  opacity: !selectedAttendance || !overtimeMinutes ? 0.5 : 1,
                }}
                disabled={
                  !selectedAttendance || 
                  !overtimeMinutes ||
                  Number(overtimeMinutes) <= 0 ||
                  !!submitting
                }
                onClick={handleSubmitRequest}
              >
                {submitting ? "Submitting..." : "✅ Submit Request"}
              </button>
            </div>
          </div>
        )}

        {/* ── OVERTIME HISTORY ── */}
        <div style={S.sectionTitle}>📋 Overtime Request History</div>

        {loading ? (
          <div style={S.centerBox}>
            <div style={S.spinner} />
          </div>
        ) : overtimeRequests.length === 0 ? (
          <div style={S.emptyBox}>
            <div style={{ fontSize: 56, opacity: 0.3, marginBottom: 12 }}>
              ⏰
            </div>
            <h3 style={{ color: "#374151", margin: "0 0 8px" }}>
              No Overtime Requests
            </h3>
            <p style={{ color: "#9ca3af", fontSize: 14 }}>
              Your overtime requests will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {overtimeRequests.map((req) => {
              const st = statusStyle(req.overtimeStatus);
              return (
                <div key={req._id} style={S.reqCard}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={S.reqDate}>
                        📅 {formatDate(req.date)}
                        &nbsp;·&nbsp; {formatTime(req.clockIn)} –{" "}
                        {formatTime(req.clockOut)}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 16,
                          marginTop: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={S.infoBox}>
                          <div style={S.infoLabel}>Regular Hours</div>
                          <div style={S.infoVal}>{req.workHours || 0} hrs</div>
                        </div>
                        <div
                          style={{
                            ...S.infoBox,
                            background: "#fffbeb",
                            border: "1px solid #fde68a",
                          }}
                        >
                          <div style={S.infoLabel}>⏰ Overtime</div>
                          <div style={{ ...S.infoVal, color: "#d97706" }}>
                            {minsToHrs(req.overtimeMinutes)}
                          </div>
                        </div>
                        {req.overtimeStatus === "approved" && (
                          <div
                            style={{
                              ...S.infoBox,
                              background: "#ecfdf5",
                              border: "1px solid #a7f3d0",
                            }}
                          >
                            <div style={S.infoLabel}>✅ Total</div>
                            <div style={{ ...S.infoVal, color: "#059669" }}>
                              {(
                                (req.workHours || 0) + (req.overtimeHours || 0)
                              ).toFixed(1)}{" "}
                              hrs
                            </div>
                          </div>
                        )}
                      </div>

                      {req.overtimeNote && (
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 13,
                            color: "#6b7280",
                          }}
                        >
                          📝 {req.overtimeNote}
                        </div>
                      )}

                      {req.overtimeStatus === "rejected" &&
                        req.overtimeRejectionNote && (
                          <div
                            style={{
                              marginTop: 8,
                              padding: "8px 12px",
                              background: "#fef2f2",
                              borderRadius: 8,
                              fontSize: 13,
                              color: "#dc2626",
                              border: "1px solid #fecaca",
                            }}
                          >
                            ❌ Rejection Reason: {req.overtimeRejectionNote}
                          </div>
                        )}

                      {req.overtimeRequestedByEmployee ? (
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 12,
                            color: "#9ca3af",
                          }}
                        >
                          Requested by you ·{" "}
                          {req.overtimeRequestedAt
                            ? formatDate(req.overtimeRequestedAt)
                            : ""}
                        </div>
                      ) : (
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 12,
                            color: "#9ca3af",
                          }}
                        >
                          Admin/Manager ne directly set kiya
                        </div>
                      )}
                    </div>

                    <span
                      style={{
                        padding: "6px 16px",
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 700,
                        background: st.bg,
                        color: st.color,
                        border: `1px solid ${st.border}`,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  content: {
    padding: 24,
    background: "#f9fafb",
    minHeight: "calc(100vh - 80px)",
    maxWidth: 900,
    margin: "0 auto",
  },
  pageHeader: {
    background: "white",
    borderRadius: 16,
    padding: "20px 28px",
    marginBottom: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 700,
    background: "linear-gradient(135deg,#667eea,#764ba2)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    margin: "0 0 4px 0",
  },
  pageSub: { fontSize: 14, color: "#6b7280", margin: 0 },
  newBtn: {
    padding: "10px 20px",
    background: "linear-gradient(135deg,#667eea,#764ba2)",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  alertBox: {
    padding: "12px 16px",
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 14,
  },
  formCard: {
    background: "white",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
  },
  formTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 20,
  },
  formGroup: { marginBottom: 18 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    border: "2px solid #e5e7eb",
    borderRadius: 10,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  dateList: { display: "flex", flexWrap: "wrap", gap: 8 },
  dateChip: {
    padding: "8px 14px",
    borderRadius: 10,
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "left",
  },
  quickBtn: {
    padding: "6px 14px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  selectedDetail: {
    background: "#f0f4ff",
    border: "1px solid #c7d2fe",
    borderRadius: 10,
    padding: "12px 16px",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 14,
    marginTop: 4,
  },
  centerBox: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "60px 20px",
  },
  spinner: {
    width: 36,
    height: 36,
    border: "3px solid #f3f3f3",
    borderTop: "3px solid #667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  emptyBox: {
    textAlign: "center",
    padding: "60px 20px",
    background: "white",
    borderRadius: 16,
  },
  reqCard: {
    background: "white",
    borderRadius: 12,
    padding: "18px 20px",
    border: "1px solid #e5e7eb",
  },
  reqDate: { fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 },
  infoBox: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "8px 14px",
    minWidth: 90,
  },
  infoLabel: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: 600,
    marginBottom: 2,
  },
  infoVal: { fontSize: 16, fontWeight: 700, color: "#111827" },
};

export default OvertimeRequest;
