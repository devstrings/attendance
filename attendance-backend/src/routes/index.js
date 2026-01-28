const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const managerRoutes = require('./manager.routes');
const employeeRoutes = require('./employee.routes');
const attendanceRoutes = require('./attendance.routes');
const leaveRoutes = require('./leave.routes');
const salaryRoutes = require('./salary.routes');
const reportRoutes = require('./report.routes');


export default  function (app) {
    app.use('/auth', authRoutes);
    

}