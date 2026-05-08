const scraper = require("./scraper.service");
const { supabase } = require("../config/supabase");

/**
 * -------------------------
 * CREATE LINK
 * -------------------------
 */
exports.createLink = async ({ url, category_id, user_id }) => {
  // 1. SCRAPE META DATA
  const preview = await scraper.generateContentLink(url);

  // 2. SAVE TO DB
  const { data, error } = await supabase
    .from("links")
    .insert([
      {
        ...preview,
        url, // always store original url
        category_id,
        user_id,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
};

/**
 * -------------------------
 * GET LINKS
 * -------------------------
 */
exports.getLinks = async ({ userId, categoryId }) => {
  let query = supabase
    .from("links")
    .select("*")
    .eq("user_id", userId);

  // optional filter by category
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  // latest → oldest
  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return data;
};

/**
 * -------------------------
 * DELETE LINK
 * -------------------------
 */
exports.deleteLink = async ({ id, userId }) => {
  const { data, error } = await supabase
    .from("links")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
};