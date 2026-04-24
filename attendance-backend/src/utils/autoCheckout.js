const cron = require('node-cron');
const Attendance = require('../models/Attendance');
const SystemConfig = require('../models/SystemConfig');

// ─── Helper: Get current time in PKT (UTC+5) ─────────────────────────────────
const getPKTTime = () => {
  const now = new Date();
  const pktOffset = 5 * 60;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const pktMinutes = utcMinutes + pktOffset;
  const pktHour   = Math.floor(pktMinutes / 60) % 24;
  const pktMinute = pktMinutes % 60;
  return { pktHour, pktMinute };
};

// ─── Core checkout logic ──────────────────────────────────────────────────────
const performAutoCheckout = async (forcedEndTime = null) => {
  const config = await SystemConfig.findOne({ isActive: true });

  if (!config) {
    console.log('⏭️ [Auto Checkout] No active system config found');
    return { success: false, message: 'No active system config found', count: 0 };
  }

  const endTime = forcedEndTime || config.workingHours?.endTime || '19:00';

  // PKT today date range
  const pktNow  = new Date(Date.now() + 5 * 60 * 60 * 1000);
  const todayStr = pktNow.toISOString().split('T')[0];
  const todayStart = new Date(todayStr + 'T00:00:00+05:00');
  const todayEnd   = new Date(todayStr + 'T23:59:59+05:00');

  const openAttendance = await Attendance.find({
    date: { $gte: todayStart, $lte: todayEnd },
    clockOut: null,
    status: { $in: ['present', 'late'] }
  }).populate('employeeId', 'firstName lastName employeeCode');

  if (openAttendance.length === 0) {
    console.log('✅ [Auto Checkout] No open attendance records found');
    return { success: true, message: 'No open attendance records to checkout', count: 0 };
  }

  console.log(`📋 [Auto Checkout] Found ${openAttendance.length} open records`);

  let checkedOutCount = 0;

  for (const attendance of openAttendance) {
    // ✅ PKT explicit clockOut time (office end time)
    const clockOutTime = new Date(`${todayStr}T${endTime}:00+05:00`);

    const clockInTime = new Date(attendance.clockIn);
    if (clockOutTime <= clockInTime) {
      console.warn(`⚠️ [Auto Checkout] Skipping ${attendance.employeeId?.employeeCode} — clockOut <= clockIn`);
      continue;
    }

    let workHours = (clockOutTime - clockInTime) / (1000 * 60 * 60);
    const breakHours = (config.breakTime || 60) / 60;
    workHours = Math.max(0, workHours - breakHours);

    const approvedOvertimeHours = attendance.overtimeStatus === 'approved'
      ? parseFloat(((attendance.overtimeMinutes || 0) / 60).toFixed(2))
      : 0;

    attendance.clockOut       = clockOutTime;
    attendance.workHours      = parseFloat((workHours + approvedOvertimeHours).toFixed(2));
    attendance.overtimeHours  = approvedOvertimeHours;
    attendance.autoCheckedOut = true;
    attendance.remarks = [attendance.remarks, `Auto checkout at ${endTime} PKT`]
      .filter(Boolean).join(' | ');

    await attendance.save();
    checkedOutCount++;

    console.log(
      `✅ [Auto Checkout] ${attendance.employeeId?.employeeCode} ` +
      `${attendance.employeeId?.firstName} ${attendance.employeeId?.lastName} ` +
      `checked out at ${endTime}`
    );
  }

  console.log(`🎉 [Auto Checkout] Done — ${checkedOutCount} employees checked out`);
  return {
    success: true,
    message: `Successfully checked out ${checkedOutCount} employees`,
    count: checkedOutCount
  };
};

// ─── Cron Job ─────────────────────────────────────────────────────────────────
const autoCheckoutJob = cron.schedule('* * * * *', async () => {
  try {
    const config = await SystemConfig.findOne({ isActive: true });
    if (!config) return;

    const endTime = config.workingHours?.endTime || '19:00';
    const [endHour, endMinute] = endTime.split(':').map(Number);

    // ✅ Grace = 10 min — trigger exactly at endTime + 10
    const graceMinutes  = 10;
    const graceEndTotal = endHour * 60 + endMinute + graceMinutes;
    const graceEndHour  = Math.floor(graceEndTotal / 60);
    const graceEndMin   = graceEndTotal % 60;

    const { pktHour, pktMinute } = getPKTTime();
    const nowTotal = pktHour * 60 + pktMinute;

    // ✅ Sirf 1 minute window — exactly at grace end
    const triggerStart = graceEndTotal;
    const triggerEnd   = graceEndTotal + 1;

    if (nowTotal < triggerStart || nowTotal >= triggerEnd) return;

    console.log(
      `🕐 [Auto Checkout] Triggered at PKT ${pktHour}:${String(pktMinute).padStart(2,'0')} ` +
      `(office end: ${endTime}, grace end: ${graceEndHour}:${String(graceEndMin).padStart(2,'0')})`
    );

    await performAutoCheckout(endTime);

  } catch (error) {
    console.error('❌ [Auto Checkout Cron] Error:', error);
  }
}, {
  scheduled: false,
  timezone: 'Asia/Karachi'
});

// ─── Manual Trigger (Admin only — testing ke liye) ────────────────────────────
const runAutoCheckoutManually = async () => {
  console.log('🔧 [Manual Trigger] Running auto checkout...');
  return await performAutoCheckout();
};

module.exports = { autoCheckoutJob, runAutoCheckoutManually };