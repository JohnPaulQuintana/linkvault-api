const linkService = require("../services/link.service");

/**
 * -------------------------
 * PREVIEW LINK (SCRAPE)
 * -------------------------
 */
exports.generatePreview = async (req, res) => {
  try {
    const { url } = req.query;
    console.log("[generatePreview] Received URL:", url);

    if (!url) {
      console.warn("[generatePreview] URL missing");
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    const data = await linkService.generateContentLink(url);
    console.log("[generatePreview] Preview data:", data);

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("[generatePreview] Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to generate preview",
      error: err.message,
    });
  }
};

/**
 * -------------------------
 * CREATE LINK
 * -------------------------
 */
exports.createLink = async (req, res) => {
  try {
    const { url, category_id, user_id } = req.body;
    console.log("[createLink] Request body:", req.body);

    if (!url) {
      console.warn("[createLink] URL missing");
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    if (!category_id) {
      console.warn("[createLink] category_id missing");
      return res.status(400).json({
        success: false,
        message: "category_id is required",
      });
    }

    if (!user_id) {
      console.warn("[createLink] user_id missing");
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    const result = await linkService.createLink({
      url,
      category_id,
      user_id,
    });
    console.log("[createLink] Link created:", result);

    return res.status(201).json({
      success: true,
      message: "Link created successfully",
      data: result,
    });
  } catch (err) {
    console.error("[createLink] Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create link",
      error: err.message,
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