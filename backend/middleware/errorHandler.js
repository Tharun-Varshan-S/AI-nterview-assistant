const logger = require('../utils/logger');

/**
 * Stage 5: Centralized Error Handler
 */
const errorHandler = (err, req, res, next) => {
  const parsedStatus = Number(err.statusCode || err.status);
  const statusCode = Number.isInteger(parsedStatus) && parsedStatus >= 100 && parsedStatus <= 599
    ? parsedStatus
    : 500;
  const message = err.message || 'Internal Server Error';

  // Log full error for backend diagnostics
  logger.error(`[${req.method}] ${req.url} >> ${message}`, err);

  // Specific Gemini 429 handling
  if (err.response?.status === 429) {
    return res.status(429).json({
      success: false,
      message: 'AI Service is temporarily busy. Please try again in 30 seconds.',
      errorCode: 'RATE_LIMIT_EXCEEDED'
    });
  }

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = errorHandler;
