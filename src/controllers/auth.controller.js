const authService = require("../services/auth.service");

const register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const result = await authService.verifyOtp(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const resendOtp = async (req, res) => {
  try {
    const result = await authService.resendOtp(req.body);

    res.json(result);
  } catch (err) {
    res.status(400).json({
      error: err.message,
    });
  }
};

const login = async (req, res) => {
  try {
    console.log("LOGIN SECRET:", process.env.JWT_SECRET);
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const me = async (req, res) => {
  try {
    const user = await authService.me(req.user.userId);
    res.json({ user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const refresh = async (req, res) => {
  try {
    const result = await authService.refreshToken(req.body);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

const logout = async (req, res) => {
  try {
    const result = await authService.logout(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
module.exports = { register, verifyOtp, resendOtp, login, me, refresh, logout };
