const User = require("../models/User");
const Employee = require("../models/Employee");
const Manager = require("../models/Manager");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const LeaveRequest = require("../models/LeaveRequest");
const Holiday = require("../models/Holiday");
const MonthlyConfig = require("../models/MonthlyConfig");
const Salary = require("../models/Salary");
const SystemConfig = require("../models/SystemConfig");
const { generateToken } = require("../utils/jwtHandler");
const { sendEmail } = require("../utils/emailService");
const { validateEmail } = require("../utils/validators");
const notificationService = require("../utils/notificationService");
const { getActiveSystemConfig } = require('../utils/getSystemConfig');

// ==================== WELCOME EMAIL TEMPLATE ====================
const getWelcomeEmailTemplate = ({
  firstName,
  lastName,
  email,
  password,
  employeeCode,
  department,
  designation,
  joiningDate,
}) => {
  const joinDate = new Date(joiningDate).toLocaleDateString("en-PK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a855f7 100%);padding:40px 30px;text-align:center;">
            <div style="font-size:48px;margin-bottom:10px;">🎉</div>
            <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Welcome Aboard!</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:16px;">Your account has been created successfully</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:35px 40px;">
            <p style="color:#374151;font-size:17px;margin:0 0 8px;">Hi <strong>${firstName} ${lastName}</strong>,</p>
            <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 28px;">
              We're thrilled to have you join our team! Your employee account is now active and ready to use. 
              Below are your login credentials — please keep them safe.
            </p>

            <!-- Login Credentials Box -->
            <div style="background:linear-gradient(135deg,#f8f7ff,#f0f4ff);border:1px solid #e0e7ff;border-radius:12px;padding:24px;margin-bottom:28px;">
              <h3 style="color:#4f46e5;margin:0 0 16px;font-size:15px;text-transform:uppercase;letter-spacing:1px;">🔐 Login Credentials</h3>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #e0e7ff;">
                    <span style="color:#6b7280;font-size:13px;">Email Address</span><br>
                    <strong style="color:#1f2937;font-size:15px;">${email}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #e0e7ff;">
                    <span style="color:#6b7280;font-size:13px;">Password</span><br>
                    <strong style="color:#1f2937;font-size:15px;background:#fff;padding:4px 12px;border-radius:6px;border:1px solid #d1d5db;display:inline-block;margin-top:4px;font-family:monospace;">${password}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <span style="color:#6b7280;font-size:13px;">Employee Code</span><br>
                    <strong style="color:#4f46e5;font-size:15px;">${employeeCode}</strong>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Employee Details Box -->
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:28px;">
              <h3 style="color:#374151;margin:0 0 16px;font-size:15px;text-transform:uppercase;letter-spacing:1px;">👤 Your Details</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;width:50%;">
                    <span style="color:#9ca3af;font-size:12px;display:block;">Department</span>
                    <span style="color:#1f2937;font-size:14px;font-weight:600;">${department}</span>
                  </td>
                  <td style="padding:6px 0;width:50%;">
                    <span style="color:#9ca3af;font-size:12px;display:block;">Designation</span>
                    <span style="color:#1f2937;font-size:14px;font-weight:600;">${designation}</span>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:6px 0;">
                    <span style="color:#9ca3af;font-size:12px;display:block;">Joining Date</span>
                    <span style="color:#1f2937;font-size:14px;font-weight:600;">${joinDate}</span>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Warning -->
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px;margin-bottom:28px;">
              <p style="margin:0;color:#92400e;font-size:13px;">
                ⚠️ <strong>Important:</strong> Please change your password after your first login for security purposes.
              </p>
            </div>

            <!-- CTA Button -->
            <div style="text-align:center;margin-bottom:28px;">
              <a href="http://localhost:3000" 
                 style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:50px;font-size:16px;font-weight:600;letter-spacing:0.3px;box-shadow:0 4px 15px rgba(99,102,241,0.4);">
                🚀 Login to Your Account
              </a>
            </div>

            <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">
              If you have any questions, please contact your HR department or admin.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              © ${new Date().getFullYear()} Attendance System. This is an automated message, please do not reply.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

// ==================== SAME FOR MANAGER ====================
const getManagerWelcomeEmailTemplate = ({
  firstName,
  lastName,
  email,
  password,
  department,
  designation,
}) => {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <tr>
          <td style="background:linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%);padding:40px 30px;text-align:center;">
            <div style="font-size:48px;margin-bottom:10px;">👔</div>
            <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;">Welcome, Manager!</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:16px;">Your manager account is ready</p>
          </td>
        </tr>
        <tr>
          <td style="padding:35px 40px;">
            <p style="color:#374151;font-size:17px;margin:0 0 8px;">Hi <strong>${firstName} ${lastName}</strong>,</p>
            <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 28px;">
              Welcome to the team! You have been assigned as a Manager. Here are your login details:
            </p>
            <div style="background:#f0f4ff;border:1px solid #e0e7ff;border-radius:12px;padding:24px;margin-bottom:24px;">
              <h3 style="color:#4f46e5;margin:0 0 16px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">🔐 Login Credentials</h3>
              <p style="margin:4px 0;color:#374151;"><strong>Email:</strong> ${email}</p>
              <p style="margin:4px 0;color:#374151;"><strong>Password:</strong> <code style="background:#fff;padding:2px 8px;border-radius:4px;border:1px solid #d1d5db;">${password}</code></p>
              <p style="margin:4px 0;color:#374151;"><strong>Department:</strong> ${department}</p>
              <p style="margin:4px 0;color:#374151;"><strong>Designation:</strong> ${designation}</p>
            </div>
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px;margin-bottom:24px;">
              <p style="margin:0;color:#92400e;font-size:13px;">⚠️ Please change your password after first login.</p>
            </div>
            <div style="text-align:center;">
              <a href="http://localhost:3000" style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#fff;text-decoration:none;padding:14px 40px;border-radius:50px;font-size:15px;font-weight:600;">
                🚀 Login Now
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Attendance System</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};


/**
 * Admin Dashboard
 */
const getDashboard = async (req, res) => {
  try {
    console.log("📊 Fetching admin dashboard data...");

    // ✅ NEW — company name fetch karo dashboard heading ke liye
    let companyName = null;
    if (req.companyId) {
      const Company = require('../models/Company');
      const company = await Company.findById(req.companyId).select('companyName');
      companyName = company?.companyName || null;
    }

    const companyFilter = req.companyId ? { companyId: req.companyId } : {};

    const totalEmployees = await Employee.countDocuments({ isActive: true, ...companyFilter });
    const totalManagers = await Manager.countDocuments({ isActive: true, ...companyFilter });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const systemConfig = await getActiveSystemConfig(req.companyId);
    const todayDayName = today.toLocaleDateString("en-US", { weekday: "long" });
    const isWorkingDay =
      systemConfig?.workingDays?.includes(todayDayName) || false;
    const activeEmployeeIds = await Employee.find({ isActive: true, ...companyFilter }).distinct(
      "_id",
    );
    let todayAttendance = 0,
      absentToday = 0,
      leaveToday = 0;
    if (isWorkingDay) {
      todayAttendance = await Attendance.countDocuments({
        employeeId: { $in: activeEmployeeIds },
        date: { $gte: today, $lt: tomorrow },
        status: { $in: ["present", "half-day", "late"] },
      });
      leaveToday = await Attendance.countDocuments({
        employeeId: { $in: activeEmployeeIds },
        date: { $gte: today, $lt: tomorrow },
        status: { $in: ["leave", "on-leave"] },
      });
      absentToday = Math.max(0, totalEmployees - todayAttendance - leaveToday);
    }
    const pendingLeaves = await LeaveRequest.countDocuments({
      status: "pending",
      employee: { $in: activeEmployeeIds },
    });
    const recentEmployees = await Employee.find({ isActive: true, ...companyFilter })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "email isActive")
      .populate("managerId", "firstName lastName");
    res
      .status(200)
      .json({
        success: true,
        data: {
          stats: {
            totalEmployees,
            totalManagers,
            todayAttendance,
            absentToday,
            leaveToday,
            pendingLeaves,
          },
          recentEmployees,
          companyName,   // ✅ NEW
          meta: {
            isWorkingDay,
            todayDayName,
            workingDays: systemConfig?.workingDays || [],
          },
        },
      });
  } catch (error) {
    console.error("❌ Get dashboard error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch dashboard data.",
        error: error.message,
      });
  }
};

