const AuditLog = require('../models/AuditLog');

/**
 * Records a Super Admin action. Never throws — a logging failure
 * must not break the actual action it is recording.
 */
const logAction = async ({ action, performedBy, performedByEmail, targetType, targetId, targetLabel = '', details = {}, req = null }) => {
  try {
    await AuditLog.create({
      action,
      performedBy,
      performedByEmail,
      targetType,
      targetId,
      targetLabel,
      details,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || null
    });
  } catch (err) {
    console.error('⚠️ Audit log write failed (non-fatal):', err.message);
  }
};

module.exports = { logAction };