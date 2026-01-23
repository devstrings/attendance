const jwt = require('jsonwebtoken');

/**
 * Generate JWT Token
 * @param {String} userId - User ID
 * @param {String} role - User role (admin, manager, employee)
 * @param {String} expiresIn - Token expiry (default: 7d)
 * @returns {String} JWT Token
 */
const generateToken = (userId, role, expiresIn = '7d') => {
  try {
    const payload = {
      userId,
      role,
      timestamp: Date.now()
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn
    });

    return token;
  } catch (error) {
    console.error('Generate token error:', error);
    throw new Error('Failed to generate token');
  }
};

/**
 * Verify JWT Token
 * @param {String} token - JWT Token
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
};

/**
 * Decode JWT Token without verification
 * @param {String} token - JWT Token
 * @returns {Object} Decoded payload
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('Decode token error:', error);
    return null;
  }
};

/**
 * Generate Refresh Token
 * @param {String} userId - User ID
 * @returns {String} Refresh Token
 */
const generateRefreshToken = (userId) => {
  try {
    const payload = {
      userId,
      type: 'refresh'
    };

    const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    return token;
  } catch (error) {
    console.error('Generate refresh token error:', error);
    throw new Error('Failed to generate refresh token');
  }
};

/**
 * Verify Refresh Token
 * @param {String} token - Refresh Token
 * @returns {Object} Decoded payload
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw new Error('Refresh token verification failed');
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  generateRefreshToken,
  verifyRefreshToken
};