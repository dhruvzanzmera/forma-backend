const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  registerValidator,
  loginValidator,
  verifyOtpValidator,
  resendOtpValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator
} = require('../validators/auth.validator');

// Public auth routes
router.post('/register', validate(registerValidator), authController.register);
router.post('/verify-otp', validate(verifyOtpValidator), authController.verifyOtp);
router.post('/resend-otp', validate(resendOtpValidator), authController.resendOtp);
router.post('/login', validate(loginValidator), authController.login);
router.post('/forgot-password', validate(forgotPasswordValidator), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordValidator), authController.resetPassword);

// Authenticated auth routes
router.post('/change-password', protect, validate(changePasswordValidator), authController.changePassword);
router.post('/logout', protect, authController.logout);

module.exports = router;
