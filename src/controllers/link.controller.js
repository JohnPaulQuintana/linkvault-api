const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const linkService = require("../services/link.service");
const { detectLinkType } = require("../utils/detectLinkType");

/**
 * -------------------------
 * CREATE LINK
 * -------------------------
 */
exports.createLink = async (req, res) => {
  try {
    const { url, category_id, user_id, title, description } = req.body;

    console.log("[createLink] Request body:", req.body);

    // VALIDATION
    if (!url)
      throw new AppError("URL is required", 400, "VALIDATION_ERROR");

    if (!category_id)
      throw new AppError("category_id is required", 400, "VALIDATION_ERROR");

    if (!user_id)
      throw new AppError("user_id is required", 400, "VALIDATION_ERROR");

    // DETECT TYPE
    const link_type = detectLinkType(url);

    console.log(`[createLink] Detected link type: ${link_type}`);

    // CREATE LINK
    const result = await linkService.createLink({
      url,
      category_id,
      user_id,
      link_type,
      title,
      description,
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

/**
 * -------------------------
 * GET ALL LINKS
 * -------------------------
 */
exports.getLinks = async (req, res) => {
  try {
    const { userId, categoryId } = req.query;
    console.log("[getLinks] Query params:", req.query);

    if (!userId) {
      console.warn("[getLinks] userId missing");
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const data = await linkService.getLinks({
      userId,
      categoryId,
    });
    console.log("[getLinks] Fetched links count:", data.length);

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("[getLinks] Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch links",
      error: err.message,
    });
  }
};

/**
 * -------------------------
 * DELETE LINK
 * -------------------------
 */
exports.deleteLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    console.log("[deleteLink] Params:", req.params, "Body:", req.body);

    if (!id) {
      console.warn("[deleteLink] Link id missing");
      return res.status(400).json({
        success: false,
        message: "Link id is required",
      });
    }

    const result = await linkService.deleteLink({
      id,
      userId,
    });
    console.log("[deleteLink] Link deleted:", result);

    return res.json({
      success: true,
      message: "Link deleted successfully",
      data: result,
    });
  } catch (err) {
    console.error("[deleteLink] Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete link",
      error: err.message,
    });
  }
};
