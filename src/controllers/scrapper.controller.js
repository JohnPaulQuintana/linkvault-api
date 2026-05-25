const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const scrapperService = require("../services/scrapper.service");
const { detectLinkType } = require("../utils/detectLinkType");

/**
 * -------------------------
 * CREATE LINK
 * -------------------------
 */
exports.scrapperLink = async (req, res) => {
  try {
    const { url } = req.body;

    console.log("[createLink] Request body:", req.body);

    // VALIDATION
    if (!url)
      throw new AppError("URL is required", 400, "VALIDATION_ERROR");

    // DETECT TYPE
    const link_type = detectLinkType(url);

    console.log(`[createLink] Detected link type: ${link_type}`);

    // CREATE LINK
    const result = await scrapperService.scrapperLink({
      url,
      link_type,
    });

    return res.status(201).json({
      success: true,
      message: "Link created successfully",
      data: result,
    });

  } catch (err) {
    console.error("[createLink] Error:", err);

    // 🟢 IMPORTANT: handle AppError properly
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        code: err.code,
        meta: err.meta || null,
      });
    }

    // 🟡 fallback for unknown errors
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      code: "SERVER_ERROR",
    });
  }
};