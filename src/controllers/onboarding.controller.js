const onboardingService = require("../services/onboarding.service");
const AppError = require("../utils/AppError");

/**
 * =========================
 * GET onboarding status
 * =========================
 */
exports.getOnboarding = async (req, res) => {
  try {
    console.log("REQ USER:", req.user);
    const userId = req.user.userId;// from auth middleware

    const result = await onboardingService.getOnboarding(userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * =========================
 * UPDATE onboarding status
 * =========================
 */
exports.updateOnboardingStatus = async (req, res) => {
  try {
    const userId = req.user.userId; // from auth middleware
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const result =
      await onboardingService.updateOnboardingStatus(
        userId,
        status
      );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};