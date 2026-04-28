/**
 * Format Date
 * @param {Date} date - Date object
 * @param {String} format - Format type (default: 'YYYY-MM-DD')
 * @returns {String} Formatted date
 */
const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD HH:mm:ss':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    case 'DD-MM-YYYY HH:mm':
      return `${day}-${month}-${year} ${hours}:${minutes}`;
    default:
      return `${year}-${month}-${day}`;
  }
};

/**
 * Format Time
 * @param {Date|String} time - Time
 * @param {Boolean} includeSeconds - Include seconds (default: false)
 * @returns {String} Formatted time (HH:mm or HH:mm:ss)
 */
const formatTime = (time, includeSeconds = false) => {
  if (!time) return '';
  
  const d = new Date(time);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  if (includeSeconds) {
    return `${hours}:${minutes}:${seconds}`;
  }
  
  return `${hours}:${minutes}`;
};

/**
 * Calculate Duration Between Two Times
 * @param {Date} startTime - Start time
 * @param {Date} endTime - End time
 * @returns {Object} Duration in hours and minutes
 */
const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) {
    return { hours: 0, minutes: 0, total: '0h 0m' };
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const diffMs = end - start;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  return {
    hours,
    minutes,
    totalMinutes: diffMinutes,
    total: `${hours}h ${minutes}m`
  };
};

/**
 * Get Month Name
 * @param {Number} month - Month number (1-12)
 * @returns {String} Month name
 */
const getMonthName = (month) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return months[month - 1] || '';
};

/**
 * Get Day Name
 * @param {Date} date - Date object
 * @returns {String} Day name
 */
const getDayName = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date(date);
  return days[d.getDay()];
};

/**
 * Calculate Working Days Between Two Dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Array} excludeWeekends - Exclude weekends (default: true)
 * @returns {Number} Number of working days
 */
const calculateWorkingDays = (startDate, endDate, excludeWeekends = true) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let workingDays = 0;
  const currentDate = new Date(start);

  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    
    // If excluding weekends, skip Saturday (6) and Sunday (0)
    if (excludeWeekends) {
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
    } else {
      workingDays++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
};

/**
 * Format Currency (Pakistani Rupees)
 * @param {Number} amount - Amount
 * @returns {String} Formatted currency
 */
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'Rs. 0';
  
  return `Rs. ${Number(amount).toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Generate Random String
 * @param {Number} length - String length (default: 10)
 * @returns {String} Random string
 */
const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Generate Employee Code
 * @param {String} prefix - Prefix (default: 'EMP')
 * @param {Number} number - Employee number
 * @returns {String} Employee code
 */
const generateEmployeeCode = (prefix = 'EMP', number) => {
  const paddedNumber = String(number).padStart(4, '0');
  return `${prefix}-${paddedNumber}`;
};

/**
 * Capitalize First Letter
 * @param {String} string - Input string
 * @returns {String} Capitalized string
 */
const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

/**
 * Capitalize Words
 * @param {String} string - Input string
 * @returns {String} String with capitalized words
 */
const capitalizeWords = (string) => {
  if (!string) return '';
  
  return string
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Get Greeting Message Based on Time
 * @returns {String} Greeting message
 */
const getGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return 'Good Morning';
  } else if (hour < 17) {
    return 'Good Afternoon';
  } else if (hour < 21) {
    return 'Good Evening';
  } else {
    return 'Good Night';
  }
};

/**
 * Calculate Age from Date of Birth
 * @param {Date} dateOfBirth - Date of birth
 * @returns {Number} Age in years
 */
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 0;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Get Date Range for Current Month
 * @returns {Object} Start and end date of current month
 */
const getCurrentMonthRange = () => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return { startDate, endDate };
};

/**
 * Get Date Range for Given Month and Year
 * @param {Number} month - Month (1-12)
 * @param {Number} year - Year
 * @returns {Object} Start and end date
 */
const getMonthRange = (month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return { startDate, endDate };
};

/**
 * Check if Date is Weekend
 * @param {Date} date - Date to check
 * @returns {Boolean} True if weekend
 */
const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

/**
 * Format Phone Number
 * @param {String} phone - Phone number
 * @returns {String} Formatted phone (03XX-XXXXXXX)
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  // If starts with +92, remove it
  const withoutCountryCode = cleaned.startsWith('92') ? cleaned.slice(2) : cleaned;
  
  // Format as 03XX-XXXXXXX
  if (withoutCountryCode.length === 10) {
    return `${withoutCountryCode.slice(0, 4)}-${withoutCountryCode.slice(4)}`;
  }
  
  return phone;
};

/**
 * Format CNIC
 * @param {String} cnic - CNIC number
 * @returns {String} Formatted CNIC (XXXXX-XXXXXXX-X)
 */
const formatCNIC = (cnic) => {
  if (!cnic) return '';
  
  const cleaned = cnic.replace(/\D/g, '');
  
  if (cleaned.length === 13) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12)}`;
  }
  
  return cnic;
};

