const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const Manager = require("../models/Manager");
const Holiday = require("../models/Holiday");
const User = require("../models/User");
const notificationService = require("../utils/notificationService");

/**
 * Get All Attendance Records (with filters)
 */
const getAllAttendance = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      employeeId = "",
      managerId = "",
      date = "",
      startDate = "",
      endDate = "",
      status = "",
      department = "",
    } = req.query;

    const query = {};

    if (employeeId) {
      query.employeeId = employeeId;
    }

    if (managerId) {
      query.managerId = managerId;
    }

    if (date) {
      const dateObj = new Date(date);
      dateObj.setHours(0, 0, 0, 0);
      query.date = {
        $gte: dateObj,
        $lt: new Date(dateObj.getTime() + 24 * 60 * 60 * 1000),
      };
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }

    if (status) {
      query.status = status;
    }

    if (department) {
      const employees = await Employee.find({
        department,
        isActive: true,
      }).select("_id");
      const employeeIds = employees.map((emp) => emp._id);
      query.employeeId = { $in: employeeIds };
    }

    const attendanceRecords = await Attendance.find(query)
      .populate(
        "employeeId",
        "firstName lastName employeeCode department designation",
      )
      .populate("managerId", "firstName lastName email")
      .populate("markedBy", "email role")
      .sort({ date: -1, clockIn: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Attendance.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        attendance: attendanceRecords,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalRecords: count,
      },
    });
  } catch (error) {
    console.error("Get all attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance records.",
      error: error.message,
    });
  }
};

/**
 * Get Attendance by ID
 */
const getAttendanceById = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    const attendance = await Attendance.findById(attendanceId)
      .populate(
        "employeeId",
        "firstName lastName employeeCode department designation phoneNumber",
      )
      .populate("managerId", "firstName lastName email phoneNumber")
      .populate("markedBy", "email role")
      .populate("approvedBy", "email role");

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: { attendance },
    });
  } catch (error) {
    console.error("Get attendance by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance record.",
      error: error.message,
    });
  }
};

/**
 * Create Attendance Record
 */
const createAttendance = async (req, res) => {
  try {
    const { employeeId, date, clockIn, clockOut, status, remarks, location } =
      req.body;

    const userId = req.user.userId;
    const userRole = req.user.role;

    if (!employeeId || !date || !clockIn) {
      return res.status(400).json({
        success: false,
        message: "Employee ID, date, and clock-in time are required.",
      });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    if (userRole === "manager") {
      const manager = await Manager.findOne({ userId });

      if (!manager) {
        return res.status(404).json({
          success: false,
          message: "Manager profile not found.",
        });
      }

      const hasAccess = manager.employeesUnder.some(
        (emp) => emp.toString() === employeeId,
      );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. This employee is not under your supervision.",
        });
      }
    } else if (userRole === "employee") {
      const employeeProfile = await Employee.findOne({ userId });

      if (!employeeProfile || employeeProfile._id.toString() !== employeeId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only mark your own attendance.",
        });
      }
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      employeeId,
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked for this date.",
      });
    }

    const clockInTime = new Date(clockIn);
    const clockInHour = clockInTime.getHours();
    const clockInMinute = clockInTime.getMinutes();

    let isLate = false;
    let lateMinutes = 0;

    if (clockInHour > 10 || (clockInHour === 10 && clockInMinute > 30)) {
      isLate = true;
      const totalMinutesNow = clockInHour * 60 + clockInMinute;
      const graceEndMinutes = 10 * 60 + 30;
      lateMinutes = totalMinutesNow - graceEndMinutes;
    }

    let earlyLeave = false;
    let earlyLeaveMinutes = 0;

    if (clockOut) {
      const clockOutTime = new Date(clockOut);
      const shiftEndTime = employee.workSchedule?.shiftEndTime || "19:00";
      const [endHour, endMinute] = shiftEndTime.split(":").map(Number);

      const expectedClockOut = new Date(clockOutTime);
      expectedClockOut.setHours(endHour, endMinute, 0, 0);

      if (clockOutTime < expectedClockOut) {
        earlyLeaveMinutes = Math.floor(
          (expectedClockOut - clockOutTime) / (1000 * 60),
        );
        earlyLeave = earlyLeaveMinutes > 15;
      }
    }

    const attendance = new Attendance({
      employeeId,
      managerId: employee.managerId,
      date: attendanceDate,
      clockIn: clockInTime,
      clockOut: clockOut ? new Date(clockOut) : null,
      status: status || "present",
      isLate,
      lateMinutes,
      earlyLeave,
      earlyLeaveMinutes,
      location,
      remarks,
      markedBy: userId,
      isApproved: userRole === "admin" || userRole === "manager",
      approvedBy:
        userRole === "admin" || userRole === "manager" ? userId : null,
    });

    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate("employeeId", "firstName lastName employeeCode")
      .populate("managerId", "firstName lastName");

    if (userRole === "admin" && employee.managerId) {
      try {
        const managerProfile = await Manager.findById(
          employee.managerId,
        ).populate("userId");

        if (managerProfile && managerProfile.userId) {
          const employeeName = `${employee.firstName} ${employee.lastName}`;
          const dateStr = attendanceDate.toLocaleDateString();

          await notificationService.createNotification(
            managerProfile.userId._id,
            "✅ Attendance Marked by Admin",
            `Admin marked attendance for ${employeeName} on ${dateStr}. Status: ${status || "present"}`,
            "attendance_marked",
            "/manager/attendance-history",
            {
              employeeId: employee._id,
              date: attendanceDate,
              markedBy: "admin",
            },
          );
        }
      } catch (notifError) {
        console.error("⚠️ Failed to notify manager:", notifError);
      }
    }

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully.",
      data: { attendance: populatedAttendance },
    });
  } catch (error) {
    console.error("Create attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark attendance.",
      error: error.message,
    });
  }
};

