const User = require('../models/user.model');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { generateOtp, hashOtp, compareOtp, getOtpExpiryDate } = require('../utils/otp.util');
const MailService = require('../services/mail.service');
const config = require('../config/env');
const { UserRole, OtpType } = require('../constants');

/**
 * Register Customer
 * Route: POST /api/v1/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  let user = await User.findOne({ email });

  // Generate OTP for email verification
  const plainOtp = generateOtp();
  const hashedOtp = await hashOtp(plainOtp);
  const otpExpiresAt = getOtpExpiryDate(config.business.otpExpireMinutes);

  if (user) {
    if (user.isEmailVerified) {
      throw ApiError.conflict('An account with this email address already exists.');
    }
    // Allow unverified users to update details and receive a fresh OTP
    user.name = name;
    user.password = password;
    if (phone) user.phone = phone;
    user.otp = {
      code: hashedOtp,
      expiresAt: otpExpiresAt,
      type: OtpType.EMAIL_VERIFICATION
    };
    await user.save();
  } else {
    user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      role: UserRole.CUSTOMER,
      isEmailVerified: false,
      otp: {
        code: hashedOtp,
        expiresAt: otpExpiresAt,
        type: OtpType.EMAIL_VERIFICATION
      }
    });
  }

  try {
    await MailService.sendVerificationOtp(user.email, user.name, plainOtp);
  } catch (error) {
    console.error(`[Mail Error] Registration verification delivery failed: ${error.message}`);
    if (config.isRender && !config.email.resendApiKey) {
      throw ApiError.serviceUnavailable(
        'Your account was saved, but email is not configured on Render. Add RESEND_API_KEY and a Resend-verified EMAIL_FROM address to the service environment, redeploy, then retry registration.'
      );
    }

    throw ApiError.serviceUnavailable(
      'Your account was saved, but the email provider could not accept the verification email. Check the backend logs and Resend API key and sender configuration, then retry registration.'
    );
  }

  user.otp.lastSentAt = new Date();
  await user.save();

  return ApiResponse.created(
    res,
    {
      userId: user._id,
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified
    },
    'Registration successful! Please verify your email with the OTP sent to you.'
  );
});

/**
 * Verify Email OTP
 * Route: POST /api/v1/auth/verify-otp
 */
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email }).select('+otp.code +otp.expiresAt +otp.type');
  if (!user) {
    throw ApiError.notFound('Account not found with this email.');
  }

  if (user.isEmailVerified) {
    return ApiResponse.success(res, null, 'Email is already verified.');
  }

  if (!user.otp || !user.otp.code || user.otp.type !== OtpType.EMAIL_VERIFICATION) {
    throw ApiError.badRequest('No pending verification code found. Please request a new OTP.');
  }

  if (new Date() > new Date(user.otp.expiresAt)) {
    throw ApiError.badRequest('Verification OTP has expired. Please request a new code.');
  }

  const isMatch = await compareOtp(otp, user.otp.code);
  if (!isMatch) {
    throw ApiError.badRequest('Invalid OTP code. Please check and try again.');
  }

  // Mark verified and clear OTP
  user.isEmailVerified = true;
  user.otp = undefined;
  await user.save();

  const token = user.generateAuthToken();

  return ApiResponse.success(
    res,
    {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: true
      }
    },
    'Email verified successfully.'
  );
});

/**
 * Resend Verification OTP
 * Route: POST /api/v1/auth/resend-otp
 */
const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email }).select('+otp.lastSentAt');
  if (!user) {
    throw ApiError.notFound('User not found with this email.');
  }

  if (user.isEmailVerified) {
    return ApiResponse.success(res, null, 'Email is already verified.');
  }

  // Check cooldown
  if (user.otp && user.otp.lastSentAt) {
    const elapsedSeconds = (Date.now() - new Date(user.otp.lastSentAt).getTime()) / 1000;
    if (elapsedSeconds < config.business.otpResendCooldownSeconds) {
      const waitTime = Math.ceil(config.business.otpResendCooldownSeconds - elapsedSeconds);
      throw ApiError.badRequest(`Please wait ${waitTime} seconds before requesting a new OTP.`);
    }
  }

  const plainOtp = generateOtp();
  const hashedOtp = await hashOtp(plainOtp);
  const otpExpiresAt = getOtpExpiryDate(config.business.otpExpireMinutes);

  user.otp = {
    code: hashedOtp,
    expiresAt: otpExpiresAt,
    type: OtpType.EMAIL_VERIFICATION
  };

  await user.save();

  await MailService.sendVerificationOtp(user.email, user.name, plainOtp);
  user.otp.lastSentAt = new Date();
  await user.save();

  return ApiResponse.success(
    res,
    null,
    'A new verification OTP has been sent to your email.'
  );
});

