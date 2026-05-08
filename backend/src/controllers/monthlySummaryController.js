const MonthlySummary = require("../models/MonthlySummary");
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const LeaveRequest = require("../models/LeaveRequest");
const SystemConfig = require("../models/SystemConfig");
const {
  generateMonthlySummaries,
  sendMonthlySummaryEmails,
} = require("../utils/Services/monthlySummaryService");

// Employee: apni summaries dekho
exports.getMyMonthlySummaries = async (req, res) => {
  try {
    const summaries = await MonthlySummary.find({
      employeeId: req.user.id,
    }).sort({ year: -1, month: -1 });
    res.json({ success: true, summaries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Employee: specific month ki summary
exports.getMyMonthlySummaryByMonth = async (req, res) => {
  try {
    const { month, year } = req.params;
    const summary = await MonthlySummary.findOne({
      employeeId: req.user.id,
      month: parseInt(month),
      year: parseInt(year),
    });
    if (!summary)
      return res
        .status(404)
        .json({ success: false, message: "Summary not found" });
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Manager: apne employees ki summaries
exports.getTeamMonthlySummaries = async (req, res) => {
  try {
    const { month, year } = req.params;
    const summaries = await MonthlySummary.find({
      managerId: req.user.id,
      month: parseInt(month),
      year: parseInt(year),
    }).populate("employeeId", "name email");
    res.json({ success: true, summaries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: manually trigger (testing k liye)
exports.adminTriggerSummary = async (req, res) => {
  try {
    const { month, year } = req.body;
    await generateMonthlySummaries(parseInt(month), parseInt(year));
    await sendMonthlySummaryEmails(parseInt(month), parseInt(year), true);
    res.json({
      success: true,
      message: `Summary generated & emails sent for ${month}/${year}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: all summaries
exports.adminGetAllSummaries = async (req, res) => {
  try {
    const { month, year } = req.params;
    const summaries = await MonthlySummary.find({
      month: parseInt(month),
      year: parseInt(year),
    }).populate("employeeId", "firstName lastName email salary employeeCode department")
    res.json({ success: true, summaries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: live preview — save/email nahi, sirf calculate karke dikhao
exports.adminPreviewSummaries = async (req, res) => {
  try {
    const { month, year } = req.params;
    const m = parseInt(month);
    const y = parseInt(year);

    const config = await SystemConfig.findOne();
    const deductionPerAbsence = config?.absenceDeductionAmount || 500;

   const monthStart = new Date(y, m - 1, 1);
const endDate = new Date(y, m, 0);

const now = new Date();
const isCurrentMonth = now.getMonth() + 1 === m && now.getFullYear() === y;
const todayEnd = new Date(now);
todayEnd.setHours(23, 59, 59, 999);
const effectiveEnd = isCurrentMonth ? todayEnd : endDate;

const employees = await Employee.find({ isActive: true });
const previews = [];

for (const emp of employees) {
  const joiningDate = emp.joiningDate ? new Date(emp.joiningDate) : monthStart;
  const startDate = joiningDate > monthStart ? joiningDate : monthStart;

  // Working days count (Mon-Fri) — joining date ke baad se
  let totalWorkingDays = 0;
  const d = new Date(startDate);
  // Config se weekendDays lo (pehle se config variable exist karta hai):
const weekendDays = config?.weekendDays || ['Saturday', 'Sunday'];
const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// Aur loop replace karo:
const Holiday = require("../models/Holiday");
const holidays = await Holiday.find({
  date: { $gte: startDate, $lte: effectiveEnd }
});
const holidaySet = new Set(holidays.map(h => new Date(h.date).toDateString()));

while (d <= effectiveEnd) {
  const dayName = dayNames[d.getDay()];
  const isHoliday = holidaySet.has(d.toDateString());
  if (!weekendDays.includes(dayName) && !isHoliday) totalWorkingDays++;
  d.setDate(d.getDate() + 1);
}
      // Present days
      const presentDocs = await Attendance.find({
  employeeId: emp._id,
  date: { $gte: startDate, $lte: effectiveEnd },
  status: { $in: ['present', 'half-day', 'late'] },
});
const totalPresent = presentDocs.length;

      // Approved overtime hours
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

      // Approved leaves
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

      // Marked days = present + leave + actual absent records
const allEmpAtt = await Attendance.find({
  employeeId: emp._id,
  date: { $gte: startDate, $lte: effectiveEnd },
});

const markedWorkingDays = allEmpAtt.filter(a => {
  const attDate = new Date(a.date);
  attDate.setHours(0, 0, 0, 0);
  const dayName = dayNames[attDate.getDay()];
  return !weekendDays.includes(dayName) && !holidaySet.has(attDate.toDateString());
}).length;

const actualAbsentRecords = allEmpAtt.filter(a => a.status === 'absent').length;
const unmarkedDays = Math.max(0, totalWorkingDays - markedWorkingDays);
const rawAbsences = actualAbsentRecords + unmarkedDays;
      const totalUnauthorizedAbsences = Math.max(
        0,
        rawAbsences - absencesCoveredByOvertime,
      );
      const totalDeduction = totalUnauthorizedAbsences * deductionPerAbsence;
      const baseSalary = emp.salary || 0;
      const netSalary = Math.max(0, baseSalary - totalDeduction);

      previews.push({
        employeeId: {
          _id: emp._id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
          salary: emp.salary,
          employeeCode: emp.employeeCode,
          department: emp.department,
        },
        month: m,
        year: y,
        totalWorkingDays,
        totalPresent,
        totalApprovedLeaves,
        totalUnauthorizedAbsences,
        totalOvertimeHours,
        absencesCoveredByOvertime,
        deductionPerAbsence,
        totalDeduction,
        baseSalary,
        netSalary,
        salarySlipGenerated: false,
        isPreview: true,
      });
    }

    res.json({ success: true, summaries: previews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
