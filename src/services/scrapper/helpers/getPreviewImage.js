const cheerio = require("cheerio");
const axios = require("axios");
const cloudscraper = require("cloudscraper");

const blockedDomains = ["facebook.com"];

const isBlockedPlatform = (url) => {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    return blockedDomains.some((d) => host.includes(d));
  } catch {
    return false;
  }
};

/**
 * -------------------------
 * FETCH HTML
 * -------------------------
 */
async function fetchHtml(url) {
  try {
    const res = await axios.get(url, {
      timeout: 12000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
      },
    });

    if (res?.data && res.data.length > 500) return res.data;
    throw new Error("Blocked or empty");
  } catch {
    try {
      return await cloudscraper.get(url);
    } catch {
      return null;
    }
  }
}

/**
 * -------------------------
 * URL NORMALIZER
 * -------------------------
 */
function normalize(src, base) {
  if (!src) return null;
  if (src.startsWith("http")) return src;
  if (src.startsWith("//")) return "https:" + src;
  if (src.startsWith("/")) return new URL(src, base).href;
  return null;
}

/**
 * -------------------------
 * BAD IMAGE FILTER
 * -------------------------
 */
function isBadImage(url = "") {
  const u = url.toLowerCase();

  return (
    u.includes("logo") ||
    u.includes("icon") ||
    u.includes("avatar") ||
    u.includes("sprite") ||
    u.includes("placeholder") ||
    u.includes("1x1") ||
    u.includes("favicon") ||
    u.startsWith("data:")
  );
}

/**
 * -------------------------
 * SCORE IMAGE
 * -------------------------
 */
function scoreImage(url, el, $) {
  let score = 0;

  const src = (url || "").toLowerCase();

  const width = parseInt($(el).attr("width") || 0);
  const height = parseInt($(el).attr("height") || 0);
  const area = width * height;

  // size importance
  if (area > 900 * 500) score += 50;
  if (area > 600 * 400) score += 30;
  if (area < 200 * 200) score -= 50;

  // semantic hints
  if (src.includes("hero")) score += 40;
  if (src.includes("cover")) score += 35;
  if (src.includes("banner")) score += 35;
  if (src.includes("thumbnail")) score += 20;
  if (src.includes("content")) score += 25;
  if (src.includes("post")) score += 20;

  // DOM context filtering
  const parentText = $(el).parent().text().toLowerCase();

  if (
    parentText.includes("nav") ||
    parentText.includes("menu") ||
    parentText.includes("footer") ||
    parentText.includes("header")
  ) {
    score -= 60;
  }

  return score;
}

/**
 * -------------------------
 * INLINE CSS IMAGE EXTRACT
 * -------------------------
 */
function extractCssImages($, baseUrl) {
  const results = [];

  $('[style*="background"]').each((_, el) => {
    const style = $(el).attr("style") || "";
    const match = style.match(/url\(["']?(.*?)["']?\)/);

    if (match?.[1]) {
      const url = normalize(match[1], baseUrl);
      if (url && !isBadImage(url)) {
        results.push(url);
      }
    }
  });

  return results;
}

/**
 * -------------------------
 * MAIN IMAGE EXTRACTOR
 * -------------------------
 */
exports.getPreviewImage = async (url, fallbackImage = null) => {
  try {
    if (isBlockedPlatform(url)) return fallbackImage;

    const html = await fetchHtml(url);
    if (!html) return fallbackImage;

    const $ = cheerio.load(html);

    const candidates = [];

    /**
     * 1. OG / TWITTER (FAST WIN)
     */
    const og = $('meta[property="og:image"]').attr("content");
    const tw = $('meta[name="twitter:image"]').attr("content");

    if (og && !isBadImage(og)) candidates.push({ url: og, score: 80 });
    if (tw && !isBadImage(tw)) candidates.push({ url: tw, score: 70 });

    /**
     * 2. IMG TAGS
     */
    $("img").each((_, el) => {
      let src = $(el).attr("src");
      const full = normalize(src, url);

      if (!full || isBadImage(full)) return;

      const score = scoreImage(full, el, $);

      candidates.push({ url: full, score });
    });

    /**
     * 3. SOURCE TAGS (lazy / responsive images)
     */
    $("source").each((_, el) => {
      let src = $(el).attr("srcset") || $(el).attr("src");
      const full = normalize(src, url);

      if (!full || isBadImage(full)) return;

      candidates.push({ url: full, score: 30 });
    });

    /**
     * 4. CSS BACKGROUND IMAGES
     */
    const cssImgs = extractCssImages($, url);
    cssImgs.forEach((img) => {
      candidates.push({ url: img, score: 25 });
    });

    /**
     * 5. PICK BEST
     */
    const best = candidates
      .sort((a, b) => b.score - a.score)[0];

    return best?.url || fallbackImage;
  } catch (err) {
    console.log("Preview image error:", err.message);
    return fallbackImage;
  }
};