const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const authValidators = require('../middleware/validators/auth.validator'); //  NEW

// ✅ Validators apply kiye har route pe
router.post('/login', authValidators.login, authController.login);
router.post('/forgot-password', authValidators.forgotPassword, authController.forgotPassword);
router.post('/verify-otp', authValidators.verifyOTP, authController.verifyOTPController);
router.post('/reset-password', authValidators.resetPassword, authController.resetPassword);
router.post('/change-password', authenticate, authValidators.changePassword, authController.changePassword);
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/logout', authenticate, authController.logout);

module.exports = router;