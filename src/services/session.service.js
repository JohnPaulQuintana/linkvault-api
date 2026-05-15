const { supabase } = require("../config/supabase");

/**
 * =========================
 * UPSERT SESSION
 * =========================
 */
exports.upsertSession = async (data) => {
  const {
    link_id,
    user_id,
    progress,
    scroll_top,
    duration,
    url, // 🔥 IMPORTANT (restore target)
    final_url
  } = data;

  const payload = {
    link_id,
    user_id,
    progress: Number(progress || 0),
    scroll_top: Math.floor(scroll_top || 0),
    duration: Number(duration || 0),

    // MUST STORE FOR RESTORE
    url,
    final_url,
    // updated_at: new Date().toISOString(),
  };

  const { data: result, error } = await supabase
    .from("link_sessions")
    .upsert(payload, {
      onConflict: "user_id,link_id",
    })
    .select()
    .single();

  if (error) throw error;

  console.log("UPSERT RESULT:", result);
  
  return result;
};

/**
 * =========================
 * GET SESSION (RESTORE)
 * =========================
 */
exports.getSession = async ({ user_id, link_id }) => {
  const { data, error } = await supabase
    .from("link_sessions")
    .select("*")
    .eq("user_id", user_id)
    .eq("link_id", link_id)
    .maybeSingle();

  if (error) throw error;

  // 🔥 SAFE DEFAULT SHAPE (prevents frontend crashes)
  return (
    data || {
      link_id,
      user_id,
      progress: 0,
      scroll_top: 0,
      duration: 0,
      url: null,
    }
  );
};

exports.getSessionsByUser = async (user_id) => {
  const { data, error } = await supabase
    .from("link_sessions")
    .select("*")
    .eq("user_id", user_id);

  if (error) throw error;

  return data || [];
};