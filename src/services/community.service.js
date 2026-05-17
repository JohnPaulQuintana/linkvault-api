const { supabase } = require("../config/supabase");
const AppError = require("../utils/AppError");

exports.getAllPublicCategory = async () => {
  const { data, error } = await supabase
  .from("categories")
  .select(`
    id,
    user_id,
    name,
    icon,
    published,
    created_at,

    author:users (
      full_name
    ),

    links (
      id,
      title,
      url,
      description,
      image,
      domain,
      created_at
    )
  `)
  .eq("published", "public")
  .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(
      error.message || "Failed to fetch public categories",
      500,
    );
  }

  return data;
};
