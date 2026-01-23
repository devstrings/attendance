/**
 * Validate Email
 * @param {String} email - Email address
 * @returns {Boolean} True if valid
 */
const validateEmail = (email) => {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Password
 * @param {String} password - Password
 * @returns {Object} Validation result
 */
const validatePassword = (password) => {
  if (!password) {
    return {
      isValid: false,
      message: 'Password is required.'
    };
  }

  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return {
      isValid: false,
      message: `Password must be at least ${minLength} characters long.`
    };
  }

  if (!hasUpperCase) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter.'
    };
  }

  if (!hasLowerCase) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter.'
    };
  }

  if (!hasNumbers) {
    return {
      isValid: false,
      message: 'Password must contain at least one number.'
    };
  }

  if (!hasSpecialChar) {
    return {
      isValid: false,
      message: 'Password must contain at least one special character (!@#$%^&*).'
    };
  }

  return {
    isValid: true,
    message: 'Password is strong.'
  };
};

/**
 * Validate Phone Number
 * @param {String} phone - Phone number
 * @returns {Boolean} True if valid
 */
const validatePhoneNumber = (phone) => {
  if (!phone) return false;
  
  // Pakistan phone number format: 03XX-XXXXXXX or +92XXX-XXXXXXX
  const phoneRegex = /^(\+92|0)?3\d{2}-?\d{7}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validate CNIC
 * @param {String} cnic - CNIC number
 * @returns {Boolean} True if valid
 */
const validateCNIC = (cnic) => {
  if (!cnic) return false;
  
  // Pakistan CNIC format: XXXXX-XXXXXXX-X
  const cnicRegex = /^\d{5}-?\d{7}-?\d{1}$/;
  return cnicRegex.test(cnic.replace(/\s/g, ''));
};

/**
 * Validate Date
 * @param {String|Date} date - Date to validate
 * @returns {Boolean} True if valid
 */
const validateDate = (date) => {
  if (!date) return false;
  
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
};

/**
 * Validate Date Range
 * @param {String|Date} startDate - Start date
 * @param {String|Date} endDate - End date
 * @returns {Object} Validation result
 */
const validateDateRange = (startDate, endDate) => {
  if (!validateDate(startDate)) {
    return {
      isValid: false,
      message: 'Invalid start date.'
    };
  }

  if (!validateDate(endDate)) {
    return {
      isValid: false,
      message: 'Invalid end date.'
    };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return {
      isValid: false,
      message: 'End date must be after or equal to start date.'
    };
  }

  return {
    isValid: true,
    message: 'Valid date range.'
  };
};

/**
 * Validate Employee Code
 * @param {String} code - Employee code
 * @returns {Boolean} True if valid
 */
const validateEmployeeCode = (code) => {
  if (!code) return false;
  
  // Format: EMP-XXXX or similar
  const codeRegex = /^[A-Z]{2,5}-\d{3,6}$/;
  return codeRegex.test(code);
};

/**
 * Validate Required Fields
 * @param {Object} data - Object with fields
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} Validation result
 */
const validateRequiredFields = (data, requiredFields) => {
  const missingFields = [];

  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missingFields.push(field);
    }
  });

  if (missingFields.length > 0) {
    return {
      isValid: false,
      message: `Missing required fields: ${missingFields.join(', ')}`
    };
  }

  return {
    isValid: true,
    message: 'All required fields are present.'
  };
};

/**
 * Sanitize Input
 * @param {String} input - Input string
 * @returns {String} Sanitized string
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Validate Salary Amount
 * @param {Number} amount - Salary amount
 * @returns {Object} Validation result
 */
const validateSalaryAmount = (amount) => {
  if (!amount || isNaN(amount)) {
    return {
      isValid: false,
      message: 'Invalid salary amount.'
    };
  }

  if (amount < 0) {
    return {
      isValid: false,
      message: 'Salary amount cannot be negative.'
    };
  }

  if (amount < 10000) {
    return {
      isValid: false,
      message: 'Salary amount must be at least 10,000.'
    };
  }

  return {
    isValid: true,
    message: 'Valid salary amount.'
  };
};

/**
 * Validate Month and Year
 * @param {Number} month - Month (1-12)
 * @param {Number} year - Year
 * @returns {Object} Validation result
 */
const validateMonthYear = (month, year) => {
  const monthNum = parseInt(month);
  const yearNum = parseInt(year);

  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return {
      isValid: false,
      message: 'Invalid month. Must be between 1 and 12.'
    };
  }

  if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2100) {
    return {
      isValid: false,
      message: 'Invalid year.'
    };
  }

  return {
    isValid: true,
    message: 'Valid month and year.'
  };
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhoneNumber,
  validateCNIC,
  validateDate,
  validateDateRange,
  validateEmployeeCode,
  validateRequiredFields,
  sanitizeInput,
  validateSalaryAmount,
  validateMonthYear
};