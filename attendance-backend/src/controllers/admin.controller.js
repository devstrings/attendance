const User = require('../models/User');
const Employee = require('../models/Employee');
const Manager = require('../models/Manager');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Holiday = require('../models/Holiday');
const MonthlyConfig = require('../models/MonthlyConfig');
const Salary = require('../models/Salary');
const SystemConfig = require('../models/SystemConfig'); // ✅ SIRF YAHAN RAKHO
const { generateToken } = require('../utils/jwtHandler');
const { sendEmail } = require('../utils/emailService');
const { validateEmail } = require('../utils/validators');

/**
 * Admin Dashboard
 */
/**
 * Admin Dashboard - WITH DELETED EMPLOYEE FILTER
 */
/**
 * Admin Dashboard - WITH WORKING DAYS CHECK
 */
const getDashboard = async (req, res) => {
  try {
    console.log('📊 Fetching admin dashboard data...');
    
    // ✅ Count only ACTIVE employees and managers
    const totalEmployees = await Employee.countDocuments({ isActive: true });
    const totalManagers = await Manager.countDocuments({ isActive: true });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // ✅ Get system configuration to check working days
    const systemConfig = await SystemConfig.findOne({ isActive: true });
    
    // ✅ Check if today is a working day
    const todayDayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    const isWorkingDay = systemConfig?.workingDays?.includes(todayDayName) || false;
    
    console.log('📅 Today:', todayDayName);
    console.log('💼 Working Days:', systemConfig?.workingDays);
    console.log('✅ Is Working Day?', isWorkingDay);
    
    // ✅ Get list of ACTIVE employee IDs
    const activeEmployeeIds = await Employee.find({ isActive: true }).distinct('_id');
    
    console.log('✅ Active employee IDs:', activeEmployeeIds.length);
    
    let todayAttendance = 0;
    let absentToday = 0;
    
    // ✅ Only calculate attendance if today is a working day
    if (isWorkingDay) {
      // Count attendance ONLY for active employees
      todayAttendance = await Attendance.countDocuments({
        date: { $gte: today },
        status: { $in: ['present', 'half-day', 'late'] },
        employeeId: { $in: activeEmployeeIds }
      });
      
      // Count leaves for today
      const onLeaveToday = await Attendance.countDocuments({
        date: { $gte: today },
        status: { $in: ['on-leave', 'leave'] },
        employeeId: { $in: activeEmployeeIds }
      });
      
      // ✅ Absent = Total Active Employees - Present - On Leave
      absentToday = Math.max(0, totalEmployees - todayAttendance - onLeaveToday);
      
      console.log('📊 Working Day Stats:', {
        totalEmployees,
        todayAttendance,
        onLeaveToday,
        absentToday
      });
    } else {
      // ✅ Non-working day: No attendance expected
      console.log('🏖️ Today is NOT a working day - No attendance expected');
      todayAttendance = 0;
      absentToday = 0;
    }

    // ✅ Count pending leaves ONLY for active employees
    const pendingLeaves = await Leave.countDocuments({ 
      status: 'pending',
      employeeId: { $in: activeEmployeeIds }
    });

    // ✅ Get recent ACTIVE employees only
    const recentEmployees = await Employee.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'email isActive')
      .populate('managerId', 'firstName lastName');

    console.log('✅ Dashboard stats:', {
      totalEmployees,
      totalManagers,
      todayAttendance,
      absentToday,
      pendingLeaves,
      isWorkingDay,
      todayDayName
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalEmployees,
          totalManagers,
          todayAttendance,
          absentToday,
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
/**
 * Create Manager - WITH DETAILED LOGGING
 */
const createManager = async (req, res) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 CREATE MANAGER REQUEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      cnic,
      dateOfBirth,
      address,
      joiningDate,
      department,
      designation,
      salary,
      bankDetails,
      emergencyContact
    } = req.body;

    // ✅ CHECK REQUIRED FIELDS
    console.log('🔍 Checking required fields...');
    console.log('firstName:', firstName ? '✅' : '❌');
    console.log('lastName:', lastName ? '✅' : '❌');
    console.log('email:', email ? '✅' : '❌');
    console.log('password:', password ? '✅' : '❌');
    console.log('phoneNumber:', phoneNumber ? '✅' : '❌');

    if (!email || !password || !firstName || !lastName || !phoneNumber) {
      console.log('❌ VALIDATION FAILED - Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Required fields missing: email, password, firstName, lastName, phoneNumber',
        received: {
          email: !!email,
          password: !!password,
          firstName: !!firstName,
          lastName: !!lastName,
          phoneNumber: !!phoneNumber
        }
      });
    }

    console.log('✅ All required fields present');

    // Validate email format
    if (!validateEmail(email)) {
      console.log('❌ Invalid email format:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.'
      });
    }

    console.log('✅ Email format valid');

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('❌ Email already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists.'
      });
    }

    console.log('✅ Email available');

    // Check CNIC if provided
    if (cnic) {
      const existingCNIC = await Manager.findOne({ cnic, isActive: true });
      if (existingCNIC) {
        console.log('❌ CNIC already exists:', cnic);
        return res.status(400).json({
          success: false,
          message: 'Manager with this CNIC already exists.'
        });
      }
    }

    console.log('✅ CNIC check passed');
    console.log('📝 Creating user account...');

    // Create user account
    const user = new User({
      email: email.toLowerCase(),
      password,
      role: 'manager',
      isActive: true,
      createdBy: req.user.userId
    });

    await user.save();
    console.log('✅ User account created:', user._id);

    console.log('📝 Creating manager profile...');

    // Create manager profile
    const manager = new Manager({
      userId: user._id,
      firstName,
      lastName,
      phoneNumber,
      cnic: cnic || '',
      dateOfBirth,
      address: address || '',
      joiningDate: joiningDate || new Date(),
      department: department || 'General',
      designation: designation || 'Manager',
      salary: salary || 0,
      bankDetails,
      emergencyContact
    });

    await manager.save();
    console.log('✅ Manager profile created:', manager._id);

    // Send welcome email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Welcome to Devstrings',
        html: `<h2>Welcome ${firstName}!</h2><p>Password: ${password}</p>`
      });
      console.log('✅ Welcome email sent');
    } catch (e) {
      console.log('⚠️ Email failed:', e.message);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ MANAGER CREATED SUCCESSFULLY');
    console.log('   Manager ID:', manager._id);
    console.log('   User ID:', user._id);
    console.log('   Email:', user.email);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    res.status(201).json({
      success: true,
      message: 'Manager created successfully.',
      data: { manager }
    });

  } catch (error) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ ERROR CREATING MANAGER');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    res.status(500).json({
      success: false,
      message: 'Failed to create manager.',
      error: error.message
    });
  }
};

