const { supabase } = require("../../config/supabase");

/**
 * Create feedback entry
 */
const createFeedback = async (data) => {
  const { user_id, category, rating, message } = data;

  const payload = {
    user_id: user_id || null,
    category,
    rating,
    message: (message || "").trim(),
  };

  const { data: result, error } = await supabase
    .from("feedback")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return result;
};

module.exports = {
  createFeedback,
};