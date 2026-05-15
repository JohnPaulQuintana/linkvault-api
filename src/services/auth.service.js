const { supabase } = require("../config/supabase");
const bcrypt = require("bcrypt");
const { sendOtp } = require("./otp.service");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const { compare } = require("../utils/hash");
const jwt = require("jsonwebtoken");
const { AuthError, AUTH_ERRORS } = require("../utils/authErrors");
const { insertSubscription } = require("./subscription.service");

const register = async ({ email, password, fullname }) => {
  console.log(fullname)
  const existing = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (existing.data) {
    throw new AuthError(
      AUTH_ERRORS.USER_EXISTS,
      "An account with this email already exists",
      409,
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // create user
  const { data: user } = await supabase
    .from("users")
    .insert({
      email,
      password: hashedPassword,
      full_name: fullname
    })
    .select()
    .single();

  // get free/basic plan
  const { data: freePlan, error: planError } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("id", "starter")
    .single();

  if (planError || !freePlan) {
    throw new Error("Default subscription plan not found");
  }

  // create default subscription
  await insertSubscription({
    userId: user.id,
    planId: freePlan.id,
    status: "active",
  });

  await sendOtp(email);

  return {
    message: "Verification code sent to your email",
    userId: user.id,
  };
};

const verifyOtp = async ({ email, otp }) => {
  const { data: record, error } = await supabase
    .from("otps")
    .select("*")
    .eq("email", email)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !record) {
    throw new AuthError(
      AUTH_ERRORS.OTP_EXPIRED,
      "Your verification code has expired. Please request a new one.",
      400,
    );
  }

  const isValid = await compare(otp, record.code_hash);

  if (!isValid) {
    throw new AuthError(
      AUTH_ERRORS.OTP_INVALID,
      "The code you entered is incorrect",
      400,
    );
  }

  // mark user as verified
  const { data: user } = await supabase
    .from("users")
    .update({ is_verified: true })
    .eq("email", email)
    .select()
    .single();

  // cleanup OTP
  await supabase.from("otps").delete().eq("email", email);

  // CREATE AUTH TOKENS (SAME AS LOGIN)
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // store session
  await supabase.from("sessions").insert({
    user_id: user.id,
    refresh_token: refreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // remove sensitive data
  const { password: _, ...safeUser } = user;

  return {
    accessToken,
    refreshToken,
    user: safeUser,
  };
};

const resendOtp = async ({ email }) => {
  if (!email) {
    throw new AuthError("INVALID_REQUEST", "Email is required", 400);
  }

  // check user exists
  const { data: user } = await supabase
    .from("users")
    .select("id, email, is_verified")
    .eq("email", email)
    .maybeSingle();

  if (!user) {
    throw new AuthError(
      AUTH_ERRORS.USER_NOT_FOUND,
      "We could not find an account with this email",
      404,
    );
  }

  // prevent resend if already verified
  if (user.is_verified) {
    throw new AuthError(
      AUTH_ERRORS.ALREADY_VERIFIED,
      "This account is already verified",
      400,
    );
  }

  // optional cleanup old OTPs
  await supabase.from("otps").delete().eq("email", email);

  // send new otp
  await sendOtp(email);

  return {
    message: "A new verification code has been sent",
  };
};

const login = async ({ email, password }) => {
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (!user) {
    throw new AuthError(
      AUTH_ERRORS.USER_NOT_FOUND,
      "Account does not exist",
      404,
    );
  }
  if (!user.is_verified) {
    // re-send OTP automatically OR allow frontend to trigger resend
    await sendOtp(user.email);

    return {
      requiresVerification: true,
      email: user.email,
      message: "Verification required. We sent a new code to your email.",
    };
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new AuthError(
      AUTH_ERRORS.INVALID_PASSWORD,
      "Incorrect password",
      401,
    );
  }

  const accessToken = generateAccessToken(user);

  // 🔥 IMPORTANT: make refresh token unique per session
  const refreshToken = generateRefreshToken(user);

  await supabase.from("sessions").insert({
    user_id: user.id,
    refresh_token: refreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const { password: _, ...safeUser } = user;

  return { accessToken, refreshToken, user: safeUser };
};

const me = async (userId) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, is_verified, created_at")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new AuthError(
      AUTH_ERRORS.USER_NOT_FOUND,
      "User session not found",
      404,
    );
  }

  return data;
};

const refreshToken = async ({ refreshToken }) => {
  if (!refreshToken) {
    throw new AuthError("INVALID_REQUEST", "Refresh token required", 400);
  }

  // 1. Verify token signature
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new AuthError(
      AUTH_ERRORS.REFRESH_INVALID,
      "Invalid refresh token",
      401,
    );
  }

  const userId = decoded.userId;

  // 2. Find session
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("refresh_token", refreshToken)
    .eq("user_id", userId)
    .single();

  if (!session) {
    throw new AuthError(
      AUTH_ERRORS.SESSION_NOT_FOUND,
      "Session not found",
      401,
    );
  }

  // 3. Check expiry
  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("sessions").delete().eq("refresh_token", refreshToken);
    throw new AuthError(AUTH_ERRORS.SESSION_EXPIRED, "Session expired", 401);
  }

  // 🔥 4. ROTATION STEP (CRITICAL)
  const newAccessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  const newRefreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  // 5. Replace old session
  await supabase
    .from("sessions")
    .update({
      refresh_token: newRefreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    .eq("refresh_token", refreshToken);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

const logout = async ({ refreshToken }) => {
  if (!refreshToken) {
    throw new AuthError("INVALID_REQUEST", "Refresh token required", 400);
  }

  await supabase.from("sessions").delete().eq("refresh_token", refreshToken);

  return { message: "Logged out successfully" };
};

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  me,
  refreshToken,
  logout,
};
