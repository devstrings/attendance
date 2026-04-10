import React from 'react';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const SalarySlip = ({ summary }) => {
  const handlePrint = () => {
    const content = document.getElementById(`salary-slip-${summary._id}`);
    if (!content) return;

    const win = window.open('', '_blank', 'height=750,width=900');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Salary Slip - ${MONTH_NAMES[summary.month - 1]} ${summary.year}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          .slip-header { text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #667eea; }
          .slip-header h1 { font-size: 22px; color: #667eea; margin-bottom: 4px; }
          .slip-header h2 { font-size: 16px; color: #374151; font-weight: 500; }
          .slip-header p { font-size: 13px; color: #6b7280; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px 16px; border: 1px solid #e5e7eb; font-size: 14px; }
          th { background: #f9fafb; text-align: left; color: #374151; font-weight: 600; }
          td { color: #111827; }
          td:last-child { text-align: right; }
          .deduct-row { background: #fff5f5; }
          .deduct-row td { color: #dc2626; font-weight: 600; }
          .net-row { background: #f0fdf4; }
          .net-row td { color: #059669; font-weight: 700; font-size: 15px; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          .footer p { font-size: 12px; color: #9ca3af; }
          .generated { font-size: 12px; color: #9ca3af; text-align: right; margin-top: 16px; }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 300);
  };

  return (
    <div style={styles.wrapper}>
      {/* Print Button */}
      <div style={styles.printButtonArea}>
        <button onClick={handlePrint} style={styles.printBtn}>
          🖨️ Print / Download Salary Slip
        </button>
      </div>

      {/* Hidden Printable Content */}
      <div id={`salary-slip-${summary._id}`} style={{ display: 'none' }}>
        <div className="slip-header">
          <h1>Devstrings Attendance System</h1>
          <h2>Salary Slip — {MONTH_NAMES[summary.month - 1]} {summary.year}</h2>
          <p>Generated on: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Working Days</td>
              <td>{summary.totalWorkingDays} days</td>
            </tr>
            <tr>
              <td>Days Present</td>
              <td>{summary.totalPresent} days</td>
            </tr>
            <tr>
              <td>Approved Leaves</td>
              <td>{summary.totalApprovedLeaves} days</td>
            </tr>
            <tr>
              <td>Unauthorized Absences</td>
              <td>{summary.totalUnauthorizedAbsences} days</td>
            </tr>
            <tr>
              <td>Deduction per Absence</td>
              <td>Rs. {summary.deductionPerAbsence}</td>
            </tr>
            <tr>
              <td>Base Salary</td>
              <td>Rs. {(summary.baseSalary || 0).toLocaleString()}</td>
            </tr>
            <tr className="deduct-row">
              <td>Total Deduction ({summary.totalUnauthorizedAbsences} × Rs. {summary.deductionPerAbsence})</td>
              <td>− Rs. {(summary.totalDeduction || 0).toLocaleString()}</td>
            </tr>
            <tr className="net-row">
              <td>Net Salary Payable</td>
              <td>Rs. {(summary.netSalary || 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div className="footer">
          <p>This is a system-generated salary slip. For queries, contact HR.</p>
          <p>Devstrings Attendance Management System</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    padding: '16px 24px 24px',
  },
  printButtonArea: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  printBtn: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
  },
};

export default SalarySlip;