/**
 * Login User (Customer or Admin)
 * Route: POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Please contact support.');
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const token = user.generateAuthToken();

  return ApiResponse.success(
    res,
    {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    },
    'Login successful.'
  );
});

/**
 * Forgot Password - Send Reset OTP
 * Route: POST /api/v1/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email }).select('+otp.lastSentAt');
  if (!user) {
    // Avoid user enumeration
    return ApiResponse.success(
      res,
      null,
      'If an account exists with this email, an OTP has been sent.'
    );
  }

  // Cooldown check
  if (user.otp && user.otp.lastSentAt) {
    const elapsedSeconds = (Date.now() - new Date(user.otp.lastSentAt).getTime()) / 1000;
    if (elapsedSeconds < config.business.otpResendCooldownSeconds) {
      const waitTime = Math.ceil(config.business.otpResendCooldownSeconds - elapsedSeconds);
      throw ApiError.badRequest(`Please wait ${waitTime} seconds before requesting another code.`);
    }
  }

  const plainOtp = generateOtp();
  const hashedOtp = await hashOtp(plainOtp);
  const otpExpiresAt = getOtpExpiryDate(config.business.otpExpireMinutes);

  user.otp = {
    code: hashedOtp,
    expiresAt: otpExpiresAt,
    type: OtpType.PASSWORD_RESET,
    lastSentAt: new Date()
  };

  await user.save();

  MailService.sendPasswordResetOtp(user.email, user.name, plainOtp).catch((err) =>
    console.error('[Mail Error] Forgot password OTP failed:', err.message)
  );

  return ApiResponse.success(
    res,
    null,
    'If an account exists with this email, an OTP has been sent.'
  );
});

/**
 * Reset Password with OTP
 * Route: POST /api/v1/auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email }).select('+password +otp.code +otp.expiresAt +otp.type');
  if (!user) {
    throw ApiError.badRequest('Invalid password reset request.');
  }

  if (!user.otp || !user.otp.code || user.otp.type !== OtpType.PASSWORD_RESET) {
    throw ApiError.badRequest('No password reset request found. Please request a new code.');
  }

  if (new Date() > new Date(user.otp.expiresAt)) {
    throw ApiError.badRequest('Reset OTP has expired. Please request a new one.');
  }

  const isMatch = await compareOtp(otp, user.otp.code);
  if (!isMatch) {
    throw ApiError.badRequest('Invalid OTP code.');
  }

  // Update password and clear OTP
  user.password = newPassword;
  user.otp = undefined;
  await user.save();

  MailService.sendPasswordChangedNotification(user.email, user.name).catch((err) =>
    console.error('[Mail Error] Password changed alert failed:', err.message)
  );

  return ApiResponse.success(
    res,
    null,
    'Password has been reset successfully. You can now log in with your new password.'
  );
});

/**
 * Change Password (Authenticated user)
 * Route: POST /api/v1/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw ApiError.unauthorized('User not found.');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest('Incorrect current password.');
  }

  if (currentPassword === newPassword) {
    throw ApiError.badRequest('New password cannot be the same as the current password.');
  }

  user.password = newPassword;
  await user.save();

  MailService.sendPasswordChangedNotification(user.email, user.name).catch((err) =>
    console.error('[Mail Error] Password changed alert failed:', err.message)
  );

  return ApiResponse.success(res, null, 'Password updated successfully.');
});

/**
 * Logout
 * Route: POST /api/v1/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, null, 'Logged out successfully.');
});

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  logout
};
