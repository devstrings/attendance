const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

// Decide which company is "active" for this request
const resolveActiveCompany = (user, headerCompanyId) => {
  const allowed = [];
  if (user.companyId) allowed.push(String(user.companyId));
  (user.companies || []).forEach((c) => {
    const id = String(c);
    if (!allowed.includes(id)) allowed.push(id);
  });

  const toObjectId = (id) => (id ? new mongoose.Types.ObjectId(id) : null);

  // Superadmin aur Worker: platform level, company restriction nahi
  if (user.role === 'superadmin' || user.role === 'worker') {
    if (headerCompanyId) {
      if (!mongoose.Types.ObjectId.isValid(headerCompanyId)) {
        return { error: { status: 400, message: 'Invalid company id.' } };
      }
      return { companyId: toObjectId(headerCompanyId), allowed };
    }
    return { companyId: toObjectId(allowed[0] || null), allowed };
  }

  // Header bheja gaya hai → allowed list mein hona chahiye
  if (headerCompanyId) {
    if (!allowed.includes(headerCompanyId)) {
      return { error: { status: 403, message: 'You do not have access to this company.' } };
    }
    return { companyId: toObjectId(headerCompanyId), allowed };
  }

  // Header nahi bheja: 0 ya 1 company ho to theek
  if (allowed.length <= 1) {
    return { companyId: toObjectId(allowed[0] || null), allowed };
  }

  // Multiple companies aur header missing
  return {
    error: {
      status: 400,
      message: 'Multiple companies assigned. Please send x-company-id header.'
    }
  };
};

const buildReqUser = (user, result) => ({
  _id: user._id,
  userId: user._id,
  email: user.email,
  role: user.role,
  permissions: user.permissions || [],   // ✅ NEW
  companyId: result.companyId,
  companies: result.allowed
});

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.'
      });
    }

    // Active company resolve karo
    const headerCompanyId = req.headers['x-company-id'];
    const result = resolveActiveCompany(user, headerCompanyId);

    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        message: result.error.message
      });
    }

    req.user = buildReqUser(user, result);
    req.companyId = result.companyId;

    next();
  } catch (error) {
    console.error('❌ Auth error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (user && user.isActive) {
        const result = resolveActiveCompany(user, req.headers['x-company-id']);

        if (!result.error) {
          req.user = buildReqUser(user, result);
          req.companyId = result.companyId;
        }
      }
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth
};