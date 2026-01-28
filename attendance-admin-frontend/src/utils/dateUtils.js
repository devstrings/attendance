// Format date to display format (DD/MM/YYYY)
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

// Format date to API format (YYYY-MM-DD)
export const formatDateForAPI = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toISOString().split('T')[0];
};

// Format date to datetime (DD/MM/YYYY HH:mm:ss)
export const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

// Format time (HH:mm:ss)
export const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
};

// Format time 12 hour (HH:mm AM/PM)
export const formatTime12Hour = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};

// Get current date (YYYY-MM-DD)
export const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

// Get current time (HH:mm)
export const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Get day name from date
export const getDayName = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[d.getDay()];
};

// Get month name from date
export const getMonthName = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[d.getMonth()];
};

// Get month name from month number (1-12)
export const getMonthNameFromNumber = (monthNumber) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNumber - 1] || '';
};

// Calculate days between two dates
export const getDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Add days to date
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Subtract days from date
export const subtractDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

// Get start of month
export const getStartOfMonth = (year, month) => {
  return new Date(year, month - 1, 1);
};

// Get end of month
export const getEndOfMonth = (year, month) => {
  return new Date(year, month, 0);
};

// Get days in month
export const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

// Check if date is today
export const isToday = (date) => {
  const today = new Date();
  const d = new Date(date);
  
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};

// Check if date is in past
export const isPast = (date) => {
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  
  return d < today;
};

// Check if date is in future
export const isFuture = (date) => {
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  
  return d > today;
};

// Check if date is weekend
export const isWeekend = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

// Get working days between dates (excluding weekends)
export const getWorkingDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let count = 0;
  const current = new Date(start);
  
  while (current <= end) {
    if (!isWeekend(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

// Get age from date of birth
export const getAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Get relative time (e.g., "2 hours ago", "3 days ago")
export const getRelativeTime = (date) => {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
  
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
};

// Parse time string to hours (e.g., "09:30" -> 9.5)
export const parseTimeToHours = (timeString) => {
  if (!timeString) return 0;
  
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours + (minutes / 60);
};

// Calculate hours between two time strings
export const calculateHoursBetween = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  
  const start = parseTimeToHours(startTime);
  const end = parseTimeToHours(endTime);
  
  return Math.max(0, end - start);
};

// Get date range for month
export const getMonthDateRange = (month, year) => {
  const startDate = getStartOfMonth(year, month);
  const endDate = getEndOfMonth(year, month);
  
  return {
    startDate: formatDateForAPI(startDate),
    endDate: formatDateForAPI(endDate)
  };
};

// Get last N months
export const getLastNMonths = (n) => {
  const months = [];
  const current = new Date();
  
  for (let i = 0; i < n; i++) {
    const date = new Date(current.getFullYear(), current.getMonth() - i, 1);
    months.push({
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      name: getMonthName(date),
      label: `${getMonthName(date)} ${date.getFullYear()}`
    });
  }
  
  return months;
};

export default {
  formatDate,
  formatDateForAPI,
  formatDateTime,
  formatTime,
  formatTime12Hour,
  getCurrentDate,
  getCurrentTime,
  getDayName,
  getMonthName,
  getMonthNameFromNumber,
  getDaysBetween,
  addDays,
  subtractDays,
  getStartOfMonth,
  getEndOfMonth,
  getDaysInMonth,
  isToday,
  isPast,
  isFuture,
  isWeekend,
  getWorkingDays,
  getAge,
  getRelativeTime,
  parseTimeToHours,
  calculateHoursBetween,
  getMonthDateRange,
  getLastNMonths
};