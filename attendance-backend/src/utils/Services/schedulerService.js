const cron = require('node-cron');
const { generateMonthlySummaries, sendMonthlySummaryEmails } = require('./monthlySummaryService');


function startScheduler() {

  // Last day of month — 11:00 PM — generate + send email
  // Runs every day, checks if today is last day of month
  cron.schedule('0 23 * * *', async () => {
    const now      = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    if (tomorrow.getDate() === 1) {
      // Aaj month ka last din hai
      const month = now.getMonth() + 1;
      const year  = now.getFullYear();
      console.log(`🕚 Last day detected — generating summary for ${month}/${year}`);
      await generateMonthlySummaries(month, year);
      await sendMonthlySummaryEmails(month, year, true);
    }
  });

  // 1st of every month — 9:00 AM — reminder email
  cron.schedule('0 9 1 * *', async () => {
    const now   = new Date();
    let month   = now.getMonth(); // previous month
    let year    = now.getFullYear();
    if (month === 0) { month = 12; year -= 1; }

    console.log(`📅 1st date — sending reminder summary email for ${month}/${year}`);
    await sendMonthlySummaryEmails(month, year, false);
  });

  // 26th of every month — Absence alert to employees
  cron.schedule('0 10 * * *', async () => {
    const now   = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();
    console.log(`⚠️ 26th alert — checking absences for ${month}/${year}`);

    try {
      const Employee     = require('../../models/Employee');
      const Attendance   = require('../../models/Attendance');
      const LeaveRequest = require('../../models/LeaveRequest');
      const SystemConfig = require('../../models/SystemConfig');
      const notificationService = require('./notificationService');

      const config = await SystemConfig.findOne();
      const deductionPerAbsence = config?.absenceDeductionAmount || 500;

      const startDate = new Date(year, month - 1, 1);
      const endDate   = new Date(now); // aaj tak

      const employees = await Employee.find({ isActive: true });

      for (const emp of employees) {
        // Present days
        const presentCount = await Attendance.countDocuments({
          employeeId: emp._id,
          date: { $gte: startDate, $lte: endDate },
          status: 'present'
        });

        // Approved leaves
        const approvedLeaves = await LeaveRequest.find({
          employeeId: emp._id,
          status: 'approved',
          $or: [
            { startDate: { $gte: startDate, $lte: endDate } },
            { endDate:   { $gte: startDate, $lte: endDate } }
          ]
        });
        let totalLeaves = 0;
        for (const lv of approvedLeaves) {
          const s = lv.startDate < startDate ? startDate : lv.startDate;
          const e = lv.endDate   > endDate   ? endDate   : lv.endDate;
          totalLeaves += Math.ceil((e - s) / (1000*60*60*24)) + 1;
        }

        // Working days so far
        let workingDaysSoFar = 0;
        const d = new Date(startDate);
        while (d <= endDate) {
          const day = d.getDay();
          if (day !== 0 && day !== 6) workingDaysSoFar++;
          d.setDate(d.getDate() + 1);
        }

        const absences = Math.max(0, workingDaysSoFar - presentCount - totalLeaves);

        // Sirf unhe alert karo jinka absence > 0 hai
        if (absences > 0 && emp.userId) {
          const deduction = absences * deductionPerAbsence;
          const monthName = new Date(year, month-1, 1)
            .toLocaleString('en-US', { month: 'long' });

          await notificationService.createNotification(
            emp.userId,
            `⚠️ Attendance Alert — ${monthName} ${year}`,
            `You have ${absences} unauthorized absence(s) this month, which may result in a salary deduction of Rs. ${deduction.toLocaleString()}. If you have worked overtime, it may offset your deductions. Please ensure your attendance is up to date before month end.`,
            'attendance_alert',
            '/employee/monthly-summary'
          );

          console.log(`✅ Alert sent to ${emp.firstName} ${emp.lastName} — ${absences} absences`);
        }
      }
    } catch (err) {
      console.error('❌ 26th alert error:', err.message);
    }
  });
  
  console.log('⏰ Scheduler started');
}

module.exports = { startScheduler };