/**
 * Create Manager - with welcome email
 */
const createManager = async (req, res) => {
  try {
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
      emergencyContact,
    } = req.body;
    if (!email || !password || !firstName || !lastName || !phoneNumber)
      return res
        .status(400)
        .json({ success: false, message: "Required fields missing." });
    if (!validateEmail(email))
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format." });
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser)
      return res
        .status(400)
        .json({
          success: false,
          message: "User with this email already exists.",
        });
    if (cnic) {
      const existingCNIC = await Manager.findOne({ cnic, isActive: true });
      if (existingCNIC)
        return res
          .status(400)
          .json({
            success: false,
            message: "Manager with this CNIC already exists.",
          });
    }
    const user = new User({
      email: email.toLowerCase(),
      password,
      role: "manager",
      isActive: true,
      companyId: req.companyId,   // ✅ NEW
      createdBy: req.user.userId,
    });
    await user.save();
    const manager = new Manager({
      userId: user._id,
      companyId: req.companyId,   // ✅ NEW
      firstName,
      lastName,
      phoneNumber,
      cnic: cnic || "",
      dateOfBirth,
      address: address || "",
      joiningDate: joiningDate || new Date(),
      department: department || "General",
      designation: designation || "Manager",
      salary: salary || 0,
      bankDetails,
      emergencyContact,
    });
    await manager.save();

    // ✅ Welcome email for manager
    try {
      await sendEmail({
        to: user.email,
        subject: "👔 Welcome to Attendance System - Manager Account Created",
        html: getManagerWelcomeEmailTemplate({
          firstName,
          lastName,
          email: user.email,
          password,
          department: department || "General",
          designation: designation || "Manager",
        }),
      });
      console.log(`✅ Manager welcome email sent to ${user.email}`);
    } catch (emailError) {
      console.error(
        "⚠️ Manager welcome email failed (non-fatal):",
        emailError.message,
      );
    }

    res
      .status(201)
      .json({
        success: true,
        message: "Manager created successfully.",
        data: { manager },
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to create manager.",
        error: error.message,
      });
  }
};

