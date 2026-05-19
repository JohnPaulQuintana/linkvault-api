const { supabase } = require("../../config/supabase");

const seedPlatforms = async (PLATFORMS) => {
  const rows = Object.entries(PLATFORMS).map(
    ([key, value]) => ({
      key,
      name: value.name,
      domain: value.domain,
      image: value.image,
      type: value.type || "general",
    }),
  );

  const { error } = await supabase
    .from("platforms")
    .upsert(rows, { onConflict: "key" });

  if (error) throw error;
};

module.exports = { seedPlatforms };