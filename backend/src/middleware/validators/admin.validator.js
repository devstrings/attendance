const { body, param, query } = require('express-validator');
const { commonValidations, validate } = require('./common.validator');

const adminValidators = {
  // ✅ SIMPLIFIED: Create manager/employee
  createUser: [
    // First name - REQUIRED
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be 2-50 characters'),
    
    // Last name - REQUIRED
    body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be 2-50 characters'),
    
    // Email validation
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Email must be valid')
      .normalizeEmail(),
    
    // Password validation
    body('password')
      .trim()
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    
    // Phone validation - ACCEPT BOTH phoneNumber AND phone
    body()
      .custom((value, { req }) => {
        const phoneNumber = req.body.phoneNumber || req.body.phone;
        if (!phoneNumber) {
          throw new Error('Phone number is required');
        }
        // Pakistani phone format: +92 or 0 followed by 10 digits
        if (!/^(\+92|0)?[0-9]{10,11}$/.test(phoneNumber)) {
          throw new Error('Invalid phone format');
        }
        return true;
      }),
    
    // Optional fields
    body('cnic').optional().trim(),
    body('department').optional().trim(),
    body('designation').optional().trim(),
    body('salary').optional(),
    body('joiningDate').optional(),
    body('address').optional().trim(),
    body('dateOfBirth').optional(),
    body('bankDetails').optional(),
    body('emergencyContact').optional(),
    
    validate
  ],

  // Get user details
  getUserDetails: [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    param('userType').isIn(['employee', 'manager', 'admin']).withMessage('Invalid user type'),
    validate
  ],

  // Update user
  updateUser: [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    param('userType').isIn(['employee', 'manager', 'admin']).withMessage('Invalid user type'),
    body('firstName').optional().trim().isLength({ min: 2 }),
    body('lastName').optional().trim().isLength({ min: 2 }),
    body('phoneNumber').optional(),
    body('phone').optional(),
    body('email').optional().isEmail(),
    body('salary').optional(),
    validate
  ],

  // ✅ FIXED: Holiday management
  manageHoliday: [
    body('name')  // ✅ CHANGED FROM 'title' TO 'name'
      .trim()
      .notEmpty()
      .withMessage('Holiday name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Holiday name must be 2-100 characters'),
    
    body('date')
      .notEmpty()
      .withMessage('Holiday date is required')
      .isISO8601()
      .withMessage('Invalid date format'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    
    body('isRecurring')
      .optional()
      .isBoolean()
      .withMessage('isRecurring must be a boolean'),
    
    validate
  ],

  // Monthly config
  monthlyConfig: [
    body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be 1-12'),
    body('year').isInt({ min: 2020 }).withMessage('Invalid year'),
    body('workingDays').isInt({ min: 1, max: 31 }).withMessage('Working days 1-31'),
    body('totalHolidays').optional().isInt({ min: 0 }),
    validate
  ],

  // Attendance filters
  attendanceFilters: [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('employeeId').optional().isMongoId(),
    query('status').optional().isIn(['present', 'absent', 'late', 'half-day']),
    ...commonValidations.pagination,
    validate
  ]
};

module.exports = adminValidators;