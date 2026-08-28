const SystemConfig = require('../models/SystemConfig');

/**
 * Get the active SystemConfig for a given company.
 * - Agar companyId di gayi hai aur us company ka apna active config hai, wahi return hoga.
 * - Agar nahi mila (ya companyId nahi di gayi — legacy/pre-SaaS request), to
 *   legacy/global config (companyId: null) return hoga — taake purana behavior na tootey.
 * - Agar wo bhi na mile, null return hota hai (caller ke existing `?.` fallback defaults
 *   already har jagah hain, is liye ye safe hai).
 */
const getActiveSystemConfig = async (companyId = null) => {
  if (companyId) {
    const companyConfig = await SystemConfig.findOne({ isActive: true, companyId });
    if (companyConfig) return companyConfig;
  }
  // Fallback — legacy/global config (pre-SaaS data, companyId field null/missing)
  return await SystemConfig.findOne({
    isActive: true,
    $or: [{ companyId: null }, { companyId: { $exists: false } }]
  });
};

module.exports = { getActiveSystemConfig };