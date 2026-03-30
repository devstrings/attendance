const cron = require('node-cron');
const Attendance = require('../models/Attendance');
const SystemConfig = require('../models/SystemConfig');

// ─── Helper: Get current time in PKT (UTC+5) ─────────────────────────────────
const getPKTTime = () => {
  const now = new Date();
  // PKT = UTC + 5 hours
  const pktOffset = 5 * 60; // minutes
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const pktMinutes = utcMinutes + pktOffset;
  const pktHour   = Math.floor(pktMinutes / 60) % 24;
  const pktMinute = pktMinutes % 60;
  return { pktHour, pktMinute };
};

// ─── Core checkout logic (shared between cron & manual) ──────────────────────
const performAutoCheckout = async (forcedEndTime = null) => {
  const config = await SystemConfig.findOne({ isActive: true });

  if (!config) {
    console.log('⏭️ [Auto Checkout] No active system config found');
    return { success: false, message: 'No active system config found', count: 0 };
  }

  const endTime = forcedEndTime || config.workingHours?.endTime || '19:00';
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const today = new Date();
today.setHours(0, 0, 0, 0);

// UTC offset fix — date field UTC mein store hoti hai
const todayUTC = new Date(today.getTime() - (5 * 60 * 60 * 1000));

const openAttendance = await Attendance.find({
  date: { $gte: todayUTC },
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
    // Clock out time = today at configured end time (PKT, stored as local server time)
    const clockOutTime = new Date();
    clockOutTime.setHours(endHour, endMinute, 0, 0);

    // If clockOut time is before clockIn (e.g., server timezone mismatch), skip
    const clockInTime = new Date(attendance.clockIn);
    if (clockOutTime <= clockInTime) {
      console.warn(`⚠️ [Auto Checkout] Skipping ${attendance.employeeId?.employeeCode} — clockOut <= clockIn`);
      continue;
    }

    let workHours = (clockOutTime - clockInTime) / (1000 * 60 * 60);
    const breakHours = (config.breakTime || 60) / 60;
    workHours = Math.max(0, workHours - breakHours);

    attendance.clockOut   = clockOutTime;
    attendance.workHours  = parseFloat(workHours.toFixed(2));
    attendance.autoCheckedOut = true; // ← new flag for tracking
    attendance.remarks    = [attendance.remarks, `Auto checkout at ${endTime} PKT`]
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
// Runs every minute — but only acts once, right after grace period ends
const autoCheckoutJob = cron.schedule('* * * * *', async () => {
  try {
    const config = await SystemConfig.findOne({ isActive: true });
    if (!config) return;

    const endTime     = config.workingHours?.endTime || '19:00';
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const graceMinutes = 15;

    // Grace period end (in total minutes)
    const graceEndTotal = endHour * 60 + endMinute + graceMinutes;
    const graceEndHour  = Math.floor(graceEndTotal / 60);
    const graceEndMin   = graceEndTotal % 60;

    // ✅ Use PKT time — NOT new Date() which is UTC on most servers
    const { pktHour, pktMinute } = getPKTTime();
    const nowTotal = pktHour * 60 + pktMinute;

    // Only trigger in the window: graceEnd <= now < graceEnd+2 minutes
    // This prevents firing every minute all night
    const triggerStart = graceEndTotal;
    const triggerEnd   = graceEndTotal + 2;

    if (nowTotal < triggerStart || nowTotal >= triggerEnd) {
      return; // Outside trigger window — do nothing
    }

    console.log(
      `🕐 [Auto Checkout] Triggered at PKT ${pktHour}:${String(pktMinute).padStart(2,'0')} ` +
      `(grace end was ${graceEndHour}:${String(graceEndMin).padStart(2,'0')})`
    );

    await performAutoCheckout(endTime);

  } catch (error) {
    console.error('❌ [Auto Checkout Cron] Error:', error);
  }
}, {
  scheduled: false,
  timezone: 'Asia/Karachi'
});

// ─── Manual Trigger ───────────────────────────────────────────────────────────
const runAutoCheckoutManually = async () => {
  console.log('🔧 [Manual Trigger] Running auto checkout...');
  return await performAutoCheckout();
};

module.exports = { autoCheckoutJob, runAutoCheckoutManually };