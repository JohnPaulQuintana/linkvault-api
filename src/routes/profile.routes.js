const express = require("express");
const router = express.Router();

const profileController = require("../controllers/profile.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// create link (save to DB)
router.post("/update", authMiddleware, profileController.update);

module.exports = router;