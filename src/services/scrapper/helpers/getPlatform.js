const { getPlatforms } = require("../../platform.service");
const { getDomain } = require("./getDomain");

/**
 * -------------------------
 * DYNAMIC PLATFORM RESOLVER
 * (Supabase-powered)
 * -------------------------
 */

exports.getPlatform = async (type, url) => {
  const domain = getDomain(url);

  const platforms = await getPlatforms();

  // =========================
  // 1. DIRECT MATCH (type)
  // =========================
  let match = platforms.find(
    (p) => p.key === type,
  );

  // =========================
  // 2. DOMAIN MATCH
  // =========================
  if (!match) {
    match = platforms.find((p) =>
      domain.includes(p.domain),
    );
  }

  // =========================
  // 3. FALLBACK
  // =========================
  if (!match) {
    return {
      key: "website",
      name: "Website",
      domain,
      image: null,
    };
  }

  return {
    key: match.key,
    name: match.name,
    domain: match.domain,
    image: match.image,
    type: match.type,
  };
};