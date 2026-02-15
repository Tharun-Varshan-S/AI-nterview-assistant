/**
 * Custom application error class
 * Centralized error handling across backend
 */

class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.timestamp = new Date().toISOString();

    // Preserve stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
