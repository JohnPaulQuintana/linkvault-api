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

router.post("/register", register);// migrated
router.post("/verify", verifyOtp);// migrated
router.post("/resend-otp", resendOtp);// migrated
router.post("/login", login);// migrated

router.post("/refresh", refresh); // migrated
router.post("/logout", logout); // migrate

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