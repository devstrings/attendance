require('dotenv').config();
require('./config/database').connectDB().then(async()=>{
  require('./src/models/Employee');
  const A=require('./src/models/Attendance');
  
  // Exactly wahi query jo Report.jsx karta hai
  const startDate = '2026-04-01';
  const endDate = '2026-04-30';
  
  const records=await A.find({
    date:{$gte:new Date(startDate),$lte:new Date(endDate)}
  }).populate('employeeId','firstName lastName');
  
  console.log('Total records from API query:', records.length);
  
  const byEmp={};
  records.forEach(r=>{
    const n=r.employeeId?.firstName;
    if(!byEmp[n]) byEmp[n]=0;
    byEmp[n]++;
  });
  console.log('Per employee:', byEmp);
  process.exit();
});