/**
 * Update Attendance Record
 */
const updateAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const updateData = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const attendance = await Attendance.findById(attendanceId);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found.",
      });
    }

    if (userRole === "manager") {
      const manager = await Manager.findOne({ userId });

      if (
        !manager ||
        attendance.managerId.toString() !== manager._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. You can only update attendance records of your employees.",
        });
      }
    } else if (userRole === "employee") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Employees cannot update attendance records.",
      });
    }

    if (updateData.clockOut && !attendance.clockOut) {
      updateData.clockOut = new Date(updateData.clockOut);
    }

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      { $set: updateData },
      { new: true, runValidators: true },
    )
      .populate("employeeId", "firstName lastName employeeCode")
      .populate("managerId", "firstName lastName");

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully.",
      data: { attendance: updatedAttendance },
    });
  } catch (error) {
    console.error("Update attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update attendance.",
      error: error.message,
    });
  }
};

/**
 * Delete Attendance Record
 */
const deleteAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const userRole = req.user.role;

    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can delete attendance records.",
      });
    }

    const attendance = await Attendance.findByIdAndDelete(attendanceId);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Attendance record deleted successfully.",
    });
  } catch (error) {
    console.error("Delete attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete attendance record.",
      error: error.message,
    });
  }
};

/**
 * Clock In
 */
