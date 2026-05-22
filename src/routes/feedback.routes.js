const express = require("express");
const router = express.Router();

const { submitFeedback } = require("../controllers/feedback/feedback.controller");

router.post("/submit", submitFeedback);

module.exports = router;