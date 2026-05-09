const categoryService = require("../services/category.service");

// GET ALL
exports.getCategories = async (req, res) => {
  try {
    const { userId } = req.query;
    console.log("[getCategories] Query params:", req.query);

    if (!userId) {
      console.warn("[getCategories] userId missing");
      return res.status(400).json({
        success: false,
        message: "User id is required",
        data: null,
      });
    }

    const data = await categoryService.getAll({ userId });
    console.log("[getCategories] Fetched categories:", data.length);

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
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      data: null,
      error: err.message,
    });
  }
};

// CREATE
exports.createCategory = async (req, res) => {
  try {
    const { userId, name, icon } = req.body;
    console.log("[createCategory] Request body:", req.body);

    if (!userId || !name || !icon) {
      console.warn("[createCategory] Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        data: null,
      });
    }

    const data = await categoryService.create({ userId, name, icon });
    console.log("[createCategory] Created category:", data);

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data,
    });
  } catch (err) {
    console.error("[createCategory] Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create category",
      data: null,
      error: err.message,
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
      console.warn("[deleteCategory] Missing category id or user id");
      return res.status(400).json({
        success: false,
        message: "Category id and user id are required",
        data: null,
      });
    }

    const deleted = await categoryService.delete({ id, userId });
    if (!deleted) {
      console.warn("[deleteCategory] Category not found:", id);
      return res.status(404).json({
        success: false,
        message: "Category not found",
        data: null,
      });
    }

    console.log("[deleteCategory] Category deleted:", deleted);
    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: deleted,
    });
  } catch (err) {
    console.error("[deleteCategory] Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
      data: null,
      error: err.message,
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
      console.warn("[editCategory] Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const updated = await categoryService.edit({ id, userId, name, icon });
    console.log("[editCategory] Category updated:", updated);

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("[editCategory] Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};