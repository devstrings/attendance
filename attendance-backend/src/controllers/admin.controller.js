const User = require('../models/User');
const Employee = require('../models/Employee');
const Manager = require('../models/Manager');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const LeaveRequest = require('../models/LeaveRequest'); // ✅ ADD THIS
const Holiday = require('../models/Holiday');
const MonthlyConfig = require('../models/MonthlyConfig');
const Salary = require('../models/Salary');
const SystemConfig = require('../models/SystemConfig');
const { generateToken } = require('../utils/jwtHandler');
const { sendEmail } = require('../utils/emailService');
const { validateEmail } = require('../utils/validators');
const notificationService = require('../utils/notificationService');

/**
 * Admin Dashboard - FIXED WITH LEAVE TODAY
 */
const getDashboard = async (req, res) => {
  try {
    console.log('📊 Fetching admin dashboard data...');
    
    const totalEmployees = await Employee.countDocuments({ isActive: true });
    const totalManagers = await Manager.countDocuments({ isActive: true });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    const systemConfig = await SystemConfig.findOne({ isActive: true });
    const todayDayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    const isWorkingDay = systemConfig?.workingDays?.includes(todayDayName) || false;
    
    const activeEmployeeIds = await Employee.find({ isActive: true }).distinct('_id');
    
    let todayAttendance = 0;
    let absentToday = 0;
    let leaveToday = 0;
    
    if (isWorkingDay) {
      todayAttendance = await Attendance.countDocuments({
        employeeId: { $in: activeEmployeeIds },
        date: { $gte: today, $lt: tomorrow },
        status: { $in: ['present', 'half-day', 'late'] }
      });
      
      // ✅ BOTH 'leave' AND 'on-leave'
      leaveToday = await Attendance.countDocuments({
        employeeId: { $in: activeEmployeeIds },
        date: { $gte: today, $lt: tomorrow },
        status: { $in: ['leave', 'on-leave'] }
      });
      
      absentToday = Math.max(0, totalEmployees - todayAttendance - leaveToday);
      
      console.log('📊 Dashboard Stats:', { totalEmployees, todayAttendance, leaveToday, absentToday });
    }

    // ✅ LeaveRequest model se pending count
    const pendingLeaves = await LeaveRequest.countDocuments({ 
      status: 'pending',
      employee: { $in: activeEmployeeIds }
    });

    const recentEmployees = await Employee.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'email isActive')
      .populate('managerId', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalEmployees,
          totalManagers,
          todayAttendance,
          absentToday,
          leaveToday,   // ✅ NEW FIELD
          pendingLeaves
        },
        recentEmployees,
        meta: {
          isWorkingDay,
          todayDayName,
          workingDays: systemConfig?.workingDays || []
        }
      }
    });
  } catch (error) {
    console.error('❌ Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data.',
      error: error.message
    });
  }
};

/**
 * Create Manager
 */
