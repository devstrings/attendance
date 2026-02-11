// routes/index.js

const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const managerRoutes = require('./manager.routes');
const employeeRoutes = require('./employee.routes');
const attendanceRoutes = require('./attendance.routes');
const leaveRoutes = require('./leave.routes');
const notificationRoutes = require('./notification.routes'); // ✅ ADDED
const salaryRoutes = require('./salary.routes');
const reportRoutes = require('./report.routes');

module.exports = function (app, apiPrefix) {
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/admin`, adminRoutes);
  app.use(`${apiPrefix}/manager`, managerRoutes);
  app.use(`${apiPrefix}/employee`, employeeRoutes);
  app.use(`${apiPrefix}/attendance`, attendanceRoutes);
  app.use(`${apiPrefix}/leave-requests`, leaveRoutes);
  app.use(`${apiPrefix}/notifications`, notificationRoutes); // ✅ ADDED
  app.use(`${apiPrefix}/salary`, salaryRoutes);
  app.use(`${apiPrefix}/report`, reportRoutes);
};