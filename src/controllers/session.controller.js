const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const sessionService = require("../services/session.service");

/**
 * =========================
 * UPSERT SESSION
 * =========================
 */
exports.upsertSession = asyncHandler(async (req, res) => {
  const {
    link_id,
    user_id,
    progress,
    scroll_top,
    duration,
    url, // (IMPORTANT FOR RESTORE)
    final_url, // (IMPORTANT FOR RESTORE)
  } = req.body;

  console.log("[upsertSession] body:", req.body);

  // VALIDATION
  if (!link_id)
    throw new AppError("link_id is required", 400, "VALIDATION_ERROR");

  if (!user_id)
    throw new AppError("user_id is required", 400, "VALIDATION_ERROR");

  const result = await sessionService.upsertSession({
    link_id,
    user_id,
    progress: Number(progress || 0),
    scroll_top: Math.floor(scroll_top || 0),
    duration: Number(duration || 0),
    url, // STORE URL
    final_url, // STORE URL
  });

  return res.status(200).json({
    success: true,
    message: "Session saved successfully",
    data: result,
  });
});

/**
 * =========================
 * GET SESSION (RESTORE)
 * =========================
 */
exports.getSession = asyncHandler(async (req, res) => {
  const { link_id, user_id } = req.params;

  console.log("[getSession] params:", req.params);

  if (!link_id)
    throw new AppError("link_id is required", 400, "VALIDATION_ERROR");

  if (!user_id)
    throw new AppError("user_id is required", 400, "VALIDATION_ERROR");

  const session = await sessionService.getSession({
    link_id,
    user_id,
  });

  return res.status(200).json({
    success: true,
    data: session || {
      progress: 0,
      scroll_top: 0,
      duration: 0,
      url: null,
      final_url: null
    }, // ALWAYS SAFE RETURN
  });
});