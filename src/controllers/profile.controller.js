const profileService = require("../services/profile.service");

const update = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { fullname, email } = req.body;

    const result = await profileService.update({
      userId,
      fullname,
      email,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.user,
    });
  } catch (err) {
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message || "Failed to update profile",
    });
  }
};

module.exports = {
  update,
};