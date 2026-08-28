/**
 * Tenant Isolation Middleware
 * Must run AFTER `authenticate`. Attaches req.companyId for convenience.
 *
 * IMPORTANT: superadmin has no companyId (platform-level) and is allowed through
 * without a companyId — routes that need company scoping should combine this
 * with role checks as needed.
 */
const attachTenant = (req, res, next) => {
  if (req.user && req.user.role !== 'superadmin') {
    if (!req.user.companyId) {
      // Legacy user (pre-SaaS data) — allowed through untouched.
      // Once all users are migrated to a company, this can be tightened
      // to reject requests with no companyId.
      req.companyId = null;
    } else {
      req.companyId = req.user.companyId;
    }
  }
  next();
};

/**
 * Use this inside controllers to build a Mongo filter that is
 * safe for both legacy (companyId: null) and tenant-scoped data.
 *
 * Example: Employee.find(tenantFilter(req, { department: 'Sales' }))
 */
const tenantFilter = (req, extraFilter = {}) => {
  if (req.companyId) {
    return { ...extraFilter, companyId: req.companyId };
  }
  // Legacy behavior — no companyId means "old data", filter unchanged
  return extraFilter;
};

module.exports = { attachTenant, tenantFilter };