const clockIn = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { location } = req.body;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay();

    if (currentDay === 0 || currentDay === 6) {
      return res.status(400).json({
        success: false,
        message: "🏖️ Today is weekend (Saturday/Sunday). Office is closed!",
      });
    }

    if (currentHour < 10) {
      return res.status(400).json({
        success: false,
        message: "⏰ Office opens at 10:00 AM. Please clock in after that.",
      });
    }

    if (currentHour >= 19) {
      return res.status(400).json({
        success: false,
        message: "⏰ Office hours ended at 7:00 PM. Cannot clock in now.",
      });
    }

    let employeeProfile = await Employee.findOne({ userId });
    let managerId = null;

    if (!employeeProfile) {
      const managerProfile = await Manager.findOne({ userId });

      if (!managerProfile) {
        return res.status(404).json({
          success: false,
          message: "Profile not found.",
        });
      }

      employeeProfile = {
        _id: managerProfile._id,
        managerId: managerProfile._id,
      };
      managerId = managerProfile._id;
    } else {
      managerId = employeeProfile.managerId;
    }

    const today = new Date();
    // PKT = UTC+5, isliye date midnight PKT mein set karo
    today.setUTCHours(19, 0, 0, 0); // 19:00 UTC = 00:00 PKT next day
    // Agar already past midnight PKT, adjust karo
    const pktNow = new Date(Date.now() + 5 * 60 * 60 * 1000);
    const pktMidnight = new Date(pktNow);
    pktMidnight.setUTCHours(
      pktMidnight.getUTCHours() - (pktNow.getUTCHours() % 24),
    );
    today.setTime(
      new Date(
        pktNow.toISOString().split("T")[0] + "T00:00:00+05:00",
      ).getTime(),
    );

    const existingAttendance = await Attendance.findOne({
      employeeId: employeeProfile._id,
      date: { $gte: today },
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "You have already clocked in today.",
      });
    }

    let isLate = false;
    let lateMinutes = 0;

    if (currentHour > 10 || (currentHour === 10 && currentMinute > 30)) {
      isLate = true;
      const totalMinutesNow = currentHour * 60 + currentMinute;
      const graceEndMinutes = 10 * 60 + 30;
      lateMinutes = totalMinutesNow - graceEndMinutes;
    }

    const holiday = await Holiday.findOne({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    const attendance = new Attendance({
      employeeId: employeeProfile._id,
      managerId: managerId,
      date: today,
      clockIn: now,
      status: holiday ? "holiday" : "present",
      isLate: isLate,
      lateMinutes: lateMinutes,
      location: { clockInLocation: location },
      markedBy: userId,
      isApproved: true,
      approvedBy: userId,
    });

    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate("employeeId", "firstName lastName employeeCode")
      .populate("managerId", "firstName lastName");

    res.status(201).json({
      success: true,
      message: isLate
        ? `⚠️ Clocked in late by ${lateMinutes} minutes (Grace period: 10:00-10:30 AM)`
        : "✅ Clocked in successfully - On Time!",
      data: { attendance: populatedAttendance },
    });
  } catch (error) {
    console.error("Clock in error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clock in.",
      error: error.message,
    });
  }
};

/**
 * Clock Out
 */
const clockOut = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { location } = req.body;

    let employeeProfile = await Employee.findOne({ userId });

    if (!employeeProfile) {
      const managerProfile = await Manager.findOne({ userId });

      if (!managerProfile) {
        return res.status(404).json({
          success: false,
          message: "Profile not found.",
        });
      }

      employeeProfile = { _id: managerProfile._id };
    }

    const pktNow = new Date(Date.now() + 5 * 60 * 60 * 1000);
const today = new Date(pktNow.toISOString().split('T')[0] + 'T00:00:00+05:00');

const attendance = await Attendance.findOne({
  employeeId: employeeProfile._id,
  date: { $gte: today }
});

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: "No clock-in record found for today. Please clock in first.",
      });
    }

    if (attendance.clockOut) {
      return res.status(400).json({
        success: false,
        message: "You have already clocked out today.",
      });
    }

    attendance.clockOut = new Date();
    if (location) {
      attendance.location.clockOutLocation = location;
    }

    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate("employeeId", "firstName lastName employeeCode")
      .populate("managerId", "firstName lastName");

    res.status(200).json({
      success: true,
      message: "Clocked out successfully.",
      data: { attendance: populatedAttendance },
    });
  } catch (error) {
    console.error("Clock out error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clock out.",
      error: error.message,
    });
  }
};

/**
 * Get Today's Clock Status
 */
