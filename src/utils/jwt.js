const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      jti: crypto.randomUUID(), // UNIQUE SESSION ID
    },
    process.env.JWT_REFRESH_SECRET,
    {
      // expiresIn: "7d",
      // expiresIn: "30s", // 🔥 DEBUG ONLY
      expiresIn: "30d", // 
    }
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};