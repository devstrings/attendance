const cron = require('node-cron');
const Attendance = require('../models/Attendance');
const SystemSettings = require('../models/SystemSettings');

/**
 * Auto Clock-Out Cron Job
 * Runs every 15 minutes to check and auto-close attendance
 */
const startAutoClockOutJob = () => {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('🕐 Running Auto Clock-Out Check...');
      
      // Get system settings
      const settings = await SystemSettings.findOne();
      
      if (!settings || !settings.autoClockOut.enabled) {
        console.log('⏭️ Auto clock-out is disabled');
        return;
      }

      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();
      
      // Parse configured end time (e.g., "19:00")
      const [endHour, endMinute] = settings.workingHours.officeEndTime.split(':').map(Number);
      
      // Calculate grace period end time (e.g., 19:15 if grace is 15 minutes)
      const graceEndHour = endHour;
      const graceEndMinute = endMinute + settings.autoClockOut.graceMinutes;
      
      // Check if current time is past grace period
      const isPastGracePeriod = 
        currentHour > graceEndHour ||
        (currentHour === graceEndHour && currentMinute >= graceEndMinute);

      if (!isPastGracePeriod) {
        console.log('⏰ Not yet past grace period');
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all attendance records that are still open (no clock out)
      const openAttendance = await Attendance.find({
        date: { $gte: today },
        clockOut: null,
        status: { $in: ['present', 'late'] }
      }).populate('employeeId', 'firstName lastName employeeCode');

      if (openAttendance.length === 0) {
        console.log('✅ No open attendance records found');
        return;
      }

      console.log(`📋 Found ${openAttendance.length} open attendance records`);

      // Auto clock-out each record
      for (const attendance of openAttendance) {
        const clockOutTime = new Date();
        clockOutTime.setHours(endHour, endMinute, 0, 0);

        // Calculate work hours
        const clockInTime = new Date(attendance.clockIn);
        const workHours = ((clockOutTime - clockInTime) / (1000 * 60 * 60)).toFixed(2);

        attendance.clockOut = clockOutTime;
        attendance.workHours = parseFloat(workHours);
        attendance.remarks = `${attendance.remarks ? attendance.remarks + ' | ' : ''}Auto clock-out at ${clockOutTime.toLocaleTimeString()}`;
        
        await attendance.save();

        console.log(`✅ Auto clocked-out: ${attendance.employeeId?.employeeCode} at ${clockOutTime.toLocaleTimeString()}`);
      }

      console.log(`🎉 Auto clock-out completed for ${openAttendance.length} employees`);

    } catch (error) {
      console.error('❌ Auto clock-out error:', error);
    }
  });

  console.log('🚀 Auto Clock-Out Cron Job Started (runs every 15 minutes)');
};

module.exports = { startAutoClockOutJob };