/**
 * Create Employee
 */
const createEmployee = async (req, res) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 CREATE EMPLOYEE REQUEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));

    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      cnic,
      dateOfBirth,
      address,
      managerId,
      department,
      designation,
      employmentType,
      salary,
      joiningDate,
      workSchedule
    } = req.body;

    // ✅ REQUIRED FIELD VALIDATION
    console.log('🔍 Validating required fields...');
    if (!email || !password || !firstName || !lastName || !phoneNumber) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, last name, and phone number are required.',
        received: {
          email: !!email,
          password: !!password,
          firstName: !!firstName,
          lastName: !!lastName,
          phoneNumber: !!phoneNumber
        }
      });
    }

    console.log('✅ All required fields present');

    // ✅ EMAIL VALIDATION
    if (!validateEmail(email)) {
      console.log('❌ Invalid email format:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.'
      });
    }

    console.log('✅ Email format valid');

    // ✅ CHECK EXISTING EMAIL
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('❌ Email already registered:', email);
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please use a different email.'
      });
    }

    console.log('✅ Email available');

    // ✅ VALIDATE MANAGER IF PROVIDED
    if (managerId) {
      console.log('🔍 Validating manager ID:', managerId);
      const manager = await Manager.findById(managerId);
      if (!manager) {
        console.log('❌ Manager not found:', managerId);
        return res.status(404).json({
          success: false,
          message: 'Manager not found. Please select a valid manager.'
        });
      }
      console.log('✅ Manager validated:', manager.firstName, manager.lastName);
    }

    // ✅ IMPROVED CNIC VALIDATION - Only check if CNIC is provided and not empty
    if (cnic && cnic.trim() !== '') {
      console.log('🔍 Checking CNIC:', cnic);
      const existingCNIC = await Employee.findOne({ 
        cnic: cnic.trim(), 
        isActive: true 
      });
      
      if (existingCNIC) {
        console.log('❌ CNIC already exists:', cnic);
        return res.status(400).json({
          success: false,
          message: `Employee with CNIC ${cnic} already exists.`
        });
      }
      console.log('✅ CNIC available');
    } else {
      console.log('ℹ️ No CNIC provided, skipping CNIC check');
    }

    // ✅ GENERATE UNIQUE EMPLOYEE CODE
    console.log('📝 Generating employee code...');
    let employeeCode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const employeeCount = await Employee.countDocuments();
      employeeCode = `EMP${String(employeeCount + attempts + 1).padStart(4, '0')}`;
      
      const existingCode = await Employee.findOne({ employeeCode });
      if (!existingCode) {
        isUnique = true;
        console.log('✅ Generated unique employee code:', employeeCode);
      } else {
        attempts++;
        console.log(`⚠️ Code ${employeeCode} exists, trying again... (attempt ${attempts})`);
      }
    }

    if (!isUnique) {
      console.log('❌ Failed to generate unique employee code');
      return res.status(500).json({
        success: false,
        message: 'Failed to generate unique employee code. Please try again.'
      });
    }

    // ✅ CREATE USER ACCOUNT
    console.log('📝 Creating user account...');
    const user = new User({
      email: email.toLowerCase(),
      password,
      role: 'employee',
      isActive: true,
      createdBy: req.user.userId
    });

    await user.save();
    console.log('✅ User account created:', user._id);

    // ✅ CREATE EMPLOYEE PROFILE
    console.log('📝 Creating employee profile...');
    const employee = new Employee({
      userId: user._id,
      managerId: managerId || null,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      employeeCode,
      phoneNumber: phoneNumber.trim(),
      cnic: cnic ? cnic.trim() : null, // ✅ Store null instead of empty string
      dateOfBirth: dateOfBirth || null,
      address: address ? address.trim() : null,
      department: department || 'General',
      designation: designation || 'Employee',
      employmentType: employmentType || 'full-time',
      salary: salary || 0,
      joiningDate: joiningDate || new Date(),
      workSchedule: workSchedule || {
        shiftStartTime: '09:00',
        shiftEndTime: '17:00',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      }
    });

    await employee.save();
    console.log('✅ Employee profile created:', employee._id);

    // ✅ ADD TO MANAGER'S LIST
    if (managerId) {
      await Manager.findByIdAndUpdate(
        managerId,
        { $addToSet: { employeesUnder: employee._id } },
        { new: true }
      );
      console.log('✅ Employee added to manager list');
    }

    // ✅ SEND WELCOME EMAIL (non-blocking)
    try {
      await sendEmail({
        to: user.email,
        subject: 'Welcome to Devstrings',
        html: `
          <h2>Welcome ${firstName} ${lastName}!</h2>
          <p>Your employee account has been created.</p>
          <p><strong>Employee Code:</strong> ${employeeCode}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Temporary Password:</strong> ${password}</p>
          <p>Please change your password after first login.</p>
        `
      });
      console.log('✅ Welcome email sent');
    } catch (emailError) {
      console.log('⚠️ Email failed (non-critical):', emailError.message);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ EMPLOYEE CREATED SUCCESSFULLY');
    console.log('   Employee ID:', employee._id);
    console.log('   User ID:', user._id);
    console.log('   Employee Code:', employeeCode);
    console.log('   Email:', user.email);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    res.status(201).json({
      success: true,
      message: 'Employee created successfully.',
      data: {
        employee: {
          _id: employee._id,
          employeeCode: employee.employeeCode,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: user.email,
          department: employee.department,
          designation: employee.designation
        }
      }
    });

  } catch (error) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ ERROR CREATING EMPLOYEE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // ✅ Provide user-friendly error messages
    let errorMessage = 'Failed to create employee.';
    
    if (error.code === 11000) {
      // MongoDB duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      errorMessage = `Duplicate ${field}. This ${field} is already registered.`;
    } else if (error.name === 'ValidationError') {
      errorMessage = Object.values(error.errors).map(e => e.message).join(', ');
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get All Managers
 */
const getAllManagers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', department = '' } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { cnic: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) {
      query.department = department;
    }

    const managers = await Manager.find(query)
      .populate('userId', 'email isActive lastLogin')
      .populate('employeesUnder', 'firstName lastName employeeCode')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Manager.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        managers,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalManagers: count
      }
    });
  } catch (error) {
    console.error('Get all managers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch managers.',
      error: error.message
    });
  }
};

