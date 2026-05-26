const cheerio = require("cheerio");
const axios = require("axios");
const { captureScreenshot } = require("./playwright/captureScreenshot");
const { runLimited } = require("./playwright/queue");
const {cloudinary} = require("../../../config/cloudinary");

const blockedDomains = [];

const isBlockedPlatform = (url) => {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    return blockedDomains.some((d) => host.includes(d));
  } catch {
    return false;
  }
};

async function fetchHtml(url) {
  try {
    const res = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
      },
    });

    return res.data;
  } catch {
    return null;
  }
}

exports.getPreviewImage = async (url, fallbackImage = null) => {
  try {
    if (isBlockedPlatform(url)) return fallbackImage;

    const html = await fetchHtml(url);

    /**
     * 1. FAST PATH → OG IMAGE
     */
    if (html) {
      const $ = cheerio.load(html);

      const og = $('meta[property="og:image"]').attr("content");
      const tw = $('meta[name="twitter:image"]').attr("content");

      const img = og || tw;

      if (img && !img.includes("svg")) {
        return img;
      }
    }

    /**
     * 2. SLOW PATH → PLAYWRIGHT (LIMITED)
     */
    const screenshot = await runLimited(() => captureScreenshot(url));

    if (screenshot) {
      const uploaded = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${screenshot.toString("base64")}`,
        {
          folder: "navilink-previews",
        },
      );

      return uploaded.secure_url;
    }

    return fallbackImage;
  } catch (err) {
    console.log("Preview error:", err.message);
    return fallbackImage;
  }
};
