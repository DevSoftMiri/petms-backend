const { HTTP_STATUS } = require('./constants');
const logger = require('./logger');

/**
 * Centralized error handling class
 */
class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
    path: req.path,
    method: req.method,
  });

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    statusCode: err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: err.code || 'INTERNAL_ERROR',
    timestamp: err.timestamp || new Date().toISOString(),
  };

  // Prisma errors
  if (err.code && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      error.statusCode = HTTP_STATUS.CONFLICT;
      error.message = `Unique constraint failed on field: ${err.meta?.target?.[0] || 'unknown'}`;
      error.code = 'UNIQUE_CONSTRAINT_FAILED';
    } else if (err.code === 'P2025') {
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      error.message = 'Record not found';
      error.code = 'RECORD_NOT_FOUND';
    } else if (err.code === 'P2003') {
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      error.message = 'Foreign key constraint failed';
      error.code = 'FOREIGN_KEY_CONSTRAINT_FAILED';
    }
  }

  // Validation errors
  if (err.array && typeof err.array === 'function') {
    error.statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    error.code = 'VALIDATION_ERROR';
    error.errors = err.array();
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.statusCode = HTTP_STATUS.UNAUTHORIZED;
    error.message = 'Invalid token';
    error.code = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    error.statusCode = HTTP_STATUS.UNAUTHORIZED;
    error.message = 'Token expired';
    error.code = 'TOKEN_EXPIRED';
  }

  // Add stack trace in development
  if (isDevelopment) {
    error.stack = err.stack;
  }

  // Send response
  res.status(error.statusCode).json(error);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
};
