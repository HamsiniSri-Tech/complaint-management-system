// ─── 404 Not Found Handler ────────────────────────────────────────────────────
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// ─── Global Error Handler ─────────────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  // Sometimes Express passes a 200 even on errors — fix that
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // ── Mongoose Bad ObjectId ──────────────────────────────────────────────────
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = `Resource not found. Invalid ID: ${err.value}`;
  }

  // ── Mongoose Duplicate Key ─────────────────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value entered for '${field}'. Please use a different value.`;
  }

  // ── Mongoose Validation Error ──────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // ── JWT Errors ─────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please log in again.';
  }

  // ── Multer Errors ──────────────────────────────────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large. Maximum size is 5MB.';
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    statusCode = 400;
    message = 'Too many files. Maximum is 3 files per complaint.';
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field.';
  }

  // ── Log error in development ───────────────────────────────────────────────
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// ─── Async Handler Wrapper ─────────────────────────────────────────────────────
// Wraps async route handlers so we don't need try/catch everywhere
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { notFound, errorHandler, asyncHandler };