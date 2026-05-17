const express = require("express");
const router = express.Router();

const communityController = require("../controllers/community.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// PUBLIC COMMUNITY FEED
router.get(
  "/public/categories",
  communityController.getAllPublicCategories
);

module.exports = router;