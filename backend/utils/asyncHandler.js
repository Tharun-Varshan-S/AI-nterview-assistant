/**
 * Async error handler wrapper for Express routes
 * Eliminates need for try-catch in every controller
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