/**
 * ✅ FIXED: Get All Employees
 * Properly populates userId field
 */
const getAllEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', department = '', managerId = '' } = req.query;

    console.log('📋 Fetching employees with params:', { page, limit, search, department, managerId });

    const query = { isActive: true };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } },
        { cnic: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) {
      query.department = department;
    }

    if (managerId) {
      query.managerId = managerId;
    }

    const employees = await Employee.find(query)
      .populate('userId', 'email isActive lastLogin') // ✅ This populates userId
      .populate('managerId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean(); // ✅ Convert to plain JavaScript objects

    const count = await Employee.countDocuments(query);

    // ✅ CRITICAL: Verify userId is populated
    console.log('✅ Employees fetched:', employees.length);
    if (employees.length > 0) {
      console.log('📊 First employee userId check:', {
        employeeId: employees[0]._id,
        userId: employees[0].userId,
        userIdType: typeof employees[0].userId
      });
    }

    res.status(200).json({
      success: true,
      data: {
        employees,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalEmployees: count
      }
    });
  } catch (error) {
    console.error('❌ Get all employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees.',
      error: error.message
    });
  }
};

/**
 * ✅ COMPLETELY FIXED: Get User Details
 * Handles BOTH userId and employeeId/managerId
 */
/**
 * ✅ COMPLETELY FIXED: Get User Details
 * Handles BOTH userId and employeeId/managerId
 */
/**
 * ✅ COMPLETELY FIXED: Get User Details
 * Handles BOTH Employee._id and User._id
 * Auto-fixes missing userId in profiles
 */
