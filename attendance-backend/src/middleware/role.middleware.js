/**
 * Check if user has required role
 * @param {Array|String} allowedRoles - Array of allowed roles or single role
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      // Check if user has required role
      const userRole = req.user.role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to perform this action.'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization failed.',
        error: error.message
      });
    }
  };
};

/**
 * Check if user is admin
 */
const isAdmin = (req, res, next) => {
  return authorize('admin')(req, res, next);
};

/**
 * Check if user is manager or admin
 */
const isManagerOrAdmin = (req, res, next) => {
  return authorize('admin', 'manager')(req, res, next);
};

/**
 * Check if user is employee, manager, or admin
 */
const isEmployeeOrAbove = (req, res, next) => {
  return authorize('admin', 'manager', 'employee')(req, res, next);
};

/**
 * Check if user can access their own resource or is admin/manager
 */
const canAccessOwnResource = (resourceIdParam = 'id') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      const resourceId = req.params[resourceIdParam];
      const userId = req.user.userId.toString();
      const userRole = req.user.role;

      // Admin and Manager can access any resource
      if (userRole === 'admin' || userRole === 'manager') {
        return next();
      }

      // Employee can only access their own resource
      if (resourceId === userId) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization failed.',
        error: error.message
      });
    }
  };
};

/**
 * Check if manager can access employee under them
 */
const canAccessEmployeeUnderManager = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const userRole = req.user.role;

    // Admin can access all employees
    if (userRole === 'admin') {
      return next();
    }

    // Manager can only access their employees
    if (userRole === 'manager') {
      const Manager = require('../models/Manager');
      const employeeId = req.params.employeeId || req.body.employeeId;

      const manager = await Manager.findOne({ userId: req.user.userId });

      if (!manager) {
        return res.status(404).json({
          success: false,
          message: 'Manager profile not found.'
        });
      }

      // Check if employee is under this manager
      const hasAccess = manager.employeesUnder.some(
        emp => emp.toString() === employeeId
      );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. This employee is not under your supervision.'
        });
      }

      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authorization failed.',
      error: error.message
    });
  }
};

module.exports = {
  authorize,
  isAdmin,
  isManagerOrAdmin,
  isEmployeeOrAbove,
  canAccessOwnResource,
  canAccessEmployeeUnderManager
};