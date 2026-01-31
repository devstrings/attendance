const { body, param, query, validationResult } = require('express-validator');

// ✅ Common validation rules
const commonValidations = {
  // Email validation
  email: body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),

  // Password validation
  password: body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),

  // MongoDB ID validation
  mongoId: (field) => param(field)
    .isMongoId()
    .withMessage(`${field} must be a valid ID`),

  // Phone number validation
  phone: body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^(\+92|0)?[0-9]{10,11}$/)
    .withMessage('Phone number must be valid Pakistani format'),

  // Date validation
  date: (field) => body(field)
    .isISO8601()
    .withMessage('Date must be in valid format'),

  // Pagination
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive number'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
  ]
};

// ✅ Validate function
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ VALIDATION FAILED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    console.log('Validation Errors:', JSON.stringify(errors.array(), null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

// ✅ Export both
module.exports = { 
  commonValidations, 
  validate 
};