const express = require("express");

const {
  register,
  verifyOtp,
  resendOtp,
  login,
  me,
  refresh,
  logout,

  forgotPassword,
  verifyResetOtp,
  resetPassword,
} = require("../controllers/auth.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// ======================
// AUTH
// ======================

router.post("/register", register);
router.post("/verify", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);

router.post("/refresh", refresh);
router.post("/logout", logout);

// ======================
// FORGOT PASSWORD
// ======================

router.post(
  "/forgot-password",
  forgotPassword,
);

router.post(
  "/verify-reset-otp",
  verifyResetOtp,
);

router.post(
  "/reset-password",
  resetPassword,
);

// ======================
// PROTECTED
// ======================

router.get(
  "/me",
  authMiddleware,
  me,
);

module.exports = router;