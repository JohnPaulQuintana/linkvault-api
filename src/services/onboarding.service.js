const { supabase } = require("../config/supabase");
const AppError = require("../utils/AppError");

/**
 * =========================
 * Get Onboarding Data
 * =========================
 */
exports.getOnboarding = async (userId) => {
  try {
    if (!userId) {
      throw new AppError(
        "User ID is required",
        400,
        "VALIDATION_ERROR"
      );
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, onboarding_status")
      .eq("id", userId)
      .single();

    if (error) {
      throw new AppError(
        error.message,
        400,
        "SUPABASE_ERROR"
      );
    }

    return {
      success: true,
      data,
    };
  } catch (err) {
    return {
      success: false,
      message: err.message,
      code: err.code || "ONBOARDING_ERROR",
    };
  }
};

/**
 * =========================
 * Update Onboarding Status
 * =========================
 */
exports.updateOnboardingStatus = async (
  userId,
  status
) => {
  try {
    if (!userId) {
      throw new AppError(
        "User ID is required",
        400,
        "VALIDATION_ERROR"
      );
    }

    const allowedStatuses = [
      "in_progress",
      "completed",
      "skipped",
      "stopped",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new AppError(
        "Invalid onboarding status",
        400,
        "VALIDATION_ERROR"
      );
    }

    const { data, error } = await supabase
      .from("users")
      .update({
        onboarding_status: status,
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw new AppError(
        error.message,
        400,
        "SUPABASE_ERROR"
      );
    }

    return {
      success: true,
      data,
    };
  } catch (err) {
    return {
      success: false,
      message: err.message,
      code: err.code || "ONBOARDING_ERROR",
    };
  }
};