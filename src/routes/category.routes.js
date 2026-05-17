const express = require("express");
const router = express.Router();

const categoryController = require("../controllers/category.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/collect", categoryController.getCategories);
router.post("/create", categoryController.createCategory);
router.delete("/delete/:id", categoryController.deleteCategory);
router.put("/edit/:id", categoryController.editCategory);


// published routes
router.get(
  "/published",
  authMiddleware,
  categoryController.getPublishedLinksByCategory
);

router.post(
  "/published",
  categoryController.togglePublishedCategory
);
module.exports = router;