/**
 * Create Employee - with beautiful welcome email
 */
const createEmployee = async (req, res) => {
  try {
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
      workSchedule,
    } = req.body;
    if (!email || !password || !firstName || !lastName || !phoneNumber)
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Email, password, first name, last name, and phone number are required.",
        });
    if (!validateEmail(email))
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format." });
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser)
      return res
        .status(400)
        .json({ success: false, message: "Email already registered." });
    if (managerId) {
      const manager = await Manager.findById(managerId);
      if (!manager)
        return res
          .status(404)
          .json({ success: false, message: "Manager not found." });
    }
    if (cnic && cnic.trim() !== "") {
      const existingCNIC = await Employee.findOne({
        cnic: cnic.trim(),
        isActive: true,
      });
      if (existingCNIC)
        return res
          .status(400)
          .json({
            success: false,
            message: `Employee with CNIC ${cnic} already exists.`,
          });
    }

    let employeeCode,
      isUnique = false,
      attempts = 0;
    // BAAD (fixed)
    while (!isUnique && attempts < 20) {
      const count = await Employee.countDocuments();
      const num = count + attempts + 1;
      employeeCode = `EMP${String(num).padStart(4, "0")}`;
      const existing = await Employee.findOne({ employeeCode });
      if (!existing) isUnique = true;
      else attempts++;
    }
    if (!isUnique) {
      // Last resort: timestamp based
      employeeCode = `EMP${Date.now().toString().slice(-6)}`;
    }

    const user = new User({
      email: email.toLowerCase(),
      password,
      role: "employee",
      isActive: true,
      companyId: req.companyId,   // ✅ NEW
      createdBy: req.user.userId,
    });
    await user.save();

    const employee = new Employee({
      userId: user._id,
      companyId: req.companyId,   // ✅ NEW
      managerId: managerId || null,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      employeeCode,
      phoneNumber: phoneNumber.trim(),
      cnic: cnic && cnic.trim() !== "" ? cnic.trim() : undefined,
      dateOfBirth: dateOfBirth || null,
      address: address ? address.trim() : null,
      department: department || "General",
      designation: designation || "Employee",
      employmentType: employmentType || "full-time",
      salary: salary || 0,
      joiningDate: joiningDate || new Date(),
      workSchedule: workSchedule || {
        shiftStartTime: "09:00",
        shiftEndTime: "17:00",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      },
    });
    await employee.save();

    if (managerId)
      await Manager.findByIdAndUpdate(managerId, {
        $addToSet: { employeesUnder: employee._id },
      });

    // ✅ Beautiful welcome email
    try {
      await sendEmail({
        to: user.email,
        subject: "🎉 Welcome to Attendance System - Your Account is Ready!",
        html: getWelcomeEmailTemplate({
          firstName,
          lastName,
          email: user.email,
          password,
          employeeCode,
          department: department || "General",
          designation: designation || "Employee",
          joiningDate: joiningDate || new Date(),
        }),
      });
      console.log(`✅ Welcome email sent to ${user.email}`);
    } catch (emailError) {
      console.error("⚠️ Welcome email failed (non-fatal):", emailError.message);
    }

    // ✅ Manager ko notification bhejo - new employee assigned
    if (managerId) {
      try {
        const Notification = require("../models/Notification");
        const assignedManager = await Manager.findById(managerId).populate(
          "userId",
          "email",
        );

        if (assignedManager?.userId) {
          // DB notification
          await Notification.create({
            userId: assignedManager.userId._id,
            title: "👤 New Employee Assigned",
            message: `${firstName} ${lastName} (${employeeCode}) has been assigned to you as a new employee in the ${department || "General"} department.`,
            type: "system_update",
            isRead: false,
          });

          // Email notification to manager
          try {
            await sendEmail({
              to: assignedManager.userId.email,
              subject: "👤 New Employee Assigned to You",
              html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%);padding:36px 30px;text-align:center;">
            <div style="font-size:44px;margin-bottom:8px;">👤</div>
            <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">New Employee Assigned!</h1>
            <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:15px;">A new team member has been added under you</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px;">
            <p style="color:#374151;font-size:16px;margin:0 0 6px;">Hi <strong>${assignedManager.firstName} ${assignedManager.lastName}</strong>,</p>
            <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 24px;">
              A new employee has been assigned to your team. Here are their details:
            </p>

            <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:22px;margin-bottom:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:7px 0;width:50%;border-bottom:1px solid #e0f2fe;">
                    <span style="color:#64748b;font-size:12px;display:block;">Full Name</span>
                    <span style="color:#0f172a;font-size:15px;font-weight:600;">${firstName} ${lastName}</span>
                  </td>
                  <td style="padding:7px 0;width:50%;border-bottom:1px solid #e0f2fe;">
                    <span style="color:#64748b;font-size:12px;display:block;">Employee Code</span>
                    <span style="color:#0ea5e9;font-size:15px;font-weight:600;">${employeeCode}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:7px 0;border-bottom:1px solid #e0f2fe;">
                    <span style="color:#64748b;font-size:12px;display:block;">Department</span>
                    <span style="color:#0f172a;font-size:14px;font-weight:500;">${department || "General"}</span>
                  </td>
                  <td style="padding:7px 0;border-bottom:1px solid #e0f2fe;">
                    <span style="color:#64748b;font-size:12px;display:block;">Designation</span>
                    <span style="color:#0f172a;font-size:14px;font-weight:500;">${designation || "Employee"}</span>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:7px 0;">
                    <span style="color:#64748b;font-size:12px;display:block;">Email</span>
                    <span style="color:#0f172a;font-size:14px;font-weight:500;">${user.email}</span>
                  </td>
                </tr>
              </table>
            </div>

            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;margin-bottom:24px;">
              <p style="margin:0;color:#166534;font-size:13px;">
                ✅ You can manage this employee's attendance and leave requests from your Manager Dashboard.
              </p>
            </div>

            <div style="text-align:center;">
              <a href="http://localhost:3000/manager/dashboard"
                 style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#fff;text-decoration:none;padding:13px 36px;border-radius:50px;font-size:15px;font-weight:600;">
                📊 Go to Dashboard
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Attendance System</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
            });
            console.log(
              `✅ Manager assignment email sent to ${assignedManager.userId.email}`,
            );
          } catch (managerEmailErr) {
            console.error(
              "⚠️ Manager email failed (non-fatal):",
              managerEmailErr.message,
            );
          }
        }
      } catch (notifError) {
        console.error(
          "⚠️ Manager notification failed (non-fatal):",
          notifError.message,
        );
      }
    }

    res
      .status(201)
      .json({
        success: true,
        message: "Employee created successfully.",
        data: {
          employee: {
            _id: employee._id,
            employeeCode,
            firstName,
            lastName,
            email: user.email,
            department: employee.department,
            designation: employee.designation,
          },
        },
      });
  } catch (error) {
    let msg = "Failed to create employee.";
    if (error.code === 11000)
      msg = `Duplicate ${Object.keys(error.keyPattern)[0]}.`;
    else if (error.name === "ValidationError")
      msg = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
    res
      .status(500)
      .json({ success: false, message: msg, error: error.message });
  }
};