const getUserDetails = async (req, res) => {
  try {
    console.log('═══════════════════════════════════');
    console.log('🔍 getUserDetails CALLED');
    console.log('   userId:', req.params.userId);
    console.log('   userType:', req.params.userType);
    console.log('═══════════════════════════════════');

    const { userId, userType } = req.params;

    // Validate userType
    if (!['manager', 'employee'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type. Must be "manager" or "employee".'
      });
    }

    const ProfileModel = userType === 'manager' ? Manager : Employee;
    const populateField = userType === 'manager' ? 'employeesUnder' : 'managerId';
    const populateSelect = userType === 'manager' 
      ? 'firstName lastName email employeeCode' 
      : 'firstName lastName email';

    let user = null;
    let profile = null;
    console.log(`🔎 Strategy 1: Searching ${userType} profile by _id...`);

    // ✅ STRATEGY 1: Try finding Profile by _id first (most common from frontend)
      profile = await ProfileModel.findById(userId)
      .populate('userId')
      .populate(populateField, populateSelect);

     if (profile) {
      console.log('✅ Found profile by Profile._id:', profile._id);
      
      // Check if userId exists and is valid
      if (profile.userId) {
        const userIdValue = profile.userId._id || profile.userId;
        user = await User.findById(userIdValue).select('-password');
        
        
         if (user) {
          console.log('✅ Found user via profile.userId:', user._id);
          
          return res.status(200).json({
            success: true,
            data: { user, profile }
          });
        }
      }
      
      // ✅ AUTO-FIX: If userId is null, try to find matching user
      console.log('⚠️ Profile.userId is null/invalid, attempting auto-fix...');
      
      // Try to find user by email pattern matching
      const searchPatterns = [
        profile.cnic,
        profile.phoneNumber,
        profile.employeeCode
      ].filter(Boolean);

       for (const pattern of searchPatterns) {
        // Search by CNIC in other profiles
        const relatedProfile = await ProfileModel.findOne({ 
          cnic: pattern,
          userId: { $exists: true, $ne: null }
        });
        
        if (relatedProfile?.userId) {
          user = await User.findById(relatedProfile.userId).select('-password');
          if (user && user.role === userType) {
            console.log('✅ Found user by pattern matching');
          
          // Auto-fix: Update profile with correct userId
           profile.userId = user._id;
            await profile.save();
            console.log('✅ AUTO-FIXED: Updated profile.userId');
          
          // Re-populate profile
          profile = await ProfileModel.findById(profile._id)
              .populate('userId')
              .populate(populateField, populateSelect);
            
            return res.status(200).json({
              success: true,
              data: { user, profile },
              message: 'Profile auto-fixed successfully'
            });
          }
        }
      }
      
      console.log('❌ No matching user account found for this profile');

       return res.status(404).json({
        success: false,
        message: `${userType} profile exists but no user account found. Please contact admin.`,
        debugInfo: {
          profileId: profile._id,
          profileName: `${profile.firstName} ${profile.lastName}`,
          cnic: profile.cnic,
          employeeCode: profile.employeeCode
        }
      });
    }

      console.log('🔎 Strategy 2: Searching user by User._id...');
      user = await User.findById(userId).select('-password');

    if (user) {
      console.log('✅ Found user by User._id:', user._id);
      profile = await ProfileModel.findOne({ userId: user._id })
        .populate(populateField, populateSelect);

         if (!profile) {
        return res.status(404).json({
          success: false,
          message: `User account exists but ${userType} profile not found.`
        });
      }

      console.log('✅ Found profile via User._id:', profile._id);
      
      return res.status(200).json({
        success: true,
        data: { user, profile }
      });
    }

    // ✅ NOT FOUND
    console.error('❌ User/Profile not found with any strategy');
    return res.status(404).json({
      success: false,
      message: 'User not found.'
    });

   } catch (error) {
    console.error('❌ Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details.',
      error: error.message
    });
  }
};
/**
 * Update User
 */
/**
 * ✅ FIXED: Update User
 * Handles BOTH Employee._id and User._id
 */
const updateUser = async (req, res) => {
  try {
    const { userId, userType } = req.params;
    const updateData = req.body;

    console.log('📝 Updating user:', { userId, userType, updateData });

    if (!['manager', 'employee'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type.'
      });
    }

    const ProfileModel = userType === 'manager' ? Manager : Employee;
    let user = null;
    let profile = null;

    // ✅ STRATEGY 1: Try as Profile._id first (most common from frontend)
    profile = await ProfileModel.findById(userId);

    if (profile) {
      console.log('✅ Found profile by Profile._id:', profile._id);
      
      // Get user from profile.userId
      if (profile.userId) {
        user = await User.findById(profile.userId);
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User account not found for this profile.'
        });
      }

      console.log('✅ Found user:', user._id);

      // Update user email if changed
       if (updateData.email && updateData.email !== user.email) {
        const existingEmail = await User.findOne({ 
          email: updateData.email.toLowerCase(),
          _id: { $ne: user._id }
        });

       if (existingEmail) {
          return res.status(400).json({
            success: false,
            message: 'Email already in use.'
          });
        }
         user.email = updateData.email.toLowerCase();
        await user.save();
        console.log('✅ User email updated');
      }

      // Update profile
      const populateField = userType === 'manager' ? 'employeesUnder' : 'managerId';
      const populateSelect = userType === 'manager' 
        ? 'firstName lastName employeeCode' 
        : 'firstName lastName email';

      profile = await ProfileModel.findByIdAndUpdate(
        profile._id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate(populateField, populateSelect);

      console.log('✅ Profile updated:', profile._id);

      return res.status(200).json({
        success: true,
        message: `${userType} updated successfully.`,
        data: { user, profile }
      });
    }

    // ✅ STRATEGY 2: Try as User._id (fallback)
    cconsole.log('⚠️ Not found as Profile._id, trying as User._id...');


   user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    nsole.log('✅ Found user by User._id:', user._id);
    // Update email if changed
    if (updateData.email && updateData.email !== user.email) {
      const existingEmail = await User.findOne({ 
        email: updateData.email.toLowerCase(),
        _id: { $ne: userId }
      });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use.'
        });
      }

      user.email = updateData.email.toLowerCase();
      await user.save();
    }

    // Update profile
    const populateField = userType === 'manager' ? 'employeesUnder' : 'managerId';
    const populateSelect = userType === 'manager' 
      ? 'firstName lastName employeeCode' 
      : 'firstName lastName email';

    profile = await ProfileModel.findOneAndUpdate(
      { userId: user._id },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate(populateField, populateSelect);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `${userType} profile not found.`
      });
    }

    console.log('✅ Profile updated via User._id');

    res.status(200).json({
      success: true,
      message: `${userType} updated successfully.`,
      data: { user, profile }
    });

  } catch (error) {
    console.error('❌ Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user.',
      error: error.message
    });
  }
};

