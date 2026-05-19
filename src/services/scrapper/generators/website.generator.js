// generators/website.generator.js

const axios = require("axios");
const cheerio = require("cheerio");
const cloudscraper = require("cloudscraper");

const { cleanText } = require("../helpers/cleanText");
const { getDomain } = require("../helpers/getDomain");
const { resolveUrl } = require("../helpers/resolveUrl");
const { isCloudflareBlocked } = require("../helpers/isCloudflareBlocked");


const { getPlatform } = require("../helpers/getPlatform");
const { getPreviewImage } = require("../helpers/getPreviewImage");
const { getPreviewDescription } = require("../helpers/getPreviewDescription");
const { detectSafety } = require("../../safety/safety.service");

exports.generateWebsiteContent = async (url, type) => {
  let html = null;
  const platform = await getPlatform(type, url);
  const realImage = await getPreviewImage(url);
  const realDescription = await getPreviewDescription(url);

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    html = response.data;

    if (isCloudflareBlocked(html)) {
      throw new Error("Cloudflare detected");
    }
  } catch {
    html = await cloudscraper.get(url);
  }

  const $ = cheerio.load(html);

  let title =
    $('meta[property="og:title"]').attr("content") || $("title").text();

  let description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content");

  description = cleanText(description);

  // let image = $('meta[property="og:image"]').attr("content");

  let favicon =
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href");

  // =========================
  // SAFETY LAYER (NEW)
  // =========================
  const safety = detectSafety({
    url,
    title: cleanText(title),
    description: description || "",
  });

  return {
    url,
    domain: getDomain(url),
    title: cleanText(title),
    description,
    image: resolveUrl(url, realImage),
    favicon: resolveUrl(url, favicon),
    type: platform.key,
    // =========================
    // SAFETY RESULT ADDED
    // =========================
    safety: {
      status: safety.status,
      reason: safety.reason,
      signals: safety.signals,
    },

    metadata: {},
  };
};