const getAllManagers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", department = "" } = req.query;
    const query = { isActive: true };
    if (req.companyId) query.companyId = req.companyId;   // ✅ NEW
    if (search)
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ];
    if (department) query.department = department;
    const managers = await Manager.find(query)
      .populate("userId", "email isActive lastLogin")
      .populate("employeesUnder", "firstName lastName employeeCode")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const count = await Manager.countDocuments(query);
    res
      .status(200)
      .json({
        success: true,
        data: {
          managers,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          totalManagers: count,
        },
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch managers.",
        error: error.message,
      });
  }
};

const getAllEmployees = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      department = "",
      managerId = "",
    } = req.query;
    const query = { isActive: true };
    if (req.companyId) query.companyId = req.companyId;   // ✅ NEW
    if (search)
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { employeeCode: { $regex: search, $options: "i" } },
      ];
    if (department) query.department = department;
    if (managerId) query.managerId = managerId;
    const employees = await Employee.find(query)
      .populate("userId", "email isActive lastLogin")
      .populate("managerId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    const count = await Employee.countDocuments(query);
    res
      .status(200)
      .json({
        success: true,
        data: {
          employees,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          totalEmployees: count,
        },
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch employees.",
        error: error.message,
      });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { userId, userType } = req.params;
    if (!["manager", "employee"].includes(userType))
      return res
        .status(400)
        .json({ success: false, message: "Invalid user type." });
    const ProfileModel = userType === "manager" ? Manager : Employee;
    const populateField =
      userType === "manager" ? "employeesUnder" : "managerId";
    const populateSelect =
      userType === "manager"
        ? "firstName lastName email employeeCode"
        : "firstName lastName email";
    let profile = await ProfileModel.findById(userId)
      .populate("userId")
      .populate(populateField, populateSelect);
    if (profile) {
      // ✅ NEW — company access check
      if (req.companyId && profile.companyId && profile.companyId.toString() !== req.companyId.toString()) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }

      const userIdValue = profile.userId?._id || profile.userId;
      const user = await User.findById(userIdValue).select("-password");
      if (user)
        return res.status(200).json({ success: true, data: { user, profile } });
    }
    const user = await User.findById(userId).select("-password");
    if (user) {
      profile = await ProfileModel.findOne({ userId: user._id }).populate(
        populateField,
        populateSelect,
      );
      if (profile) {
        // ✅ NEW — company access check
        if (req.companyId && profile.companyId && profile.companyId.toString() !== req.companyId.toString()) {
          return res.status(403).json({ success: false, message: "Access denied." });
        }
        return res.status(200).json({ success: true, data: { user, profile } });
      }
    }
    res.status(404).json({ success: false, message: "User not found." });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch user details.",
        error: error.message,
      });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId, userType } = req.params;
    const updateData = req.body;
    if (!["manager", "employee"].includes(userType))
      return res
        .status(400)
        .json({ success: false, message: "Invalid user type." });
    const ProfileModel = userType === "manager" ? Manager : Employee;
    const populateField =
      userType === "manager" ? "employeesUnder" : "managerId";
    let profile = await ProfileModel.findById(userId);
    if (!profile)
      return res
        .status(404)
        .json({ success: false, message: "Profile not found." });

    // ✅ NEW — company access check
    if (req.companyId && profile.companyId && profile.companyId.toString() !== req.companyId.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    let user = await User.findById(profile.userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User account not found." });
    if (updateData.email && updateData.email !== user.email) {
      const existing = await User.findOne({
        email: updateData.email.toLowerCase(),
        _id: { $ne: user._id },
      });
      if (existing)
        return res
          .status(400)
          .json({ success: false, message: "Email already in use." });
      user.email = updateData.email.toLowerCase();
      await user.save();
    }
    profile = await ProfileModel.findByIdAndUpdate(
      profile._id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).populate(populateField);
    res
      .status(200)
      .json({
        success: true,
        message: `${userType} updated successfully.`,
        data: { user, profile },
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to update user.",
        error: error.message,
      });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId, userType } = req.params;
    if (!["manager", "employee"].includes(userType))
      return res
        .status(400)
        .json({ success: false, message: "Invalid user type." });
    const ProfileModel = userType === "manager" ? Manager : Employee;
    let profile = await ProfileModel.findById(userId);
    let user = null;
    if (!profile) {
      user = await User.findById(userId);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      profile = await ProfileModel.findOne({ userId: user._id });
    } else {
      user = profile.userId ? await User.findById(profile.userId) : null;
    }

    // ✅ NEW — company access check
    if (profile && req.companyId && profile.companyId && profile.companyId.toString() !== req.companyId.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (userType === "manager" && profile?.employeesUnder?.length > 0)
      return res
        .status(400)
        .json({
          success: false,
          message: `Cannot delete manager. ${profile.employeesUnder.length} employee(s) assigned.`,
        });
    if (userType === "employee" && profile) {
      await Attendance.deleteMany({ employeeId: profile._id });
      await Leave.deleteMany({ employeeId: profile._id });
      await Salary.deleteMany({ employeeId: profile._id });
      if (profile.managerId)
        await Manager.findByIdAndUpdate(profile.managerId, {
          $pull: { employeesUnder: profile._id },
        });
    }
    if (profile) await ProfileModel.findByIdAndDelete(profile._id);
    if (user) await User.findByIdAndDelete(user._id);
    res
      .status(200)
      .json({
        success: true,
        message: `${userType} deleted.`,
        data: { deletedEmail: user?.email },
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to delete user.",
        error: error.message,
      });
  }
};

