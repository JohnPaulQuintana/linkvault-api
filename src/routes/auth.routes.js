const express = require("express");
const {
  register,
  verifyOtp,
  resendOtp,
  login,
  me,
  refresh,
  logout
} = require("../controllers/auth.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/verify", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);

// 🔐 protected route
router.get("/me", authMiddleware, me);
router.post("/refresh", refresh);
router.post("/logout", logout);

module.exports = router;