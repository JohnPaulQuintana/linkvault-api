const express = require("express");
const router = express.Router();

const categoryController = require("../controllers/category.controller");

router.get("/collect", categoryController.getCategories);
router.post("/create", categoryController.createCategory);
router.delete("/delete/:id", categoryController.deleteCategory);
router.put("/edit/:id", categoryController.editCategory);

module.exports = router;