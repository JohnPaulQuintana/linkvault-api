class AppError extends Error {
  constructor(
    message,
    statusCode = 500,
    code = "SERVER_ERROR",
    meta = {}
  ) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.meta = meta; // 👈 add context data
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;