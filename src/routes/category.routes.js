const express = require("express");
const router = express.Router();

const categoryController = require("../controllers/category.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/collect", categoryController.getCategories); // migrated
router.post("/create", categoryController.createCategory); // migrated
router.delete("/delete/:id", categoryController.deleteCategory); // migrated
router.put("/edit/:id", categoryController.editCategory); //migrated


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