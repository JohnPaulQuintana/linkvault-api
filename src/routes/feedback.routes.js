const express = require("express");
const router = express.Router();

const {
  submitFeedback,
  fetchFeedback,
  fetchFeedbackStats,
  fetchFeedbackById,
} = require("../controllers/feedback/feedback.controller");

router.post("/submit", submitFeedback);
router.get("/status", fetchFeedback);

router.get("/stats", fetchFeedbackStats);

router.get("/:id", fetchFeedbackById);
module.exports = router;
