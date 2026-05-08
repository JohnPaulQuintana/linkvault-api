const { supabase } = require("../config/supabase");

// =========================
// GET ALL CATEGORIES
// =========================
exports.getAll = async ({ userId }) => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .or(`is_system.eq.true,user_id.eq.${userId}`)
    .order("created_at", { ascending: false }); // latest first

  if (error) throw new Error(error.message);

  return data;
};

// =========================
// CREATE CATEGORY
// =========================
exports.create = async ({ userId, name, icon }) => {
  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name,
      icon,
      is_system: false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
};

// =========================
// DELETE CATEGORY
// =========================
exports.delete = async ({ id, userId }) => {
  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId) // prevent deleting other users categories
    .eq("is_system", false) // prevent deleting system categories
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
};

exports.edit = async ({ id, userId, name, icon }) => {
  const { data, error } = await supabase
    .from("categories")
    .update({
      name,
      icon,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
};