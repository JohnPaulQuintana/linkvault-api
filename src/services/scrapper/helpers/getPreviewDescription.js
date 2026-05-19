const cheerio = require("cheerio");
const axios = require("axios");
const cloudscraper = require("cloudscraper");

/**
 * -------------------------
 * BLOCKED PLATFORM CHECK
 * -------------------------
 */
const blockedDomains = [
  // "facebook.com",
  "instagram.com",
  "tiktok.com",
  "x.com",
  "twitter.com",
  "linkedin.com",
];

const isBlockedPlatform = (url) => {
  try {
    const host = new URL(url).hostname.replace(
      "www.",
      "",
    );

    return blockedDomains.some((d) =>
      host.includes(d),
    );
  } catch {
    return false;
  }
};

/**
 * -------------------------
 * DETECT BLOCKED HTML
 * -------------------------
 */
const isBlockedHtml = (html = "") => {
  const text = html.toLowerCase();

  return (
    text.includes("access denied") ||
    text.includes("cloudflare") ||
    text.includes("attention required") ||
    text.includes("captcha") ||
    text.includes("enable javascript") ||
    text.includes("something went wrong")
  );
};

/**
 * -------------------------
 * CLEAN TEXT
 * -------------------------
 */
const cleanText = (text = "") => {
  return text
    .replace(/\s+/g, " ")
    .replace(/[\n\r\t]/g, " ")
    .trim();
};

/**
 * -------------------------
 * VALID DESCRIPTION CHECK
 * -------------------------
 */
const isValidDescription = (text = "") => {
  if (!text) return false;

  const t = cleanText(text);

  if (t.length < 30) return false;

  const garbage = [
    "enable javascript",
    "sign in",
    "log in",
    "cookies",
    "accept all",
    "loading...",
    "access denied",
    "page not found",
  ];

  return !garbage.some((g) =>
    t.toLowerCase().includes(g),
  );
};

/**
 * -------------------------
 * FETCH HTML
 * -------------------------
 */
async function fetchHtml(url) {
  try {
    const res = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml",
      },
    });

    if (
      res?.data &&
      res.data.length > 500 &&
      !isBlockedHtml(res.data)
    ) {
      return res.data;
    }

    throw new Error("Blocked response");
  } catch {
    try {
      const html = await cloudscraper.get({
        uri: url,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
        },
      });

      if (html && !isBlockedHtml(html)) {
        return html;
      }

      return null;
    } catch {
      return null;
    }
  }
}

/**
 * -------------------------
 * SCORE PARAGRAPHS
 * -------------------------
 */
const scoreParagraph = (text = "") => {
  let score = 0;

  const t = text.toLowerCase();

  if (text.length > 80) score += 4;
  if (text.length > 150) score += 6;

  if (t.includes("welcome")) score += 1;
  if (t.includes("discover")) score += 1;
  if (t.includes("platform")) score += 1;

  if (
    t.includes("cookie") ||
    t.includes("privacy") ||
    t.includes("login") ||
    t.includes("sign up")
  ) {
    score -= 10;
  }

  return score;
};

/**
 * -------------------------
 * GET BEST DESCRIPTION
 * -------------------------
 */
exports.getPreviewDescription = async (
  url,
  fallbackDescription = null,
) => {
  try {
    /**
     * SOCIAL SITES BLOCK SCRAPING
     */
    if (isBlockedPlatform(url)) {
      return fallbackDescription;
    }

    const html = await fetchHtml(url);

    if (!html) {
      return fallbackDescription;
    }

    const $ = cheerio.load(html);

    /**
     * =========================
     * META TAGS
     * =========================
     */
    const metaCandidates = [
      $('meta[property="og:description"]').attr(
        "content",
      ),

      $('meta[name="twitter:description"]').attr(
        "content",
      ),

      $('meta[name="description"]').attr(
        "content",
      ),

      $('meta[itemprop="description"]').attr(
        "content",
      ),
    ];

    const validMeta = metaCandidates.find(
      (d) => d && isValidDescription(d),
    );

    if (validMeta) {
      return cleanText(validMeta);
    }

    /**
     * =========================
     * BODY PARAGRAPHS
     * =========================
     */
    const paragraphs = [];

    $("article p, main p, section p, p").each(
      (_, el) => {
        const text = cleanText($(el).text());

        if (!isValidDescription(text)) return;

        paragraphs.push({
          text,
          score: scoreParagraph(text),
        });
      },
    );

    const bestParagraph = paragraphs.sort(
      (a, b) => b.score - a.score,
    )[0];

    if (bestParagraph?.text) {
      return bestParagraph.text;
    }

    /**
     * =========================
     * TITLE FALLBACK
     * =========================
     */
    const title = cleanText($("title").text());

    if (title && title.length > 10) {
      return title;
    }

    return fallbackDescription;
  } catch (err) {
    console.log(
      "getPreviewDescription error:",
      err.message,
    );

    return fallbackDescription;
  }
};