const MonthlySummary = require("../../models/MonthlySummary");
const Employee = require("../../models/Employee");
const Attendance = require("../../models/Attendance");
const LeaveRequest = require("../../models/LeaveRequest");
const SystemConfig = require("../../models/SystemConfig");
const notificationService = require("./notificationService");
const emailService = require("./emailService");

// NAYA — weekends + holidays DB se:
async function getWorkingDaysWithConfig(startDate, endDate) {
  const config = await SystemConfig.findOne({ isActive: true });
  const weekendDays = config?.weekendDays || ['Saturday', 'Sunday'];
  
  const holidays = await require('../../models/Holiday').find({
    date: { $gte: startDate, $lte: endDate }
  });
  const holidaySet = new Set(holidays.map(h => new Date(h.date).toDateString()));
  
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  let count = 0;
  const cursor = new Date(startDate);
  cursor.setHours(0,0,0,0);
  const end = new Date(endDate);
  end.setHours(23,59,59,999);
  
  while (cursor <= end) {
    const dayName = dayNames[cursor.getDay()];
    if (!weekendDays.includes(dayName) && !holidaySet.has(cursor.toDateString())) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

// Main: generate summary for all employees for given month/year
async function generateMonthlySummaries(month, year) {
  const config = await SystemConfig.findOne();
  const deductionPerAbsence = config?.absenceDeductionAmount || 500;

 const employees = await Employee.find({ isActive: true });

  for (const emp of employees) {
    const monthStart = new Date(year, month - 1, 1);
    const now = new Date();
    const isCurrentMonth = now.getMonth() + 1 === month && now.getFullYear() === year;
    const monthEnd = isCurrentMonth ? now : new Date(year, month, 0);

    // Joining date logic
    const joiningDate = emp.joiningDate ? new Date(emp.joiningDate) : null;
    const startDate = joiningDate && joiningDate > monthStart ? joiningDate : monthStart;
    const endDate = monthEnd;

    // Working days count — aaj tak ya poora month
    const totalWorkingDays = await getWorkingDaysWithConfig(startDate, endDate);


    // Count present days
    // PKT timezone fix — start at 19:00 UTC prev day, end at 18:59 UTC same day
    const startUTC = new Date(startDate);
    startUTC.setHours(0, 0, 0, 0);
    const endUTC = new Date(endDate);
    endUTC.setHours(23, 59, 59, 999);

    const presentDocs = await Attendance.find({
      employeeId: emp._id,
      date: { $gte: startUTC, $lte: endUTC },
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
    .populate("employeeId", "firstName lastName email salary managerId userId")
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
    if (!emp.email) { console.warn(`⚠️ Skipping ${emp.firstName} - no email`); continue; }

    // Email to employee
    await emailService.sendMonthlySummaryEmail({
      toEmail:     emp.email,
      toName:      `${emp.firstName} ${emp.lastName}`,
      monthLabel,
      summary,
      role:        "employee",
      joiningDate: emp.joiningDate,
    });

    // Email to manager
    if (summary.managerId) {
      await emailService.sendMonthlySummaryEmail({
        toEmail:      summary.managerId.email,
        toName:       summary.managerId.name,
        monthLabel,
        summary,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        role:         "manager",
        joiningDate:  emp.joiningDate,
      });
    }

    // Bell notification — employee
   // Bell notification — employee
    const now = new Date();
    const isMonthComplete = now.getMonth() + 1 !== month || now.getFullYear() !== year;
    const periodMsg = isMonthComplete
      ? `Full month of ${monthLabel}`
      : `${monthLabel} so far (1st to ${now.getDate()}th)`;

    await notificationService.createNotification(
      emp.userId,
      `📊 ${monthLabel} Attendance Summary Ready`,
      `Your attendance summary for ${periodMsg} is ready. Working Days: ${summary.totalWorkingDays} | Present: ${summary.totalPresent} | Unauthorized Absences: ${summary.totalUnauthorizedAbsences} | Deduction: Rs.${summary.totalDeduction.toLocaleString()} | Net Salary: Rs.${summary.netSalary.toLocaleString()}. View your detailed salary slip on the dashboard.`,
      'monthly_summary',
      '/employee/monthly-summary'
    );

    // Bell notification — manager
    if (summary.managerId) {
      await notificationService.createNotification(
        summary.managerId._id,
        `📊 ${emp.firstName} ${emp.lastName} — ${monthLabel} Summary`,
        `${emp.firstName} ${emp.lastName} ki ${monthLabel} summary: Absences: ${summary.totalUnauthorizedAbsences}, Deduction: Rs.${summary.totalDeduction}`,
        'monthly_summary',
        '/manager/monthly-summary'
      );
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
