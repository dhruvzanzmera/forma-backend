const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/user.model');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Protect routes - Verifies JWT from Authorization Bearer header
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(ApiError.unauthorized('Authentication token is missing. Please log in.'));
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(ApiError.unauthorized('The user belonging to this token no longer exists.'));
    }

    if (!currentUser.isActive) {
      return next(ApiError.forbidden('Your account has been deactivated. Please contact support.'));
    }

    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Your session has expired. Please log in again.'));
    }
    return next(ApiError.unauthorized('Invalid authentication token.'));
  }
});

/**
 * Role-based authorization middleware
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(`Access denied. Role '${req.user ? req.user.role : 'Guest'}' is not authorized.`)
      );
    }
    next();
  };
};

/**
 * Require verified email check
 */
const requireVerifiedEmail = (req, res, next) => {
  if (req.user && !req.user.isEmailVerified) {
    return next(
      ApiError.forbidden('Please verify your email address before continuing.')
    );
  }
  next();
};

module.exports = {
  protect,
  authorize,
  requireVerifiedEmail
};
