const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

/**
 * Middleware to check validation results from express-validator rules
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return next(ApiError.badRequest('Validation Error', formattedErrors));
  };
};

module.exports = validate;