/**
 * Calculate Percentage
 * @param {Number} value - Value
 * @param {Number} total - Total
 * @param {Number} decimals - Decimal places (default: 2)
 * @returns {Number} Percentage
 */
const calculatePercentage = (value, total, decimals = 2) => {
  if (!total || total === 0) return 0;
  return Number(((value / total) * 100).toFixed(decimals));
};

/**
 * Paginate Array
 * @param {Array} array - Array to paginate
 * @param {Number} page - Page number
 * @param {Number} limit - Items per page
 * @returns {Object} Paginated data
 */
const paginateArray = (array, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    data: array.slice(startIndex, endIndex),
    currentPage: page,
    totalPages: Math.ceil(array.length / limit),
    totalItems: array.length
  };
};

/**
 * Sort Array of Objects
 * @param {Array} array - Array to sort
 * @param {String} key - Key to sort by
 * @param {String} order - 'asc' or 'desc' (default: 'asc')
 * @returns {Array} Sorted array
 */
const sortArray = (array, key, order = 'asc') => {
  return array.sort((a, b) => {
    if (order === 'asc') {
      return a[key] > b[key] ? 1 : -1;
    } else {
      return a[key] < b[key] ? 1 : -1;
    }
  });
};

/**
 * Group Array by Key
 * @param {Array} array - Array to group
 * @param {String} key - Key to group by
 * @returns {Object} Grouped object
 */
const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

/**
 * Remove Duplicates from Array
 * @param {Array} array - Array with duplicates
 * @param {String} key - Key to check for duplicates (optional)
 * @returns {Array} Array without duplicates
 */
const removeDuplicates = (array, key = null) => {
  if (!key) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

/**
 * Deep Clone Object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if Object is Empty
 * @param {Object} obj - Object to check
 * @returns {Boolean} True if empty
 */
const isEmptyObject = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 * Sleep/Delay Function
 * @param {Number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generate Slug from String
 * @param {String} string - Input string
 * @returns {String} Slug
 */
const generateSlug = (string) => {
  if (!string) return '';
  
  return string
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Truncate String
 * @param {String} string - String to truncate
 * @param {Number} length - Max length
 * @param {String} ending - Ending string (default: '...')
 * @returns {String} Truncated string
 */
const truncateString = (string, length, ending = '...') => {
  if (!string || string.length <= length) return string;
  return string.substring(0, length - ending.length) + ending;
};

/**
 * Get File Extension
 * @param {String} filename - Filename
 * @returns {String} File extension
 */
const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.split('.').pop().toLowerCase();
};

/**
 * Convert Minutes to Hours and Minutes
 * @param {Number} minutes - Total minutes
 * @returns {Object} Hours and minutes
 */
const minutesToHoursMinutes = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  return {
    hours,
    minutes: mins,
    formatted: `${hours}h ${mins}m`
  };
};

/**
 * Get Financial Year
 * @param {Date} date - Date (default: current date)
 * @returns {String} Financial year (e.g., '2024-2025')
 */
const getFinancialYear = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth();
  
  // If month is April (3) or later, FY is current year to next year
  // Otherwise, FY is previous year to current year
  if (month >= 3) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

module.exports = {
  formatDate,
  formatTime,
  calculateDuration,
  getMonthName,
  getDayName,
  calculateWorkingDays,
  formatCurrency,
  generateRandomString,
  generateEmployeeCode,
  capitalizeFirstLetter,
  capitalizeWords,
  getGreeting,
  calculateAge,
  getCurrentMonthRange,
  getMonthRange,
  isWeekend,
  formatPhoneNumber,
  formatCNIC,
  calculatePercentage,
  paginateArray,
  sortArray,
  groupBy,
  removeDuplicates,
  deepClone,
  isEmptyObject,
  sleep,
  generateSlug,
  truncateString,
  getFileExtension,
  minutesToHoursMinutes,
  getFinancialYear
};