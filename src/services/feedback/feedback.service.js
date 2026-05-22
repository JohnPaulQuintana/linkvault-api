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


const getFeedbackById = async (id) => {
  const { data, error } = await supabase
    .from("feedback")
    .select(`
      *,
      users (
        id,
        full_name,
        email,
        is_verified
      )
    `)
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);

  return data;
};


const getFeedback = async ({ category, limit = 20, offset = 0 }) => {
  let query = supabase
    .from("feedback")
    .select(`
      id,
      user_id,
      category,
      rating,
      message,
      created_at,
      users (
        id,
        full_name,
        email,
        is_verified
      )
    `)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // filter by category (bug, feature, rating, etc.)
  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  console.log(data)
  if (error) throw new Error(error.message);

  return data;
};

const getFeedbackStats = async () => {
  const { data, error } = await supabase.from("feedback").select("rating");

  if (error) throw new Error(error.message);

  const total = data.length;

  const avgRating =
    total > 0
      ? data.reduce((sum, f) => sum + (f.rating || 0), 0) / total
      : 0;

  return {
    total,
    avgRating: Number(avgRating.toFixed(2)),
  };
};
module.exports = {
  createFeedback,
  getFeedback,
  getFeedbackById,
  getFeedbackStats,
};