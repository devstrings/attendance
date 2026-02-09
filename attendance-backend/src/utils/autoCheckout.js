const cron = require('node-cron');
const Attendance = require('../models/Attendance');
const SystemConfig = require('../models/SystemConfig');

/**
 * Auto Checkout Cron Job
 * Runs every minute to check for auto checkout
 */
const autoCheckoutJob = cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    console.log(`🕐 [Auto Checkout] Running at ${currentHour}:${String(currentMinute).padStart(2, '0')}`);
    
    // Get active system configuration
    const config = await SystemConfig.findOne({ isActive: true });
    
    if (!config) {
      console.log('⏭️ [Auto Checkout] No active system config found');
      return;
    }

    // Parse configured end time (e.g., "19:00")
    const endTime = config.workingHours?.endTime || '19:00';
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    // Grace period is 15 minutes
    const graceMinutes = 15;
    let graceEndHour = endHour;
    let graceEndMinute = endMinute + graceMinutes;
    
    // Handle minute overflow
    if (graceEndMinute >= 60) {
      graceEndHour += 1;
      graceEndMinute -= 60;
    }
    
    // Check if current time is past grace period
    const isPastGracePeriod = 
      currentHour > graceEndHour ||
      (currentHour === graceEndHour && currentMinute >= graceEndMinute);

    if (!isPastGracePeriod) {
      console.log(`⏰ [Auto Checkout] Not yet past grace period (${graceEndHour}:${String(graceEndMinute).padStart(2, '0')})`);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all open attendance records
    const openAttendance = await Attendance.find({
      date: { $gte: today },
      clockOut: null,
      status: { $in: ['present', 'late'] }
    }).populate('employeeId', 'firstName lastName employeeCode');

    if (openAttendance.length === 0) {
      console.log('✅ [Auto Checkout] No open attendance records found');
      return;
    }

    console.log(`📋 [Auto Checkout] Found ${openAttendance.length} open attendance records`);

    let checkedOutCount = 0;

    // Auto checkout each record
    for (const attendance of openAttendance) {
      const clockOutTime = new Date();
      clockOutTime.setHours(endHour, endMinute, 0, 0);

      // Calculate work hours
      const clockInTime = new Date(attendance.clockIn);
      let workHours = (clockOutTime - clockInTime) / (1000 * 60 * 60);
      
      // Subtract break time
      const breakHours = (config.breakTime || 60) / 60;
      workHours = Math.max(0, workHours - breakHours);
      
      attendance.clockOut = clockOutTime;
      attendance.workHours = parseFloat(workHours.toFixed(2));
      attendance.remarks = `${attendance.remarks ? attendance.remarks + ' | ' : ''}Auto checkout at ${clockOutTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      
      await attendance.save();
      
      checkedOutCount++;

      console.log(`✅ [Auto Checkout] ${attendance.employeeId?.employeeCode} - ${attendance.employeeId?.firstName} ${attendance.employeeId?.lastName} auto checked out at ${clockOutTime.toLocaleTimeString()}`);
    }

    console.log(`🎉 [Auto Checkout] Completed - ${checkedOutCount} employees checked out`);

  } catch (error) {
    console.error('❌ [Auto Checkout] Error:', error);
  }
}, {
  scheduled: false, // Don't start automatically, we'll start it manually
  timezone: 'Asia/Karachi' // Pakistan timezone
});

/**
 * Manual trigger for testing
 */
const runAutoCheckoutManually = async () => {
  try {
    console.log('🔧 [Manual Trigger] Running auto checkout...');
    
    const config = await SystemConfig.findOne({ isActive: true });
    
    if (!config) {
      return {
        success: false,
        message: 'No active system config found',
        count: 0
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const openAttendance = await Attendance.find({
      date: { $gte: today },
      clockOut: null,
      status: { $in: ['present', 'late'] }
    }).populate('employeeId', 'firstName lastName employeeCode');

    if (openAttendance.length === 0) {
      return {
        success: true,
        message: 'No open attendance records to checkout',
        count: 0
      };
    }

    const endTime = config.workingHours?.endTime || '19:00';
    const [endHour, endMinute] = endTime.split(':').map(Number);

    let checkedOutCount = 0;

    for (const attendance of openAttendance) {
      const clockOutTime = new Date();
      clockOutTime.setHours(endHour, endMinute, 0, 0);

      const clockInTime = new Date(attendance.clockIn);
      let workHours = (clockOutTime - clockInTime) / (1000 * 60 * 60);
      
      const breakHours = (config.breakTime || 60) / 60;
      workHours = Math.max(0, workHours - breakHours);
      
      attendance.clockOut = clockOutTime;
      attendance.workHours = parseFloat(workHours.toFixed(2));
      attendance.remarks = `${attendance.remarks ? attendance.remarks + ' | ' : ''}Manual auto checkout at ${clockOutTime.toLocaleTimeString()}`;
      
      await attendance.save();
      checkedOutCount++;

      console.log(`✅ [Manual] ${attendance.employeeId?.employeeCode} checked out`);
    }

    return {
      success: true,
      message: `Successfully checked out ${checkedOutCount} employees`,
      count: checkedOutCount
    };

  } catch (error) {
    console.error('❌ [Manual Trigger] Error:', error);
    return {
      success: false,
      message: error.message,
      count: 0
    };
  }
};

module.exports = {
  autoCheckoutJob,
  runAutoCheckoutManually
};