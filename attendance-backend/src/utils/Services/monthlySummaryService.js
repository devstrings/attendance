const MonthlySummary = require("../../models/MonthlySummary");
const Employee = require("../../models/Employee");
const Attendance = require("../../models/Attendance");
const LeaveRequest = require("../../models/LeaveRequest");
const SystemConfig = require("../../models/SystemConfig");
const notificationService = require("./notificationService");
const emailService = require("./emailService");

// Helper: working days in a month (Mon-Fri)
function getWorkingDays(year, month) {
  let count = 0;
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) count++;
    date.setDate(date.getDate() + 1);
  }
  return count;
}

// Main: generate summary for all employees for given month/year
async function generateMonthlySummaries(month, year) {
  const config = await SystemConfig.findOne();
  const deductionPerAbsence = config?.absenceDeductionAmount || 500;

  const employees = await Employee.find({ role: "employee", isActive: true });

  for (const emp of employees) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // last day of month
    const totalWorkingDays = getWorkingDays(year, month);

    // Count present days
    const presentDocs = await Attendance.find({
      employeeId: emp._id,
      date: { $gte: startDate, $lte: endDate },
      status: "present",
    });
    const totalPresent = presentDocs.length;

    // Overtime hours calculate karo (approved only)
    const overtimeAttendances = await Attendance.find({
      employeeId: emp._id,
      date: { $gte: startDate, $lte: endDate },
      overtimeStatus: "approved",
      overtimeHours: { $gt: 0 },
    });
    const totalOvertimeHours = overtimeAttendances.reduce(
      (sum, a) => sum + (a.overtimeHours || 0),
      0,
    );
    const absencesCoveredByOvertime = Math.floor(totalOvertimeHours / 8);

    // Count approved leaves
    const approvedLeaves = await LeaveRequest.find({
      employeeId: emp._id,
      status: "approved",
      $or: [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } },
      ],
    });
    let totalApprovedLeaves = 0;
    for (const lv of approvedLeaves) {
      const s = lv.startDate < startDate ? startDate : lv.startDate;
      const e = lv.endDate > endDate ? endDate : lv.endDate;
      const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
      totalApprovedLeaves += diff;
    }

    const rawAbsences = Math.max(
  0,
  totalWorkingDays - totalPresent - totalApprovedLeaves
);
const totalUnauthorizedAbsences = Math.max(
  0,
  rawAbsences - absencesCoveredByOvertime
);

    const totalDeduction = totalUnauthorizedAbsences * deductionPerAbsence;
    const baseSalary = emp.salary || 0;
    const netSalary = Math.max(0, baseSalary - totalDeduction);

    // Upsert
    await MonthlySummary.findOneAndUpdate(
      { employeeId: emp._id, month, year },
      {
        employeeId: emp._id,
        managerId: emp.managerId || null,
        month,
        year,
        totalWorkingDays,
        totalPresent,
        totalApprovedLeaves,
        totalUnauthorizedAbsences,
        deductionPerAbsence,
        totalDeduction,
        baseSalary,
        netSalary,
        salarySlipGenerated: true,
        totalOvertimeHours,
absencesCoveredByOvertime,
      },
      { upsert: true, new: true },
    );
  }

  console.log(`✅ Monthly summaries generated for ${month}/${year}`);
}

// Send emails + notifications
async function sendMonthlySummaryEmails(month, year, isLastDay = false) {
  const summaries = await MonthlySummary.find({ month, year })
    .populate("employeeId", "firstName lastName email salary managerId")
    .populate("managerId", "name email");

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthLabel = `${monthNames[month - 1]} ${year}`;

  for (const summary of summaries) {
    const emp = summary.employeeId;
    if (!emp) continue;

    // Email to employee
    await emailService.sendMonthlySummaryEmail({
      toEmail: emp.email,
      toName: emp.name,
      monthLabel,
      summary,
      role: "employee",
    });

    // Email to manager
    if (summary.managerId) {
      await emailService.sendMonthlySummaryEmail({
        toEmail: summary.managerId.email,
        toName: summary.managerId.name,
        monthLabel,
        summary,
        employeeName: emp.name,
        role: "manager",
      });
    }

    // Bell notification — employee
    await notificationService.createNotification({
      userId: emp._id,
      title: `📊 ${monthLabel} Attendance Summary`,
      message: `Aapki ${monthLabel} ki summary ready hai. Unauthorized absences: ${summary.totalUnauthorizedAbsences}, Deduction: Rs.${summary.totalDeduction}`,
      type: "monthly_summary",
    });

    // Bell notification — manager
    if (summary.managerId) {
      await notificationService.createNotification({
        userId: summary.managerId._id,
        title: `📊 ${emp.name} — ${monthLabel} Summary`,
        message: `${emp.name} ki ${monthLabel} summary: Absences: ${summary.totalUnauthorizedAbsences}, Deduction: Rs.${summary.totalDeduction}`,
        type: "monthly_summary",
      });
    }

    // Update flags
    if (isLastDay) {
      await MonthlySummary.findByIdAndUpdate(summary._id, {
        emailSentLastDay: true,
      });
    } else {
      await MonthlySummary.findByIdAndUpdate(summary._id, {
        emailSentFirstDay: true,
      });
    }
  }

  console.log(`📧 Summary emails sent for ${month}/${year}`);
}

module.exports = { generateMonthlySummaries, sendMonthlySummaryEmails };
