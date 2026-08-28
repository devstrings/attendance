const Company = require('../models/Company');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Manager = require('../models/Manager');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const LeaveRequest = require('../models/LeaveRequest');
const CorrectionRequest = require('../models/CorrectionRequest');
const Salary = require('../models/Salary');
const Notification = require('../models/Notification');
const Holiday = require('../models/Holiday');
const SystemConfig = require('../models/SystemConfig');
const { logAction } = require('../utils/auditLogger');
const AuditLog = require('../models/AuditLog');

/**
 * Create a new Company
 */
const createCompany = async (req, res) => {
  try {
    const {
      companyName, companyCode, slug, email, phone,
      address, country, timezone, subscriptionPlan
    } = req.body;

    if (!companyName || !companyCode || !slug || !email) {
      return res.status(400).json({
        success: false,
        message: 'companyName, companyCode, slug and email are required.'
      });
    }

    const existing = await Company.findOne({
      $or: [{ companyCode: companyCode.toUpperCase() }, { slug: slug.toLowerCase() }]
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Company code or slug already in use.'
      });
    }

    const company = await Company.create({
      companyName,
      companyCode,
      slug,
      email,
      phone,
      address,
      country,
      timezone,
      subscriptionPlan,
      createdBy: req.user._id
    });

      // ✅ NEW — audit log
    await logAction({
      action: 'company_created',
      performedBy: req.user._id,
      performedByEmail: req.user.email,
      targetType: 'Company',
      targetId: company._id,
      targetLabel: company.companyName,
      req
    });

    res.status(201).json({
      success: true,
      message: 'Company created successfully.',
      data: company
    });
  } catch (error) {
    console.error('❌ Create company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create company.',
      error: error.message
    });
  }
};

/**
 * Get all companies (with basic pagination)
 */
const getAllCompanies = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;

    const filter = search
      ? { companyName: { $regex: search, $options: 'i' } }
      : {};

    const companies = await Company.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Company.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: companies,
      pagination: { page: Number(page), limit: Number(limit), total }
    });
  } catch (error) {
    console.error('❌ Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies.',
      error: error.message
    });
  }
};

/**
 * Get single company + basic stats
 */
const getCompanyById = async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    const userCount = await User.countDocuments({ companyId });
    const adminCount = await User.countDocuments({ companyId, role: 'admin' });
    const managerCount = await User.countDocuments({ companyId, role: 'manager' });
    const employeeCount = await User.countDocuments({ companyId, role: 'employee' });

    res.status(200).json({
      success: true,
      data: {
        company,
        stats: { userCount, adminCount, managerCount, employeeCount }
      }
    });
  } catch (error) {
    console.error('❌ Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company.',
      error: error.message
    });
  }
};

/**
 * Update company details
 */
const updateCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const updates = { ...req.body };

    // Prevent direct isActive toggling here — use suspend/activate endpoints instead
    delete updates.isActive;
    delete updates.companyCode;
    delete updates.slug;

    const company = await Company.findByIdAndUpdate(companyId, updates, {
      new: true,
      runValidators: true
    });

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

     // ✅ NEW — audit log
    await logAction({
      action: 'company_updated',
      performedBy: req.user._id,
      performedByEmail: req.user.email,
      targetType: 'Company',
      targetId: company._id,
      targetLabel: company.companyName,
      details: updates,
      req
    });

    res.status(200).json({
      success: true,
      message: 'Company updated successfully.',
      data: company
    });
  } catch (error) {
    console.error('❌ Update company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company.',
      error: error.message
    });
  }
};

/**
 * Suspend a company (blocks login for all its users — enforced in tenant middleware, added later)
 */
const suspendCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { reason } = req.body;

    const company = await Company.findByIdAndUpdate(
      companyId,
      { isActive: false, suspendedAt: new Date(), suspensionReason: reason || 'Not specified' },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    // ✅ NEW — audit log
    await logAction({
      action: 'company_suspended',
      performedBy: req.user._id,
      performedByEmail: req.user.email,
      targetType: 'Company',
      targetId: company._id,
      targetLabel: company.companyName,
      details: { reason: reason || 'Not specified' },
      req
    });

    res.status(200).json({
      success: true,
      message: 'Company suspended successfully.',
      data: company
    });
  } catch (error) {
    console.error('❌ Suspend company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend company.',
      error: error.message
    });
  }
};

/**
 * Activate a suspended company
 */
const activateCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findByIdAndUpdate(
      companyId,
      { isActive: true, suspendedAt: null, suspensionReason: null },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    // ✅ NEW — audit log
    await logAction({
      action: 'company_activated',
      performedBy: req.user._id,
      performedByEmail: req.user.email,
      targetType: 'Company',
      targetId: company._id,
      targetLabel: company.companyName,
      req
    });

    res.status(200).json({
      success: true,
      message: 'Company activated successfully.',
      data: company
    });
  } catch (error) {
    console.error('❌ Activate company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate company.',
      error: error.message
    });
  }
};

/**
 * Delete a company (soft — only allowed if it has no users, to avoid orphaned data)
 */
/**
 * Delete a company — cascade deletes ALL its data (users, profiles, attendance,
 * leaves, salaries, notifications, holidays, system config). Irreversible.
 * Frontend confirms with the user before calling this.
 */
const deleteCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    const employeeIds = await Employee.find({ companyId }).distinct('_id');
    const managerIds = await Manager.find({ companyId }).distinct('_id');
    const userIds = await User.find({ companyId }).distinct('_id');

    await Promise.all([
      Attendance.deleteMany({ employeeId: { $in: [...employeeIds, ...managerIds] } }),
      Leave.deleteMany({ companyId }),
      LeaveRequest.deleteMany({ companyId }),
      CorrectionRequest.deleteMany({ companyId }),
      Salary.deleteMany({ companyId }),
      Notification.deleteMany({ companyId }),
      Holiday.deleteMany({ companyId }),
      SystemConfig.deleteMany({ companyId }),
      Employee.deleteMany({ companyId }),
      Manager.deleteMany({ companyId }),
      User.deleteMany({ companyId }),
    ]);

    await Company.findByIdAndDelete(companyId);

    // ✅ audit log
    await logAction({
      action: 'company_deleted',
      performedBy: req.user._id,
      performedByEmail: req.user.email,
      targetType: 'Company',
      targetId: company._id,
      targetLabel: company.companyName,
      details: { deletedUsers: userIds.length },
      req
    });

    res.status(200).json({
      success: true,
      message: `Company "${company.companyName}" and all its data (${userIds.length} user(s)) deleted successfully.`
    });
  } catch (error) {
    console.error('❌ Delete company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete company.',
      error: error.message
    });
  }
};

/**
 * Create the first Admin user for a company
 */
const createCompanyAdmin = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { email, password, name, phoneNumber } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email and password are required.'
      });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.'
      });
    }

    const adminUser = await User.create({
      email,
      password, // hashed automatically by User pre-save hook
      name,
      phoneNumber,
      role: 'admin',
      companyId: company._id,
      isEmailVerified: true,
      createdBy: req.user._id
    });

     // ✅ NEW — audit log
    await logAction({
      action: 'company_admin_created',
      performedBy: req.user._id,
      performedByEmail: req.user.email,
      targetType: 'User',
      targetId: adminUser._id,
      targetLabel: `${adminUser.email} (${company.companyName})`,
      req
    });

    res.status(201).json({
      success: true,
      message: 'Company admin created successfully.',
      data: adminUser
    });
  } catch (error) {
    console.error('❌ Create company admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create company admin.',
      error: error.message
    });
  }
};

/**
 * Reset a company admin's password
 */
const resetCompanyAdminPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'newPassword is required (min 6 characters).'
      });
    }

    const user = await User.findOne({ _id: userId, role: 'admin' });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Company admin not found.' });
    }

    user.password = newPassword; // re-hashed automatically by pre-save hook
    await user.save();

    // ✅ NEW — audit log
    await logAction({
      action: 'company_admin_password_reset',
      performedBy: req.user._id,
      performedByEmail: req.user.email,
      targetType: 'User',
      targetId: user._id,
      targetLabel: user.email,
      req
    });

    res.status(200).json({
      success: true,
      message: 'Company admin password reset successfully.'
    });
  } catch (error) {
    console.error('❌ Reset admin password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password.',
      error: error.message
    });
  }
};

/**
 * View audit logs (paginated, filterable)
 */
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 30, action = '', targetType = '' } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await AuditLog.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: { page: Number(page), limit: Number(limit), total }
    });
  } catch (error) {
    console.error('❌ Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs.',
      error: error.message
    });
  }
};

/**
 * Delete a single audit log entry
 */
const deleteAuditLog = async (req, res) => {
  try {
    const { logId } = req.params;
    const log = await AuditLog.findByIdAndDelete(logId);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Audit log entry not found.' });
    }
    res.status(200).json({ success: true, message: 'Audit log entry deleted.' });
  } catch (error) {
    console.error('❌ Delete audit log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete audit log entry.',
      error: error.message
    });
  }
};

/**
 * Clear all audit logs
 */
const clearAllAuditLogs = async (req, res) => {
  try {
    const result = await AuditLog.deleteMany({});
    res.status(200).json({
      success: true,
      message: `Cleared ${result.deletedCount} audit log entries.`
    });
  } catch (error) {
    console.error('❌ Clear audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear audit logs.',
      error: error.message
    });
  }
};

/**
 * Platform-wide usage snapshot
 */
const getPlatformUsage = async (req, res) => {
  try {
    const totalCompanies = await Company.countDocuments();
    const activeCompanies = await Company.countDocuments({ isActive: true });
    const suspendedCompanies = totalCompanies - activeCompanies;

    const totalUsers = await User.countDocuments({ role: { $ne: 'superadmin' } });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalManagers = await User.countDocuments({ role: 'manager' });
    const totalEmployees = await User.countDocuments({ role: 'employee' });

    const planBreakdown = await Company.aggregate([
      { $group: { _id: '$subscriptionPlan', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        companies: { total: totalCompanies, active: activeCompanies, suspended: suspendedCompanies },
        users: { total: totalUsers, admins: totalAdmins, managers: totalManagers, employees: totalEmployees },
        planBreakdown
      }
    });
  } catch (error) {
    console.error('❌ Get platform usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch platform usage.',
      error: error.message
    });
  }
};  

module.exports = {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  suspendCompany,
  activateCompany,
  deleteCompany,
  createCompanyAdmin,
  resetCompanyAdminPassword,
   getAuditLogs,        // ✅ NEW
   deleteAuditLog,        // ✅ NEW
   clearAllAuditLogs,     // ✅ NEW
  getPlatformUsage  
};