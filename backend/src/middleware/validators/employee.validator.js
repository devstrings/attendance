const { body, validationResult } = require('express-validator');

const employeeValidators = {
  createEmployee: [
    body('firstName').trim().notEmpty().withMessage('First name required'),
    body('lastName').trim().notEmpty().withMessage('Last name required'),
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 characters'),
    body('phoneNumber').notEmpty().withMessage('Phone number required'),
    
    // ✅ CNIC optional but uniqye provides
    body('cnic')
      .optional({ checkFalsy: true }) // Empty string ko optional treat kare
      .trim()
      .custom((value) => {
        if (value && value.length > 0 && value.length !== 13) {
          throw new Error('CNIC must be 13 digits');
        }
        return true;
      }),
    
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      next();
    }
  ]
};

module.exports = employeeValidators;