// Sirf in roles ko allow karo
const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  next();
};

// Superadmin ko sab allow, worker ko sirf wohi jo permission mili ho
const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  if (req.user.role === 'superadmin') return next();
  if (req.user.role === 'worker' && (req.user.permissions || []).includes(permission)) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Permission denied.' });
};

module.exports = { allowRoles, requirePermission };