const createManager = async (req, res) => {
  try {
    const {
      email, password, firstName, lastName, phoneNumber,
      cnic, dateOfBirth, address, joiningDate, department,
      designation, salary, bankDetails, emergencyContact
    } = req.body;

    if (!email || !password || !firstName || !lastName || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'Required fields missing: email, password, firstName, lastName, phoneNumber' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    if (cnic) {
      const existingCNIC = await Manager.findOne({ cnic, isActive: true });
      if (existingCNIC) {
        return res.status(400).json({ success: false, message: 'Manager with this CNIC already exists.' });
      }
    }

    const user = new User({ email: email.toLowerCase(), password, role: 'manager', isActive: true, createdBy: req.user.userId });
    await user.save();

    const manager = new Manager({
      userId: user._id, firstName, lastName, phoneNumber, cnic: cnic || '',
      dateOfBirth, address: address || '', joiningDate: joiningDate || new Date(),
      department: department || 'General', designation: designation || 'Manager',
      salary: salary || 0, bankDetails, emergencyContact
    });
    await manager.save();

    try { await sendEmail({ to: user.email, subject: 'Welcome to Devstrings', html: `<h2>Welcome ${firstName}!</h2><p>Password: ${password}</p>` }); } catch (e) {}

    res.status(201).json({ success: true, message: 'Manager created successfully.', data: { manager } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create manager.', error: error.message });
  }
};

/**
 * Create Employee
 */
const createEmployee = async (req, res) => {
  try {
    const {
      email, password, firstName, lastName, phoneNumber, cnic,
      dateOfBirth, address, managerId, department, designation,
      employmentType, salary, joiningDate, workSchedule
    } = req.body;

    if (!email || !password || !firstName || !lastName || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'Email, password, first name, last name, and phone number are required.' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    if (managerId) {
      const manager = await Manager.findById(managerId);
      if (!manager) {
        return res.status(404).json({ success: false, message: 'Manager not found.' });
      }
    }

    if (cnic && cnic.trim() !== '') {
      const existingCNIC = await Employee.findOne({ cnic: cnic.trim(), isActive: true });
      if (existingCNIC) {
        return res.status(400).json({ success: false, message: `Employee with CNIC ${cnic} already exists.` });
      }
    }

    let employeeCode;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const count = await Employee.countDocuments();
      employeeCode = `EMP${String(count + attempts + 1).padStart(4, '0')}`;
      const existing = await Employee.findOne({ employeeCode });
      if (!existing) isUnique = true;
      else attempts++;
    }

    const user = new User({ email: email.toLowerCase(), password, role: 'employee', isActive: true, createdBy: req.user.userId });
    await user.save();

    const employee = new Employee({
      userId: user._id, managerId: managerId || null,
      firstName: firstName.trim(), lastName: lastName.trim(), employeeCode,
      phoneNumber: phoneNumber.trim(), cnic: cnic ? cnic.trim() : null,
      dateOfBirth: dateOfBirth || null, address: address ? address.trim() : null,
      department: department || 'General', designation: designation || 'Employee',
      employmentType: employmentType || 'full-time', salary: salary || 0,
      joiningDate: joiningDate || new Date(),
      workSchedule: workSchedule || { shiftStartTime: '09:00', shiftEndTime: '17:00', workingDays: ['Monday','Tuesday','Wednesday','Thursday','Friday'] }
    });
    await employee.save();

    if (managerId) {
      await Manager.findByIdAndUpdate(managerId, { $addToSet: { employeesUnder: employee._id } });
    }

    try { await sendEmail({ to: user.email, subject: 'Welcome to Devstrings', html: `<h2>Welcome ${firstName}!</h2><p>Code: ${employeeCode}</p><p>Password: ${password}</p>` }); } catch (e) {}

    res.status(201).json({ success: true, message: 'Employee created successfully.', data: { employee: { _id: employee._id, employeeCode, firstName, lastName, email: user.email, department: employee.department, designation: employee.designation } } });
  } catch (error) {
    let msg = 'Failed to create employee.';
    if (error.code === 11000) msg = `Duplicate ${Object.keys(error.keyPattern)[0]}.`;
    else if (error.name === 'ValidationError') msg = Object.values(error.errors).map(e => e.message).join(', ');
    res.status(500).json({ success: false, message: msg, error: error.message });
  }
};

const getAllManagers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', department = '' } = req.query;
    const query = { isActive: true };
    if (search) query.$or = [{ firstName: { $regex: search, $options: 'i' } }, { lastName: { $regex: search, $options: 'i' } }];
    if (department) query.department = department;
    const managers = await Manager.find(query).populate('userId', 'email isActive lastLogin').populate('employeesUnder', 'firstName lastName employeeCode').sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit);
    const count = await Manager.countDocuments(query);
    res.status(200).json({ success: true, data: { managers, totalPages: Math.ceil(count / limit), currentPage: page, totalManagers: count } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch managers.', error: error.message });
  }
};

const getAllEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', department = '', managerId = '' } = req.query;
    const query = { isActive: true };
    if (search) query.$or = [{ firstName: { $regex: search, $options: 'i' } }, { lastName: { $regex: search, $options: 'i' } }, { employeeCode: { $regex: search, $options: 'i' } }];
    if (department) query.department = department;
    if (managerId) query.managerId = managerId;
    const employees = await Employee.find(query).populate('userId', 'email isActive lastLogin').populate('managerId', 'firstName lastName email').sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit).lean();
    const count = await Employee.countDocuments(query);
    res.status(200).json({ success: true, data: { employees, totalPages: Math.ceil(count / limit), currentPage: page, totalEmployees: count } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch employees.', error: error.message });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { userId, userType } = req.params;
    if (!['manager', 'employee'].includes(userType)) return res.status(400).json({ success: false, message: 'Invalid user type.' });
    const ProfileModel = userType === 'manager' ? Manager : Employee;
    const populateField = userType === 'manager' ? 'employeesUnder' : 'managerId';
    const populateSelect = userType === 'manager' ? 'firstName lastName email employeeCode' : 'firstName lastName email';
    let profile = await ProfileModel.findById(userId).populate('userId').populate(populateField, populateSelect);
    if (profile) {
      const userIdValue = profile.userId?._id || profile.userId;
      const user = await User.findById(userIdValue).select('-password');
      if (user) return res.status(200).json({ success: true, data: { user, profile } });
    }
    const user = await User.findById(userId).select('-password');
    if (user) {
      profile = await ProfileModel.findOne({ userId: user._id }).populate(populateField, populateSelect);
      if (profile) return res.status(200).json({ success: true, data: { user, profile } });
    }
    res.status(404).json({ success: false, message: 'User not found.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user details.', error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId, userType } = req.params;
    const updateData = req.body;
    if (!['manager', 'employee'].includes(userType)) return res.status(400).json({ success: false, message: 'Invalid user type.' });
    const ProfileModel = userType === 'manager' ? Manager : Employee;
    const populateField = userType === 'manager' ? 'employeesUnder' : 'managerId';
    let profile = await ProfileModel.findById(userId);
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });
    let user = await User.findById(profile.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User account not found.' });
    if (updateData.email && updateData.email !== user.email) {
      const existing = await User.findOne({ email: updateData.email.toLowerCase(), _id: { $ne: user._id } });
      if (existing) return res.status(400).json({ success: false, message: 'Email already in use.' });
      user.email = updateData.email.toLowerCase();
      await user.save();
    }
    profile = await ProfileModel.findByIdAndUpdate(profile._id, { $set: updateData }, { new: true, runValidators: true }).populate(populateField);
    res.status(200).json({ success: true, message: `${userType} updated successfully.`, data: { user, profile } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user.', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId, userType } = req.params;
    if (!['manager', 'employee'].includes(userType)) return res.status(400).json({ success: false, message: 'Invalid user type.' });
    const ProfileModel = userType === 'manager' ? Manager : Employee;
    let profile = await ProfileModel.findById(userId);
    let user = null;
    if (!profile) {
      user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      profile = await ProfileModel.findOne({ userId: user._id });
    } else {
      user = profile.userId ? await User.findById(profile.userId) : null;
    }
    if (userType === 'manager' && profile?.employeesUnder?.length > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete manager. ${profile.employeesUnder.length} employee(s) assigned.` });
    }
    if (userType === 'employee' && profile) {
      await Attendance.deleteMany({ employeeId: profile._id });
      await Leave.deleteMany({ employeeId: profile._id });
      await Salary.deleteMany({ employeeId: profile._id });
      if (profile.managerId) await Manager.findByIdAndUpdate(profile.managerId, { $pull: { employeesUnder: profile._id } });
    }
    if (profile) await ProfileModel.findByIdAndDelete(profile._id);
    if (user) await User.findByIdAndDelete(user._id);
    res.status(200).json({ success: true, message: `${userType} deleted.`, data: { deletedEmail: user?.email } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user.', error: error.message });
  }
};

const getAllAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 10, date = '', employeeId = '', status = '' } = req.query;
    const query = {};
    if (date) {
      const d = new Date(date); d.setHours(0,0,0,0);
      query.date = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    }
    if (employeeId) query.employeeId = employeeId;
    if (status) query.status = status;
    const records = await Attendance.find(query)
      .populate({ path: 'employeeId', select: 'firstName lastName employeeCode department designation phoneNumber', populate: { path: 'userId', select: 'email' } })
      .populate('managerId', 'firstName lastName')
      .sort({ date: -1 }).limit(limit * 1).skip((page - 1) * limit);
    const count = await Attendance.countDocuments(query);
    res.status(200).json({ success: true, data: { attendance: records, totalPages: Math.ceil(count / limit), currentPage: page, totalRecords: count } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance.', error: error.message });
  }
};

const manageHoliday = async (req, res) => {
  try {
    const { holidayId } = req.params;
    const holidayData = req.body;
    if (!holidayData.name || !holidayData.date) return res.status(400).json({ success: false, message: 'Holiday name and date are required.' });
    const holidayDate = new Date(holidayData.date);
    const obj = { name: holidayData.name.trim(), date: holidayDate, year: holidayDate.getFullYear(), month: holidayDate.getMonth() + 1, description: holidayData.description || '', isRecurring: holidayData.isRecurring || false };
    if (holidayId) {
      const holiday = await Holiday.findByIdAndUpdate(holidayId, { $set: obj }, { new: true });
      if (!holiday) return res.status(404).json({ success: false, message: 'Holiday not found.' });
      return res.status(200).json({ success: true, message: 'Holiday updated.', data: { holiday } });
    }
    const start = new Date(holidayDate); start.setHours(0,0,0,0);
    const end = new Date(holidayDate); end.setHours(23,59,59,999);
    const existing = await Holiday.findOne({ date: { $gte: start, $lte: end } });
    if (existing) return res.status(400).json({ success: false, message: `Holiday already exists on this date.` });
    obj.createdBy = req.user?.userId;
    const holiday = new Holiday(obj);
    await holiday.save();
    res.status(201).json({ success: true, message: 'Holiday created.', data: { holiday } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to manage holiday.', error: error.message });
  }
};

const getSummaryReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeId, department } = req.query;
    const query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) { const s = new Date(startDate); s.setHours(0,0,0,0); query.date.$gte = s; }
      if (endDate) { const e = new Date(endDate); e.setHours(23,59,59,999); query.date.$lte = e; }
    }
    if (employeeId) query.employeeId = employeeId;
    const records = await Attendance.find(query)
      .populate({ path: 'employeeId', select: 'firstName lastName employeeCode department designation', populate: { path: 'userId', select: 'email' } })
      .populate('managerId', 'firstName lastName').sort({ date: -1 });
    let filtered = records;
    if (department) filtered = records.filter(r => r.employeeId?.department === department);
    res.status(200).json({
      success: true,
      data: {
        records: filtered,
        statistics: {
          total: filtered.length,
          present: filtered.filter(r => r.status === 'present').length,
          absent: filtered.filter(r => r.status === 'absent').length,
          late: filtered.filter(r => r.isLate === true).length,
          // ✅ BOTH leave statuses
          leave: filtered.filter(r => ['leave', 'on-leave'].includes(r.status)).length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch report.', error: error.message });
  }
};

const getAllHolidays = async (req, res) => {
  try {
    const { year } = req.query;
    const query = year ? { year: parseInt(year) } : {};
    const holidays = await Holiday.find(query).sort({ date: 1 }).populate('createdBy', 'email');
    res.status(200).json({ success: true, data: { holidays } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch holidays.', error: error.message });
  }
};

const deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.holidayId);
    if (!holiday) return res.status(404).json({ success: false, message: 'Holiday not found.' });
    res.status(200).json({ success: true, message: 'Holiday deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete holiday.', error: error.message });
  }
};

const getMonthlyConfig = async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    const configs = await MonthlyConfig.find(query).sort({ year: -1, month: -1 }).populate('createdBy', 'email');
    res.status(200).json({ success: true, data: { configs } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch config.', error: error.message });
  }
};

const updateMonthlyConfig = async (req, res) => {
  try {
    const { configId } = req.params;
    if (configId) {
      const config = await MonthlyConfig.findByIdAndUpdate(configId, { $set: req.body }, { new: true });
      if (!config) return res.status(404).json({ success: false, message: 'Config not found.' });
      return res.status(200).json({ success: true, message: 'Config updated.', data: { config } });
    }
    const config = new MonthlyConfig({ ...req.body, createdBy: req.user.userId });
    await config.save();
    res.status(201).json({ success: true, message: 'Config created.', data: { config } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update config.', error: error.message });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ success: false, message: 'Invalid ID format' });
    const employee = await Employee.findById(id).populate('userId', 'email username role createdAt').populate('managerId', 'firstName lastName email phoneNumber').lean();
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.status(200).json({ success: true, data: { employee } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch employee.', error: error.message });
  }
};

const getAllLeaves = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', employeeId = '' } = req.query;
    const query = {};
    if (status) query.status = status;
    if (employeeId) query.employeeId = employeeId;
    const leaves = await Leave.find(query).populate('employeeId', 'firstName lastName employeeCode').populate('managerId', 'firstName lastName').populate('approvedBy', 'email').sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit);
    const count = await Leave.countDocuments(query);
    res.status(200).json({ success: true, data: { leaves, totalPages: Math.ceil(count / limit), currentPage: page, totalLeaves: count } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch leaves.', error: error.message });
  }
};

const getSettings = async (req, res) => {
  try {
    res.status(200).json({ success: true, data: { settings: { workingHours: 8, lateArrivalGracePeriod: 15, overtimeRate: 1.5, weekends: ['Saturday', 'Sunday'], leaveTypes: ['sick', 'casual', 'annual', 'unpaid', 'emergency', 'maternity', 'paternity'] } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch settings.', error: error.message });
  }
};

const forceDeleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findByIdAndDelete(employeeId);
    if (employee) {
      if (employee.userId) await User.findByIdAndDelete(employee.userId);
      if (employee.managerId) await Manager.findByIdAndUpdate(employee.managerId, { $pull: { employeesUnder: employee._id } });
      return res.status(200).json({ success: true, message: 'Employee deleted.' });
    }
    res.status(404).json({ success: false, message: 'Employee not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete.', error: error.message });
  }
};

const getSystemConfig = async (req, res) => {
  try {
    let config = await SystemConfig.findOne({ isActive: true }).populate('createdBy', 'email').populate('updatedBy', 'email');
    if (!config) {
      config = new SystemConfig({ workingDays: ['Monday','Tuesday','Wednesday','Thursday','Friday'], workingHours: { startTime: '10:00', endTime: '19:00', lateEntryTime: '10:30' }, breakTime: 60, leavePolicy: { allowedLeaves: 2, autoAbsentOnExceed: true }, weekendDays: ['Saturday','Sunday'], isActive: true, createdBy: req.user.userId });
      await config.save();
    }
    res.status(200).json({ success: true, data: { config } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch config.', error: error.message });
  }
};

const createSystemConfig = async (req, res) => {
  try {
    await SystemConfig.updateMany({ isActive: true }, { $set: { isActive: false } });
    const config = new SystemConfig({ ...req.body, isActive: true, createdBy: req.user.userId, effectiveFrom: new Date() });
    await config.save();
    res.status(201).json({ success: true, message: 'Config created.', data: { config } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create config.', error: error.message });
  }
};

const updateSystemConfig = async (req, res) => {
  try {
    const config = await SystemConfig.findByIdAndUpdate(req.params.configId, { $set: { ...req.body, updatedBy: req.user.userId } }, { new: true }).populate('createdBy', 'email').populate('updatedBy', 'email');
    if (!config) return res.status(404).json({ success: false, message: 'Config not found.' });
    try { await notificationService.sendAnnouncement('⚙️ System Settings Updated', 'System settings have been updated by admin.', 'all'); } catch (e) {}
    res.status(200).json({ success: true, message: 'Config updated.', data: { config } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update config.', error: error.message });
  }
};

const fixEmployeeManagerLinks = async (req, res) => {
  try {
    const employees = await Employee.find({ managerId: { $exists: true, $ne: null } });
    let fixed = 0, alreadyLinked = 0;
    for (const emp of employees) {
      const manager = await Manager.findById(emp.managerId);
      if (!manager) continue;
      const linked = manager.employeesUnder.some(id => id.toString() === emp._id.toString());
      if (!linked) { await Manager.findByIdAndUpdate(emp.managerId, { $addToSet: { employeesUnder: emp._id } }); fixed++; }
      else alreadyLinked++;
    }
    res.status(200).json({ success: true, message: `Fixed: ${fixed}, Already linked: ${alreadyLinked}`, data: { fixed, alreadyLinked } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fix links.', error: error.message });
  }
};

module.exports = {
  getDashboard,
  createManager,
  createEmployee,
  getAllManagers,
  getAllEmployees,
  getEmployeeById,
  getUserDetails,
  updateUser,
  deleteUser,
  getAllAttendance,
  manageHoliday,
  getAllHolidays,
  deleteHoliday,
  getMonthlyConfig,
  updateMonthlyConfig,
  getAllLeaves,
  getSettings,
  getSummaryReport,
  forceDeleteEmployee,
  getSystemConfig,
  createSystemConfig,
  updateSystemConfig,
  fixEmployeeManagerLinks
};