const getAllAttendance = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      date = "",
      employeeId = "",
      status = "",
    } = req.query;
    const query = {};
     if (req.companyId) {
      const companyEmployeeIds = await Employee.find({ companyId: req.companyId }).distinct('_id');
      query.employeeId = { $in: companyEmployeeIds };
    }
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      query.date = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    }
    if (employeeId) query.employeeId = employeeId;
    if (status) query.status = status;
    const records = await Attendance.find(query)
      .populate({
        path: "employeeId",
        select:
          "firstName lastName employeeCode department designation phoneNumber",
        populate: { path: "userId", select: "email" },
      })
      .populate("managerId", "firstName lastName")
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const count = await Attendance.countDocuments(query);
    res
      .status(200)
      .json({
        success: true,
        data: {
          attendance: records,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          totalRecords: count,
        },
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch attendance.",
        error: error.message,
      });
  }
};

const manageHoliday = async (req, res) => {
  try {
    const { holidayId } = req.params;
    const holidayData = req.body;
    if (!holidayData.name || !holidayData.date)
      return res
        .status(400)
        .json({
          success: false,
          message: "Holiday name and date are required.",
        });
    const holidayDate = new Date(holidayData.date);
    const obj = {
      name: holidayData.name.trim(),
      date: holidayDate,
      year: holidayDate.getFullYear(),
      month: holidayDate.getMonth() + 1,
      description: holidayData.description || "",
      isRecurring: holidayData.isRecurring || false,
    };
    if (holidayId) {
      // ✅ NEW — company access check before update
      const existingHoliday = await Holiday.findById(holidayId);
      if (existingHoliday && req.companyId && existingHoliday.companyId && existingHoliday.companyId.toString() !== req.companyId.toString()) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }

      const holiday = await Holiday.findByIdAndUpdate(
        holidayId,
        { $set: obj },
        { new: true },
      );
      if (!holiday)
        return res
          .status(404)
          .json({ success: false, message: "Holiday not found." });
      return res
        .status(200)
        .json({
          success: true,
          message: "Holiday updated.",
          data: { holiday },
        });
    }
    const start = new Date(holidayDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(holidayDate);
    end.setHours(23, 59, 59, 999);
    const existing = await Holiday.findOne({
      date: { $gte: start, $lte: end },
      ...(req.companyId ? { companyId: req.companyId } : {}),   // ✅ NEW
    });
    if (existing)
      return res
        .status(400)
        .json({
          success: false,
          message: `Holiday already exists on this date.`,
        });
    obj.createdBy = req.user?.userId;
    obj.companyId = req.companyId;   // ✅ NEW
    const holiday = new Holiday(obj);
    await holiday.save();
    res
      .status(201)
      .json({ success: true, message: "Holiday created.", data: { holiday } });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to manage holiday.",
        error: error.message,
      });
  }
};

const getSummaryReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeId, department } = req.query;
    const query = {};
    if (req.companyId) {
      const companyEmployeeIds = await Employee.find({ companyId: req.companyId }).distinct('_id');
      query.employeeId = { $in: companyEmployeeIds };
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        query.date.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        query.date.$lte = e;
      }
    }
    if (employeeId) query.employeeId = employeeId;
    const records = await Attendance.find(query)
      .populate({
        path: "employeeId",
        select: "firstName lastName employeeCode department designation",
        populate: { path: "userId", select: "email" },
      })
      .populate("managerId", "firstName lastName")
      .sort({ date: -1 });
    let filtered = records;
    if (department)
      filtered = records.filter((r) => r.employeeId?.department === department);
    res
      .status(200)
      .json({
        success: true,
        data: {
          records: filtered,
          statistics: {
            total: filtered.length,
            present: filtered.filter((r) => r.status === "present").length,
            absent: filtered.filter((r) => r.status === "absent").length,
            late: filtered.filter((r) => r.isLate === true).length,
            leave: filtered.filter((r) =>
              ["leave", "on-leave"].includes(r.status),
            ).length,
          },
        },
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch report.",
        error: error.message,
      });
  }
};

const getAllHolidays = async (req, res) => {
  try {
    const { year } = req.query;
    const query = year ? { year: parseInt(year) } : {};
    if (req.companyId) query.companyId = req.companyId;   // ✅ NEW

    const holidays = await Holiday.find(query)
      .sort({ date: 1 })
      .populate("createdBy", "email");
    res.status(200).json({ success: true, data: { holidays } });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch holidays.",
        error: error.message,
      });
  }
};

const deleteHoliday = async (req, res) => {
  try {
    // ✅ NEW — company access check before delete
    const existingHoliday = await Holiday.findById(req.params.holidayId);
    if (existingHoliday && req.companyId && existingHoliday.companyId && existingHoliday.companyId.toString() !== req.companyId.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const holiday = await Holiday.findByIdAndDelete(req.params.holidayId);
    if (!holiday)
      return res
        .status(404)
        .json({ success: false, message: "Holiday not found." });
    res.status(200).json({ success: true, message: "Holiday deleted." });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to delete holiday.",
        error: error.message,
      });
  }
};

const getMonthlyConfig = async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    const configs = await MonthlyConfig.find(query)
      .sort({ year: -1, month: -1 })
      .populate("createdBy", "email");
    res.status(200).json({ success: true, data: { configs } });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch config.",
        error: error.message,
      });
  }
};

