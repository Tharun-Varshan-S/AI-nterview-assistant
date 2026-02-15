/**
 * Simple logging utility with levels and timestamps
 */

const logLevels = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

const logger = {
  // Format timestamp as ISO string
  formatTime: () => new Date().toISOString(),

  // Error logs - always shown
  error: (message, error = null) => {
    console.error(`❌ [${logger.formatTime()}] ERROR: ${message}`);
    if (error) {
      console.error('   Details:', error.message || error);
      if (error.stack) console.error('   Stack:', error.stack);
    }
  },

  // Warn logs
  warn: (message, extra = null) => {
    console.warn(`⚠️  [${logger.formatTime()}] WARN: ${message}`);
    if (extra) console.warn('   Details:', extra);
  },

  // Info logs - important events
  info: (message, data = null) => {
    console.log(`ℹ️  [${logger.formatTime()}] INFO: ${message}`);
    if (data) console.log('   Data:', data);
  },

  // Debug logs - detailed info
  debug: (message, data = null) => {
    if (process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development') {
      console.log(`🐛 [${logger.formatTime()}] DEBUG: ${message}`);
      if (data) console.log('   Data:', data);
    }
  },

  // API request/response logging
  apiRequest: (method, path, statusCode = null, duration = null) => {
    const status = statusCode ? `[${statusCode}]` : '';
    const time = duration ? `(${duration}ms)` : '';
    console.log(`📍 [${logger.formatTime()}] ${method} ${path} ${status} ${time}`);
  },

  // Gemini API specific logging
  gemini: (message, data = null) => {
    console.log(`🔑 [${logger.formatTime()}] GEMINI: ${message}`);
    if (data) console.log('   Data:', data);
  },
};

module.exports = logger;
