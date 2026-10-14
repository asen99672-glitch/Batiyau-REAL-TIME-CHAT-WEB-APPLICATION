// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  // Default status code 500 (internal server error)
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose ObjectId error (invalid ID format)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // MongoDB duplicate key error (e.g., duplicate email/username)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  res.status(statusCode).json({
    message,
    // Development mein stack trace dikhao, production mein nahi
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export { errorHandler };
