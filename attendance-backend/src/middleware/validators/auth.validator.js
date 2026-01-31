const { body } = require('express-validator');
const { commonValidations, validate } = require('./common.validator');

const authValidators = {
  // Login validation
  login: [
    commonValidations.email,
    body('password').trim().notEmpty().withMessage('Password is required'),
    validate,
  ],

  // Forgot password
  forgotPassword: [commonValidations.email, validate],

  // Verify OTP
  verifyOTP: [
    commonValidations.email,
    body('otp')
      .trim()
      .isLength({ min: 4, max: 6 })
      .withMessage('OTP must be 4-6 digits')
      .isNumeric()
      .withMessage('OTP must contain only numbers'),
    validate,
  ],

  // Reset password
  resetPassword: [
    commonValidations.email,
    body('otp').trim().notEmpty().withMessage('OTP is required'),
    commonValidations.password,
    body('confirmPassword')
      .trim()
      .notEmpty()
      .withMessage('Confirm password is required')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Passwords do not match'),
    validate,
  ],

  // Change password
  changePassword: [
    body('oldPassword').trim().notEmpty().withMessage('Old password is required'),
    commonValidations.password.withMessage('New password must meet requirements'),
    body('confirmPassword')
      .trim()
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Passwords do not match'),
    validate,
  ],
};

module.exports = authValidators;