const { createFeedback } = require("../../services/feedback/feedback.service");

const submitFeedback = async (req, res) => {
  try {
    const feedback = await createFeedback(req.body);

    return res.status(201).json({
      success: true,
      data: feedback,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  submitFeedback,
};