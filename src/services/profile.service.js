const { supabase } = require("../config/supabase");

const { AuthError, AUTH_ERRORS } = require("../utils/authErrors");

const update = async ({ userId, fullname, email }) => {
  // check if email already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .neq("id", userId)
    .maybeSingle();

  if (existingUser) {
    throw new AuthError(
      AUTH_ERRORS.USER_EXISTS,
      "An account with this email already exists",
      409,
    );
  }

  // update user
  const { data: updatedUser, error } = await supabase
    .from("users")
    .update({
      full_name: fullname,
      email
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update profile");
  }

  return {
    message: "Profile updated successfully",
    user: updatedUser,
  };
};

module.exports = {
  update,
};