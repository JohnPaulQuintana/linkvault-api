const categoryService = require("../services/category.service");

// GET ALL
exports.getCategories = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User id is required",
        data: null,
      });
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

    if (!userId || !name || !icon) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        data: null,
      });
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

    if (!id || !userId) {
      return res.status(400).json({
        success: false,
        message: "Category id and user id are required",
        data: null,
      });
    }

    const deleted = await categoryService.delete({
      id,
      userId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: deleted,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
      data: null,
      error: err.message,
    });
  }
};

exports.editCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, name, icon } = req.body;

    if (!id || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
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
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};