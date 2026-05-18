const { supabase } = require("../config/supabase");
const bcrypt = require("bcrypt");
const { sendOtp, sendForgotPasswordOtp } = require("./otp.service");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const { compare } = require("../utils/hash");
const jwt = require("jsonwebtoken");
const { AuthError, AUTH_ERRORS } = require("../utils/authErrors");

const { insertSubscription } = require("./subscription.service");

const register = async ({ email, password, fullname }) => {
  console.log(fullname);
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
      full_name: fullname,
    })
    .select()
    .single();

  // get free/basic plan
  const { data: freePlan, error: planError } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("slug", "starter")
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

const login = async ({ email, password, meta }) => {
  console.log("THIS IS THE LOGIN REQUEST...")
  console.log(email, password, meta)
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
    // expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    // expires_at: new Date(Date.now() + 30 * 1000), // 🔥 DEBUG: 30 seconds
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    device_name: meta.deviceName,
    ip_address: meta.ipAddress,
    user_agent: meta.userAgent,
    last_used_at: new Date(),

  });

  const { password: _, ...safeUser } = user;

  return { accessToken, refreshToken, user: safeUser };
};

const me = async (userId) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, onboarding_status ,is_verified, created_at")
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

const refreshToken = async ({ refreshToken: token }) => {
  if (!token) {
    throw new AuthError("INVALID_REQUEST", "Refresh token required", 400);
  }

  // =========================
  // 1. VERIFY JWT SIGNATURE
  // =========================
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new AuthError(
      AUTH_ERRORS.REFRESH_INVALID,
      "Invalid refresh token",
      401,
    );
  }

  // =========================
  // 2. FIND SESSION (single source of truth)
  // =========================
  const { data: session, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("refresh_token", token)
    .single();

  if (error || !session) {
    throw new AuthError(
      AUTH_ERRORS.SESSION_NOT_FOUND,
      "Session not found",
      401,
    );
  }

  const userId = session.user_id;

  // =========================
  // 3. CHECK SESSION EXPIRY
  // =========================
  const isExpired = new Date(session.expires_at) < new Date();

  if (isExpired) {
    await supabase.from("sessions").delete().eq("id", session.id);

    throw new AuthError(AUTH_ERRORS.SESSION_EXPIRED, "Session expired", 401);
  }

  // =========================
  // 4. GET USER
  // =========================
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    throw new AuthError(AUTH_ERRORS.USER_NOT_FOUND, "User not found", 404);
  }

  // =========================
  // 5. GENERATE NEW TOKENS
  // =========================
  const newAccessToken = generateAccessToken({
    id: user.id,
    email: user.email,
  });

  const newRefreshToken = generateRefreshToken({
    id: user.id,
  });

  // =========================
  // 6. ROTATE SESSION SAFELY (FIXED)
  // =========================
  const { error: updateError } = await supabase
    .from("sessions")
    .update({
      refresh_token: newRefreshToken,
      // expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      //  expires_at: new Date(Date.now() + 30 * 1000), // 🔥 DEBUG: 30 seconds
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30days
      last_used_at: new Date(),
    })
    .eq("id", session.id); // ✅ FIX: stable identifier

  if (updateError) {
    throw new AuthError(
      "SESSION_UPDATE_FAILED",
      "Failed to update session",
      500,
    );
  }

  // =========================
  // 7. RETURN NEW TOKENS
  // =========================
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

const forgotPassword = async ({ email }) => {
  if (!email) {
    throw new AuthError("INVALID_REQUEST", "Email is required", 400);
  }

  // check user
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (!user) {
    throw new AuthError(AUTH_ERRORS.USER_NOT_FOUND, "Account not found", 404);
  }

  // cooldown check
  const { data: lastOtp } = await supabase
    .from("password_resets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastOtp) {
    const diff = Date.now() - new Date(lastOtp.created_at).getTime();

    if (diff < 60 * 1000) {
      throw new Error("Please wait 60 seconds before requesting another code");
    }
  }

  // cleanup old reset requests
  await supabase.from("password_resets").delete().eq("user_id", user.id);

  // generate otp
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // hash otp
  const codeHash = await bcrypt.hash(otp, 10);

  // expiry
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // save otp
  await supabase.from("password_resets").insert({
    user_id: user.id,
    email: user.email,
    otp: codeHash,
    expires_at: expiresAt,
    created_at: new Date(),
  });

  // ONLY SEND EMAIL
  await sendForgotPasswordOtp({
    email: user.email,
    otp,
  });

  return {
    message: "Password reset code sent",
  };
};

const verifyResetOtp = async ({ email, otp }) => {
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (!user) {
    throw new AuthError(AUTH_ERRORS.USER_NOT_FOUND, "User not found", 404);
  }

  const { data: record } = await supabase
    .from("password_resets")
    .select("*")
    .eq("user_id", user.id)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!record) {
    throw new AuthError(AUTH_ERRORS.OTP_EXPIRED, "OTP expired", 400);
  }

  const valid = await bcrypt.compare(otp, record.otp);

  if (!valid) {
    throw new AuthError(AUTH_ERRORS.OTP_INVALID, "Invalid OTP", 400);
  }

  return {
    message: "OTP verified",
  };
};

const resetPassword = async ({ email, otp, newPassword }) => {
  console.log(email, otp, newPassword);
  if (!email || !otp || !newPassword) {
    throw new AuthError("INVALID_REQUEST", "All fields are required", 400);
  }

  // find user
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (!user) {
    throw new AuthError(AUTH_ERRORS.USER_NOT_FOUND, "User not found", 404);
  }

  // get latest valid reset otp
  const { data: record } = await supabase
    .from("password_resets")
    .select("*")
    .eq("user_id", user.id)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (!record) {
    throw new AuthError(AUTH_ERRORS.OTP_EXPIRED, "OTP expired", 400);
  }

  // compare otp
  const valid = await bcrypt.compare(otp, record.otp);

  if (!valid) {
    throw new AuthError(AUTH_ERRORS.OTP_INVALID, "Invalid OTP", 400);
  }

  // hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // update password
  await supabase
    .from("users")
    .update({
      password: hashedPassword,
    })
    .eq("id", user.id);

  // cleanup reset otp
  await supabase.from("password_resets").delete().eq("user_id", user.id);

  // logout all sessions
  await supabase.from("sessions").delete().eq("user_id", user.id);

  return {
    message: "Password reset successful",
  };
};

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  me,
  refreshToken,
  logout,

  forgotPassword,
  verifyResetOtp,
  resetPassword,
};
