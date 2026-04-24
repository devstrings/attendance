require('dotenv').config();
require('./config/database').connectDB().then(async()=>{
  require('./src/models/Employee');
  require('./src/models/User');
  const A=require('./src/models/Attendance');
  
  const months = [
    {name:'March', gte:new Date('2026-03-01'), lte:new Date('2026-03-31')},
    {name:'April', gte:new Date('2026-04-01'), lte:new Date('2026-04-23')}
  ];
  
  for(const m of months){
    const records=await A.find({date:{$gte:m.gte,$lte:m.lte}}).populate('employeeId','firstName');
    console.log('\n=== '+m.name+' ===');
    const byEmp={};
    records.forEach(r=>{
      const n=r.employeeId?.firstName||'Unknown';
      if(!byEmp[n]) byEmp[n]={present:0,absent:0,late:0,leave:0,total:0};
      byEmp[n].total++;
      if(['present','half-day','late'].includes(r.status)) byEmp[n].present++;
      if(r.status==='absent') byEmp[n].absent++;
      if(r.isLate) byEmp[n].late++;
      if(['leave','on-leave'].includes(r.status)) byEmp[n].leave++;
    });
    Object.entries(byEmp).forEach(([n,d])=>
      console.log(n+': present='+d.present+' absent='+d.absent+' late='+d.late+' leave='+d.leave+' totalRecords='+d.total)
    );
  }
  process.exit();
});
