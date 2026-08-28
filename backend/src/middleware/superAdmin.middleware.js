/**
 * Restrict route to Super Admin only.
 * Must be used AFTER `authenticate` middleware (needs req.user).
 */
const isSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super Admin privileges required.'
    });
  }
  next();
};

module.exports = { isSuperAdmin };