const updateMonthlyConfig = async (req, res) => {
  try {
    const { configId } = req.params;
    if (configId) {
      const config = await MonthlyConfig.findByIdAndUpdate(
        configId,
        { $set: req.body },
        { new: true },
      );
      if (!config)
        return res
          .status(404)
          .json({ success: false, message: "Config not found." });
      return res
        .status(200)
        .json({ success: true, message: "Config updated.", data: { config } });
    }
    const config = new MonthlyConfig({
      ...req.body,
      createdBy: req.user.userId,
    });
    await config.save();
    res
      .status(201)
      .json({ success: true, message: "Config created.", data: { config } });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to update config.",
        error: error.message,
      });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });
    const employee = await Employee.findById(id)
      .populate("userId", "email username role createdAt")
      .populate("managerId", "firstName lastName email phoneNumber")
      .lean();
    if (!employee)
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
        if (req.companyId && employee.companyId && employee.companyId.toString() !== req.companyId.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    res.status(200).json({ success: true, data: { employee } });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch employee.",
        error: error.message,
      });
  }
};

const getAllLeaves = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "", employeeId = "" } = req.query;
    const query = {};
    if (req.companyId) {
      const companyEmployeeIds = await Employee.find({ companyId: req.companyId }).distinct('_id');
      query.employeeId = { $in: companyEmployeeIds };
    }

    if (status) query.status = status;
    if (employeeId) query.employeeId = employeeId;
    const leaves = await Leave.find(query)
      .populate("employeeId", "firstName lastName employeeCode")
      .populate("managerId", "firstName lastName")
      .populate("approvedBy", "email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const count = await Leave.countDocuments(query);
    res
      .status(200)
      .json({
        success: true,
        data: {
          leaves,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          totalLeaves: count,
        },
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch leaves.",
        error: error.message,
      });
  }
};

const getSettings = async (req, res) => {
  try {
    res
      .status(200)
      .json({
        success: true,
        data: {
          settings: {
            workingHours: 8,
            lateArrivalGracePeriod: 15,
            overtimeRate: 1.5,
            weekends: ["Saturday", "Sunday"],
            leaveTypes: [
              "sick",
              "casual",
              "annual",
              "unpaid",
              "emergency",
              "maternity",
              "paternity",
            ],
          },
        },
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch settings.",
        error: error.message,
      });
  }
};

const forceDeleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
        const existingEmp = await Employee.findById(employeeId);
    if (existingEmp && req.companyId && existingEmp.companyId && existingEmp.companyId.toString() !== req.companyId.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const employee = await Employee.findByIdAndDelete(employeeId);
    if (employee) {
      if (employee.userId) await User.findByIdAndDelete(employee.userId);
      if (employee.managerId)
        await Manager.findByIdAndUpdate(employee.managerId, {
          $pull: { employeesUnder: employee._id },
        });
      return res
        .status(200)
        .json({ success: true, message: "Employee deleted." });
    }
    res.status(404).json({ success: false, message: "Employee not found" });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to delete.",
        error: error.message,
      });
  }
};

const getSystemConfig = async (req, res) => {
  try {
    let config = await getActiveSystemConfig(req.companyId);
    if (!config) {
      config = new SystemConfig({
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        workingHours: {
          startTime: "10:00",
          endTime: "19:00",
          lateEntryTime: "10:30",
        },
        breakTime: 60,
        leavePolicy: { allowedLeaves: 2, autoAbsentOnExceed: true },
        weekendDays: ["Saturday", "Sunday"],
        isActive: true,
        companyId: req.companyId,   // ✅ NEW
        createdBy: req.user.userId,
      });
      await config.save();
    }
    res.status(200).json({ success: true, data: { config } });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch config.",
        error: error.message,
      });
  }
};

const createSystemConfig = async (req, res) => {
  try {
    await SystemConfig.updateMany(
      { isActive: true, ...(req.companyId ? { companyId: req.companyId } : { $or: [{ companyId: null }, { companyId: { $exists: false } }] }) },
      { $set: { isActive: false } },
    );

    const config = new SystemConfig({
      ...req.body,
      isActive: true,
       companyId: req.companyId,   // ✅ NEW
      createdBy: req.user.userId,
      effectiveFrom: new Date(),
    });
    await config.save();
    res
      .status(201)
      .json({ success: true, message: "Config created.", data: { config } });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to create config.",
        error: error.message,
      });
  }
};

