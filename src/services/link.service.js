const scraper = require("./scraper.service");
const { supabase } = require("../config/supabase");
const AppError = require("../utils/AppError");

exports.createLink = async ({
  url,
  category_id,
  user_id,
  link_type,
  title,
  description,
}) => {
  // 1. DUPLICATE CHECK (IMPORTANT)
  const { data: existing } = await supabase
    .from("links")
    .select("id")
    .eq("user_id", user_id)
    .eq("url", url)
    .maybeSingle();

  if (existing) {
    throw new AppError("Link already exists", 409, "DUPLICATE_LINK");
  }

  // 2. SCRAPE / GENERATE PREVIEW
  let preview = null;

  if (link_type === "website") {
    preview = await scraper.generateWebsiteContent(url);
  } else {
    preview = await scraper.generateTypedContent(url, link_type);
  }

  // 3. SAFE MERGE (user input wins)
  const payload = {
    url,
    category_id,
    user_id,

    title: title || preview?.title || "Untitled",
    description: description || preview?.description || null,
    image: preview?.image || null,
    favicon: preview?.favicon || null,
    domain: preview?.domain || null,
  };

  // 4. INSERT
  const { data, error } = await supabase
    .from("links")
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw new AppError(error.message, 500, "DB_ERROR");
  }

  return data;
};

/**
 * -------------------------
 * GET LINKS
 * -------------------------
 */
exports.getLinks = async ({ userId, categoryId }) => {
  const query = supabase
    .from("links")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (categoryId) {
    query.eq("category_id", categoryId);
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError(error.message, 500, "DB_ERROR");
  }

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

  if (error) {
    throw new AppError(error.message, 500, "DB_ERROR");
  }

  return data;
};