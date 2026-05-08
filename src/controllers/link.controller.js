const linkService = require("../services/link.service");

/**
 * -------------------------
 * PREVIEW LINK (SCRAPE)
 * -------------------------
 */
exports.generatePreview = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    const data = await linkService.generateContentLink(url);

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
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

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    if (!category_id) {
      return res.status(400).json({
        success: false,
        message: "category_id is required",
      });
    }

    if (!user_id) {
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

    return res.status(201).json({
      success: true,
      message: "Link created successfully",
      data: result,
    });
  } catch (err) {
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

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const data = await linkService.getLinks({
      userId,
      categoryId,
    });

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
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

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Link id is required",
      });
    }

    const result = await linkService.deleteLink({
      id,
      userId,
    });

    return res.json({
      success: true,
      message: "Link deleted successfully",
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete link",
      error: err.message,
    });
  }
};