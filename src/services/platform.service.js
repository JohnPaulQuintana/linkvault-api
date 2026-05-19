const { supabase } = require("../config/supabase");

let PLATFORM_CACHE = null;

exports.loadPlatforms = async () => {
  const { data, error } = await supabase
    .from("platforms")
    .select("*")
    .eq("active", true);

  if (error) throw error;

  PLATFORM_CACHE = data;
  return data;
};

exports.getPlatforms = async () => {
  if (PLATFORM_CACHE) return PLATFORM_CACHE;
  return await exports.loadPlatforms();
};