const getTodayClockStatus = async (req, res) => {
  try {
    const userId = req.user.userId;

    let employeeProfile = await Employee.findOne({ userId });

    if (!employeeProfile) {
      const managerProfile = await Manager.findOne({ userId });

      if (!managerProfile) {
        return res.status(404).json({
          success: false,
          message: "Profile not found.",
        });
      }

      employeeProfile = { _id: managerProfile._id };
    }

    const pktNow = new Date(Date.now() + 5 * 60 * 60 * 1000);
const today = new Date(pktNow.toISOString().split('T')[0] + 'T00:00:00+05:00');

const attendance = await Attendance.findOne({
  employeeId: employeeProfile._id,
  date: { $gte: today }
});

    if (!attendance) {
      return res.status(200).json({
        success: true,
        data: {
          hasClockedIn: false,
          hasClockedOut: false,
          attendance: null,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        hasClockedIn: true,
        hasClockedOut: !!attendance.clockOut,
        attendance,
      },
    });
  } catch (error) {
    console.error("Get today clock status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch clock status.",
      error: error.message,
    });
  }
};

/**
 * Get Attendance Summary
 */
const getAttendanceSummary = async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    if (!employeeId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Employee ID, start date, and end date are required.",
      });
    }

    const query = {
      employeeId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    const attendanceRecords = await Attendance.find(query).sort({ date: 1 });

    const summary = {
      totalDays: attendanceRecords.length,
      present: attendanceRecords.filter((a) => a.status === "present").length,
      absent: attendanceRecords.filter((a) => a.status === "absent").length,
      late: attendanceRecords.filter((a) => a.isLate).length,
      halfDay: attendanceRecords.filter((a) => a.status === "half-day").length,
      onLeave: attendanceRecords.filter((a) => a.status === "on-leave").length,
      holiday: attendanceRecords.filter((a) => a.status === "holiday").length,
      totalWorkHours: attendanceRecords.reduce(
        (sum, a) => sum + (a.workHours || 0),
        0,
      ),
      totalOvertimeHours: attendanceRecords.reduce(
        (sum, a) => sum + (a.overtimeHours || 0),
        0,
      ),
      totalLateMinutes: attendanceRecords.reduce(
        (sum, a) => sum + (a.lateMinutes || 0),
        0,
      ),
      averageWorkHours: 0,
    };

    if (summary.totalDays > 0) {
      summary.averageWorkHours = (
        summary.totalWorkHours / summary.totalDays
      ).toFixed(2);
    }

    res.status(200).json({
      success: true,
      data: {
        summary,
        attendance: attendanceRecords,
      },
    });
  } catch (error) {
    console.error("Get attendance summary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance summary.",
      error: error.message,
    });
  }
};

/**
 * Bulk Mark Attendance
 */
