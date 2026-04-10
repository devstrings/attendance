import React, { useState, useEffect } from "react";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import api from "../../services/api";
import "../../styles/Admin.css";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// Generate last 12 months list
const getLast12Months = () => {
  const now = new Date();
  const months = [];
  for (let i = 0; i < 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }
  return months;
};

const AdminMonthlySummary = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [employees, setEmployees] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");

  const last12 = getLast12Months();

  useEffect(() => { fetchEmployees(); }, []);
  useEffect(() => { fetchSummaries(); }, [month, year]);

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/admin/employees");
      if (res.data.success) {
        setEmployees(res.data.data?.employees || res.data.employees || []);
      }
    } catch (err) { console.error("Employees fetch error:", err); }
  };

  const fetchSummaries = async () => {
  setLoading(true);
  try {
    // Pehle saved summaries try karo
    const res = await api.get(`/monthly-summary/admin/${month}/${year}`);
    if (res.data.success && res.data.summaries?.length > 0) {
      setSummaries(res.data.summaries);
    } else {
      // Agar saved nahi — live preview lo
      const preview = await api.get(`/monthly-summary/admin/preview/${month}/${year}`);
      if (preview.data.success) setSummaries(preview.data.summaries || []);
      else setSummaries([]);
    }
  } catch (err) { setSummaries([]); }
  finally { setLoading(false); }
};

  const handleGenerate = async () => {
    if (!window.confirm(`Generate summary for ${MONTH_NAMES[month - 1]} ${year}?\nThis will calculate deductions and send emails.`)) return;
    setGenerating(true); setMsg("");
    try {
      const res = await api.post("/monthly-summary/admin/trigger", { month, year });
      if (res.data.success) {
        setMsg("Summary generated & emails sent!");
        setMsgType("success");
        fetchSummaries();
      }
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to generate");
      setMsgType("error");
    } finally { setGenerating(false); }
  };

  const getSummary = (empId) =>
    summaries.find((s) => s.employeeId?._id === empId || s.employeeId === empId);

  const totalDeductions = summaries.reduce((a, x) => a + (x.totalDeduction || 0), 0);
  const totalNetSalary  = summaries.reduce((a, x) => a + (x.netSalary || 0), 0);
  const totalAbsences   = summaries.reduce((a, x) => a + (x.totalUnauthorizedAbsences || 0), 0);

  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  return (
    <div className="admin-container">
      <AdminNavbar />
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content" style={{ padding: 24, background: "#f9fafb", minHeight: "100vh" }}>

          {/* Header */}
          <div style={s.header}>
            <div>
              <h1 style={s.title}>📊 Monthly Attendance Summary</h1>
              <p style={s.subtitle}>Employee wise attendance, deductions & salary slips</p>
            </div>
            <button onClick={handleGenerate} disabled={generating}
              style={{ ...s.genBtn, opacity: generating ? 0.7 : 1 }}>
              {generating ? "⏳ Generating..." : "⚡ Generate & Send Emails"}
            </button>
          </div>

          {/* Month Tabs — last 12 months */}
          <div style={s.tabsWrapper}>
            <div style={s.tabs}>
              {last12.map((m, i) => {
                const isActive = m.month === month && m.year === year;
                return (
                  <button key={i}
                    onClick={() => { setMonth(m.month); setYear(m.year); }}
                    style={{ ...s.tab, ...(isActive ? s.tabActive : {}) }}>
                    {MONTH_NAMES[m.month - 1].slice(0, 3)} {m.year}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stats Bar */}
          <div style={s.statsBar}>
            <div style={s.statCard}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#ef4444" }}>{totalAbsences}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Total Absences</div>
            </div>
            <div style={s.statCard}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#f59e0b" }}>Rs. {totalDeductions.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Total Deducted</div>
            </div>
            <div style={s.statCard}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981" }}>Rs. {totalNetSalary.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Total Net Salary</div>
            </div>
            <div style={s.statCard}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#6366f1" }}>
                {summaries.filter(s => s.salarySlipGenerated).length}/{employees.length}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Summaries Generated</div>
            </div>
          </div>

          {/* Message */}
          {msg && (
            <div style={{
              padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontWeight: 600, fontSize: 14,
              background: msgType === "success" ? "#d1fae5" : "#fee2e2",
              color: msgType === "success" ? "#065f46" : "#991b1b",
            }}>
              {msgType === "success" ? "✅ " : "❌ "}{msg}
            </div>
          )}

          {/* Employee Table */}
          <div style={s.card}>
            <div style={s.cardHead}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                👥 {MONTH_NAMES[month - 1]} {year} — All Employees
              </h3>
              <span style={s.purpleBadge}>{employees.length} employees</span>
              {!isCurrentMonth && (
                <span style={s.historyBadge}>📁 History Record</span>
              )}
            </div>

            {loading ? (
              <div style={s.center}>⏳ Loading summaries...</div>
            ) : employees.length === 0 ? (
              <div style={s.center}>No employees found</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={s.table}>
                  <thead>
                    <tr style={{ background: "#f9fafb" }}>
                      {["Employee","Department","Base Salary","Absences","Overtime","Deduction","Net Salary","Status","Detail"].map((h) => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp, i) => {
                      const summary = getSummary(emp._id);
                      const has = !!summary;
                      return (
                        <tr key={emp._id}
                          style={{ background: i % 2 === 0 ? "white" : "#fafafa", cursor: "pointer" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "white" : "#fafafa")}
                          onClick={() => setSelected({ emp, summary })}>

                          {/* Employee */}
                          <td style={s.td}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={s.avatar}>{(emp.firstName || "?").charAt(0).toUpperCase()}</div>
                              <div>
                                <div style={{ fontWeight: 600 }}>{emp.firstName} {emp.lastName}</div>
                                <div style={{ fontSize: 12, color: "#9ca3af" }}>{emp.employeeCode}</div>
                              </div>
                            </div>
                          </td>

                          {/* Department */}
                          <td style={s.td}>{emp.department || "—"}</td>

                          {/* Base Salary */}
                          <td style={s.td}>Rs. {(emp.salary || 0).toLocaleString()}</td>

                          {/* Absences */}
                          <td style={s.td}>
                            {has ? (
                              <span style={{
                                background: summary.totalUnauthorizedAbsences > 0 ? "#fee2e2" : "#d1fae5",
                                color: summary.totalUnauthorizedAbsences > 0 ? "#dc2626" : "#059669",
                                padding: "2px 10px", borderRadius: 20, fontWeight: 700, fontSize: 13,
                              }}>
                                {summary.totalUnauthorizedAbsences}
                              </span>
                            ) : <span style={{ color: "#d1d5db" }}>—</span>}
                          </td>

                          {/* Overtime */}
                          <td style={s.td}>
                            {has ? (
                              <span style={{
                                background: "#eff6ff", color: "#3b82f6",
                                padding: "2px 10px", borderRadius: 20, fontWeight: 700, fontSize: 13,
                              }}>
                                {(summary.totalOvertimeHours || 0).toFixed(1)}h
                                {summary.absencesCoveredByOvertime > 0 && (
                                  <span style={{ color: "#10b981", marginLeft: 4 }}>
                                    (-{summary.absencesCoveredByOvertime} abs)
                                  </span>
                                )}
                              </span>
                            ) : <span style={{ color: "#d1d5db" }}>—</span>}
                          </td>

                          {/* Deduction */}
                          <td style={s.td}>
                            {has ? (
                              <span style={{ color: "#ef4444", fontWeight: 600 }}>
                                Rs. {(summary.totalDeduction || 0).toLocaleString()}
                              </span>
                            ) : <span style={{ color: "#d1d5db" }}>—</span>}
                          </td>

                          {/* Net Salary */}
                          <td style={s.td}>
                            {has ? (
                              <span style={{ color: "#059669", fontWeight: 700 }}>
                                Rs. {(summary.netSalary || 0).toLocaleString()}
                              </span>
                            ) : <span style={{ color: "#d1d5db" }}>—</span>}
                          </td>

                          {/* Status */}
                          <td style={s.td}>
                            {has ? (
                              <span style={s.greenBadge}>✅ Generated</span>
                            ) : (
                              <span style={s.grayBadge}>⏳ Pending</span>
                            )}
                          </td>

                          {/* Detail */}
                          <td style={s.td}>
                            <button onClick={(e) => { e.stopPropagation(); setSelected({ emp, summary }); }}
                              style={s.viewBtn}>👁️ View</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {selected && (
        <DetailModal emp={selected.emp} summary={selected.summary}
          month={month} year={year} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};

// ===== DETAIL MODAL =====
const DetailModal = ({ emp, summary, month, year, onClose }) => {
  const has = !!summary;

  const handlePrint = () => {
    const el = document.getElementById("slip-print-area");
    if (!el) return;
    const win = window.open("", "_blank", "height=750,width=900");
    win.document.write(`<!DOCTYPE html><html><head><title>Salary Slip</title>
    <style>
      body{font-family:Arial,sans-serif;padding:40px;color:#333}
      .top{text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #667eea}
      h1{color:#667eea;margin:0 0 4px}h2{margin:0 0 4px;font-weight:500;color:#374151}
      p{margin:2px 0;color:#9ca3af;font-size:13px}
      table{width:100%;border-collapse:collapse;margin:20px 0}
      th,td{padding:12px 16px;border:1px solid #e5e7eb;font-size:14px}
      th{background:#f9fafb;text-align:left}td:last-child{text-align:right}
      .red td{background:#fff5f5;color:#dc2626;font-weight:700}
      .grn td{background:#f0fdf4;color:#059669;font-weight:700;font-size:15px}
      .foot{text-align:center;margin-top:30px;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb;padding-top:14px}
    </style></head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={m.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={m.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={m.avt}>{(emp.firstName || "?").charAt(0).toUpperCase()}</div>
            <div>
              <div style={m.name}>{emp.firstName} {emp.lastName}</div>
              <div style={m.meta}>{emp.employeeCode} • {emp.department} • {emp.designation}</div>
            </div>
          </div>
          <button onClick={onClose} style={m.xBtn}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          {!has ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#6b7280" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <h3 style={{ color: "#374151" }}>No Summary Yet</h3>
              <p>{MONTH_NAMES[month - 1]} {year} ki summary generate nahi hui abhi.</p>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div style={m.grid}>
                {[
                  { n: summary.totalWorkingDays,          l: "📅 Working Days", c: "#3b82f6" },
                  { n: summary.totalPresent,              l: "✅ Present",       c: "#10b981" },
                  { n: summary.totalApprovedLeaves,       l: "🏖️ Leaves",       c: "#6366f1" },
                  { n: summary.totalUnauthorizedAbsences, l: "❌ Unauthorized",  c: "#ef4444" },
                  { n: `${(summary.totalOvertimeHours || 0).toFixed(1)}h`, l: "⏰ Overtime", c: "#f59e0b" },
                ].map((x, i) => (
                  <div key={i} style={{ ...m.statBox, borderTop: `3px solid ${x.c}` }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: x.c, marginBottom: 4 }}>{x.n}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{x.l}</div>
                  </div>
                ))}
              </div>

              {/* Salary Breakdown */}
              <h4 style={{ fontSize: 15, fontWeight: 700, color: "#374151", margin: "16px 0 12px" }}>
                💰 Salary Breakdown
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {[
                  { l: "Base Salary",            v: `Rs. ${(emp.salary || 0).toLocaleString()}` },
                  { l: "Deduction per Absence",  v: `Rs. ${summary.deductionPerAbsence}` },
                  { l: "Unauthorized Absences",  v: `${summary.totalUnauthorizedAbsences} days` },
                  { l: "Overtime Hours",         v: `${(summary.totalOvertimeHours || 0).toFixed(1)} hrs` },
                  { l: "Absences Covered by OT", v: `${summary.absencesCoveredByOvertime || 0} days` },
                ].map((r, i) => (
                  <div key={i} style={m.row}>
                    <span style={{ color: "#6b7280", fontSize: 14 }}>{r.l}</span>
                    <span style={{ fontWeight: 600 }}>{r.v}</span>
                  </div>
                ))}
                <div style={{ ...m.row, background: "#fff5f5", borderRadius: 8, padding: "10px 12px" }}>
                  <span style={{ color: "#dc2626", fontWeight: 600 }}>Total Deduction</span>
                  <span style={{ color: "#dc2626", fontWeight: 700 }}>− Rs. {(summary.totalDeduction || 0).toLocaleString()}</span>
                </div>
                <div style={{ ...m.row, background: "#f0fdf4", borderRadius: 8, padding: "12px", border: "1px solid #bbf7d0" }}>
                  <span style={{ color: "#059669", fontWeight: 700, fontSize: 16 }}>Net Salary</span>
                  <span style={{ color: "#059669", fontWeight: 700, fontSize: 18 }}>Rs. {(summary.netSalary || 0).toLocaleString()}</span>
                </div>
              </div>

              <button onClick={handlePrint} style={m.printBtn}>🖨️ Print Salary Slip</button>

              {/* Hidden Print Area */}
              <div id="slip-print-area" style={{ display: "none" }}>
                <div className="top">
                  <h1>Devstrings Attendance System</h1>
                  <h2>Salary Slip — {MONTH_NAMES[month - 1]} {year}</h2>
                  <p>Employee: {emp.firstName} {emp.lastName} ({emp.employeeCode}) | Dept: {emp.department}</p>
                  <p>Generated: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
                </div>
                <table>
                  <thead><tr><th>Description</th><th style={{ textAlign: "right" }}>Value</th></tr></thead>
                  <tbody>
                    <tr><td>Total Working Days</td><td>{summary.totalWorkingDays} days</td></tr>
                    <tr><td>Days Present</td><td>{summary.totalPresent} days</td></tr>
                    <tr><td>Approved Leaves</td><td>{summary.totalApprovedLeaves} days</td></tr>
                    <tr><td>Unauthorized Absences</td><td>{summary.totalUnauthorizedAbsences} days</td></tr>
                    <tr><td>Overtime Hours</td><td>{(summary.totalOvertimeHours || 0).toFixed(1)} hrs</td></tr>
                    <tr><td>Absences Covered by Overtime</td><td>{summary.absencesCoveredByOvertime || 0} days</td></tr>
                    <tr><td>Deduction per Absence</td><td>Rs. {summary.deductionPerAbsence}</td></tr>
                    <tr><td>Base Salary</td><td>Rs. {(emp.salary || 0).toLocaleString()}</td></tr>
                    <tr className="red"><td>Total Deduction</td><td>− Rs. {(summary.totalDeduction || 0).toLocaleString()}</td></tr>
                    <tr className="grn"><td>Net Salary Payable</td><td>Rs. {(summary.netSalary || 0).toLocaleString()}</td></tr>
                  </tbody>
                </table>
                <div className="foot">
                  <p>System-generated salary slip. For queries, contact HR.</p>
                  <p>Devstrings Attendance Management System</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const s = {
  header: { background: "white", borderRadius: 16, padding: "20px 24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 },
  title: { fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px 0" },
  subtitle: { fontSize: 14, color: "#6b7280", margin: 0 },
  genBtn: { padding: "12px 24px", background: "linear-gradient(135deg,#10b981,#059669)", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  tabsWrapper: { background: "white", borderRadius: 12, padding: "12px 16px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" },
  tabs: { display: "flex", gap: 8, minWidth: "max-content" },
  tab: { padding: "7px 14px", border: "2px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "white", color: "#6b7280", whiteSpace: "nowrap" },
  tabActive: { background: "linear-gradient(135deg,#667eea,#764ba2)", color: "white", border: "2px solid transparent" },
  statsBar: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 },
  statCard: { background: "white", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  filterBar: { background: "white", borderRadius: 12, padding: "14px 20px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" },
  fg: { display: "flex", flexDirection: "column", gap: 4 },
  fl: { fontSize: 12, fontWeight: 600, color: "#6b7280" },
  sel: { padding: "8px 12px", border: "2px solid #e5e7eb", borderRadius: 8, fontSize: 14, background: "white" },
  refreshBtn: { padding: "8px 18px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" },
  card: { background: "white", borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" },
  cardHead: { padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12 },
  purpleBadge: { background: "#ede9fe", color: "#7c3aed", fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 20 },
  historyBadge: { background: "#fef3c7", color: "#92400e", fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 20 },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 900 },
  th: { padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb" },
  td: { padding: "12px 16px", fontSize: 14, color: "#111827", borderBottom: "1px solid #f3f4f6" },
  avatar: { width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 },
  greenBadge: { background: "#d1fae5", color: "#065f46", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  grayBadge: { background: "#f3f4f6", color: "#6b7280", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  viewBtn: { padding: "6px 14px", background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  center: { padding: "40px", textAlign: "center", color: "#6b7280" },
};

const m = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal: { background: "white", borderRadius: 16, width: "100%", maxWidth: 620, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" },
  header: { background: "linear-gradient(135deg,#667eea,#764ba2)", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  avt: { width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.2)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 20 },
  name: { color: "white", fontWeight: 700, fontSize: 18 },
  meta: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },
  xBtn: { background: "rgba(255,255,255,0.2)", border: "none", color: "white", width: 32, height: 32, borderRadius: "50%", fontSize: 16, cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 20 },
  statBox: { background: "#f9fafb", borderRadius: 10, padding: "14px 10px", textAlign: "center" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3f4f6" },
  printBtn: { width: "100%", padding: "12px", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" },
};

export default AdminMonthlySummary;