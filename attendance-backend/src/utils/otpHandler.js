/**
 * Generate OTP
 * @param {Number} length - OTP length (default: 6)
 * @returns {String} OTP
 */
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  
  return otp;
};

/**
 * Verify OTP
 * @param {String} inputOTP - User input OTP
 * @param {String} storedOTP - Stored OTP
 * @param {Date} otpExpiry - OTP expiry time
 * @returns {Object} Verification result
 */
const verifyOTP = (inputOTP, storedOTP, otpExpiry) => {
  // Check if OTP exists
  if (!storedOTP || !otpExpiry) {
    return {
      isValid: false,
      message: 'No OTP found. Please request a new one.'
    };
  }

  // Check if OTP expired
  if (new Date() > new Date(otpExpiry)) {
    return {
      isValid: false,
      message: 'OTP has expired. Please request a new one.'
    };
  }

  // Check if OTP matches
  if (inputOTP !== storedOTP) {
    return {
      isValid: false,
      message: 'Invalid OTP. Please try again.'
    };
  }

  return {
    isValid: true,
    message: 'OTP verified successfully.'
  };
};

/**
 * Generate OTP Expiry Time
 * @param {Number} minutes - Expiry in minutes (default: 10)
 * @returns {Date} Expiry date
 */
const generateOTPExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Generate Alphanumeric OTP
 * @param {Number} length - OTP length (default: 6)
 * @returns {String} Alphanumeric OTP
 */
const generateAlphanumericOTP = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return otp;
};

/**
 * Check if OTP is expired
 * @param {Date} otpExpiry - OTP expiry time
 * @returns {Boolean} True if expired
 */
const isOTPExpired = (otpExpiry) => {
  if (!otpExpiry) return true;
  return new Date() > new Date(otpExpiry);
};

module.exports = {
  generateOTP,
  verifyOTP,
  generateOTPExpiry,
  generateAlphanumericOTP,
  isOTPExpired
};