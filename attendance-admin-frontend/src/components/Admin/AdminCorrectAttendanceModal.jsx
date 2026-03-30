import React, { useState } from "react";
import adminService from "../../services/adminService";

const AdminCorrectAttendanceModal = ({ record, onClose, onCorrected }) => {
  const [status, setStatus] = useState("present");
  const [clockIn, setClockIn] = useState("10:00");
  const [clockOut, setClockOut] = useState("19:00");
  const [correctionReason, setCorrectionReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!correctionReason.trim()) {
      setError("Correction reason likhna zaroori hai.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // Date + time combine karo
      const dateStr = record.date; // "2026-03-30" format
      const clockInDateTime = dateStr
        ? new Date(`${dateStr}T${clockIn}:00`)
        : null;
      const clockOutDateTime = dateStr
        ? new Date(`${dateStr}T${clockOut}:00`)
        : null;

      const payload = {
        status,
        correctionReason,
        remarks,
        ...(clockIn && { clockIn: clockInDateTime }),
        ...(clockOut && { clockOut: clockOutDateTime }),
      };

      const response = await adminService.correctAttendance(
        record.id,
        payload
      );

      if (response.success) {
        onCorrected();
      } else {
        setError(response.message || "Correction failed.");
      }
    } catch (err) {
      setError("Server error. Dobara try karein.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>✏️ Correct Attendance</h2>
            <p style={styles.subtitle}>
              {record.employeeName} — {record.employeeId}
            </p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Current Status Badge */}
        <div style={styles.currentStatus}>
          <span style={styles.currentLabel}>Current Status:</span>
          <span style={{
            ...styles.badge,
            background: record.status === "absent" ? "#fee2e2" : "#e0e7ff",
            color: record.status === "absent" ? "#dc2626" : "#4338ca",
          }}>
            {record.status?.toUpperCase()}
          </span>
          <span style={styles.arrow}>→</span>
          <span style={styles.currentLabel}>Correct To:</span>
        </div>

        {/* New Status Select */}
        <div style={styles.field}>
          <label style={styles.label}>New Status *</label>
          <div style={styles.statusGrid}>
            {["present", "half-day", "on-leave", "holiday"].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                style={{
                  ...styles.statusBtn,
                  ...(status === s ? styles.statusBtnActive : {}),
                }}
              >
                {s === "present" && "✅ Present"}
                {s === "half-day" && "🌗 Half Day"}
                {s === "on-leave" && "🏖️ On Leave"}
                {s === "holiday" && "🎉 Holiday"}
              </button>
            ))}
          </div>
        </div>

        {/* Clock In / Out — sirf present ya half-day pe dikhao */}
        {(status === "present" || status === "half-day") && (
          <div style={styles.timeRow}>
            <div style={styles.field}>
              <label style={styles.label}>Clock In Time</label>
              <input
                type="time"
                value={clockIn}
                onChange={(e) => setClockIn(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Clock Out Time</label>
              <input
                type="time"
                value={clockOut}
                onChange={(e) => setClockOut(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>
        )}

        {/* Correction Reason */}
        <div style={styles.field}>
          <label style={styles.label}>Correction Reason * <span style={styles.required}>(Employee ko dikhega)</span></label>
          <textarea
            placeholder="Maslan: System error ki wajah se absent mark hua, asal mein present tha..."
            value={correctionReason}
            onChange={(e) => setCorrectionReason(e.target.value)}
            rows={3}
            style={styles.textarea}
          />
        </div>

        {/* Remarks */}
        <div style={styles.field}>
          <label style={styles.label}>Additional Remarks (Optional)</label>
          <input
            type="text"
            placeholder="Koi extra note..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            style={styles.input}
          />
        </div>

        {/* Error */}
        {error && <div style={styles.error}>⚠️ {error}</div>}

        {/* Buttons */}
        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : "✅ Save Correction"}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
    zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
    padding: "16px",
  },
  modal: {
    background: "#fff", borderRadius: "16px", padding: "28px",
    width: "100%", maxWidth: "520px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    maxHeight: "90vh", overflowY: "auto",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: "20px",
  },
  title: { margin: 0, fontSize: "20px", fontWeight: "700", color: "#1e293b" },
  subtitle: { margin: "4px 0 0", fontSize: "13px", color: "#64748b" },
  closeBtn: {
    background: "#f1f5f9", border: "none", borderRadius: "8px",
    width: "32px", height: "32px", cursor: "pointer", fontSize: "14px",
    color: "#64748b", fontWeight: "600",
  },
  currentStatus: {
    display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap",
    background: "#f8fafc", borderRadius: "10px", padding: "12px 16px",
    marginBottom: "20px",
  },
  currentLabel: { fontSize: "13px", color: "#64748b", fontWeight: "600" },
  badge: {
    padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700",
  },
  arrow: { fontSize: "16px", color: "#94a3b8" },
  field: { marginBottom: "16px" },
  label: { display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "8px" },
  required: { fontWeight: "400", color: "#94a3b8", fontSize: "12px" },
  statusGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" },
  statusBtn: {
    padding: "10px", borderRadius: "8px", border: "2px solid #e2e8f0",
    background: "#f8fafc", cursor: "pointer", fontSize: "13px", fontWeight: "500",
    color: "#475569", transition: "all 0.2s",
  },
  statusBtnActive: {
    border: "2px solid #667eea", background: "#ede9fe", color: "#4338ca", fontWeight: "700",
  },
  timeRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  input: {
    width: "100%", padding: "10px 12px", borderRadius: "8px",
    border: "1px solid #e2e8f0", fontSize: "14px", color: "#1e293b",
    outline: "none", boxSizing: "border-box",
  },
  textarea: {
    width: "100%", padding: "10px 12px", borderRadius: "8px",
    border: "1px solid #e2e8f0", fontSize: "14px", color: "#1e293b",
    outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit",
  },
  error: {
    background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px",
    padding: "10px 14px", color: "#dc2626", fontSize: "13px", marginBottom: "16px",
  },
  actions: { display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" },
  cancelBtn: {
    padding: "10px 20px", borderRadius: "8px", border: "1px solid #e2e8f0",
    background: "#f8fafc", color: "#64748b", cursor: "pointer", fontSize: "14px", fontWeight: "600",
  },
  submitBtn: {
    padding: "10px 24px", borderRadius: "8px", border: "none",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white", cursor: "pointer", fontSize: "14px", fontWeight: "700",
    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.35)",
  },
};

export default AdminCorrectAttendanceModal;