const bulkMarkAttendance = async (req, res) => {
  try {
    const { attendanceData } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (!attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance data format.",
      });
    }

    if (userRole !== "admin" && userRole !== "manager") {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only admins and managers can bulk mark attendance.",
      });
    }

    const results = { success: [], failed: [] };

    for (const data of attendanceData) {
      try {
        const { employeeId, date, status, remarks } = data;

        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        const existingAttendance = await Attendance.findOne({
          employeeId,
          date: {
            $gte: attendanceDate,
            $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
          },
        });

        if (existingAttendance) {
          results.failed.push({
            employeeId,
            date,
            reason: "Attendance already exists",
          });
          continue;
        }

        const employee = await Employee.findById(employeeId);

        if (!employee) {
          results.failed.push({
            employeeId,
            date,
            reason: "Employee not found",
          });
          continue;
        }

        const attendance = new Attendance({
          employeeId,
          managerId: employee.managerId,
          date: attendanceDate,
          clockIn: new Date(attendanceDate.getTime() + 10 * 60 * 60 * 1000),
          status: status || "present",
          remarks,
          markedBy: userId,
          isApproved: true,
          approvedBy: userId,
        });

        await attendance.save();
        results.success.push({
          employeeId,
          date,
          attendanceId: attendance._id,
        });
      } catch (err) {
        results.failed.push({
          employeeId: data.employeeId,
          date: data.date,
          reason: err.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk attendance marked. Success: ${results.success.length}, Failed: ${results.failed.length}`,
      data: results,
    });
  } catch (error) {
    console.error("Bulk mark attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk mark attendance.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ⏰ OVERTIME FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Admin/Manager: Employee ka overtime directly set karo (bina request ke)
 */
const setOvertime = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { overtimeMinutes, overtimeNote } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole === "employee") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Employees cannot directly set overtime.",
      });
    }

    if (overtimeMinutes === undefined || overtimeMinutes < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid overtime minutes required (0 ya zyada).",
      });
    }

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance record not found." });
    }

    if (userRole === "manager") {
      const manager = await Manager.findOne({ userId });
      if (
        !manager ||
        attendance.managerId?.toString() !== manager._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Yeh employee aapke under nahi hai.",
        });
      }
    }

    const overtimeHours = parseFloat((overtimeMinutes / 60).toFixed(2));

    attendance.overtimeMinutes = overtimeMinutes;
    attendance.overtimeHours = overtimeHours;
    attendance.overtimeNote = overtimeNote || "";
    attendance.overtimeApprovedBy = userId;
    attendance.overtimeApprovedAt = new Date();
    attendance.overtimeStatus = "approved";
    attendance.overtimeRequestedByEmployee = false;
    await attendance.save();

    try {
      const employee = await Employee.findById(attendance.employeeId).populate(
        "userId",
      );
      if (employee && employee.userId) {
        await notificationService.createNotification(
          employee.userId._id,
          "⏰ Overtime Added to Your Record",
          `${overtimeMinutes} minutes (${overtimeHours} hrs) overtime aapki attendance mein add kar diya gaya hai. ${overtimeNote ? "Note: " + overtimeNote : ""}`,
          "overtime_added",
          "/employee/my-attendance",
          { attendanceId: attendance._id, overtimeMinutes, overtimeHours },
        );
      }
    } catch (notifErr) {
      console.error("⚠️ Overtime notification error:", notifErr);
    }

    const updatedAttendance = await Attendance.findById(attendanceId)
      .populate("employeeId", "firstName lastName employeeCode")
      .populate("managerId", "firstName lastName");

    res.status(200).json({
      success: true,
      message: `✅ Overtime successfully set: ${overtimeMinutes} min (${overtimeHours} hrs)`,
      data: { attendance: updatedAttendance },
    });
  } catch (error) {
    console.error("Set overtime error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to set overtime.",
        error: error.message,
      });
  }
};

/**
 * Employee: Overtime request bhejo
 */
const requestOvertime = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { overtimeMinutes, overtimeNote } = req.body;
    const userId = req.user.userId;

    if (!overtimeMinutes || overtimeMinutes <= 0) {
      return res.status(400).json({
        success: false,
        message: "Overtime minutes required aur 0 se zyada hone chahiye.",
      });
    }

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance record not found." });
    }

    let employeeProfile = await Employee.findOne({ userId });
    if (!employeeProfile) {
      const managerProfile = await Manager.findOne({ userId });
      if (
        !managerProfile ||
        managerProfile._id.toString() !== attendance.employeeId.toString()
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied." });
      }
    } else if (
      employeeProfile._id.toString() !== attendance.employeeId.toString()
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message:
            "Access denied. Aap sirf apna overtime request kar sakte hain.",
        });
    }

    if (attendance.overtimeStatus === "approved") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Is din ka overtime already approved hai.",
        });
    }

    if (attendance.overtimeStatus === "pending") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Aapki overtime request pehle se pending hai.",
        });
    }

    const overtimeHours = parseFloat((overtimeMinutes / 60).toFixed(2));

    attendance.overtimeMinutes = overtimeMinutes;
    attendance.overtimeHours = overtimeHours;
    attendance.overtimeNote = overtimeNote || "";
    attendance.overtimeStatus = "pending";
    attendance.overtimeRequestedByEmployee = true;
    attendance.overtimeRequestedAt = new Date();
    await attendance.save();

    try {
      const employee = await Employee.findById(attendance.employeeId);
      const empName = `${employee?.firstName} ${employee?.lastName}`;
      const dateStr = new Date(attendance.date).toLocaleDateString("en-GB");

      const admins = await User.find({ role: "admin" });
      for (const admin of admins) {
        await notificationService.createNotification(
          admin._id,
          "⏰ Overtime Request",
          `${empName} ne ${dateStr} ke liye ${overtimeMinutes} min overtime request ki hai.`,
          "overtime_request",
          "/admin/overtime",
          {
            attendanceId: attendance._id,
            employeeName: empName,
            overtimeMinutes,
          },
        );
      }

      if (attendance.managerId) {
        const managerDoc = await Manager.findById(
          attendance.managerId,
        ).populate("userId");
        if (managerDoc?.userId) {
          await notificationService.createNotification(
            managerDoc.userId._id,
            "⏰ Overtime Request",
            `${empName} ne ${dateStr} ke liye ${overtimeMinutes} min overtime request ki hai.`,
            "overtime_request",
            "/manager/overtime",
            {
              attendanceId: attendance._id,
              employeeName: empName,
              overtimeMinutes,
            },
          );
        }
      }
    } catch (notifErr) {
      console.error("⚠️ Overtime request notification error:", notifErr);
    }

    res.status(200).json({
      success: true,
      message: `✅ Overtime request submit ho gayi: ${overtimeMinutes} min. Admin/Manager review karega.`,
      data: { attendance },
    });
  } catch (error) {
    console.error("Request overtime error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to submit overtime request.",
        error: error.message,
      });
  }
};

/**
 * Admin/Manager: Overtime request approve ya reject karo
 */
const approveOvertimeRequest = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { approved, overtimeMinutes, rejectionNote } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole === "employee") {
      return res
        .status(403)
        .json({ success: false, message: "Access denied." });
    }

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance record not found." });
    }

    if (attendance.overtimeStatus !== "pending") {
      return res
        .status(400)
        .json({
          success: false,
          message: `Overtime request already ${attendance.overtimeStatus} hai.`,
        });
    }

    if (approved) {
      if (overtimeMinutes && overtimeMinutes > 0) {
        attendance.overtimeMinutes = overtimeMinutes;
        attendance.overtimeHours = parseFloat(
          (overtimeMinutes / 60).toFixed(2),
        );
      }
      attendance.overtimeStatus = "approved";
      attendance.overtimeApprovedBy = userId;
      attendance.overtimeApprovedAt = new Date();
    } else {
      attendance.overtimeStatus = "rejected";
      attendance.overtimeMinutes = 0;
      attendance.overtimeHours = 0;
      attendance.overtimeRejectionNote = rejectionNote || "Request rejected";
    }

    await attendance.save();

    try {
      const employee = await Employee.findById(attendance.employeeId).populate(
        "userId",
      );
      if (employee && employee.userId) {
        await notificationService.createNotification(
          employee.userId._id,
          approved
            ? "✅ Overtime Request Approved"
            : "❌ Overtime Request Rejected",
          approved
            ? `Aapki ${attendance.overtimeMinutes} min overtime request approve ho gayi!`
            : `Aapki overtime request reject ho gayi. ${rejectionNote ? "Reason: " + rejectionNote : ""}`,
          approved ? "overtime_approved" : "overtime_rejected",
          "/employee/overtime-requests",
          { attendanceId: attendance._id },
        );
      }
    } catch (notifErr) {
      console.error("⚠️ Notification error:", notifErr);
    }

    res.status(200).json({
      success: true,
      message: approved
        ? `✅ Overtime approved: ${attendance.overtimeMinutes} min`
        : "❌ Overtime request rejected.",
      data: { attendance },
    });
  } catch (error) {
    console.error("Approve overtime error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to process overtime request.",
        error: error.message,
      });
  }
};

/**
 * Admin/Manager: Pending overtime requests dekho
 */
const getPendingOvertimeRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    const query = {
      overtimeStatus: "pending",
      overtimeRequestedByEmployee: true,
    };

    if (userRole === "manager") {
      const manager = await Manager.findOne({ userId });
      if (manager) query.managerId = manager._id;
    }

    const pendingRequests = await Attendance.find(query)
      .populate("employeeId", "firstName lastName employeeCode department")
      .populate("managerId", "firstName lastName")
      .sort({ overtimeRequestedAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        requests: pendingRequests,
        count: pendingRequests.length,
      },
    });
  } catch (error) {
    console.error("Get pending overtime error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch pending overtime requests.",
        error: error.message,
      });
  }
};
/**
 * Admin: Mistakenly absent marked employee ki attendance correct karo
 */
const adminCorrectAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { status, clockIn, clockOut, remarks, correctionReason } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;
 
    // Sirf admin correct kar sakta hai
    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin can correct attendance records.",
      });
    }
 
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "New status is required.",
      });
    }
 
    if (!correctionReason || correctionReason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Correction reason is required.",
      });
    }
 
    const attendance = await Attendance.findById(attendanceId);
 
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found.",
      });
    }
 
    const oldStatus = attendance.status;
 
    // Fields update karo
    attendance.status = status;
    attendance.remarks = remarks || attendance.remarks;
    attendance.correctionReason = correctionReason;
    attendance.correctedBy = userId;
    attendance.correctedAt = new Date();
    attendance.originalStatus = oldStatus;
 
    if (clockIn) attendance.clockIn = new Date(clockIn);
    if (clockOut) attendance.clockOut = new Date(clockOut);
 
    // Agar absent tha aur ab present/half-day ho raha hai
    if (oldStatus === "absent" && (status === "present" || status === "half-day")) {
      attendance.isApproved = true;
      attendance.approvedBy = userId;
    }
 
    await attendance.save();
 
    // Employee ko notification bhejo
    try {
      const employee = await Employee.findById(attendance.employeeId).populate("userId");
      if (employee && employee.userId) {
        const dateStr = new Date(attendance.date).toLocaleDateString("en-GB");
        await notificationService.createNotification(
          employee.userId._id,
          "✅ Attendance Corrected by Admin",
          `Aapki ${dateStr} ki attendance admin ne correct ki hai. Status: ${oldStatus} → ${status}. Reason: ${correctionReason}`,
          "attendance_corrected",
          "/employee/my-attendance",
          {
            attendanceId: attendance._id,
            oldStatus,
            newStatus: status,
            date: attendance.date,
          }
        );
      }
 
      // Manager ko bhi notify karo
      if (attendance.managerId) {
        const managerDoc = await Manager.findById(attendance.managerId).populate("userId");
        if (managerDoc && managerDoc.userId) {
          const employee2 = await Employee.findById(attendance.employeeId);
          const empName = employee2 ? `${employee2.firstName} ${employee2.lastName}` : "Employee";
          const dateStr = new Date(attendance.date).toLocaleDateString("en-GB");
          await notificationService.createNotification(
            managerDoc.userId._id,
            "📝 Attendance Corrected",
            `Admin ne ${empName} ki ${dateStr} attendance correct ki: ${oldStatus} → ${status}`,
            "attendance_corrected",
            "/manager/attendance-history",
            {
              attendanceId: attendance._id,
              oldStatus,
              newStatus: status,
            }
          );
        }
      }
    } catch (notifErr) {
      console.error("⚠️ Correction notification error:", notifErr);
    }
 
    const updatedAttendance = await Attendance.findById(attendanceId)
      .populate("employeeId", "firstName lastName employeeCode department")
      .populate("managerId", "firstName lastName")
      .populate("correctedBy", "email role");
 
    res.status(200).json({
      success: true,
      message: `✅ Attendance corrected: ${oldStatus} → ${status}`,
      data: { attendance: updatedAttendance },
    });
  } catch (error) {
    console.error("Admin correct attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to correct attendance.",
      error: error.message,
    });
  }
};
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getAllAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  clockIn,
  clockOut,
  getTodayClockStatus,
  getAttendanceSummary,
  bulkMarkAttendance,
  setOvertime,
  requestOvertime,
  approveOvertimeRequest,
  getPendingOvertimeRequests,
   setOvertime,
  requestOvertime,
  approveOvertimeRequest,
  adminCorrectAttendance,
  getPendingOvertimeRequests
};
