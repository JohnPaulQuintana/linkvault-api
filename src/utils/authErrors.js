class AuthError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const AUTH_ERRORS = {
  USER_EXISTS: "USER_EXISTS",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  INVALID_PASSWORD: "INVALID_PASSWORD",
  OTP_INVALID: "OTP_INVALID",
  OTP_EXPIRED: "OTP_EXPIRED",
  OTP_REQUIRED: "OTP_REQUIRED",
  USER_NOT_VERIFIED: "USER_NOT_VERIFIED",
  ALREADY_VERIFIED: "ALREADY_VERIFIED",
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  REFRESH_INVALID: "REFRESH_INVALID",
};

module.exports = { AuthError, AUTH_ERRORS };