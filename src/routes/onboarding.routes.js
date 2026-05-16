const express = require("express");
const router = express.Router();

const onboardingController = require("../controllers/onboarding.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * =========================
 * Get onboarding status
 * =========================
 */
router.get(
  "/",
  authMiddleware,
  onboardingController.getOnboarding
);

/**
 * =========================
 * Update onboarding status
 * =========================
 */
router.post(
  "/status",
  authMiddleware,
  onboardingController.updateOnboardingStatus
);

module.exports = router;