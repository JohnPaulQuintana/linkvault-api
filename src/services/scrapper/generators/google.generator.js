// generators/google.generator.js
// Handles:

// google_sheet
// google_doc
// google_slides
// google_form
// google_drive
// google_photos
const { getDomain } = require("../helpers/getDomain");
const { getPlatform } = require("../helpers/getPlatform");
const { getPreviewImage } = require("../helpers/getPreviewImage");
const { getPreviewDescription } = require("../helpers/getPreviewDescription");
const { detectSafety } = require("../../safety/safety.service");

exports.generateGoogleMeta = async (url, type) => {
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

  // let description = cleanText(realDescription);
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