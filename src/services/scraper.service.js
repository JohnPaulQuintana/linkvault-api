const axios = require("axios");
const cheerio = require("cheerio");
const { normalizeUrl } = require("../utils/normalizeUrl");

const cleanText = (text) => {
  if (!text) return null;
  return text
    .replace(/\s+/g, " ")
    .replace(/[\n\r\t]/g, " ")
    .trim();
};

const getDomain = (url) => {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return null;
  }
};

const resolveUrl = (base, src) => {
  try {
    if (!src) return null;
    if (src.startsWith("http")) return src;
    if (src.startsWith("//")) return "https:" + src;
    return new URL(src, base).href;
  } catch {
    return null;
  }
};

// 🔥 THIS IS PURE SCRAPER (NO DB)
exports.generateContentLink = async (inputUrl) => {
  const url = normalizeUrl(inputUrl);

  const response = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    timeout: 10000,
  });

  const $ = cheerio.load(response.data);

  // -------------------
  // TITLE
  // -------------------
  let title =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content") ||
    $("title").text();

  title = cleanText(title) || "Untitled";
  title = title.replace(/\s*\|\s*MDN.*$/i, "");
  title = title.replace(/\s*\-\s*MDN.*$/i, "");
  title = title.slice(0, 90);

  // -------------------
  // DESCRIPTION
  // -------------------
  let description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="twitter:description"]').attr("content") ||
    $('meta[name="description"]').attr("content");

  description = cleanText(description);

  if (!description) {
    description = cleanText($("p").first().text());
  }

  if (description && description.length > 160) {
    description = description.slice(0, 157) + "...";
  }

  // -------------------
  // IMAGE
  // -------------------
  let image =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    $("link[rel='image_src']").attr("href");

  if (!image) {
    image = $("img")
      .first()
      .attr("src");
  }

  image = resolveUrl(url, image);

  // fallback avatar
  if (!image) {
    const domain = getDomain(url);
    image = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      domain || "link"
    )}&background=0D8ABC&color=fff&size=512`;
  }

  // -------------------
  // FAVICON
  // -------------------
  let favicon =
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href");

  favicon = resolveUrl(url, favicon);

  if (!favicon) {
    try {
      favicon = new URL("/favicon.ico", url).href;
    } catch {
      favicon = null;
    }
  }

  const domain = getDomain(url);

  // -------------------
  // FINAL CLEAN OUTPUT
  // -------------------
  return {
    url,
    domain,
    title,
    description,
    image,
    favicon,
  };
};