import { REGEX_PATTERNS, VALIDATION_RULES } from './constants';

// Validate email
export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  if (!REGEX_PATTERNS.EMAIL.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  return { isValid: true, error: null };
};

// Validate password
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    return { 
      isValid: false, 
      error: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters` 
    };
  }
  if (password.length > VALIDATION_RULES.PASSWORD_MAX_LENGTH) {
    return { 
      isValid: false, 
      error: `Password must not exceed ${VALIDATION_RULES.PASSWORD_MAX_LENGTH} characters` 
    };
  }
  return { isValid: true, error: null };
};

// Validate strong password
export const validateStrongPassword = (password) => {
  const baseValidation = validatePassword(password);
  if (!baseValidation.isValid) return baseValidation;

  if (!REGEX_PATTERNS.PASSWORD.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain uppercase, lowercase, and number'
    };
  }
  return { isValid: true, error: null };
};

// Validate name
export const validateName = (name) => {
  if (!name) {
    return { isValid: false, error: 'Name is required' };
  }
  if (name.length < VALIDATION_RULES.NAME_MIN_LENGTH) {
    return { 
      isValid: false, 
      error: `Name must be at least ${VALIDATION_RULES.NAME_MIN_LENGTH} characters` 
    };
  }
  if (name.length > VALIDATION_RULES.NAME_MAX_LENGTH) {
    return { 
      isValid: false, 
      error: `Name must not exceed ${VALIDATION_RULES.NAME_MAX_LENGTH} characters` 
    };
  }
  if (!REGEX_PATTERNS.NAME.test(name)) {
    return { isValid: false, error: 'Name can only contain letters and spaces' };
  }
  return { isValid: true, error: null };
};

// Validate phone
export const validatePhone = (phone) => {
  if (!phone) {
    return { isValid: false, error: 'Phone number is required' };
  }
  const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
  if (cleanPhone.length < VALIDATION_RULES.PHONE_MIN_LENGTH) {
    return { 
      isValid: false, 
      error: `Phone number must be at least ${VALIDATION_RULES.PHONE_MIN_LENGTH} digits` 
    };
  }
  if (cleanPhone.length > VALIDATION_RULES.PHONE_MAX_LENGTH) {
    return { 
      isValid: false, 
      error: `Phone number must not exceed ${VALIDATION_RULES.PHONE_MAX_LENGTH} digits` 
    };
  }
  if (!REGEX_PATTERNS.PHONE.test(phone)) {
    return { isValid: false, error: 'Invalid phone number format' };
  }
  return { isValid: true, error: null };
};

// Validate OTP
export const validateOTP = (otp) => {
  if (!otp) {
    return { isValid: false, error: 'OTP is required' };
  }
  if (otp.length !== VALIDATION_RULES.OTP_LENGTH) {
    return { 
      isValid: false, 
      error: `OTP must be ${VALIDATION_RULES.OTP_LENGTH} digits` 
    };
  }
  if (!REGEX_PATTERNS.NUMBER.test(otp)) {
    return { isValid: false, error: 'OTP must contain only numbers' };
  }
  return { isValid: true, error: null };
};

// Validate required field
export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  return { isValid: true, error: null };
};

// Validate number
export const validateNumber = (value, min = null, max = null) => {
  if (value === '' || value === null || value === undefined) {
    return { isValid: false, error: 'Number is required' };
  }
  if (isNaN(value)) {
    return { isValid: false, error: 'Must be a valid number' };
  }
  if (min !== null && Number(value) < min) {
    return { isValid: false, error: `Must be at least ${min}` };
  }
  if (max !== null && Number(value) > max) {
    return { isValid: false, error: `Must not exceed ${max}` };
  }
  return { isValid: true, error: null };
};

// Validate date
export const validateDate = (date, futureOnly = false, pastOnly = false) => {
  if (!date) {
    return { isValid: false, error: 'Date is required' };
  }
  
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (isNaN(inputDate.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }
  
  if (futureOnly && inputDate < today) {
    return { isValid: false, error: 'Date must be in the future' };
  }
  
  if (pastOnly && inputDate > today) {
    return { isValid: false, error: 'Date must be in the past' };
  }
  
  return { isValid: true, error: null };
};

// Validate time
export const validateTime = (time) => {
  if (!time) {
    return { isValid: false, error: 'Time is required' };
  }
  
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(time)) {
    return { isValid: false, error: 'Invalid time format (HH:MM)' };
  }
  
  return { isValid: true, error: null };
};

// Validate salary
export const validateSalary = (salary) => {
  const numValidation = validateNumber(salary, 0);
  if (!numValidation.isValid) {
    return { isValid: false, error: 'Invalid salary amount' };
  }
  if (Number(salary) <= 0) {
    return { isValid: false, error: 'Salary must be greater than 0' };
  }
  return { isValid: true, error: null };
};

// Validate attendance data
export const validateAttendanceData = (data) => {
  const errors = {};
  
  if (!data.employeeId) {
    errors.employeeId = 'Employee is required';
  }
  
  if (!data.date) {
    errors.date = 'Date is required';
  }
  
  if (!data.status) {
    errors.status = 'Status is required';
  }
  
  if (data.status === 'present') {
    if (!data.clockIn) {
      errors.clockIn = 'Clock in time is required';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate employee data
export const validateEmployeeData = (data) => {
  const errors = {};
  
  const nameValidation = validateName(data.name);
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error;
  }
  
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error;
  }
  
  const phoneValidation = validatePhone(data.phone);
  if (!phoneValidation.isValid) {
    errors.phone = phoneValidation.error;
  }
  
  if (!data.department) {
    errors.department = 'Department is required';
  }
  
  if (!data.position) {
    errors.position = 'Position is required';
  }
  
  if (data.baseSalary) {
    const salaryValidation = validateSalary(data.baseSalary);
    if (!salaryValidation.isValid) {
      errors.baseSalary = salaryValidation.error;
    }
  }
  
  if (data.joiningDate) {
    const dateValidation = validateDate(data.joiningDate, false, true);
    if (!dateValidation.isValid) {
      errors.joiningDate = dateValidation.error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate login form
export const validateLoginForm = (data) => {
  const errors = {};
  
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error;
  }
  
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate password change form
export const validatePasswordChangeForm = (data) => {
  const errors = {};
  
  if (!data.currentPassword) {
    errors.currentPassword = 'Current password is required';
  }
  
  const newPasswordValidation = validatePassword(data.newPassword);
  if (!newPasswordValidation.isValid) {
    errors.newPassword = newPasswordValidation.error;
  }
  
  if (data.currentPassword === data.newPassword) {
    errors.newPassword = 'New password must be different from current password';
  }
  
  if (data.newPassword !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export default {
  validateEmail,
  validatePassword,
  validateStrongPassword,
  validateName,
  validatePhone,
  validateOTP,
  validateRequired,
  validateNumber,
  validateDate,
  validateTime,
  validateSalary,
  validateAttendanceData,
  validateEmployeeData,
  validateLoginForm,
  validatePasswordChangeForm
};