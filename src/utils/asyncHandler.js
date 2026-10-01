/**
 * Higher-order function to catch asynchronous errors in route handlers
 * @param {Function} fn - async controller function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
