const express = require("express");
const router = express.Router();

const sessionController = require("../controllers/session.controller");

// SAVE / UPDATE
router.post("/upsert", sessionController.upsertSession);

// GET (RESTORE)
router.get("/:user_id/:link_id", sessionController.getSession);

module.exports = router;