const updateSystemConfig = async (req, res) => {
  try {
    // ✅ Pehle purana config fetch karo comparison ke liye
    const oldConfig = await SystemConfig.findById(req.params.configId);
    // ✅ NEW — company access check
    if (oldConfig && req.companyId && oldConfig.companyId && oldConfig.companyId.toString() !== req.companyId.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const config = await SystemConfig.findByIdAndUpdate(
      req.params.configId,
      { $set: { ...req.body, updatedBy: req.user.userId } },
      { new: true },
    )
      .populate("createdBy", "email")
      .populate("updatedBy", "email");

    if (!config)
      return res
        .status(404)
        .json({ success: false, message: "Config not found." });

    // ✅ Changes detect karo
    const changes = [];

    if (oldConfig && req.body.workingDays) {
      const oldDays = (oldConfig.workingDays || []).sort().join(", ");
      const newDays = (req.body.workingDays || []).sort().join(", ");
      if (oldDays !== newDays) {
        changes.push(`📅 Working Days: ${oldDays} → ${newDays}`);
      }
    }

    if (oldConfig && req.body.workingHours) {
      const oldStart = oldConfig.workingHours?.startTime;
      const oldEnd = oldConfig.workingHours?.endTime;
      const oldLate = oldConfig.workingHours?.lateEntryTime;
      const newStart = req.body.workingHours?.startTime;
      const newEnd = req.body.workingHours?.endTime;
      const newLate = req.body.workingHours?.lateEntryTime;
      if (oldStart !== newStart || oldEnd !== newEnd) {
        changes.push(
          `⏰ Working Hours: ${oldStart}-${oldEnd} → ${newStart}-${newEnd}`,
        );
      }
      if (oldLate !== newLate) {
        changes.push(`🕐 Late Entry Time: ${oldLate} → ${newLate}`);
      }
    }

    if (oldConfig && req.body.breakTime !== undefined) {
      if (oldConfig.breakTime !== req.body.breakTime) {
        changes.push(
          `☕ Break Time: ${oldConfig.breakTime} min → ${req.body.breakTime} min`,
        );
      }
    }

    if (oldConfig && req.body.leavePolicy) {
      const oldAllowed = oldConfig.leavePolicy?.allowedLeaves;
      const newAllowed = req.body.leavePolicy?.allowedLeaves;
      const oldAuto = oldConfig.leavePolicy?.autoAbsentOnExceed;
      const newAuto = req.body.leavePolicy?.autoAbsentOnExceed;
      if (oldAllowed !== newAllowed) {
        changes.push(
          `📋 Allowed Leaves: ${oldAllowed}/month → ${newAllowed}/month`,
        );
      }
      if (oldAuto !== newAuto) {
        changes.push(
          `🚫 Auto Absent: ${oldAuto ? "Yes" : "No"} → ${newAuto ? "Yes" : "No"}`,
        );
      }
    }

    // ✅ Detailed notification bhejo
    try {
      const notifTitle = "⚙️ System Settings Updated";
      const notifMessage =
        changes.length > 0
          ? `Admin has updated the system settings:\n${changes.join("\n")}`
          : "System settings have been updated by admin.";
      await notificationService.sendAnnouncement(
        notifTitle,
        notifMessage,
        "all",
      );
    } catch (e) {
      console.warn("⚠️ Notification failed:", e.message);
    }

    res
      .status(200)
      .json({ success: true, message: "Config updated.", data: { config } });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to update config.",
        error: error.message,
      });
  }
};

const fixEmployeeManagerLinks = async (req, res) => {
  try {
    const employees = await Employee.find({
      managerId: { $exists: true, $ne: null },
    });
    let fixed = 0,
      alreadyLinked = 0;
    for (const emp of employees) {
      const manager = await Manager.findById(emp.managerId);
      if (!manager) continue;
      const linked = manager.employeesUnder.some(
        (id) => id.toString() === emp._id.toString(),
      );
      if (!linked) {
        await Manager.findByIdAndUpdate(emp.managerId, {
          $addToSet: { employeesUnder: emp._id },
        });
        fixed++;
      } else alreadyLinked++;
    }
    res
      .status(200)
      .json({
        success: true,
        message: `Fixed: ${fixed}, Already linked: ${alreadyLinked}`,
        data: { fixed, alreadyLinked },
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fix links.",
        error: error.message,
      });
  }
};

const getAdminProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ 
      success: false, message: 'Admin not found.' 
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          name:        user.name || '',
          email:       user.email || '',
          phone:       user.phoneNumber || '',
          address:     user.address || '',
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch profile.', 
      error: error.message 
    });
  }
};

const updateAdminProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, phone, address } = req.body;

    // User model mein name field save karo
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { name, phoneNumber: phone, address } },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ 
      success: false, message: 'Admin not found.' 
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile.', 
      error: error.message 
    });
  }
};
const updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { profilePicture } = req.body;
    await User.findByIdAndUpdate(userId, { profilePicture });
    res.json({ success: true, message: 'Profile picture updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getProfilePicture = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('profilePicture');
    res.json({ success: true, profilePicture: user?.profilePicture || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  updateProfilePicture,
getProfilePicture,
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
  getAdminProfile,
  updateAdminProfile,
  updateSystemConfig,
  fixEmployeeManagerLinks,
};
