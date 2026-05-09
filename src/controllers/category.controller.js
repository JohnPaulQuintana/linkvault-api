const categoryService = require("../services/category.service");
const AppError = require("../utils/AppError");

// GET ALL
exports.getCategories = async (req, res) => {
  try {
    const { userId } = req.query;

    console.log("[getCategories] Query params:", req.query);

    if (!userId) {
      throw new AppError(
        "User id is required",
        400,
        "VALIDATION_ERROR"
      );
    }

    const data = await categoryService.getAll({ userId });

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data,
      meta: {
        total: data.length,
      },
    });

  } catch (err) {
    console.error("[getCategories] Error:", err);

    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        code: err.code,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      code: "SERVER_ERROR",
    });
  }
};

// CREATE
exports.createCategory = async (req, res) => {
  try {
    const { userId, name, icon } = req.body;

    console.log("[createCategory] Request body:", req.body);

    if (!userId || !name || !icon) {
      throw new AppError(
        "Missing required fields",
        400,
        "VALIDATION_ERROR"
      );
    }

    const data = await categoryService.create({
      userId,
      name,
      icon,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data,
    });

  } catch (err) {
    console.error("[createCategory] Error:", err);

    // 🟢 HANDLE EXPECTED ERRORS
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        code: err.code,
        meta: err.meta || null,
      });
    }

    // 🟡 UNKNOWN ERROR
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      code: "SERVER_ERROR",
    });
  }
};

// DELETE
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    console.log("[deleteCategory] Params:", req.params, "Body:", req.body);

    if (!id || !userId) {
      throw new AppError(
        "Category id and user id are required",
        400,
        "VALIDATION_ERROR"
      );
    }

    const deleted = await categoryService.delete({
      id,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: deleted,
    });

  } catch (err) {
    console.error("[deleteCategory] Error:", err);

    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        code: err.code,
        meta: err.meta || null,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      code: "SERVER_ERROR",
    });
  }
};

// EDIT
exports.editCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, name, icon } = req.body;

    console.log("[editCategory] Params:", req.params, "Body:", req.body);

    if (!id || !userId) {
      throw new AppError(
        "Missing required fields",
        400,
        "VALIDATION_ERROR"
      );
    }

    const updated = await categoryService.edit({
      id,
      userId,
      name,
      icon,
    });

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updated,
    });

  } catch (err) {
    console.error("[editCategory] Error:", err);

    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        code: err.code,
        meta: err.meta || null,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      code: "SERVER_ERROR",
    });
  }
};