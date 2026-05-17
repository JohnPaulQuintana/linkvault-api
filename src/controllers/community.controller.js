const communityService = require("../services/community.service");
const AppError = require("../utils/AppError");

exports.getAllPublicCategories = async (req, res, next) => {
  try {
    const categories =
      await communityService.getAllPublicCategory();

    return res.status(200).json({
      success: true,
      message: "Public categories fetched successfully",
      data: categories,
    });
  } catch (err) {
    next(
      err instanceof AppError
        ? err
        : new AppError(
            err.message || "Failed to fetch public categories",
            500,
            "COMMUNITY_FETCH_ERROR"
          )
    );
  }
};