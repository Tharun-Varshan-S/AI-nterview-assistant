const logger = require('../utils/logger');

/**
 * Centralized error handler middleware
 * Handles all errors thrown in async route handlers
 * 
 * Error types handled:
 * - MongoDB validation errors
 * - JWT authentication errors
 * - File upload errors
 * - Gemini API errors
 * - Custom app errors
 */

const errorHandler = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

  // Log error details
  logger.error(`${err.name || 'Unknown Error'}: ${message}`, err);
  logger.debug(`Request: ${req.method} ${req.path}`, { errorCode, statusCode });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    errorCode = 'VALIDATION_ERROR';
  }

  // Mongoose CastError (bad ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource ID';
    errorCode = 'INVALID_ID';
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
    errorCode = 'DUPLICATE_ENTRY';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid or malformed token';
    errorCode = 'INVALID_TOKEN';
  }

  // JWT expired
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    errorCode = 'TOKEN_EXPIRED';
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'FILE_TOO_LARGE') {
      message = 'File size exceeds limit (max 5MB)';
      errorCode = 'FILE_TOO_LARGE';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded';
      errorCode = 'TOO_MANY_FILES';
    } else {
      message = `File upload error: ${err.message}`;
      errorCode = 'FILE_UPLOAD_ERROR';
    }
  }

  // Custom file extension error
  if (err.message && err.message.includes('Only PDF files')) {
    statusCode = 400;
    message = 'Only PDF files are allowed';
    errorCode = 'INVALID_FILE_TYPE';
  }

  // Network/Timeout errors
  if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
    statusCode = 504;
    message = 'Request timeout - service unavailable';
    errorCode = 'REQUEST_TIMEOUT';
  }

  // Gemini API specific errors
  if (err.message && err.message.includes('Gemini')) {
    statusCode = err.statusCode || 500;
    errorCode = 'GEMINI_API_ERROR';
    logger.warn(`Gemini API Error: ${message}`);
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    timestamp,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
