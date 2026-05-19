// generators/social.generator.js

// Handles:
// facebook
// instagram
// tiktok
// twitter
// x
// linkedin
// reddit
// pinterest
// snapchat
const { getDomain } = require("../helpers/getDomain");
const { getPlatform } = require("../helpers/getPlatform");
const { getPreviewImage } = require("../helpers/getPreviewImage");
const { getPreviewDescription } = require("../helpers/getPreviewDescription");
const { detectSafety } = require("../../safety/safety.service");

exports.generateSocialMeta = async (url, type) => {
  const domain = getDomain(url);
const platform = await getPlatform(type, url);
  const realImage = await getPreviewImage(url);
  const realDescription = await getPreviewDescription(url);

  // =========================
  // SAFETY LAYER (NEW)
  // =========================
  const safety = detectSafety({
    url,
    title: platform.name,
    description: realDescription || "",
  });


  return {
    url,
    domain: platform.domain,

    title: platform.name,

    description: realDescription,

    image: realImage,

    favicon: `https://www.google.com/s2/favicons?domain=${platform.domain}&sz=128`,

    type: platform.key,

    // =========================
    // SAFETY RESULT ADDED
    // =========================
    safety: {
      status: safety.status,
      reason: safety.reason,
      signals: safety.signals,
    },

    metadata: {
      provider: platform.key,
    },
  };
};