const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const managerRoutes = require('./manager.routes');
const employeeRoutes = require('./employee.routes');
const attendanceRoutes = require('./attendance.routes');
const leaveRequestRoutes = require('./leaveRequest.routes');
const correctionRequestRoutes = require('./correctionRequest.routes'); // ✅ ADDED
const notificationRoutes = require('./notification.routes');
const salaryRoutes = require('./salary.routes');
const reportRoutes = require('./report.routes');

module.exports = function (app, apiPrefix) {
  console.log('📡 Registering routes with prefix:', apiPrefix);
  
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/admin`, adminRoutes);
  app.use(`${apiPrefix}/manager`, managerRoutes);
  app.use(`${apiPrefix}/employee`, employeeRoutes);
  app.use(`${apiPrefix}/attendance`, attendanceRoutes);
  app.use(`${apiPrefix}/leave-requests`, leaveRequestRoutes);
  app.use(`${apiPrefix}/correction-requests`, correctionRequestRoutes); // ✅ ADDED
  app.use(`${apiPrefix}/notifications`, notificationRoutes);
  app.use(`${apiPrefix}/salary`, salaryRoutes);
  app.use(`${apiPrefix}/report`, reportRoutes);
  
  console.log('✅ All routes registered');
  console.log('✅ Leave requests route: ' + apiPrefix + '/leave-requests');
  console.log('✅ Correction requests route: ' + apiPrefix + '/correction-requests'); // ✅ ADDED
};