/**
 * ✅ COMPLETE FIX: Delete User (Hard Delete)
 */
/**
 * ✅ ENHANCED: Delete User with Attendance Cleanup
 */
const deleteUser = async (req, res) => {
  try {
    const { userId, userType } = req.params;

    console.log('═══════════════════════════════════');
    console.log(`🗑️ DELETE REQUEST - ${userType.toUpperCase()}`);
    console.log('   userId:', userId);
    console.log('   userType:', userType);
    console.log('═══════════════════════════════════');

    // Validate userType
    if (!['manager', 'employee'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type. Must be "manager" or "employee".'
      });
    }

    const ProfileModel = userType === 'manager' ? Manager : Employee;
    let user = null;
    let profile = null;

    // ✅ STRATEGY 1: Try as Profile._id (most common)
    console.log(`🔎 Strategy 1: Finding ${userType} by Profile._id...`);
    
    profile = await ProfileModel.findById(userId);

    if (profile) {
      console.log('✅ Found profile by Profile._id:', profile._id);
      console.log('📧 Profile name:', `${profile.firstName} ${profile.lastName}`);

      // Get user from profile.userId
      if (profile.userId) {
        user = await User.findById(profile.userId);
        
        if (user) {
          console.log('✅ Found user via profile.userId:', user._id);
          console.log('📧 User email:', user.email);
        }
      }

      // Check if manager has employees
      if (userType === 'manager' && profile.employeesUnder && profile.employeesUnder.length > 0) {
        console.log('❌ Cannot delete - Manager has employees assigned');
        return res.status(400).json({
          success: false,
          message: `Cannot delete manager. ${profile.employeesUnder.length} employee(s) are assigned. Please reassign them first.`
        });
      }

      // ✅ NEW: Delete all attendance records for this employee
      if (userType === 'employee') {
        const deletedAttendance = await Attendance.deleteMany({
          employeeId: profile._id
        });
        console.log(`✅ Deleted ${deletedAttendance.deletedCount} attendance records`);
        
        // ✅ Delete all leave requests for this employee
        const deletedLeaves = await Leave.deleteMany({
          employeeId: profile._id
        });
        console.log(`✅ Deleted ${deletedLeaves.deletedCount} leave requests`);
        
        // ✅ Delete all salary records for this employee
        const deletedSalaries = await Salary.deleteMany({
          employeeId: profile._id
        });
        console.log(`✅ Deleted ${deletedSalaries.deletedCount} salary records`);
      }

      // Remove employee from manager's list if applicable
      if (userType === 'employee' && profile.managerId) {
        await Manager.findByIdAndUpdate(
          profile.managerId,
          { $pull: { employeesUnder: profile._id } }
        );
        console.log('✅ Employee removed from manager\'s list');
      }

      // Delete the profile
      await ProfileModel.findByIdAndDelete(profile._id);
      console.log(`✅ ${userType} profile DELETED from database`);

      // Delete user account if exists
      if (user) {
        await User.findByIdAndDelete(user._id);
        console.log('✅ User account DELETED from database');
        console.log(`📧 Email ${user.email} is now available for new registration`);
      }

      return res.status(200).json({
        success: true,
        message: `${userType.charAt(0).toUpperCase() + userType.slice(1)} and all related records permanently deleted.`,
        data: {
          deletedProfile: profile._id,
          deletedEmail: user?.email || 'N/A'
        }
      });
    }

    // ✅ STRATEGY 2: Try as User._id (fallback) - same logic as above
    console.log('🔎 Strategy 2: Finding by User._id...');
    
    user = await User.findById(userId);

    if (!user) {
      console.error('❌ User not found with either strategy');
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    console.log('✅ Found user by User._id:', user._id);

    // Verify role matches
    if (user.role.toLowerCase() !== userType.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: `User role mismatch. Expected ${userType} but found ${user.role}.`
      });
    }

    // Find and delete profile
    profile = await ProfileModel.findOne({ userId: user._id });

    if (!profile) {
      console.log('⚠️ Profile not found, deleting user account only');
      
      await User.findByIdAndDelete(user._id);
      console.log('✅ User account DELETED');
      
      return res.status(200).json({
        success: true,
        message: 'User account deleted (profile not found).',
        data: { deletedEmail: user.email }
      });
    }

    // Check if manager has employees
    if (userType === 'manager' && profile.employeesUnder && profile.employeesUnder.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete manager. ${profile.employeesUnder.length} employee(s) are assigned.`
      });
    }

    // ✅ Delete all related records for employee
    if (userType === 'employee') {
      await Attendance.deleteMany({ employeeId: profile._id });
      await Leave.deleteMany({ employeeId: profile._id });
      await Salary.deleteMany({ employeeId: profile._id });
      console.log('✅ Deleted all attendance, leave, and salary records');
    }

    // Remove from manager's list
    if (userType === 'employee' && profile.managerId) {
      await Manager.findByIdAndUpdate(
        profile.managerId,
        { $pull: { employeesUnder: profile._id } }
      );
    }

    // Delete profile and user
    await ProfileModel.findByIdAndDelete(profile._id);
    await User.findByIdAndDelete(user._id);

    console.log('✅ User and all related records DELETED');

    res.status(200).json({
      success: true,
      message: `${userType.charAt(0).toUpperCase() + userType.slice(1)} and all related records permanently deleted.`,
      data: {
        deletedProfile: profile._id,
        deletedEmail: user.email
      }
    });

  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user.',
      error: error.message
    });
  }
};

/**
 * Get All Attendance
 */
const getAllAttendance = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      date = '', 
      employeeId = '', 
      status = '' 
    } = req.query;

    const query = {};

    if (date) {
      const dateObj = new Date(date);
      dateObj.setHours(0, 0, 0, 0);
      query.date = { $gte: dateObj, $lt: new Date(dateObj.getTime() + 24 * 60 * 60 * 1000) };
    }

    if (employeeId) {
      query.employeeId = employeeId;
    }

    if (status) {
      query.status = status;
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('employeeId', 'firstName lastName employeeCode department designation phoneNumber userId')
      .populate({
        path: 'employeeId',
        populate: {
          path: 'userId',
          select: 'email'
        }
      })
      .populate('managerId', 'firstName lastName')
      .sort({ date: -1, clockIn: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Attendance.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        attendance: attendanceRecords,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalRecords: count
      }
    });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records.',
      error: error.message
    });
  }
};

/**
 * Manage Holiday
 */
/**
 * ✅ FIXED: Manage Holiday (Create/Update)
 */
/**
 * ✅ COMPLETE FIX: Manage Holiday
 */
const manageHoliday = async (req, res) => {
  try {
    const { holidayId } = req.params;
    const holidayData = req.body;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📅 MANAGE HOLIDAY REQUEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Holiday ID:', holidayId);
    console.log('Request Body:', JSON.stringify(holidayData, null, 2));
    console.log('User ID:', req.user?.userId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ✅ Validation
    if (!holidayData.name || !holidayData.date) {
      console.log('❌ Validation failed: Missing name or date');
      return res.status(400).json({
        success: false,
        message: 'Holiday name and date are required.'
      });
    }

    // ✅ Extract year and month from date
    const holidayDate = new Date(holidayData.date);
    const year = holidayDate.getFullYear();
    const month = holidayDate.getMonth() + 1; // 0-indexed

    console.log('✅ Extracted - Year:', year, 'Month:', month);

    // ✅ Prepare holiday object
    const holidayObject = {
      name: holidayData.name.trim(),
      date: holidayDate,
      year: year,
      month: month,
      description: holidayData.description || '',
      isRecurring: holidayData.isRecurring || false
    };

    console.log('📦 Holiday Object:', JSON.stringify(holidayObject, null, 2));

    // ✅ UPDATE EXISTING HOLIDAY
    if (holidayId) {
      console.log('🔄 UPDATE MODE - Holiday ID:', holidayId);

      const holiday = await Holiday.findByIdAndUpdate(
        holidayId,
        { $set: holidayObject },
        { new: true, runValidators: true }
      );

      if (!holiday) {
        console.log('❌ Holiday not found');
        return res.status(404).json({
          success: false,
          message: 'Holiday not found.'
        });
      }

      console.log('✅ Holiday updated successfully:', holiday._id);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return res.status(200).json({
        success: true,
        message: 'Holiday updated successfully.',
        data: { holiday }
      });
    }

    // ✅ CREATE NEW HOLIDAY
    console.log('➕ CREATE MODE - New holiday');

    // Check for duplicate on same date
    const startOfDay = new Date(holidayDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(holidayDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingHoliday = await Holiday.findOne({
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    if (existingHoliday) {
      console.log('⚠️ Duplicate holiday found:', existingHoliday.name);
      return res.status(400).json({
        success: false,
        message: `A holiday "${existingHoliday.name}" already exists on ${holidayDate.toLocaleDateString()}.`
      });
    }

    // Add createdBy
    holidayObject.createdBy = req.user?.userId;

    console.log('💾 Saving holiday to database...');

    const holiday = new Holiday(holidayObject);
    await holiday.save();

    console.log('✅ Holiday created successfully:', holiday._id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return res.status(201).json({
      success: true,
      message: 'Holiday created successfully.',
      data: { holiday }
    });

  } catch (error) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ MANAGE HOLIDAY ERROR');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    res.status(500).json({
      success: false,
      message: 'Failed to manage holiday.',
      error: error.message
    });
  }
};

/**
 * Get Summary Report
 */
const getSummaryReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeId, department } = req.query;

    const query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (employeeId) {
      query.employeeId = employeeId;
    }

    const attendanceRecords = await Attendance.find(query)
      .populate({
        path: 'employeeId',
        select: 'firstName lastName employeeCode department designation',
        populate: {
          path: 'userId',
          select: 'email'
        }
      })
      .populate('managerId', 'firstName lastName')
      .sort({ date: -1, clockIn: -1 });

    let filteredRecords = attendanceRecords;
    if (department) {
      filteredRecords = attendanceRecords.filter(
        record => record.employeeId?.department === department
      );
    }

    const totalRecords = filteredRecords.length;
    const presentCount = filteredRecords.filter(r => r.status === 'present').length;
    const absentCount = filteredRecords.filter(r => r.status === 'absent').length;
    const lateCount = filteredRecords.filter(r => r.isLate === true).length;
    const leaveCount = filteredRecords.filter(r => r.status === 'on-leave').length;

    res.status(200).json({
      success: true,
      data: {
        records: filteredRecords,
        statistics: {
          total: totalRecords,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          leave: leaveCount
        }
      }
    });
  } catch (error) {
    console.error('Get summary report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch summary report.',
      error: error.message
    });
  }
};

/**
 * Get All Holidays
 */
const getAllHolidays = async (req, res) => {
  try {
    const { year } = req.query;

    const query = {};
    if (year) {
      query.year = parseInt(year);
    }

    const holidays = await Holiday.find(query)
      .sort({ date: 1 })
      .populate('createdBy', 'email');

    res.status(200).json({
      success: true,
      data: { holidays }
    });
  } catch (error) {
    console.error('Get all holidays error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch holidays.',
      error: error.message
    });
  }
};

/**
 * Delete Holiday
 */
const deleteHoliday = async (req, res) => {
  try {
    const { holidayId } = req.params;

    const holiday = await Holiday.findByIdAndDelete(holidayId);

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: 'Holiday not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Holiday deleted successfully.'
    });
  } catch (error) {
    console.error('Delete holiday error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete holiday.',
      error: error.message
    });
  }
};

/**
 * Get Monthly Config
 */
const getMonthlyConfig = async (req, res) => {
  try {
    const { month, year } = req.query;

    const query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const configs = await MonthlyConfig.find(query)
      .sort({ year: -1, month: -1 })
      .populate('createdBy', 'email');

    res.status(200).json({
      success: true,
      data: { configs }
    });
  } catch (error) {
    console.error('Get monthly config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly config.',
      error: error.message
    });
  }
};

/**
 * Update Monthly Config
 */
const updateMonthlyConfig = async (req, res) => {
  try {
    const { configId } = req.params;
    const configData = req.body;

    if (configId) {
      const config = await MonthlyConfig.findByIdAndUpdate(
        configId,
        { $set: configData },
        { new: true, runValidators: true }
      );

      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'Monthly config not found.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Monthly config updated successfully.',
        data: { config }
      });
    } else {
      const config = new MonthlyConfig({
        ...configData,
        createdBy: req.user.userId
      });

      await config.save();

      return res.status(201).json({
        success: true,
        message: 'Monthly config created successfully.',
        data: { config }
      });
    }
  } catch (error) {
    console.error('Update monthly config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update monthly config.',
      error: error.message
    });
  }
};
/**
 * ✅ NEW: Get Employee By ID
 * For AttendanceDetails page when navigating from Reports
 */
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 [Admin] Fetching employee with ID:', id);
    
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('❌ Invalid ID format');
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID format'
      });
    }
    
    // Find employee with populated fields
    const employee = await Employee.findById(id)
      .populate('userId', 'email username role createdAt')
      .populate('managerId', 'firstName lastName email phoneNumber')
      .lean();
    
    // Check if employee exists
    if (!employee) {
      console.log('❌ Employee not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    console.log('✅ Employee found:', employee.firstName, employee.lastName);
    
    // Return employee data
    return res.status(200).json({
      success: true,
      data: {
        employee: employee
      }
    });
    
  } catch (error) {
    console.error('❌ Error in getEmployeeById:', error);
    
    // Handle CastError (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID format'
      });
    }
    
    // Handle other errors
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employee details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
/**
 * Get All Leaves
 */
const getAllLeaves = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', employeeId = '' } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (employeeId) {
      query.employeeId = employeeId;
    }


    const leaves = await Leave.find(query)
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('managerId', 'firstName lastName')
      .populate('approvedBy', 'email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Leave.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        leaves,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalLeaves: count
      }
    });
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaves.',
      error: error.message
    });
  }
};

/**
 * Get Settings
 */
const getSettings = async (req, res) => {
  try {
    const settings = {
      workingHours: 8,
      lateArrivalGracePeriod: 15,
      overtimeRate: 1.5,
      weekends: ['Saturday', 'Sunday'],
      leaveTypes: ['sick', 'casual', 'annual', 'unpaid', 'emergency', 'maternity', 'paternity']
    };

    res.status(200).json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings.',
      error: error.message
    });
  }
};


/**
 * 🔥 FORCE DELETE - Delete corrupted employee from database
 * Temporary endpoint for fixing corrupted data
 */
const forceDeleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    console.log('🔥 FORCE DELETE - Removing corrupted employee:', employeeId);
    
    // Delete employee profile
    const employee = await Employee.findByIdAndDelete(employeeId);
    
    if (employee) {
      console.log('✅ Employee deleted:', employee._id);
      
      // Try to delete user account if exists
      if (employee.userId) {
        await User.findByIdAndDelete(employee.userId);
        console.log('✅ User account deleted');
      }
      
      // Remove from manager's list
      if (employee.managerId) {
        await Manager.findByIdAndUpdate(
          employee.managerId,
          { $pull: { employeesUnder: employee._id } }
        );
        console.log('✅ Removed from manager list');
      }
      
      return res.status(200).json({
        success: true,
        message: 'Corrupted employee deleted successfully'
      });
    }
    
    res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
    
  } catch (error) {
    console.error('❌ Force delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee',
      error: error.message
    });
  }
};



// ✅ ADD THESE NEW FUNCTIONS TO YOUR EXISTING admin.controller.js



/**
 * Get System Configuration
 */
const getSystemConfig = async (req, res) => {
  try {
    console.log('📋 Fetching system configuration...');
    
    // Get active configuration
    let config = await SystemConfig.findOne({ isActive: true })
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email');

    // If no config exists, create default one
    if (!config) {
      console.log('⚠️ No config found, creating default...');
      config = new SystemConfig({
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingHours: {
          startTime: '10:00',
          endTime: '19:00',
          lateEntryTime: '10:30'
        },
        breakTime: 60,
        leavePolicy: {
          allowedLeaves: 2,
          autoAbsentOnExceed: true
        },
        weekendDays: ['Saturday', 'Sunday'],
        isActive: true,
        createdBy: req.user.userId
      });
      await config.save();
      console.log('✅ Default config created');
    }

    res.status(200).json({
      success: true,
      data: { config }
    });
  } catch (error) {
    console.error('❌ Get system config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system configuration.',
      error: error.message
    });
  }
};

/**
 * Create System Configuration
 */
const createSystemConfig = async (req, res) => {
  try {
    console.log('📝 Creating new system configuration...');
    console.log('Data:', req.body);

    const {
      workingDays,
      workingHours,
      breakTime,
      leavePolicy,
      weekendDays
    } = req.body;

    // Deactivate all existing configs
    await SystemConfig.updateMany(
      { isActive: true },
      { $set: { isActive: false } }
    );

    // Create new active config
    const config = new SystemConfig({
      workingDays: workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      workingHours: workingHours || {
        startTime: '10:00',
        endTime: '19:00',
        lateEntryTime: '10:30'
      },
      breakTime: breakTime || 60,
      leavePolicy: leavePolicy || {
        allowedLeaves: 2,
        autoAbsentOnExceed: true
      },
      weekendDays: weekendDays || ['Saturday', 'Sunday'],
      isActive: true,
      createdBy: req.user.userId,
      effectiveFrom: new Date()
    });

    await config.save();

    console.log('✅ System configuration created:', config._id);

    res.status(201).json({
      success: true,
      message: 'System configuration created successfully.',
      data: { config }
    });
  } catch (error) {
    console.error('❌ Create system config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create system configuration.',
      error: error.message
    });
  }
};

/**
 * Update System Configuration
 */
const updateSystemConfig = async (req, res) => {
  try {
    const { configId } = req.params;
    const updateData = req.body;

    console.log('📝 Updating system configuration:', configId);
    console.log('Update data:', updateData);

    const config = await SystemConfig.findByIdAndUpdate(
      configId,
      {
        $set: {
          ...updateData,
          updatedBy: req.user.userId
        }
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'email')
     .populate('updatedBy', 'email');

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'System configuration not found.'
      });
    }

    console.log('✅ System configuration updated');

    res.status(200).json({
      success: true,
      message: 'System configuration updated successfully.',
      data: { config }
    });
  } catch (error) {
    console.error('❌ Update system config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system configuration.',
      error: error.message
    });
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
    manageHoliday,  
  // ✅ ADD THESE 3 NEW EXPORTS
  getSystemConfig,
  createSystemConfig,
  updateSystemConfig
};