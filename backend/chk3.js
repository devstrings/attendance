require('dotenv').config();
require('./config/database').connectDB().then(async()=>{
  require('./src/models/Employee');
  const A=require('./src/models/Attendance');
  const records=await A.find({
    date:{$gte:new Date('2026-04-01'),$lte:new Date('2026-04-23')}
  }).select('employeeId date status isLate clockIn clockOut');
  console.log('Total:', records.length);
  records.forEach(r=>console.log(
    new Date(r.date).toLocaleDateString(),
    r.status, 'isLate:'+r.isLate,
    'clockIn:'+(r.clockIn?'yes':'no')
  ));
  process.exit();
});
