require('dotenv').config();
require('./config/database').connectDB().then(async()=>{
  require('./src/models/Employee');
  const A=require('./src/models/Attendance');
  const records=await A.find({
    date:{$gte:new Date('2026-04-01'),$lte:new Date('2026-04-30')}
  }).populate('employeeId','firstName');
  const byEmp={};
  records.forEach(r=>{
    const n=r.employeeId.firstName;
    if(!byEmp[n]) byEmp[n]={present:0,absent:0};
    if(['present','late','half-day'].includes(r.status)) byEmp[n].present++;
    if(r.status==='absent') byEmp[n].absent++;
  });
  console.log(JSON.stringify(byEmp,null,2));
  process.exit();
});
