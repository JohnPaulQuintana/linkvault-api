const {
  createFeedback,
  getFeedback,
  getFeedbackById,
  getFeedbackStats,
} = require("../../services/feedback/feedback.service");

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

const fetchFeedback = async (req, res) => {
  try {
    const { category, limit, offset } = req.query;

    const data = await getFeedback({
      category,
      limit: Number(limit) || 20,
      offset: Number(offset) || 0,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


const fetchFeedbackStats = async (req, res) => {
  try {
    const stats = await getFeedbackStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


const fetchFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await getFeedbackById(id);

    return res.status(200).json({
      success: true,
      data,
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
  fetchFeedback,
  fetchFeedbackStats,
  fetchFeedbackById,
};